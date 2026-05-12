// whm-test-connection — admin only
// Body: { server_id?: string, api_url?, username?, token? }
// If server_id is provided, uses stored credentials. Otherwise tests provided creds.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { whmCall, type WhmServerRow } from "../_shared/whm.ts";

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

    const { data: isAdmin } = await userClient.rpc("has_role" as any, {
      _user_id: u.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    let server: WhmServerRow | null = null;

    if (body.server_id) {
      const { data, error } = await admin
        .from("whm_servers")
        .select("*")
        .eq("id", body.server_id)
        .single();
      if (error || !data) return json({ error: "Server not found" }, 404);
      server = data as WhmServerRow;
    } else {
      if (!body.api_url || !body.username || !body.token) {
        return json({ error: "Missing api_url/username/token" }, 400);
      }
      server = {
        id: "tmp",
        hostname: body.hostname ?? body.api_url,
        api_url: body.api_url,
        username: body.username,
        token: body.token,
        server_ip: null,
        nameserver1: "",
        nameserver2: "",
      };
    }

    const resp = await whmCall(server, "version");
    return json({ ok: true, version: resp?.data?.version ?? resp });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? "Failed" }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
