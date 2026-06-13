// CMS server functions: public reads + admin writes.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

// ============ Public reads ============

export const getServicePlans = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("service_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data?.category) q = q.eq("category", data.category);
    const { data: rows, error } = await q;
    if (error) return [];
    return rows ?? [];
  });

export const getSiteSections = createServerFn({ method: "GET" })
  .inputValidator((d: { page?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("site_sections")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (data?.page) q = q.eq("page", data.page);
    const { data: rows, error } = await q;
    if (error) return [];
    return rows ?? [];
  });

export const getSiteImages = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("site_images").select("*");
  if (error) return [];
  return data ?? [];
});

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin.from("site_settings").select("*");
  if (error) return [];
  return data ?? [];
});

// ============ Admin writes ============

const planSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  category: z.string().min(1),
  name: z.string().min(1),
  short_description: z.string().nullable().optional(),
  benefits: z.array(z.string()).default([]),
  cta_label: z.string().nullable().optional(),
  cta_href: z.string().nullable().optional(),
  price_brl: z.number().nullable().optional(),
  price_aoa: z.number().nullable().optional(),
  currency_default: z.string().default("BRL"),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  badge: z.string().nullable().optional(),
  sort_order: z.number().int().default(0),
});

export const adminListServicePlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("service_plans")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertServicePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => planSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("service_plans")
      .upsert(data, { onConflict: "slug" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteServicePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("service_plans").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// sections
const sectionSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1),
  page: z.string().default("home"),
  title: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  cta_label: z.string().nullable().optional(),
  cta_href: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const adminListSiteSections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("site_sections")
      .select("*")
      .order("page")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertSiteSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sectionSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_sections").upsert(data, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSiteSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_sections").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// images (URL-based for now; admin pastes URL)
const imageSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1),
  url: z.string().url(),
  alt: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const adminListSiteImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.from("site_images").select("*").order("key");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => imageSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_images").upsert(data, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSiteImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_images").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// settings + contents
const settingSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1),
  value: z.any(),
  description: z.string().nullable().optional(),
});

export const adminListSiteSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.from("site_settings").select("*").order("key");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertSiteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_settings").upsert(data, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

export const adminListSiteContents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin.from("site_contents").select("*").order("key");
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_contents").upsert(data, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("site_contents").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ Domain extensions ============

const domainExtSchema = z.object({
  id: z.string().uuid().optional(),
  ext: z
    .string()
    .min(2)
    .transform((v) => {
      const s = v.trim().toLowerCase();
      return s.startsWith(".") ? s : `.${s}`;
    }),
  slug: z.string().min(1),
  price_brl: z.number().nonnegative().default(0),
  price_aoa: z.number().nonnegative().default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().default(0),
});

export const getDomainExtensions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("domain_extensions" as any)
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data ?? [];
});

export const adminListDomainExtensions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("domain_extensions" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const adminUpsertDomainExtension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => domainExtSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("domain_extensions" as any)
      .upsert(data, { onConflict: "ext" });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteDomainExtension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("domain_extensions" as any)
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

