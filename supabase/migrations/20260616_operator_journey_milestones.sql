create table if not exists public.operator_journey_state (
  email text primary key references public.operators(email) on delete cascade,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operator_journey_check_state (
  email text not null references public.operators(email) on delete cascade,
  check_id text not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (email, check_id)
);

create table if not exists public.operator_journey_milestone_state (
  email text not null references public.operators(email) on delete cascade,
  milestone_id text not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (email, milestone_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_operator_journey_state_updated_at on public.operator_journey_state;
create trigger set_operator_journey_state_updated_at
before update on public.operator_journey_state
for each row execute function public.set_updated_at();

drop trigger if exists set_operator_journey_check_state_updated_at on public.operator_journey_check_state;
create trigger set_operator_journey_check_state_updated_at
before update on public.operator_journey_check_state
for each row execute function public.set_updated_at();

drop trigger if exists set_operator_journey_milestone_state_updated_at on public.operator_journey_milestone_state;
create trigger set_operator_journey_milestone_state_updated_at
before update on public.operator_journey_milestone_state
for each row execute function public.set_updated_at();

alter table public.operator_journey_state enable row level security;
alter table public.operator_journey_check_state enable row level security;
alter table public.operator_journey_milestone_state enable row level security;

drop policy if exists "Service role can manage operator journey state" on public.operator_journey_state;
create policy "Service role can manage operator journey state"
on public.operator_journey_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage operator journey checks" on public.operator_journey_check_state;
create policy "Service role can manage operator journey checks"
on public.operator_journey_check_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage operator journey milestones" on public.operator_journey_milestone_state;
create policy "Service role can manage operator journey milestones"
on public.operator_journey_milestone_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
