// create-cpanel-account
// Provisions a cPanel account on WHM after a paid order.
// Body: { order_id: string }
// Auth: requires the user's JWT (verify_jwt = true by default).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import {
  deriveUsername,
  generatePassword,
  whmCall,
  type WhmServerRow,
} from "../_shared/whm.ts";
import { encryptSecret } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? null;

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return json({ error: "order_id required" }, 400);

    // Load order (RLS as user)
    const { data: order, error: oErr } = await userClient
      .from("orders")
      .select("id, user_id, status, provisioned, currency, cycle")
      .eq("id", order_id)
      .single();
    if (oErr || !order) return json({ error: "Order not found" }, 404);
    if (order.status !== "paid") {
      return json({ error: `Order not paid (status=${order.status})` }, 400);
    }
    if (order.provisioned) {
      return json({ ok: true, message: "Already provisioned" });
    }

    // Load hosting items
    const { data: items, error: iErr } = await userClient
      .from("order_items")
      .select("id, product_id, product_type, product_name, domain, cycle")
      .eq("order_id", order_id);
    if (iErr) throw iErr;

    const hostingItems = (items ?? []).filter((it) => it.product_type === "hosting");
    if (hostingItems.length === 0) {
      // nothing to provision; mark as provisioned
      await admin.from("orders").update({ provisioned: true }).eq("id", order_id);
      return json({ ok: true, message: "No hosting items in order" });
    }

    // Pick least-loaded active server
    const { data: servers, error: sErr } = await admin
      .from("whm_servers")
      .select("*")
      .eq("active", true)
      .order("current_accounts", { ascending: true })
      .limit(1);
    if (sErr) throw sErr;
    const server = (servers?.[0] ?? null) as WhmServerRow | null;
    if (!server) {
      const msg = "No active WHM server configured";
      await admin
        .from("orders")
        .update({ provisioning_error: msg })
        .eq("id", order_id);
      await admin.from("provisioning_logs").insert({
        order_id,
        user_id: userId,
        event: "no_server",
        success: false,
        payload: {},
      });
      return json({ error: msg }, 503);
    }

    const ENC_KEY = Deno.env.get("WHM_ENCRYPTION_KEY") ?? "";
    const created: any[] = [];
    const errors: string[] = [];

    for (const item of hostingItems) {
      const domain = (item.domain ?? "").trim().toLowerCase();
      if (!domain) {
        errors.push(`Item ${item.product_name}: domain not set`);
        continue;
      }
      const username = deriveUsername(domain);
      const password = generatePassword();

      try {
        const resp = await whmCall(server, "createacct", {
          username,
          domain,
          password,
          plan: item.product_id, // package slug e.g. starter_host
          contactemail: userEmail ?? "",
        });

        const ip = resp?.data?.ip ?? server.server_ip ?? null;
        const cpanel_url = `https://${server.hostname}:2083`;
        const nameservers = [server.nameserver1, server.nameserver2];

        // Encrypt password using AES-GCM (Web Crypto)
        const pwdEnc = ENC_KEY ? await encryptSecret(password, ENC_KEY) : null;
        const { data: acct, error: aErr } = await admin
          .from("cpanel_accounts")
          .insert({
            user_id: userId,
            order_id,
            server_id: server.id,
            server_ip: ip,
            username,
            domain,
            plan_name: item.product_name,
            package: item.product_id,
            status: "active",
            nameservers,
            cpanel_url,
            password_encrypted: pwdEnc,
            provisioned_at: new Date().toISOString(),
            expiry_date: addCycle(new Date(), item.cycle),
          })
          .select("*")
          .single();
        if (aErr) throw aErr;

        // Mirror entries
        await admin.from("domains").insert({
          user_id: userId,
          domain,
          status: "active",
          expires_at: addCycle(new Date(), item.cycle),
        });
        await admin.from("services").insert({
          user_id: userId,
          name: item.product_name,
          type: "hosting",
          status: "active",
          expires_at: addCycle(new Date(), item.cycle),
        });

        await admin.from("provisioning_logs").insert({
          order_id,
          cpanel_account_id: acct.id,
          user_id: userId,
          event: "createacct",
          success: true,
          payload: { whm: resp?.metadata ?? {}, ip, domain, username },
        });

        // Increment server counter
        await admin
          .from("whm_servers")
          .update({ current_accounts: (server.current_accounts ?? 0) + 1 } as any)
          .eq("id", server.id);

        created.push({ domain, username, cpanel_url, nameservers, password });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        errors.push(`${domain}: ${msg}`);
        await admin.from("provisioning_logs").insert({
          order_id,
          user_id: userId,
          event: "createacct_error",
          success: false,
          payload: { domain, error: msg },
        });
      }
    }

    await admin
      .from("orders")
      .update({
        provisioned: errors.length === 0,
        provisioning_error: errors.length ? errors.join("\n") : null,
      })
      .eq("id", order_id);

    return json({ ok: errors.length === 0, created, errors });
  } catch (e: any) {
    console.error("create-cpanel-account error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function addCycle(d: Date, cycle: string): string {
  const months: Record<string, number> = {
    monthly: 1, quarterly: 3, semiannual: 6, annual: 12, biennial: 24, triennial: 36,
  };
  const m = months[cycle] ?? 1;
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r.toISOString();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
