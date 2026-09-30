-- Keep Level 1 focused on workspace setup, add commission confirmation to Level 2,
-- and make Level 3 a practical orientation to the main OBAOL platform.
-- Existing submissions are intentionally preserved.

update public.operator_journey_day_templates
set
  learn = $level2_learn$
  [
    "OBAOL is not a marketplace, broker, trader, or lead-selling platform",
    "OBAOL does not own inventory or guarantee buyers/sellers",
    "Execution breaks down through vague inquiries, weak verification, price/payment mismatch, poor follow-up, and logistics/document gaps",
    "How the OBAOL commission structure rewards execution"
  ]
  $level2_learn$::jsonb,
  tasks = $level2_tasks$
  [
    { "title": "Read the execution model", "instruction": "Complete this action carefully, then record the result in the level submission below." },
    { "title": "Study what OBAOL is not", "instruction": "Complete this action carefully, then record the result in the level submission below." },
    { "title": "Explain why execution support matters", "instruction": "Complete this action carefully, then record the result in the level submission below." },
    {
      "title": "Review the commission structure",
      "instruction": "Study the commission material in the operator foundations course and confirm that you understand how the OBAOL commission structure works.",
      "href": "/courses/beginner-operator-foundations",
      "actionLabel": "Review commission material"
    },
    { "title": "Submit a 5-line explanation", "instruction": "Complete this action carefully, then record the result in the level submission below." }
  ]
  $level2_tasks$::jsonb,
  rich_template = coalesce(rich_template, '{}'::jsonb) || $level2$
  {
    "learn": [
      "OBAOL is not a marketplace, broker, trader, or lead-selling platform",
      "OBAOL does not own inventory or guarantee buyers/sellers",
      "Execution breaks down through vague inquiries, weak verification, price/payment mismatch, poor follow-up, and logistics/document gaps",
      "How the OBAOL commission structure rewards execution"
    ],
    "tasks": [
      { "title": "Read the execution model", "instruction": "Complete this action carefully, then record the result in the level submission below." },
      { "title": "Study what OBAOL is not", "instruction": "Complete this action carefully, then record the result in the level submission below." },
      { "title": "Explain why execution support matters", "instruction": "Complete this action carefully, then record the result in the level submission below." },
      {
        "title": "Review the commission structure",
        "instruction": "Study the commission material in the operator foundations course and confirm that you understand how the OBAOL commission structure works.",
        "href": "/courses/beginner-operator-foundations",
        "actionLabel": "Review commission material"
      },
      { "title": "Submit a 5-line explanation", "instruction": "Complete this action carefully, then record the result in the level submission below." }
    ],
    "formFields": [
      { "id": "whatIsObaol", "label": "What is OBAOL?", "type": "textarea", "required": true },
      { "id": "whatIsNotObaol", "label": "What is OBAOL not?", "type": "textarea", "required": true },
      { "id": "whyExecutionMatters", "label": "Why does execution matter in trade?", "type": "textarea", "required": true },
      { "id": "acknowledgement", "label": "I understand that OBAOL is not a marketplace, broker, or lead-selling system.", "type": "checkbox", "required": true },
      { "id": "commissionStructureUnderstood", "label": "I understand the OBAOL commission structure.", "type": "checkbox", "required": true }
    ]
  }
  $level2$::jsonb,
  updated_at = now()
where day_number = 2;

