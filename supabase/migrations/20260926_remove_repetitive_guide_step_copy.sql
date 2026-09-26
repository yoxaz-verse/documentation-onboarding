-- Guide cards already show their step number and parent level, so remove the
-- redundant generated sentence from existing persisted task instructions.
update public.operator_journey_day_templates as template
set tasks = coalesce((
  select jsonb_agg(
    case
      when jsonb_typeof(task.value) = 'object'
        and jsonb_typeof(task.value->'instruction') = 'string'
      then jsonb_set(
        task.value,
        '{instruction}',
        to_jsonb(regexp_replace(
          task.value->>'instruction',
          '[[:space:]]+This is guide step [0-9]+ for Level [0-9]+\.$',
          ''
        )),
        false
      )
      else task.value
    end
    order by task.ordinality
  )
  from jsonb_array_elements(coalesce(template.tasks, '[]'::jsonb))
    with ordinality as task(value, ordinality)
), '[]'::jsonb)
where jsonb_typeof(template.tasks) = 'array';

update public.operator_journey_day_templates as template
set rich_template = jsonb_set(
  template.rich_template,
  '{tasks}',
  coalesce((
    select jsonb_agg(
      case
        when jsonb_typeof(task.value) = 'object'
          and jsonb_typeof(task.value->'instruction') = 'string'
        then jsonb_set(
          task.value,
          '{instruction}',
          to_jsonb(regexp_replace(
            task.value->>'instruction',
            '[[:space:]]+This is guide step [0-9]+ for Level [0-9]+\.$',
            ''
          )),
          false
        )
        else task.value
      end
      order by task.ordinality
    )
    from jsonb_array_elements(coalesce(template.rich_template->'tasks', '[]'::jsonb))
      with ordinality as task(value, ordinality)
  ), '[]'::jsonb),
  true
)
where template.rich_template is not null
  and jsonb_typeof(template.rich_template->'tasks') = 'array';
