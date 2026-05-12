// save-whm-server — admin only
// Creates/updates WHM servers and encrypts API tokens before storage.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { encryptSecret } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PUBLISHABLE = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: role } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const hostname = String(body.hostname ?? "").trim();
    const api_url = String(body.api_url ?? "").trim().replace(/\/+$/, "");
    const username = String(body.username ?? "").trim();
    const token = String(body.token ?? "").trim();
    const nameservers = Array.isArray(body.nameservers)
      ? body.nameservers.map((ns: unknown) => String(ns).trim()).filter(Boolean)
      : [];

    if (!name || !hostname || !api_url || !username) {
      return json({ error: "name, hostname, api_url and username are required" }, 400);
    }
    if (!body.id && !token) return json({ error: "token is required for new servers" }, 400);
    if (nameservers.length === 0) return json({ error: "At least one nameserver is required" }, 400);

    const ENC_KEY = Deno.env.get("WHM_ENCRYPTION_KEY") ?? "";
    const token_encrypted = token ? await encryptSecret(token, ENC_KEY) : undefined;
    const payload: Record<string, unknown> = {
      name,
      hostname,
      api_url,
      username,
      nameservers,
      nameserver1: nameservers[0] ?? "",
      nameserver2: nameservers[1] ?? nameservers[0] ?? "",
      active: Boolean(body.active),
      server_ip: body.server_ip ? String(body.server_ip).trim() : null,
      max_accounts: Number(body.max_accounts) || 500,
      notes: body.notes ? String(body.notes) : null,
    };

    if (token_encrypted) {
      payload.token_encrypted = token_encrypted;
      payload.token = null;
    }

    const query = body.id
      ? admin.from("whm_servers").update(payload).eq("id", body.id).select("id").single()
      : admin.from("whm_servers").insert(payload).select("id").single();

    const { data, error } = await query;
    if (error) throw error;
    return json({ ok: true, id: data.id });
  } catch (e: any) {
    console.error("save-whm-server error:", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
