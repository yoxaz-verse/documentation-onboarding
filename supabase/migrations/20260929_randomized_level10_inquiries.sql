-- Turn Level 10 into a generated inquiry-classification exercise.
-- Inquiry prompts are selected in the client from the operator's Level 5 product circle;
-- the submitted answer shape remains unchanged.
update public.operator_journey_day_templates
set
  template_id = 'day-10-cluster-search-rule',
  title = 'Inquiry Flexibility and Cluster Search Rule',
  description = 'Classify five randomized trade inquiries while deciding when wider OBAOL cluster support is required.',
  category = 'learning',
  review_required = false,
  button_text = 'Complete Cluster Search Rule',
  completion_message = 'You now understand how to stay focused while still responding to wider opportunities through the OBAOL cluster system.',
  rich_template = coalesce(rich_template, '{}'::jsonb) || $level10$
  {
    "id": "day-10-cluster-search-rule",
    "day": 10,
    "title": "Inquiry Flexibility and Cluster Search Rule",
    "description": "Classify five randomized trade inquiries while deciding when wider OBAOL cluster support is required.",
    "category": "learning",
    "dayType": "Operating Discipline",
    "purpose": "Primary work stays inside the selected product circle, but wider inquiries should be searched and recorded through cluster collaboration.",
    "learn": [
      "Focused product circle work",
      "Wider inquiry response through cluster search",
      "Identify missing commercial details before taking action"
    ],
    "tasks": [
      {
        "title": "Study the cluster search rule",
        "instruction": "Use your selected product circle for focused work and use the wider OBAOL cluster when an inquiry falls outside it."
      },
      {
        "title": "Classify five randomized inquiries",
        "instruction": "Read each generated inquiry and choose its classification and whether an internal database search is required."
      },
      {
        "title": "Identify missing details and next action",
        "instruction": "Record what information is missing and the most appropriate next action. Enter None when no material detail is missing."
      }
    ],
    "requiredOutput": "Five classified randomized inquiries.",
    "buttonText": "Complete Cluster Search Rule",
    "completionMessage": "You now understand how to stay focused while still responding to wider opportunities through the OBAOL cluster system.",
    "reviewRequired": false,
    "formFields": [],
    "repeatGroups": [
      {
        "id": "clusterInquiries",
        "label": "Random inquiry test",
        "minEntries": 5,
        "fixedEntries": true,
        "fields": [
          { "id": "inquiryText", "label": "Inquiry text", "type": "textarea", "required": true, "readOnly": true },
          { "id": "classification", "label": "Classification", "type": "select", "required": true, "options": ["Inside my product circle", "Outside but searchable", "Needs cluster support", "Not enough details", "Not serious"] },
          { "id": "internalSearchRequired", "label": "Internal database search required", "type": "select", "required": true, "options": ["Yes", "No"] },
          { "id": "missingDetails", "label": "Missing details", "type": "textarea", "required": true },
          { "id": "nextAction", "label": "Next action", "type": "textarea", "required": true }
        ]
      }
    ]
  }
  $level10$::jsonb,
  updated_at = now()
where day_number = 10;
