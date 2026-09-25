-- Replace the legacy Day 4 inquiry exercise with an applied Incoterms® checkpoint.
-- Existing submissions are intentionally preserved; only the shared day template changes.
update public.operator_journey_day_templates
set
  template_id = 'day-4-incoterms-intro',
  title = 'Apply Incoterms® to Trade Scenarios',
  description = 'Study the first seven International Trade Basics lessons, then choose the correct Incoterms® 2020 rule for practical shipments.',
  category = 'learning',
  href = '/courses/international-trade-basics',
  action_label = 'Study Lessons 1–7',
  review_required = false,
  button_text = 'Submit Incoterms Scenarios',
  completion_message = 'Day 4 complete. You can now apply core Incoterms® 2020 principles to practical shipment scenarios.',
  rich_template = coalesce(rich_template, '{}'::jsonb) || $day4$
  {
    "id": "day-4-incoterms-intro",
    "day": 4,
    "title": "Apply Incoterms® to Trade Scenarios",
    "description": "Study the first seven International Trade Basics lessons, then choose the correct Incoterms® 2020 rule for practical shipments.",
    "category": "learning",
    "dayType": "Applied Learning",
    "purpose": "The operator must connect delivery method, loading, unloading, carriage, insurance, customs responsibility, and risk transfer to the correct Incoterms® 2020 rule.",
    "learn": [
      "Use FCA when the seller loads at its premises and clears exports",
      "Distinguish FAS vessel-side delivery from FOB on-board delivery",
      "Separate seller-paid carriage from the earlier risk-transfer point under C rules",
      "Recognize DPU as the destination rule requiring seller unloading",
      "Distinguish buyer import clearance under DAP from seller import responsibility under DDP"
    ],
    "tasks": [
      {
        "title": "Study International Trade Basics Lessons 1–7",
        "instruction": "Review trade flow, Incoterms® fundamentals, the E/F/C/D rule groups, and the rule-selection checklist before attempting the scenarios.",
        "href": "/courses/international-trade-basics",
        "actionLabel": "Study Lessons 1–7"
      },
      {
        "title": "Read each shipment carefully",
        "instruction": "Identify the transport method, delivery point, loading or unloading duty, customs responsibility, carriage, insurance, and risk-transfer point."
      },
      {
        "title": "Pass the scenario checkpoint",
        "instruction": "Answer all five scenarios and score at least 4 out of 5. Incorrect answers can be reviewed and retried immediately."
      }
    ],
    "requiredOutput": "Five completed Incoterms® scenarios with a score of at least 4/5.",
    "buttonText": "Submit Incoterms Scenarios",
    "completionMessage": "Day 4 complete. You can now apply core Incoterms® 2020 principles to practical shipment scenarios.",
    "reviewRequired": false,
    "formFields": [],
    "repeatGroups": [],
    "scenarioPassScore": 4,
    "scenarioQuestions": [
      {
        "id": "factory-fca",
        "title": "Factory collection and export clearance",
        "situation": "A seller in Pune must load a sealed container onto the buyer-nominated truck at the seller’s factory and complete Indian export clearance. The buyer controls the main carriage.",
        "question": "Which Incoterms® 2020 rule best matches this arrangement?",
        "options": ["EXW Seller Factory", "FCA Seller Factory", "DAP Buyer Warehouse"],
        "correctAnswer": "FCA Seller Factory",
        "explanation": "FCA at the seller’s premises fits because the seller loads the collecting vehicle and completes export clearance before risk transfers to the buyer."
      },
      {
        "id": "bulk-fas",
        "title": "Bulk cargo alongside the vessel",
        "situation": "A seller delivers bulk grain alongside the buyer-nominated vessel at Kandla Port. The buyer arranges loading on board and the ocean freight.",
        "question": "Which Incoterms® 2020 rule matches the agreed delivery point?",
        "options": ["FAS Kandla Port", "FOB Kandla Port", "CFR Destination Port"],
        "correctAnswer": "FAS Kandla Port",
        "explanation": "FAS applies when sea or inland-waterway cargo is delivered alongside the vessel. FOB would require delivery on board."
      },
      {
        "id": "sea-cif",
        "title": "Freight and insurance paid to destination",
        "situation": "For a non-containerized sea shipment, the seller loads the goods on board, pays freight to the named destination port, and arranges the insurance required by the rule. Risk transfers when the goods are on board at origin.",
        "question": "Which Incoterms® 2020 rule describes this structure?",
        "options": ["CIF Named Destination Port", "CFR Named Destination Port", "CIP Named Destination"],
        "correctAnswer": "CIF Named Destination Port",
        "explanation": "CIF is the sea rule in which the seller pays freight and arranges required insurance, while risk transfers on board at the shipment port."
      },
      {
        "id": "destination-dpu",
        "title": "Seller unloads at destination",
        "situation": "The seller arranges transport to the buyer’s named depot and must unload the goods there. The buyer completes import clearance.",
        "question": "Which Incoterms® 2020 rule uniquely requires seller unloading at destination?",
        "options": ["DAP Buyer Depot", "DPU Buyer Depot", "DDP Buyer Depot"],
        "correctAnswer": "DPU Buyer Depot",
        "explanation": "DPU is the only Incoterms® 2020 rule that requires the seller to unload at the named destination. The buyer normally handles import clearance."
      },
      {
        "id": "destination-dap",
        "title": "Buyer unloads and clears imports",
        "situation": "The seller arranges delivery to the buyer’s warehouse on the arriving truck, ready for unloading. The buyer unloads the goods and completes import clearance, duty, and taxes.",
        "question": "Which Incoterms® 2020 rule best fits?",
        "options": ["DAP Buyer Warehouse", "DPU Buyer Warehouse", "DDP Buyer Warehouse"],
        "correctAnswer": "DAP Buyer Warehouse",
        "explanation": "DAP fits because the seller delivers ready for unloading, while the buyer unloads and handles import clearance. DDP would place import responsibility on the seller."
      }
    ]
  }
  $day4$::jsonb,
  updated_at = now()
where day_number = 4;
