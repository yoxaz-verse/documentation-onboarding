-- Rename operator-facing journey terminology without changing internal day-based keys,
-- routes, sequencing, elapsed-time calculations, or existing submissions.

update public.operator_journey_day_templates
set
  title = replace(replace(title, '30-day', '30-level'), 'Day ', 'Level '),
  description = replace(replace(description, '30-day', '30-level'), 'Day ', 'Level '),
  button_text = replace(replace(button_text, '30-day', '30-level'), 'Day ', 'Level '),
  completion_message = replace(
    replace(
      replace(
        replace(completion_message, '30-day', '30-level'),
        'Day ', 'Level '
      ),
      'final day', 'final level'
    ),
    'next day', 'next level'
  ),
  rich_template = replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(rich_template::text, '30-day', '30-level'),
              '30-Day', '30-Level'
            ),
            'Days ', 'Levels '
          ),
          'Day ', 'Level '
        ),
        'daily submission', 'level submission'
      ),
      'daily guides', 'level guides'
    ),
    'future days', 'future levels'
  )::jsonb
where rich_template is not null;

update public.operator_journey_day_templates
set rich_template = replace(
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(rich_template::text, 'daily work', 'journey work'),
              'daily operator milestones', 'operator journey levels'
            ),
            'daily completion tracking', 'level completion tracking'
          ),
          'daily tasks', 'level tasks'
        ),
        'final day', 'final level'
      ),
      'next day', 'next level'
    ),
    'earlier days', 'earlier levels'
  ),
  'this day', 'this level'
)::jsonb
where rich_template is not null;
