// cpanel-usage — returns disk/bandwidth usage for a user's cPanel account
// Body: { account_id: string }

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

    const { account_id } = await req.json().catch(() => ({}));
    if (!account_id) return json({ error: "account_id required" }, 400);

    // user can only read own
    const { data: acct, error } = await userClient
      .from("cpanel_accounts")
      .select("id, username, server_id")
      .eq("id", account_id)
      .single();
    if (error || !acct) return json({ error: "Account not found" }, 404);
    if (!acct.server_id) return json({ error: "No server linked" }, 400);

    const { data: server } = await admin
      .from("whm_servers")
      .select("*")
      .eq("id", acct.server_id)
      .single();
    if (!server) return json({ error: "Server not found" }, 404);

    const resp = await whmCall(server as WhmServerRow, "listaccts", {
      search: acct.username,
      searchtype: "user",
    });
    const account = resp?.data?.acct?.[0] ?? null;
    if (!account) return json({ ok: true, usage: null });

    const usage = {
      disk_used_mb: parseInt(account.diskused || "0"),
      disk_quota_mb: account.disklimit === "unlimited"
        ? null
        : parseInt(account.disklimit || "0"),
      bandwidth_used_mb: Math.round((account.totalbytes || 0) / 1024 / 1024),
      bandwidth_quota_mb: account.maxbandwidth === "unlimited"
        ? null
        : parseInt(account.maxbandwidth || "0"),
      email_count: parseInt(account.maxpop || "0"),
      suspended: !!account.suspended,
    };

    return json({ ok: true, usage });
  } catch (e: any) {
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
