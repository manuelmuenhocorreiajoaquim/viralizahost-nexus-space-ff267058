
-- Storage bucket for bank transfer receipts
insert into storage.buckets (id, name, public)
values ('bank-receipts', 'bank-receipts', true)
on conflict (id) do nothing;

-- Anyone (auth or anon) can upload a receipt (checkout works without auth)
create policy "bank_receipts_insert_any"
on storage.objects for insert
with check (bucket_id = 'bank-receipts');

-- Public read (bucket is public; receipts are short-lived order proofs)
create policy "bank_receipts_select_public"
on storage.objects for select
using (bucket_id = 'bank-receipts');

-- Admin global read on orders / payments
create policy "orders_admin_select_all"
on public.orders for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "orders_admin_update_all"
on public.orders for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "payments_admin_select_all"
on public.payments for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "payments_admin_update_all"
on public.payments for update
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "order_items_admin_select_all"
on public.order_items for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));
