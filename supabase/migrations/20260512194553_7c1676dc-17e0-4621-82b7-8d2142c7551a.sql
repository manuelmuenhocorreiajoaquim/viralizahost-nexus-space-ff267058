
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, country)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'country'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Services (hosting / vps / dedicated / cloud)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null, -- hosting | vps | cloud | dedicated
  status text not null default 'active', -- active | pending | expired
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "services_select_own" on public.services for select using (auth.uid() = user_id);
create policy "services_insert_own" on public.services for insert with check (auth.uid() = user_id);
create policy "services_update_own" on public.services for update using (auth.uid() = user_id);
create policy "services_delete_own" on public.services for delete using (auth.uid() = user_id);

-- Domains
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,
  status text not null default 'active',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.domains enable row level security;
create policy "domains_select_own" on public.domains for select using (auth.uid() = user_id);
create policy "domains_insert_own" on public.domains for insert with check (auth.uid() = user_id);
create policy "domains_update_own" on public.domains for update using (auth.uid() = user_id);
create policy "domains_delete_own" on public.domains for delete using (auth.uid() = user_id);

-- Email accounts
create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null,
  accounts_count int not null default 0,
  storage_gb int not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.email_accounts enable row level security;
create policy "emails_select_own" on public.email_accounts for select using (auth.uid() = user_id);
create policy "emails_insert_own" on public.email_accounts for insert with check (auth.uid() = user_id);
create policy "emails_update_own" on public.email_accounts for update using (auth.uid() = user_id);
create policy "emails_delete_own" on public.email_accounts for delete using (auth.uid() = user_id);

-- Support tickets
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open', -- open | pending | closed
  priority text not null default 'normal', -- low | normal | high
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
create policy "tickets_select_own" on public.support_tickets for select using (auth.uid() = user_id);
create policy "tickets_insert_own" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "tickets_update_own" on public.support_tickets for update using (auth.uid() = user_id);
create trigger tickets_updated_at before update on public.support_tickets
for each row execute function public.set_updated_at();

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  status text not null default 'pending', -- pending | paid | overdue
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.invoices enable row level security;
create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id);
create policy "invoices_insert_own" on public.invoices for insert with check (auth.uid() = user_id);
create policy "invoices_update_own" on public.invoices for update using (auth.uid() = user_id);
