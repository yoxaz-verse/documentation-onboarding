create table if not exists public.support_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  designation text check (designation is null or char_length(designation) <= 120),
  category text check (category is null or char_length(category) <= 80),
  note text check (note is null or char_length(note) <= 300),
  display_order integer not null default 0 check (display_order >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_contacts_operator_order
on public.support_contacts (is_available, display_order, name);

drop trigger if exists set_support_contacts_updated_at on public.support_contacts;
create trigger set_support_contacts_updated_at
before update on public.support_contacts
for each row execute function public.set_updated_at();

alter table public.support_contacts enable row level security;

drop policy if exists "Service role can manage support contacts" on public.support_contacts;
create policy "Service role can manage support contacts"
on public.support_contacts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
