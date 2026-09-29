-- Journey ranking is derived from canonical start and submission records so it
-- cannot become stale as operating days advance. Supporting indexes keep the
-- aggregation inexpensive as the operator population grows.
create index if not exists operator_journey_submissions_rank_idx
  on public.operator_journey_day_submissions (email, status, day_number);

create index if not exists operator_journey_state_started_idx
  on public.operator_journey_state (started_at, email)
  where started_at is not null;

create or replace view public.operator_journey_leaderboard as
with active_levels as (
  select day_number
  from public.operator_journey_day_templates
  where is_active is distinct from false
),
progress as (
  select
    state.email,
    state.started_at,
    least(30, greatest(1, floor(extract(epoch from (now() - state.started_at)) / 86400)::integer + 1)) as operating_day,
    count(submission.day_number) filter (where submission.status = 'completed')::integer as completed_levels,
    max(coalesce(submission.updated_at, submission.submitted_at, state.updated_at)) as last_activity_at
  from public.operator_journey_state state
  left join public.operator_journey_day_submissions submission on submission.email = state.email
  where state.started_at is not null
  group by state.email, state.started_at, state.updated_at
)
select
  progress.email,
  progress.started_at,
  progress.operating_day,
  progress.completed_levels,
  (
    select min(level.day_number)
    from active_levels level
    where not exists (
      select 1
      from public.operator_journey_day_submissions submission
      where submission.email = progress.email
        and submission.day_number = level.day_number
        and submission.status = 'completed'
    )
  )::integer as current_level,
  progress.last_activity_at
from progress;

revoke all on public.operator_journey_leaderboard from anon, authenticated;
grant select on public.operator_journey_leaderboard to service_role;

create or replace function public.get_operator_journey_leaderboard(
  p_email text,
  p_limit integer default 10
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      leaderboard.*,
      rank() over (
        order by leaderboard.completed_levels desc, coalesce(leaderboard.current_level, 31) desc,
          leaderboard.operating_day asc, leaderboard.last_activity_at asc nulls last, leaderboard.email
      )::integer as overall_rank,
      count(*) over ()::integer as total_participants,
      rank() over (
        partition by leaderboard.operating_day
        order by leaderboard.completed_levels desc, coalesce(leaderboard.current_level, 31) desc,
          leaderboard.last_activity_at asc nulls last, leaderboard.email
      )::integer as cohort_rank,
      count(*) over (partition by leaderboard.operating_day)::integer as cohort_size
    from public.operator_journey_leaderboard leaderboard
  ),
  current_operator as (
    select * from ranked where email = p_email
  ),
  leaders as (
    select ranked.*
    from ranked
    order by overall_rank
    limit least(greatest(coalesce(p_limit, 10), 1), 25)
  )
  select jsonb_build_object(
    'summary', case when current_operator.email is null then null else jsonb_build_object(
      'operatingDay', current_operator.operating_day,
      'currentLevel', current_operator.current_level,
      'completedLevels', current_operator.completed_levels,
      'overallRank', current_operator.overall_rank,
      'totalParticipants', current_operator.total_participants,
      'cohortRank', current_operator.cohort_rank,
      'cohortSize', current_operator.cohort_size,
      'aheadOf', greatest(current_operator.cohort_size - current_operator.cohort_rank, 0),
      'percentile', case
        when current_operator.cohort_size <= 1 then 100
        else round(100.0 * (current_operator.cohort_size - current_operator.cohort_rank) / (current_operator.cohort_size - 1))::integer
      end
    ) end,
    'entries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'email', leaders.email,
        'rank', leaders.overall_rank,
        'operatingDay', leaders.operating_day,
        'currentLevel', leaders.current_level,
        'completedLevels', leaders.completed_levels,
        'isCurrentUser', leaders.email = p_email
      ) order by leaders.overall_rank)
      from leaders
    ), '[]'::jsonb)
  )
  from current_operator
  right join (select 1) singleton on true;
$$;

revoke all on function public.get_operator_journey_leaderboard(text, integer) from public, anon, authenticated;
grant execute on function public.get_operator_journey_leaderboard(text, integer) to service_role;
