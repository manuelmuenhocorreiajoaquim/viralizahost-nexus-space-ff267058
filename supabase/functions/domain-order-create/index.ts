import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { domain_name, extension, price, customer_email } = body ?? {};
    if (!domain_name || !extension || typeof price !== "number") {
      return new Response(JSON.stringify({ error: "Dados inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve user from auth header (optional).
    let userId: string | null = null;
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const { data, error } = await admin
      .from("domain_orders")
      .insert({
        domain_name,
        extension,
        price,
        customer_email: customer_email ?? null,
        user_id: userId,
        provider: Deno.env.get("DOMAIN_PROVIDER") ?? "namesilo",
        status: "pending",
        currency: "BRL",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ order: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("domain-order-create error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
