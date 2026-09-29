-- Level 11 supplier records are created on the separate main OBAOL platform.
-- This onboarding level only requests admin verification and stores no duplicate supplier data.
update public.operator_journey_day_templates
set
  template_id = 'day-11-supplier-records',
  title = 'Onboard Five Suppliers on the Platform',
  description = 'Add five supplier associates and their associate companies on the main OBAOL platform, then return here for verification.',
  category = 'platform',
  href = null,
  action_label = null,
  review_required = true,
  button_text = 'Request Supplier Verification',
  completion_message = 'Your supplier onboarding has been verified. Next, you will learn how to build buyer-side data.',
  rich_template = coalesce(rich_template, '{}'::jsonb) || $level11$
  {
    "id": "day-11-supplier-records",
    "day": 11,
    "title": "Onboard Five Suppliers on the Platform",
    "description": "Add five supplier associates and their associate companies on the main OBAOL platform, then return here for verification.",
    "category": "platform",
    "dayType": "Platform Execution",
    "purpose": "Supplier onboarding must happen on the main platform so the records become usable operational data without being duplicated in the training workspace.",
    "learn": [
      "Add the supplier as an associate",
      "Add and connect the associate company",
      "Capture identity, contact, location, products, source, and verification information"
    ],
    "tasks": [
      {
        "title": "Go to the main OBAOL platform",
        "instruction": "Open the platform you use for normal operator work."
      },
      {
        "title": "Add five supplier associates",
        "instruction": "Create five supplier associates and add the associate company for each supplier."
      },
      {
        "title": "Complete the core supplier information",
        "instruction": "Ensure each record includes identity, contact, location, company, products, source, and verification information."
      },
      {
        "title": "Return and request verification",
        "instruction": "Come back to this level and submit the verification request. An onboarding admin will check the five records on the platform."
      }
    ],
    "requiredOutput": "Five supplier associates and associate companies added on the main platform.",
    "buttonText": "Request Supplier Verification",
    "completionMessage": "Your supplier onboarding has been verified. Next, you will learn how to build buyer-side data.",
    "reviewRequired": true,
    "formFields": [],
    "repeatGroups": [],
    "metricMaps": []
  }
  $level11$::jsonb,
  updated_at = now()
where day_number = 11;