update public.operator_journey_day_templates
set
  title = 'Navigate the OBAOL Platform',
  description = 'Walk through the main OBAOL dashboard workflows for associate companies, associates, products, enquiries, and orders.',
  category = 'platform',
  href = null,
  action_label = null,
  day_type = 'Platform Orientation',
  purpose = 'The operator must know where core supplier, product, enquiry, and order work is completed on the main OBAOL platform before continuing the journey.',
  learn = $level3_learn$
  [
    "Add an associate company before connecting its associate",
    "Create a product and publish it live",
    "Create an enquiry and understand how it progresses into the order flow"
  ]
  $level3_learn$::jsonb,
  tasks = $level3_tasks$
  [
    {
      "title": "Add an associate company",
      "instruction": "Open the Companies page and review how an associate company is entered on the main OBAOL platform.",
      "href": "https://www.obaol.com/dashboard/companies",
      "actionLabel": "Open associate companies"
    },
    {
      "title": "Add an associate",
      "instruction": "Review how an associate is entered and connected to the correct associate company.",
      "href": "https://www.obaol.com/dashboard/companies",
      "actionLabel": "Open associates"
    },
    {
      "title": "Add a product",
      "instruction": "Open the Products page and review the information required to create a product.",
      "href": "https://www.obaol.com/dashboard/product",
      "actionLabel": "Open products"
    },
    {
      "title": "Make a product live",
      "instruction": "Review how a completed product is published or activated so it becomes live on the platform.",
      "href": "https://www.obaol.com/dashboard/product",
      "actionLabel": "Review product publishing"
    },
    {
      "title": "Create an enquiry",
      "instruction": "Open the Enquiries page and review how a buyer requirement is entered as an enquiry.",
      "href": "https://www.obaol.com/dashboard/enquiries",
      "actionLabel": "Open enquiries"
    },
    {
      "title": "Review the order flow",
      "instruction": "Open the Orders page and review how an enquiry progresses through the order workflow.",
      "href": "https://www.obaol.com/dashboard/orders",
      "actionLabel": "Open orders"
    }
  ]
  $level3_tasks$::jsonb,
  required_output = 'Confirm that you reviewed all six core OBAOL platform workflows.',
  review_required = false,
  button_text = 'Confirm Platform Navigation',
  completion_message = 'You now understand where associate companies, associates, products, enquiries, and orders are managed on the OBAOL platform.',
  rich_template = coalesce(rich_template, '{}'::jsonb) || $level3$
  {
    "title": "Navigate the OBAOL Platform",
    "description": "Walk through the main OBAOL dashboard workflows for associate companies, associates, products, enquiries, and orders.",
    "category": "platform",
    "href": null,
    "actionLabel": null,
    "dayType": "Platform Orientation",
    "purpose": "The operator must know where core supplier, product, enquiry, and order work is completed on the main OBAOL platform before continuing the journey.",
    "learn": [
      "Add an associate company before connecting its associate",
      "Create a product and publish it live",
      "Create an enquiry and understand how it progresses into the order flow"
    ],
    "tasks": [
      {
        "title": "Add an associate company",
        "instruction": "Open the Companies page and review how an associate company is entered on the main OBAOL platform.",
        "href": "https://www.obaol.com/dashboard/companies",
        "actionLabel": "Open associate companies"
      },
      {
        "title": "Add an associate",
        "instruction": "Review how an associate is entered and connected to the correct associate company.",
        "href": "https://www.obaol.com/dashboard/companies",
        "actionLabel": "Open associates"
      },
      {
        "title": "Add a product",
        "instruction": "Open the Products page and review the information required to create a product.",
        "href": "https://www.obaol.com/dashboard/product",
        "actionLabel": "Open products"
      },
      {
        "title": "Make a product live",
        "instruction": "Review how a completed product is published or activated so it becomes live on the platform.",
        "href": "https://www.obaol.com/dashboard/product",
        "actionLabel": "Review product publishing"
      },
      {
        "title": "Create an enquiry",
        "instruction": "Open the Enquiries page and review how a buyer requirement is entered as an enquiry.",
        "href": "https://www.obaol.com/dashboard/enquiries",
        "actionLabel": "Open enquiries"
      },
      {
        "title": "Review the order flow",
        "instruction": "Open the Orders page and review how an enquiry progresses through the order workflow.",
        "href": "https://www.obaol.com/dashboard/orders",
        "actionLabel": "Open orders"
      }
    ],
    "requiredOutput": "Confirm that you reviewed all six core OBAOL platform workflows.",
    "buttonText": "Confirm Platform Navigation",
    "completionMessage": "You now understand where associate companies, associates, products, enquiries, and orders are managed on the OBAOL platform.",
    "reviewRequired": false,
    "formFields": [
      { "id": "associateCompanyEntry", "label": "I understand associate company entry in the OBAOL platform.", "type": "checkbox", "required": true },
      { "id": "associateEntry", "label": "I understand associate entry in the OBAOL platform.", "type": "checkbox", "required": true },
      { "id": "productCreation", "label": "I understand how to add a product in the OBAOL platform.", "type": "checkbox", "required": true },
      { "id": "productPublication", "label": "I understand how to make a product live in the OBAOL platform.", "type": "checkbox", "required": true },
      { "id": "enquiryCreation", "label": "I understand how to create an enquiry in the OBAOL platform.", "type": "checkbox", "required": true },
      { "id": "orderFlow", "label": "I understand the order flow in the OBAOL platform.", "type": "checkbox", "required": true }
    ],
    "repeatGroups": [],
    "keywordRules": [],
    "metricMaps": []
  }
  $level3$::jsonb,
  updated_at = now()
where day_number = 3;
