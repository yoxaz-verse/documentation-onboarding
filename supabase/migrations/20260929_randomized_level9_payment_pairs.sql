-- Turn Level 9 into a generated buyer/supplier payment-pair exercise.
-- The client supplies the randomized prompt pairs while preserving the existing
-- paymentScenarios submission shape and all historical submissions.
update public.operator_journey_day_templates
set
  template_id = 'day-9-payment-risk',
  title = 'Payment Terms and Risk',
  description = 'Assess five randomized buyer and supplier payment-preference pairs for compatibility and trade risk.',
  category = 'learning',
  review_required = false,
  button_text = 'Complete Payment Risk Task',
  completion_message = 'You now understand that payment terms must be recorded carefully before moving any trade opportunity forward.',
  rich_template = coalesce(rich_template, '{}'::jsonb) || $level9$
  {
    "id": "day-9-payment-risk",
    "day": 9,
    "title": "Payment Terms and Risk",
    "description": "Assess five randomized buyer and supplier payment-preference pairs for compatibility and trade risk.",
    "category": "learning",
    "dayType": "Commercial Risk",
    "purpose": "Wrong payment commitments can break trades and damage trust.",
    "learn": [
      "Advance, partial advance, and balance-payment triggers",
      "Open-account credit, TT, LC, DP, and DA",
      "Bank guarantees, SBLC structures, compatibility, and trade risk"
    ],
    "tasks": [
      {
        "title": "Study payment terms",
        "instruction": "Review how payment timing, banking method, document triggers, credit exposure, and security affect both parties."
      },
      {
        "title": "Assess five randomized payment pairs",
        "instruction": "Compare each fixed buyer preference with the corresponding supplier preference."
      },
      {
        "title": "Record the decision",
        "instruction": "Select compatibility and risk, then write the clarification needed and the next action for each pair."
      }
    ],
    "requiredOutput": "Five completed payment compatibility assessments.",
    "buttonText": "Complete Payment Risk Task",
    "completionMessage": "You now understand that payment terms must be recorded carefully before moving any trade opportunity forward.",
    "reviewRequired": false,
    "formFields": [],
    "repeatGroups": [
      {
        "id": "paymentScenarios",
        "label": "Random payment-pair test",
        "minEntries": 5,
        "fixedEntries": true,
        "fields": [
          { "id": "buyerPreference", "label": "Buyer payment preference", "type": "text", "required": true, "readOnly": true },
          { "id": "supplierPreference", "label": "Supplier payment preference", "type": "text", "required": true, "readOnly": true },
          { "id": "compatibility", "label": "Compatibility", "type": "select", "required": true, "options": ["Compatible", "Not compatible", "Needs negotiation"] },
          { "id": "riskLevel", "label": "Risk level", "type": "select", "required": true, "options": ["Low", "Medium", "High"] },
          { "id": "clarificationNeeded", "label": "Clarification needed", "type": "textarea", "required": true },
          { "id": "nextAction", "label": "Next action", "type": "textarea", "required": true }
        ]
      }
    ]
  }
  $level9$::jsonb,
  updated_at = now()
where day_number = 9;
