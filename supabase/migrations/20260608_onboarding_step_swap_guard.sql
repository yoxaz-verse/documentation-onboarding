create table if not exists public.app_migration_runs (
  migration_key text primary key,
  completed_at timestamptz not null default timezone('utc', now())
);

create or replace function public.run_onboarding_step_7_8_swap()
returns table(already_ran boolean, affected_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  migration_name constant text := '20260608_swap_onboarding_steps_7_8';
  touched integer := 0;
begin
  if exists (
    select 1
    from public.app_migration_runs
    where migration_key = migration_name
  ) then
    return query select true, 0;
    return;
  end if;

  update public.operator_progress
  set current_step = case
    when current_step = 7 then 8
    when current_step = 8 then 7
    else current_step
  end
  where current_step in (7, 8);

  get diagnostics touched = row_count;

  insert into public.app_migration_runs (migration_key)
  values (migration_name);

  return query select false, touched;
end;
$$;
