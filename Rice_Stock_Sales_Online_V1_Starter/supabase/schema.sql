-- Rice Stock & Sales Dashboard | Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'department_user' check (role in ('admin','store_manager','department_user')),
  store_code text not null default '29',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_snapshots (
  id uuid primary key default gen_random_uuid(),
  store_code text not null,
  snapshot_date date not null,
  item_no text not null,
  description text,
  selling_price numeric(14,2) not null default 0,
  asoh numeric(14,2) not null default 0,
  usoh numeric(14,2) not null default 0,
  on_order numeric(14,2) not null default 0,
  in_transit numeric(14,2) not null default 0,
  avg_sale_28d numeric(14,4) not null default 0,
  last_month_sold numeric(14,2) not null default 0,
  current_month_sold numeric(14,2) not null default 0,
  ly_same_period_sold numeric(14,2) not null default 0,
  stock_cover_days numeric(14,2),
  oos_status text not null default 'HEALTHY',
  stock_value numeric(14,2) not null default 0,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_code,snapshot_date,item_no)
);

create table if not exists public.upload_logs (
  id uuid primary key default gen_random_uuid(),
  store_code text not null,
  snapshot_date date not null,
  file_name text,
  record_count integer not null default 0,
  uploaded_by uuid references auth.users(id),
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.action_logs (
  id uuid primary key default gen_random_uuid(),
  store_code text not null default '29',
  item_no text,
  issue_type text not null,
  priority text not null default 'medium',
  root_cause text,
  action_plan text,
  owner_id uuid references auth.users(id),
  due_date date,
  status text not null default 'pending',
  result_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_inventory_store_date on public.inventory_snapshots(store_code,snapshot_date desc);
create index if not exists idx_inventory_status on public.inventory_snapshots(store_code,oos_status);
create index if not exists idx_action_store_status on public.action_logs(store_code,status);

alter table public.user_profiles enable row level security;
alter table public.inventory_snapshots enable row level security;
alter table public.upload_logs enable row level security;
alter table public.action_logs enable row level security;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path=public
as $$ select role from public.user_profiles where id=auth.uid() $$;

create or replace function public.current_user_store()
returns text language sql stable security definer set search_path=public
as $$ select store_code from public.user_profiles where id=auth.uid() $$;

create policy "profile read self or admin" on public.user_profiles for select to authenticated
using (id=auth.uid() or public.current_user_role()='admin');
create policy "profile admin manage" on public.user_profiles for all to authenticated
using (public.current_user_role()='admin') with check (public.current_user_role()='admin');

create policy "inventory read own store" on public.inventory_snapshots for select to authenticated
using (store_code=public.current_user_store() or public.current_user_role()='admin');
create policy "upload log read own store" on public.upload_logs for select to authenticated
using (store_code=public.current_user_store() or public.current_user_role()='admin');
create policy "actions read own store" on public.action_logs for select to authenticated
using (store_code=public.current_user_store() or public.current_user_role()='admin');
create policy "actions insert own store" on public.action_logs for insert to authenticated
with check (store_code=public.current_user_store() and public.current_user_role() in ('admin','store_manager','department_user'));
create policy "actions update own store" on public.action_logs for update to authenticated
using (store_code=public.current_user_store() and public.current_user_role() in ('admin','store_manager','department_user'))
with check (store_code=public.current_user_store());

-- Server-side import uses the service role key only in the API route.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to browser code.
