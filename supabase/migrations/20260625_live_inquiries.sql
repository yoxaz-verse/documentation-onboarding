create table if not exists public.live_inquiries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  order_summary text not null default '',
  products jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_inquiries_products_array check (jsonb_typeof(products) = 'array')
);

drop trigger if exists set_live_inquiries_updated_at on public.live_inquiries;
create trigger set_live_inquiries_updated_at
before update on public.live_inquiries
for each row execute function public.set_updated_at();

alter table public.live_inquiries enable row level security;

drop policy if exists "Service role can manage live inquiries" on public.live_inquiries;
create policy "Service role can manage live inquiries"
on public.live_inquiries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
