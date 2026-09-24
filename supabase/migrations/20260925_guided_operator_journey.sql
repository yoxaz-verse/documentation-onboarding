-- Convert persisted plain-text task lists into structured guide steps.
update public.operator_journey_day_templates
set tasks = coalesce((
  select jsonb_agg(
    case
      when jsonb_typeof(task.value) = 'object' then task.value
      else jsonb_build_object(
        'title', trim(both '"' from task.value::text),
        'instruction', 'Complete this action carefully, then record the result in the daily submission below.'
      )
    end
    order by task.ordinality
  )
  from jsonb_array_elements(coalesce(tasks, '[]'::jsonb)) with ordinality as task(value, ordinality)
), '[]'::jsonb);

update public.operator_journey_day_templates
set rich_template = jsonb_set(
  rich_template,
  '{tasks}',
  coalesce((
    select jsonb_agg(
      case
        when jsonb_typeof(task.value) = 'object' then task.value
        else jsonb_build_object(
          'title', trim(both '"' from task.value::text),
          'instruction', 'Complete this action carefully, then record the result in the daily submission below.'
        )
      end
      order by task.ordinality
    )
    from jsonb_array_elements(coalesce(rich_template->'tasks', '[]'::jsonb)) with ordinality as task(value, ordinality)
  ), '[]'::jsonb),
  true
)
where rich_template is not null;

-- Day 1 is intentionally more explicit: every required confirmation follows a linked guide action.
update public.operator_journey_day_templates
set
  tasks = '[
    {"title":"Open the operator dashboard","instruction":"Review the dashboard navigation and identify where your onboarding progress, daily work, courses, profile, and operator tools are located.","href":"/","actionLabel":"Open dashboard"},
    {"title":"Review your operator profile","instruction":"Verify that your account and setup details are complete and correct. Update them before continuing if anything is missing.","href":"/profile","actionLabel":"Review profile"},
    {"title":"Open the course library","instruction":"Review where your training tracks and lessons are located so you can return to them during the 30-day journey.","href":"/courses","actionLabel":"Open course library"},
    {"title":"Review the 30-day journey","instruction":"Understand how daily guides, required outputs, submissions, reviews, and locked future days work on this page.","href":"/journey","actionLabel":"Review journey page"},
    {"title":"Confirm communication access","instruction":"Open the official operator WhatsApp group and confirm that you can receive operator coordination messages and updates.","href":"https://chat.whatsapp.com/LO1Hq98MF1X9lVc1PIlAwn?mode=gi_t","actionLabel":"Open WhatsApp group"}
  ]'::jsonb,
  rich_template = jsonb_set(
    jsonb_set(
      coalesce(rich_template, '{}'::jsonb),
      '{tasks}',
      '[
        {"title":"Open the operator dashboard","instruction":"Review the dashboard navigation and identify where your onboarding progress, daily work, courses, profile, and operator tools are located.","href":"/","actionLabel":"Open dashboard"},
        {"title":"Review your operator profile","instruction":"Verify that your account and setup details are complete and correct. Update them before continuing if anything is missing.","href":"/profile","actionLabel":"Review profile"},
        {"title":"Open the course library","instruction":"Review where your training tracks and lessons are located so you can return to them during the 30-day journey.","href":"/courses","actionLabel":"Open course library"},
        {"title":"Review the 30-day journey","instruction":"Understand how daily guides, required outputs, submissions, reviews, and locked future days work on this page.","href":"/journey","actionLabel":"Review journey page"},
        {"title":"Confirm communication access","instruction":"Open the official operator WhatsApp group and confirm that you can receive operator coordination messages and updates.","href":"https://chat.whatsapp.com/LO1Hq98MF1X9lVc1PIlAwn?mode=gi_t","actionLabel":"Open WhatsApp group"}
      ]'::jsonb,
      true
    ),
    '{formFields}',
    '[
      {"id":"dashboardReviewed","label":"I opened and reviewed the operator dashboard","type":"select","required":true,"options":["Yes"]},
      {"id":"profileReviewed","label":"I reviewed my operator profile","type":"select","required":true,"options":["Yes"]},
      {"id":"courseLibraryOpened","label":"I opened and reviewed the course library","type":"select","required":true,"options":["Yes"]},
      {"id":"journeyPageOpened","label":"I reviewed the 30-day journey workflow","type":"select","required":true,"options":["Yes"]},
      {"id":"communicationConfirmed","label":"I confirmed access to the operator WhatsApp group","type":"select","required":true,"options":["Yes"]},
      {"id":"accessIssue","label":"Any access issue","type":"textarea","required":false},
      {"id":"confirmationNote","label":"Operator confirmation note","type":"textarea","required":true}
    ]'::jsonb,
    true
  )
where day_number = 1;
