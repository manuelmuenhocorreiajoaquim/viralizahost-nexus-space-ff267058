// whm-sync-clients — admin only
// Imports all cPanel accounts from a WHM server (or all active servers) and:
//   - creates Supabase auth users with default password "welcome2026"
//   - flags must_change_password = true on profile
//   - upserts cpanel_accounts linked to the user
// Body: { server_id?: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { whmCall, withDecryptedWhmToken, type WhmServerRow } from "../_shared/whm.ts";

const DEFAULT_PASSWORD = "welcome2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { data: u } = await userClient.auth.getUser();
    if (!u.user) return json({ error: "Unauthorized" }, 401);

    const { data: role } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));

    let serversQuery = admin.from("whm_servers").select("*").eq("active", true);
    if (body.server_id) serversQuery = admin.from("whm_servers").select("*").eq("id", body.server_id);

    const { data: servers, error: sErr } = await serversQuery;
    if (sErr) throw sErr;
    if (!servers || servers.length === 0) return json({ error: "No active server" }, 404);

    let found = 0;
    let usersCreated = 0;
    let accountsCreated = 0;
    let accountsUpdated = 0;
    const errors: string[] = [];

    for (const stored of servers) {
      const server = await withDecryptedWhmToken(stored as WhmServerRow);

      let resp: any;
      try {
        resp = await whmCall(server, "listaccts");
      } catch (e: any) {
        errors.push(`Server ${stored.name}: ${e.message}`);
        continue;
      }

      const accounts: any[] = resp?.data?.acct ?? [];
      found += accounts.length;

      for (const a of accounts) {
        const email = (a.email ?? a.contact_email ?? "").toString().trim().toLowerCase();
        const username = (a.user ?? "").toString();
        const domain = (a.domain ?? "").toString().toLowerCase();
        if (!email || !username || !domain) {
          errors.push(`Skipped ${username || domain}: missing email/user/domain`);
          continue;
        }

        try {
          // Find or create auth user by email
          let userId: string | null = null;
          // listUsers paginates by email filter via getUserByEmail (admin)
          const { data: existing } = await (admin.auth.admin as any).getUserByEmail?.(email)
            ?? { data: null };
          if (existing?.user) {
            userId = existing.user.id;
          } else {
            // Fallback: search via listUsers (page 1 small)
            const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
            const match = list?.users?.find((x) => x.email?.toLowerCase() === email);
            if (match) userId = match.id;
          }

          if (!userId) {
            const { data: created, error: cErr } = await admin.auth.admin.createUser({
              email,
              password: DEFAULT_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: a.owner ?? username, source: "whm_sync" },
            });
            if (cErr || !created.user) throw cErr ?? new Error("Failed to create user");
            userId = created.user.id;
            usersCreated++;

            // Ensure profile has must_change_password = true (handle_new_user trigger creates row)
            await admin
              .from("profiles")
              .upsert({ id: userId, must_change_password: true, full_name: a.owner ?? username }, { onConflict: "id" });
          }

          // Upsert cpanel_account
          const ip = a.ip ?? server.server_ip ?? null;
          const cpanel_url = `https://${server.hostname}:2083`;
          const nameservers = Array.isArray((server as any).nameservers) && (server as any).nameservers.length
            ? (server as any).nameservers
            : [server.nameserver1, server.nameserver2].filter(Boolean);

          const diskUsed = parseDiskMb(a.diskused);

          const { data: existingAcct } = await admin
            .from("cpanel_accounts")
            .select("id")
            .eq("server_id", server.id)
            .eq("username", username)
            .maybeSingle();

          const payload = {
            user_id: userId,
            server_id: server.id,
            server_ip: ip,
            username,
            domain,
            plan_name: a.plan ?? null,
            package: a.plan ?? null,
            status: a.suspended ? "suspended" : "active",
            nameservers,
            cpanel_url,
            disk_used_mb: diskUsed,
            provisioned_at: a.startdate
              ? new Date(a.startdate).toISOString()
              : new Date().toISOString(),
          };

          if (existingAcct) {
            await admin.from("cpanel_accounts").update(payload).eq("id", existingAcct.id);
            accountsUpdated++;
          } else {
            await admin.from("cpanel_accounts").insert(payload);
            accountsCreated++;
            // mirror domain & service (best effort, ignore duplicates)
            const { data: existingDom } = await admin
              .from("domains")
              .select("id")
              .eq("user_id", userId)
              .eq("domain", domain)
              .maybeSingle();
            if (!existingDom) {
              await admin.from("domains").insert({ user_id: userId, domain, status: "active" });
            }
            await admin.from("services").insert({
              user_id: userId,
              name: a.plan ?? domain,
              type: "hosting",
              status: "active",
            });
          }
        } catch (e: any) {
          errors.push(`${email}/${username}: ${e?.message ?? String(e)}`);
        }
      }
    }

    return json({
      ok: true,
      summary: { found, usersCreated, accountsCreated, accountsUpdated, errors: errors.length },
      errors,
    });
  } catch (e: any) {
    console.error("whm-sync-clients error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function parseDiskMb(v: unknown): number | null {
  if (v == null) return null;
  const n = parseInt(String(v));
  return Number.isFinite(n) ? n : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
