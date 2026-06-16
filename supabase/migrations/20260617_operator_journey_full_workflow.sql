alter table public.operator_journey_day_templates
  add column if not exists phase text,
  add column if not exists day_type text,
  add column if not exists purpose text,
  add column if not exists learn jsonb not null default '[]'::jsonb,
  add column if not exists tasks jsonb not null default '[]'::jsonb,
  add column if not exists required_output text,
  add column if not exists button_text text,
  add column if not exists completion_message text,
  add column if not exists review_required boolean not null default false,
  add column if not exists rich_template jsonb;

create table if not exists public.operator_journey_day_submissions (
  id uuid primary key default gen_random_uuid(),
  email text not null references public.operators(email) on delete cascade,
  template_id text not null,
  day_number integer not null check (day_number between 1 and 30),
  status text not null check (status in ('pending', 'submitted', 'under_review', 'completed', 'needs_correction')),
  answers jsonb not null default '{}'::jsonb,
  computed_metrics jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, day_number)
);

drop trigger if exists set_operator_journey_day_submissions_updated_at on public.operator_journey_day_submissions;
create trigger set_operator_journey_day_submissions_updated_at
before update on public.operator_journey_day_submissions
for each row execute function public.set_updated_at();

alter table public.operator_journey_day_submissions enable row level security;

drop policy if exists "Service role can manage operator journey day submissions" on public.operator_journey_day_submissions;
create policy "Service role can manage operator journey day submissions"
on public.operator_journey_day_submissions
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
