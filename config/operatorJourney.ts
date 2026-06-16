export type JourneyCheck = {
  id: string;
  label: string;
  description: string;
};

export type JourneyMilestoneCategory = 'setup' | 'learning' | 'outreach' | 'platform' | 'deal';

export type JourneyMilestone = {
  id: string;
  day: number;
  title: string;
  description: string;
  category: JourneyMilestoneCategory;
  href?: string;
  actionLabel?: string;
  isActive?: boolean;
};

export type JourneySubmissionStatus = 'pending' | 'submitted' | 'under_review' | 'completed' | 'needs_correction';
export type JourneyDerivedStatus = 'upcoming' | 'today' | 'pending' | 'catch_up' | JourneySubmissionStatus;

export type JourneyFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';

export type JourneyFormField = {
  id: string;
  label: string;
  type: JourneyFieldType;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
};

export type JourneyRepeatGroup = {
  id: string;
  label: string;
  minEntries: number;
  fields: JourneyFormField[];
};

export type JourneyKeywordRule = {
  fieldId: string;
  keywords: string[];
};

export type JourneyMetricMap = {
  metric: keyof JourneyDashboardMetrics;
  groupId?: string;
  fieldId?: string;
  mode: 'countGroupEntries' | 'countTruthy' | 'numericField' | 'scoreAverage';
};

export type JourneyDayTemplate = JourneyMilestone & {
  phase: string;
  dayType: string;
  purpose: string;
  learn: string[];
  tasks: string[];
  requiredOutput: string;
  buttonText: string;
  completionMessage: string;
  reviewRequired: boolean;
  formFields: JourneyFormField[];
  repeatGroups: JourneyRepeatGroup[];
  keywordRules?: JourneyKeywordRule[];
  metricMaps?: JourneyMetricMap[];
};

export type JourneyDashboardMetrics = {
  suppliersAdded: number;
  buyersAdded: number;
  productsMapped: number;
  availabilitiesLogged: number;
  buyerRequirementsLogged: number;
  outreachDone: number;
  responsesReceived: number;
  followUpsPending: number;
  matchesAttempted: number;
  quotationReadyInquiries: number;
  opportunityScoreAverage: number;
  executionReadinessScore: number;
};

export const JOURNEY_TOTAL_DAYS = 30;

export const JOURNEY_CHECKS: JourneyCheck[] = [
  {
    id: 'operator-account',
    label: 'Operator account is active',
    description: 'Confirm you can sign in to this workspace and access your operator profile.',
  },
  {
    id: 'official-email',
    label: 'Official company email is ready',
    description: 'Confirm your official communication email is created and saved in the profile.',
  },
  {
    id: 'zoho-cliq',
    label: 'Zoho/Cliq communication is set',
    description: 'Confirm you have joined the communication workspace and can receive operator updates.',
  },
  {
    id: 'platform-registration',
    label: 'Platform registration is complete',
    description: 'Confirm your OBAOL platform registration is complete with the correct email.',
  },
  {
    id: 'course-readiness',
    label: 'Ready to begin operator courses',
    description: 'Confirm you are ready to use the training library alongside your daily operator milestones.',
  },
];

const yesNo = ['Yes', 'No'];
const lowMediumHigh = ['Low', 'Medium', 'High'];
const contactMethods = ['Call', 'WhatsApp', 'Email'];
const matchPotential = ['Low', 'Medium', 'High'];
const reviewRequiredFromDay = 11;

const productCircleOptions = [
  'Spices Circle',
  'Pulses Circle',
  'Rice Circle',
  'Coconut and Coir Circle',
  'Oilseed Circle',
  'Processed Food and Powder Circle',
  'Other',
];

const phaseByDay = (day: number) => {
  if (day <= 5) return 'Phase 1: Foundation and Focus';
  if (day <= 10) return 'Phase 2: Product and Trade Basics';
  if (day <= 15) return 'Phase 3: Supplier and Buyer Data Building';
  if (day <= 20) return 'Phase 4: Outreach and Relationship Building';
  if (day <= 25) return 'Phase 5: Cluster Collaboration';
  return 'Phase 6: Momentum and Readiness';
};

const baseField = (id: string, label: string, type: JourneyFieldType = 'text', required = true, options?: string[], min?: number, max?: number): JourneyFormField => ({
  id,
  label,
  type,
  required,
  options,
  min,
  max,
});

const noteField = (id = 'operatorNote', label = 'Operator note'): JourneyFormField => baseField(id, label, 'textarea', true);

const contactFields: JourneyFormField[] = [
  baseField('name', 'Name'),
  baseField('phone', 'Phone', 'text', false),
  baseField('location', 'Location', 'text', false),
  noteField('notes', 'Notes'),
];

type DaySeed = {
  day: number;
  id: string;
  title: string;
  description: string;
  category: JourneyMilestoneCategory;
  dayType: string;
  purpose: string;
  learn: string[];
  tasks: string[];
  requiredOutput: string;
  buttonText: string;
  completionMessage: string;
  formFields?: JourneyFormField[];
  repeatGroups?: JourneyRepeatGroup[];
  keywordRules?: JourneyKeywordRule[];
  metricMaps?: JourneyMetricMap[];
  reviewRequired?: boolean;
  href?: string;
  actionLabel?: string;
};

const daySeeds: DaySeed[] = [
  {
    day: 1,
    id: 'day-1-system-access',
    title: 'Start Your Operator Journey',
    description: 'Confirm workspace access, profile readiness, course library access, journey tracking, and communication channels.',
    category: 'setup',
    dayType: 'Setup',
    purpose: 'The operator must understand where the workspace, journey tracker, profile, courses, and daily tasks are located before outreach begins.',
    learn: ['Operator dashboard location', 'Onboarding and daily completion tracking', 'Course library and profile locations', 'Where supplier, buyer, product, availability, and requirement entries will be added'],
    tasks: ['Open the operator dashboard', 'Check profile completion', 'Open the course library', 'Open the 30-day journey page', 'Confirm where daily work will be tracked'],
    requiredOutput: 'Confirm profile, course library, journey page, dashboard, and communication access.',
    buttonText: 'Confirm System Access',
    completionMessage: 'Your operator journey has started. From Day 2 onward, you will begin understanding the OBAOL execution model and your role inside the system.',
    formFields: [
      baseField('profileReviewed', 'Profile reviewed', 'select', true, yesNo),
      baseField('courseLibraryOpened', 'Course library opened', 'select', true, yesNo),
      baseField('journeyPageOpened', 'Journey page opened', 'select', true, yesNo),
      baseField('communicationConfirmed', 'Communication access confirmed', 'select', true, yesNo),
      baseField('accessIssue', 'Any access issue', 'textarea', false),
      noteField('confirmationNote', 'Operator confirmation note'),
    ],
    href: '/profile',
    actionLabel: 'Review profile',
  },
  {
    day: 2,
    id: 'day-2-execution-model',
    title: 'Understand OBAOL’s Execution Model',
    description: 'Learn why OBAOL is a structured agro trade execution system, not a marketplace, broker, lead-selling platform, or trader.',
    category: 'learning',
    dayType: 'Foundation',
    purpose: 'The operator must understand OBAOL’s role in opportunity discovery, verification, coordination, quotation readiness, relationship continuity, and deal movement.',
    learn: ['OBAOL is not a marketplace, broker, trader, or lead-selling platform', 'OBAOL does not own inventory or guarantee buyers/sellers', 'Execution breaks down through vague inquiries, weak verification, price/payment mismatch, poor follow-up, and logistics/document gaps'],
    tasks: ['Read the execution model', 'Study what OBAOL is not', 'Explain why execution support matters', 'Submit a 5-line explanation'],
    requiredOutput: 'A 5-line explanation of OBAOL containing execution, verification, coordination, trade completion, and not marketplace/broker/lead-selling.',
    buttonText: 'Submit OBAOL Understanding',
    completionMessage: 'You now understand the OBAOL execution model. The next step is to understand your complete responsibility as an operator.',
    formFields: [
      noteField('whatIsObaol', 'What is OBAOL?'),
      noteField('whatIsNotObaol', 'What is OBAOL not?'),
      noteField('whyExecutionMatters', 'Why does execution matter in trade?'),
      baseField('acknowledgement', 'I understand that OBAOL is not a marketplace, broker, or lead-selling system.', 'checkbox', true),
    ],
    keywordRules: [{ fieldId: 'whatIsObaol', keywords: ['execution', 'verification', 'coordination', 'trade', 'completion'] }],
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Open foundations',
  },
  {
    day: 3,
    id: 'day-3-operator-role',
    title: 'Understand the Operator Role',
    description: 'Understand the operator as a trade execution participant who structures market information and supports opportunity movement.',
    category: 'learning',
    dayType: 'Foundation',
    purpose: 'The operator must understand that one role covers research, data entry, inquiry formatting, follow-up, cluster search, match attempts, and opportunity scoring.',
    learn: ['Operators build reliable market maps', 'Operators should not think like brokers', 'Structured operating is different from random calling'],
    tasks: ['Study the responsibility list', 'Complete the checklist', 'Explain how an operator creates value'],
    requiredOutput: 'Responsibility checklist and one paragraph on operator value.',
    buttonText: 'Complete Operator Role Checklist',
    completionMessage: 'You now understand the operator role. Next, you will learn the real nature of inquiries in agro trade.',
    formFields: [
      baseField('supplierEntry', 'I understand supplier data entry.', 'checkbox', true),
      baseField('buyerEntry', 'I understand buyer data entry.', 'checkbox', true),
      baseField('availabilityEntry', 'I understand product availability entry.', 'checkbox', true),
      baseField('requirementEntry', 'I understand buyer requirement entry.', 'checkbox', true),
      baseField('followUp', 'I understand follow-up responsibility.', 'checkbox', true),
      baseField('clusterCollaboration', 'I understand cluster collaboration.', 'checkbox', true),
      baseField('noOverpromise', 'I understand that I must not overpromise.', 'checkbox', true),
      baseField('inquiryNotOrder', 'I understand that inquiry is not order.', 'checkbox', true),
      noteField('operatorValue', 'Explain how an operator creates value.'),
    ],
  },
  {
    day: 4,
    id: 'day-4-inquiry-reality',
    title: 'Understand Inquiry Reality',
    description: 'Classify inquiry seriousness and understand that inquiry is only a market signal, not an order.',
    category: 'learning',
    dayType: 'Mindset',
    purpose: 'The operator must avoid emotional dependence on one inquiry and learn to verify seriousness, missing details, and next action.',
    learn: ['Inquiry is a market signal', 'A price request is not a confirmed order', 'Speed and follow-up build trust', 'Multiple opportunities must be handled with discipline'],
    tasks: ['Study inquiry reality', 'Classify five sample inquiries', 'Write why one inquiry is not final order'],
    requiredOutput: 'Classify five sample inquiries and write one note on inquiry reality.',
    buttonText: 'Complete Inquiry Reality Task',
    completionMessage: 'You now understand that inquiry is not order. Your job is to build momentum, not emotionally depend on one opportunity.',
    formFields: [noteField('inquiryRealityNote', 'Inquiry reality note')],
    repeatGroups: [{
      id: 'sampleInquiries',
      label: 'Sample inquiry classifications',
      minEntries: 5,
      fields: [
        baseField('inquiryText', 'Inquiry text'),
        baseField('classification', 'Classification', 'select', true, ['Active and serious', 'Needs missing details', 'Price checking only', 'Future possibility', 'Weak or incomplete', 'Not relevant', 'Non-serious', 'Requires cluster support', 'Requires supplier confirmation', 'Requires buyer confirmation']),
        noteField('reason', 'Reason'),
        noteField('missingDetails', 'Missing details'),
        noteField('nextAction', 'Next action'),
      ],
    }],
  },
  {
    day: 5,
    id: 'day-5-product-circle',
    title: 'Choose Product Circle and Region Advantage',
    description: 'Select one primary product circle, one secondary circle, working region, language comfort, and product-focus reason.',
    category: 'outreach',
    dayType: 'Strategic Focus',
    purpose: 'Product focus prevents random work and helps the operator build depth, speed, trust, and relationship continuity.',
    learn: ['Depth creates speed', 'Region advantage helps supplier access and local confidence', 'Operators should stay focused while still using cluster search for wider inquiries'],
    tasks: ['Review product circle examples', 'Select primary and secondary circle', 'Enter main region and language comfort', 'List five products', 'Explain the product-circle choice'],
    requiredOutput: 'A product focus profile.',
    buttonText: 'Save Product Circle',
    completionMessage: 'Your product circle is now selected. From the next day onward, your learning and outreach will become more focused.',
    formFields: [
      baseField('primaryProductCircle', 'Primary product circle', 'select', true, productCircleOptions),
      baseField('secondaryProductCircle', 'Secondary product circle', 'select', true, productCircleOptions),
      baseField('mainWorkingRegion', 'Main working region'),
      baseField('languageComfort', 'Language comfort'),
      noteField('fiveProducts', '5 products inside primary circle'),
      noteField('selectionReason', 'Reason for choosing this circle'),
      baseField('localSupplierAccess', 'Local supplier access', 'select', false, yesNo),
      baseField('localBuyerAccess', 'Local buyer access', 'select', false, yesNo),
      baseField('priorKnowledge', 'Prior product knowledge', 'select', false, yesNo),
      baseField('supplierComfort', 'Supplier-side comfort', 'select', false, lowMediumHigh),
      baseField('buyerComfort', 'Buyer-side comfort', 'select', false, lowMediumHigh),
    ],
  },
];

const repeatedDaySeeds: DaySeed[] = [
  {
    day: 6, id: 'day-6-product-circle-study', title: 'Product Circle Study', category: 'learning', dayType: 'Product Learning',
    description: 'Study five products in the selected product circle with sourcing regions, grades, packing, buyer types, risks, certification, seasonality, and price factors.',
    purpose: 'Build product confidence before supplier or buyer outreach.', learn: ['Varieties, regions, grades, packing, buyers, suppliers, seasonality, price movement, quality issues, certification needs'],
    tasks: ['Select five products', 'Study sourcing regions and grades', 'Identify buyer types and risks', 'Submit product notes'], requiredOutput: 'Product circle note covering at least five products.',
    buttonText: 'Submit Product Circle Study', completionMessage: 'You now have a basic understanding of your selected product circle. Next, you will build specification checklists for trade inquiries.',
    repeatGroups: [{ id: 'products', label: 'Products studied', minEntries: 5, fields: ['Product name', 'Variety or type', 'Main sourcing region', 'Common grade', 'Common packing', 'Buyer type', 'Quality risk', 'Certification requirement', 'Seasonality note', 'Price movement factor'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label)) }],
    metricMaps: [{ metric: 'productsMapped', groupId: 'products', mode: 'countGroupEntries' }],
  },
  {
    day: 7, id: 'day-7-specification-checklist', title: 'Product Specification Checklist', category: 'learning', dayType: 'Trade Data Discipline',
    description: 'Convert vague product names into trade-ready specifications and missing-detail questions.',
    purpose: 'Without specification, quotation is weak; a product name alone is not enough.', learn: ['Product, variety, grade, size, origin, quantity, moisture, purity, packing, certification, location, delivery, payment, timeline, target price'],
    tasks: ['Pick three products', 'Create specification checklists', 'Write questions before quoting'], requiredOutput: 'Three product specification checklists.',
    buttonText: 'Submit Specification Checklist', completionMessage: 'You can now collect product details in a structured way. This will help you avoid weak inquiries and poor quotation attempts.',
    repeatGroups: [{ id: 'specifications', label: 'Specification checklists', minEntries: 3, fields: ['Product name', 'Required specification fields', 'Quality parameters', 'Packing options', 'Certification options', 'Payment questions', 'Delivery questions', 'Missing detail questions'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, label.includes('questions') || label.includes('fields') ? 'textarea' : 'text')) }],
  },
  {
    day: 8, id: 'day-8-price-terms', title: 'Price Terms and Incoterms Basics', category: 'learning', dayType: 'Commercial Learning',
    description: 'Understand that price has no meaning without delivery responsibility and price-term clarity.',
    purpose: 'Never quote or compare price without the delivery term.', learn: ['Ex-farm, ex-mill, ex-factory, ex-warehouse, FOR, delivered', 'EXW, FOB, CFR/CNF, CIF, DAP, DDP'],
    tasks: ['Study price terms', 'Prepare three quote examples', 'Mention inclusions and exclusions'], requiredOutput: 'Three sample price quotes.',
    buttonText: 'Complete Price Terms Task', completionMessage: 'You now understand that price must always be connected to location, responsibility, and delivery term.',
    repeatGroups: [{ id: 'quotes', label: 'Sample price quotes', minEntries: 3, fields: [
      baseField('product', 'Product'), baseField('quantity', 'Quantity'), baseField('location', 'Location'), baseField('price', 'Price'), baseField('priceTerm', 'Price term'),
      baseField('packing', 'Packing'), baseField('freightIncluded', 'Freight included', 'select', true, yesNo), baseField('loadingIncluded', 'Loading included', 'select', true, yesNo),
      baseField('insuranceIncluded', 'Insurance included', 'select', true, yesNo), baseField('exportClearanceIncluded', 'Export clearance included', 'select', true, yesNo), noteField('notes', 'Notes'),
    ] }],
  },
  {
    day: 9, id: 'day-9-payment-risk', title: 'Payment Terms and Risk', category: 'learning', dayType: 'Commercial Risk',
    description: 'Understand payment terms, compatibility, and trade risk before serious buyer/supplier communication.',
    purpose: 'Wrong payment commitments can break trades and damage trust.', learn: ['Advance, partial advance, balance before dispatch/loading/documents, credit, LC, TT, DP, DA, bank guarantee, SBLC'],
    tasks: ['Study payment terms', 'Complete five scenarios', 'Identify risk and clarification needed'], requiredOutput: 'Payment compatibility task.',
    buttonText: 'Complete Payment Risk Task', completionMessage: 'You now understand that payment terms must be recorded carefully before moving any trade opportunity forward.',
    repeatGroups: [{ id: 'paymentScenarios', label: 'Payment scenarios', minEntries: 5, fields: [
      baseField('buyerPreference', 'Buyer payment preference'), baseField('supplierPreference', 'Supplier payment preference'),
      baseField('compatibility', 'Compatibility', 'select', true, ['Compatible', 'Not compatible', 'Needs negotiation']),
      baseField('riskLevel', 'Risk level', 'select', true, lowMediumHigh), noteField('clarificationNeeded', 'Clarification needed'), noteField('nextAction', 'Next action'),
    ] }],
  },
  {
    day: 10, id: 'day-10-cluster-search-rule', title: 'Inquiry Flexibility and Cluster Search Rule', category: 'learning', dayType: 'Operating Discipline',
    description: 'Stay focused on product depth while using the OBAOL cluster database for wider inquiries.',
    purpose: 'Primary work stays inside the selected product circle, but wider inquiries should be searched and recorded through cluster collaboration.', learn: ['Focused product circle work', 'Wider inquiry response through cluster search'],
    tasks: ['Study cluster search rule', 'Classify five sample inquiries', 'Write next action for each'], requiredOutput: 'Five classified inquiries.',
    buttonText: 'Complete Cluster Search Rule', completionMessage: 'You now understand how to stay focused while still responding to wider opportunities through the OBAOL cluster system.',
    repeatGroups: [{ id: 'clusterInquiries', label: 'Cluster inquiry classifications', minEntries: 5, fields: [
      noteField('inquiryText', 'Inquiry text'), baseField('classification', 'Classification', 'select', true, ['Inside my product circle', 'Outside but searchable', 'Needs cluster support', 'Not enough details', 'Not serious']),
      baseField('internalSearchRequired', 'Internal database search required', 'select', true, yesNo), noteField('missingDetails', 'Missing details'), noteField('nextAction', 'Next action'),
    ] }],
  },
];

const dataBuildingSeeds: DaySeed[] = [
  { day: 11, id: 'day-11-supplier-records', title: 'Supplier Database Entry Training', category: 'platform', dayType: 'Data Building', description: 'Enter five useful supplier records inside the selected product circle.', purpose: 'A supplier entry must become useful trade data, not just name and phone.', learn: ['Supplier name, company, contact, location, products, availability, capacity, packing, payment, delivery, certification, source, verification, notes'], tasks: ['Study supplier format', 'Add five supplier records', 'Mark verification status'], requiredOutput: 'Five supplier records.', buttonText: 'Submit Supplier Records', completionMessage: 'Supplier data has been added. Next, you will learn how to build buyer-side data.', repeatGroups: [{ id: 'suppliers', label: 'Supplier records', minEntries: 5, fields: [...contactFields, baseField('companyName', 'Company name'), baseField('productCircle', 'Product circle'), baseField('productsHandled', 'Products handled'), baseField('currentStock', 'Current stock', 'select', true, ['Yes', 'No', 'Unknown']), baseField('capacity', 'Capacity', 'text', false), baseField('packing', 'Packing', 'text', false), baseField('certifications', 'Certifications', 'text', false), baseField('paymentPreference', 'Payment preference', 'text', false), baseField('deliveryPreference', 'Delivery preference', 'text', false), baseField('source', 'Source'), baseField('lastVerifiedDate', 'Last verified date', 'date', false), baseField('verificationStatus', 'Verification status', 'select', true, ['Unverified', 'Partially verified', 'Verified'])] }], metricMaps: [{ metric: 'suppliersAdded', groupId: 'suppliers', mode: 'countGroupEntries' }] },
  { day: 12, id: 'day-12-buyer-records', title: 'Buyer Database Entry Training', category: 'platform', dayType: 'Data Building', description: 'Enter five buyer records that capture purchasing behavior.', purpose: 'Buyer data should capture purchase behavior, not just contact details.', learn: ['Products, quantity pattern, purchase frequency, target price, payment, delivery, certification, seriousness'], tasks: ['Study buyer format', 'Add five buyer records', 'Mark seriousness level'], requiredOutput: 'Five buyer records.', buttonText: 'Submit Buyer Records', completionMessage: 'Buyer data has been added. Next, you will learn how to enter product availability from suppliers.', repeatGroups: [{ id: 'buyers', label: 'Buyer records', minEntries: 5, fields: [...contactFields, baseField('role', 'Role', 'text', false), baseField('productRequired', 'Product required'), baseField('quantityPattern', 'Quantity pattern', 'text', false), baseField('purchaseFrequency', 'Purchase frequency', 'text', false), baseField('targetPrice', 'Target price if known', 'text', false), baseField('paymentPreference', 'Payment preference', 'text', false), baseField('deliveryPreference', 'Delivery preference', 'text', false), baseField('certificationRequired', 'Certification required', 'text', false), baseField('buyerType', 'Domestic/export buyer', 'text', false), baseField('source', 'Source'), baseField('lastContactDate', 'Last contact date', 'date', false), baseField('seriousness', 'Seriousness', 'select', true, ['Unknown', 'Low', 'Medium', 'High'])] }], metricMaps: [{ metric: 'buyersAdded', groupId: 'buyers', mode: 'countGroupEntries' }] },
  { day: 13, id: 'day-13-product-availability', title: 'Product Availability Entry', category: 'platform', dayType: 'Supply Data', description: 'Convert supplier information into three product availability records.', purpose: 'Supplier data and current product availability are different and must be separately recorded.', learn: ['Product, variety, grade, quantity, location, packing, price, terms, photos, documents, validity, supplier, confirmation date'], tasks: ['Collect availability information', 'Add three availability records', 'Mark stock status and validity'], requiredOutput: 'Three product availability records.', buttonText: 'Submit Product Availability', completionMessage: 'Product availability has been entered. This supply data can now support buyer inquiries and internal cluster matching.', repeatGroups: [{ id: 'availabilities', label: 'Product availabilities', minEntries: 3, fields: ['Supplier name', 'Product', 'Variety', 'Grade', 'Quantity', 'Location', 'Packing', 'Price', 'Price term', 'Payment term', 'Delivery term', 'Validity', 'Last confirmed date', 'Notes'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label)).concat([baseField('photosAvailable', 'Photos available', 'select', true, yesNo), baseField('documentsAvailable', 'Documents available', 'select', true, yesNo), baseField('availabilityStatus', 'Availability status', 'select', true, ['Indicated', 'Confirmed', 'Needs verification'])]) }], metricMaps: [{ metric: 'availabilitiesLogged', groupId: 'availabilities', mode: 'countGroupEntries' }] },
  { day: 14, id: 'day-14-buyer-requirements', title: 'Buyer Requirement Entry', category: 'platform', dayType: 'Demand Data', description: 'Convert buyer conversations into three structured requirements.', purpose: 'A buyer saying send price is not enough; usable demand data must be collected.', learn: ['Product, specification, quantity, destination, target price, delivery, payment, packing, certification, timeline, decision maker, seriousness, missing details'], tasks: ['Review buyer records', 'Add three buyer requirements', 'Mark seriousness and missing details'], requiredOutput: 'Three buyer requirement records.', buttonText: 'Submit Buyer Requirements', completionMessage: 'Buyer requirements have been recorded. The system can now compare demand with available supplier data.', repeatGroups: [{ id: 'requirements', label: 'Buyer requirements', minEntries: 3, fields: ['Buyer name', 'Product', 'Specification', 'Quantity', 'Destination', 'Target price', 'Delivery term', 'Payment term', 'Packing', 'Certification requirement', 'Timeline', 'Missing details', 'Last confirmed date', 'Notes'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label)).concat([baseField('decisionMakerConfirmed', 'Decision maker confirmed', 'select', true, yesNo), baseField('requirementStatus', 'Requirement status', 'select', true, ['Active', 'Future', 'Price checking', 'Incomplete'])]) }], metricMaps: [{ metric: 'buyerRequirementsLogged', groupId: 'requirements', mode: 'countGroupEntries' }] },
  { day: 15, id: 'day-15-data-quality-review', title: 'Data Quality Review', category: 'platform', dayType: 'Data Discipline', description: 'Review all supplier, buyer, availability, and requirement data entered so far.', purpose: 'Bad data creates confusion; clean data creates execution strength.', learn: ['Weak records miss location, specification, quantity, terms, contact person, verification date, source, status, or clear notes'], tasks: ['Review records from Days 11-14', 'Correct missing fields', 'Flag duplicates', 'Update verification status'], requiredOutput: 'Data quality review summary.', buttonText: 'Submit Data Quality Review', completionMessage: 'Your database is cleaner now. From the next phase, you will begin relationship outreach.', formFields: ['Suppliers reviewed count', 'Buyers reviewed count', 'Availabilities reviewed count', 'Requirements reviewed count', 'Missing fields corrected count', 'Duplicate records found', 'Records marked for verification'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, 'number')).concat([noteField('notes', 'Notes')]) },
];

const operatingSeeds: DaySeed[] = [
  { day: 16, id: 'day-16-supplier-outreach', title: 'Supplier Outreach Inside Product Circle', category: 'outreach', dayType: 'Outreach', description: 'Log ten supplier outreach attempts inside the selected product circle.', purpose: 'Open communication, understand product handling, and collect usable trade data without forcing a deal.', learn: ['Short, respectful supplier outreach', 'Ask what products, quantity, stock location, packing, price, payment, photos, and other products they handle'], tasks: ['Contact ten suppliers', 'Record responses', 'Update supplier records', 'Set follow-up date'], requiredOutput: 'Ten supplier interactions.', buttonText: 'Log Supplier Outreach', completionMessage: 'Supplier outreach completed. The next step is to open buyer-side conversations inside your product circle.', repeatGroups: [{ id: 'supplierOutreach', label: 'Supplier outreach attempts', minEntries: 10, fields: [baseField('supplierName', 'Supplier name'), baseField('contactedBy', 'Contacted by', 'select', true, contactMethods), baseField('responseReceived', 'Response received', 'select', true, yesNo), baseField('productsHandled', 'Products handled'), baseField('currentAvailability', 'Current availability', 'text', false), baseField('quantity', 'Quantity', 'text', false), baseField('location', 'Location', 'text', false), baseField('priceIndication', 'Price indication', 'text', false), baseField('paymentPreference', 'Payment preference', 'text', false), baseField('documents', 'Documents/certifications', 'text', false), baseField('otherProducts', 'Other products handled', 'text', false), baseField('followUpRequired', 'Follow-up required', 'select', true, yesNo), baseField('followUpDate', 'Follow-up date', 'date', false), noteField('notes', 'Notes')] }], metricMaps: [{ metric: 'outreachDone', groupId: 'supplierOutreach', mode: 'countGroupEntries' }, { metric: 'responsesReceived', groupId: 'supplierOutreach', fieldId: 'responseReceived', mode: 'countTruthy' }] },
  { day: 17, id: 'day-17-buyer-outreach', title: 'Buyer Outreach Inside Product Circle', category: 'outreach', dayType: 'Outreach', description: 'Log ten buyer outreach attempts inside the selected product circle.', purpose: 'Understand buyer demand patterns, not push stock.', learn: ['Products, quantity pattern, frequency, origin, target price, payment, delivery, certification, active and future requirements'], tasks: ['Contact ten buyers', 'Record responses', 'Update buyer records', 'Add requirements where available'], requiredOutput: 'Ten buyer interactions.', buttonText: 'Log Buyer Outreach', completionMessage: 'Buyer outreach completed. Next, you will classify responses and identify which contacts deserve follow-up.', repeatGroups: [{ id: 'buyerOutreach', label: 'Buyer outreach attempts', minEntries: 10, fields: [baseField('buyerName', 'Buyer name'), baseField('contactedBy', 'Contacted by', 'select', true, contactMethods), baseField('responseReceived', 'Response received', 'select', true, yesNo), baseField('productsRequired', 'Products required'), baseField('quantityPattern', 'Quantity pattern', 'text', false), baseField('destination', 'Destination', 'text', false), baseField('targetPrice', 'Target price', 'text', false), baseField('paymentPreference', 'Payment preference', 'text', false), baseField('deliveryPreference', 'Delivery preference', 'text', false), baseField('certificationRequirement', 'Certification requirement', 'text', false), baseField('activeRequirement', 'Active requirement', 'select', true, yesNo), baseField('futureRequirement', 'Future requirement', 'select', true, yesNo), baseField('followUpRequired', 'Follow-up required', 'select', true, yesNo), baseField('followUpDate', 'Follow-up date', 'date', false), noteField('notes', 'Notes')] }], metricMaps: [{ metric: 'outreachDone', groupId: 'buyerOutreach', mode: 'countGroupEntries' }, { metric: 'responsesReceived', groupId: 'buyerOutreach', fieldId: 'responseReceived', mode: 'countTruthy' }] },
  { day: 18, id: 'day-18-response-classification', title: 'Response Classification', category: 'outreach', dayType: 'Filtering', description: 'Classify supplier and buyer responses from outreach.', purpose: 'Not every response is equal; classify seriousness, missing details, and next action.', learn: ['Active requirement, active availability, future possibility, price checking, follow-up needed, not relevant, wrong contact, non-serious, needs verification, needs cluster support'], tasks: ['Review Day 16 and 17 responses', 'Classify every response', 'Update follow-up dates'], requiredOutput: 'Classified supplier and buyer responses.', buttonText: 'Classify Responses', completionMessage: 'Responses have been classified. This helps you focus on serious and useful relationships without wasting time.', repeatGroups: [{ id: 'classifiedResponses', label: 'Classified responses', minEntries: 10, fields: [baseField('contactName', 'Contact name'), baseField('contactType', 'Contact type', 'select', true, ['Supplier', 'Buyer']), baseField('responseCategory', 'Response category'), baseField('seriousnessLevel', 'Seriousness level', 'select', true, lowMediumHigh), noteField('missingDetails', 'Missing details'), noteField('nextAction', 'Next action'), baseField('followUpDate', 'Follow-up date', 'date', false), noteField('notes', 'Notes')] }] },
  { day: 19, id: 'day-19-relationship-follow-up', title: 'Relationship Follow-Up', category: 'outreach', dayType: 'Relationship Building', description: 'Log ten professional follow-ups with contacts that need continuity.', purpose: 'Trade relationships are built through consistent, useful follow-up.', learn: ['Follow up for promised details, future price, availability confirmation, missing details, pending documents/photos, and next dates'], tasks: ['Select contacts requiring follow-up', 'Send follow-up messages', 'Record responses', 'Set next follow-up date'], requiredOutput: 'Ten follow-ups.', buttonText: 'Log Relationship Follow-Ups', completionMessage: 'Follow-ups have been completed. You are now building continuity instead of one-time conversations.', repeatGroups: [{ id: 'followUps', label: 'Relationship follow-ups', minEntries: 10, fields: [baseField('contactName', 'Contact name'), baseField('contactType', 'Contact type'), noteField('previousDiscussion', 'Previous discussion summary'), baseField('messageSent', 'Follow-up message sent', 'select', true, yesNo), baseField('responseReceived', 'Response received', 'select', true, yesNo), noteField('updatedInformation', 'Updated information'), baseField('nextFollowUpDate', 'Next follow-up date', 'date', false), baseField('status', 'Status')] }], metricMaps: [{ metric: 'followUpsPending', groupId: 'followUps', mode: 'countGroupEntries' }] },
  { day: 20, id: 'day-20-secondary-products', title: 'Product Expansion From Existing Contacts', category: 'outreach', dayType: 'Market Expansion', description: 'Add secondary product data for ten contacts.', purpose: 'One supplier or buyer may handle multiple products, increasing opportunity without random searching.', learn: ['Ask what other products contacts regularly handle', 'Mark whether secondary products belong to the operator circle or the wider cluster'], tasks: ['Contact existing suppliers and buyers', 'Ask about other products', 'Add secondary product data'], requiredOutput: 'Secondary product data for ten contacts.', buttonText: 'Add Secondary Product Data', completionMessage: 'You have expanded product knowledge from existing relationships. This strengthens the cluster database.', repeatGroups: [{ id: 'secondaryProducts', label: 'Secondary product data', minEntries: 10, fields: [baseField('contactName', 'Contact name'), baseField('primaryProduct', 'Primary product'), baseField('secondaryProducts', 'Secondary products handled'), baseField('quantityIndication', 'Quantity indication', 'text', false), baseField('location', 'Location', 'text', false), baseField('contactType', 'Supplier/buyer type'), baseField('belongsToMyCircle', 'Belongs to my circle', 'select', true, yesNo), baseField('visibleToCluster', 'Should be visible to cluster', 'select', true, yesNo), noteField('notes', 'Notes')] }], metricMaps: [{ metric: 'productsMapped', groupId: 'secondaryProducts', mode: 'countGroupEntries' }] },
];

const clusterSeeds: DaySeed[] = [
  { day: 21, id: 'day-21-cluster-understanding', title: 'Understand Operator Cluster System', category: 'deal', dayType: 'Cluster Collaboration', description: 'Explain how shared operator data creates execution strength.', purpose: 'Operators should not work alone; shared supplier, buyer, availability, requirement, logistics, and document data can connect opportunities.', learn: ['Product, supplier, buyer, availability, and requirement search', 'Internal match suggestions', 'Operator-to-operator collaboration', 'Quotation readiness and follow-up tracking'], tasks: ['Study cluster concept', 'Search sample internal records', 'Write a five-line explanation'], requiredOutput: 'Cluster understanding note.', buttonText: 'Submit Cluster Understanding', completionMessage: 'You now understand why operator data must be clean, searchable, and useful for the wider OBAOL system.', formFields: [noteField('clusterCollaboration', 'What is operator cluster collaboration?'), noteField('cleanDataMatters', 'Why clean data matters?'), noteField('supplierHelpsBuyer', 'How can another operator’s supplier help your buyer?'), baseField('dataSupportAcknowledgement', 'I understand that my data may support other operators.', 'checkbox', true)] },
  { day: 22, id: 'day-22-internal-supplier-search', title: 'Search Internal Supplier Data', category: 'deal', dayType: 'Cluster Search', description: 'Submit five supplier search results and three possible supplier-side matches.', purpose: 'Use supplier data entered by other operators to respond faster instead of starting from zero.', learn: ['Existing supplier, availability, location, grade, quantity, payment compatibility, verification, added-by operator'], tasks: ['Search supplier data', 'Find five supplier records', 'Identify three matches'], requiredOutput: 'Five supplier search results and three match notes.', buttonText: 'Submit Supplier Search Note', completionMessage: 'You now know how to use internal supplier data to respond faster and support buyer inquiries.', repeatGroups: [{ id: 'supplierSearchResults', label: 'Supplier search results', minEntries: 5, fields: [baseField('supplierName', 'Supplier name'), baseField('product', 'Product'), baseField('location', 'Location'), baseField('quantity', 'Quantity'), baseField('price', 'Price if available', 'text', false), baseField('verificationStatus', 'Verification status'), baseField('addedByOperator', 'Added by operator'), baseField('lastVerifiedDate', 'Last verified date', 'date', false), baseField('matchPotential', 'Match potential', 'select', true, matchPotential), noteField('notes', 'Notes')] }, { id: 'supplierMatchNotes', label: 'Supplier match notes', minEntries: 3, fields: [baseField('matchTitle', 'Match title'), noteField('matchReason', 'Match reason')] }] },
  { day: 23, id: 'day-23-internal-buyer-search', title: 'Search Internal Buyer Data', category: 'deal', dayType: 'Cluster Search', description: 'Submit five buyer search results and three possible demand-side matches.', purpose: 'Use buyer data entered by other operators to support suppliers and identify matching demand.', learn: ['Buyer requirements, product matching, quantity, destination, target price, payment, seriousness, active/old status, added-by operator'], tasks: ['Search buyer data', 'Find five buyer requirements', 'Identify three matches'], requiredOutput: 'Five buyer search results and three match notes.', buttonText: 'Submit Buyer Search Note', completionMessage: 'You now know how to use internal buyer data to support suppliers and identify demand-side opportunities.', repeatGroups: [{ id: 'buyerSearchResults', label: 'Buyer search results', minEntries: 5, fields: [baseField('buyerName', 'Buyer name'), baseField('productRequired', 'Product required'), baseField('destination', 'Destination'), baseField('quantity', 'Quantity'), baseField('targetPrice', 'Target price', 'text', false), baseField('paymentTerm', 'Payment term'), baseField('requirementStatus', 'Requirement status'), baseField('addedByOperator', 'Added by operator'), baseField('lastConfirmedDate', 'Last confirmed date', 'date', false), baseField('matchPotential', 'Match potential', 'select', true, matchPotential), noteField('notes', 'Notes')] }, { id: 'buyerMatchNotes', label: 'Buyer match notes', minEntries: 3, fields: [baseField('matchTitle', 'Match title'), noteField('matchReason', 'Match reason')] }] },
  { day: 24, id: 'day-24-first-match', title: 'Create First Match Attempt', category: 'deal', dayType: 'Matching', description: 'Compare one buyer requirement with one supplier availability and submit a match report.', purpose: 'Matching is feasibility checking, not deal closure.', learn: ['Check product, grade, quantity, location, destination, price, payment, delivery, packing, certification, timeline, verification'], tasks: ['Select buyer requirement and supplier availability', 'Compare both', 'Identify gaps', 'Mark match status and next action'], requiredOutput: 'One complete match report.', buttonText: 'Submit Match Report', completionMessage: 'You have completed your first match attempt. Remember, matching is about feasibility, not forcing a deal.', formFields: [baseField('buyerRequirement', 'Buyer requirement selected'), baseField('supplierAvailability', 'Supplier availability selected'), baseField('productMatch', 'Product match', 'select', true, yesNo), baseField('gradeMatch', 'Grade match', 'select', true, ['Yes', 'No', 'Unknown']), baseField('quantityMatch', 'Quantity match', 'select', true, ['Yes', 'No', 'Partial']), baseField('priceCompatible', 'Price compatible', 'select', true, ['Yes', 'No', 'Needs negotiation']), baseField('paymentCompatible', 'Payment compatible', 'select', true, ['Yes', 'No', 'Needs negotiation']), baseField('deliveryCompatible', 'Delivery compatible', 'select', true, ['Yes', 'No', 'Needs check']), baseField('documentCompatible', 'Document compatible', 'select', true, ['Yes', 'No', 'Unknown']), baseField('timelineCompatible', 'Timeline compatible', 'select', true, ['Yes', 'No', 'Needs check']), baseField('matchScore', 'Match score', 'number', true, undefined, 0, 100), baseField('matchStatus', 'Match status', 'select', true, ['Strong match', 'Partial match', 'Needs buyer clarification', 'Needs supplier confirmation', 'Price mismatch', 'Payment mismatch', 'Location issue', 'Document issue', 'Not feasible']), noteField('gaps', 'Gaps'), noteField('suggestedNextAction', 'Suggested next action')], metricMaps: [{ metric: 'matchesAttempted', mode: 'numericField', fieldId: 'matchScore' }] },
  { day: 25, id: 'day-25-quotation-readiness', title: 'Fast Quotation Practice', category: 'deal', dayType: 'Quotation Readiness', description: 'Submit three quotation readiness reports for sample inquiries.', purpose: 'Respond quickly without careless or incomplete quotation.', learn: ['Check product clarity, specification, quantity, location, terms, supplier confirmation, validity, packing, certification, freight, margin'], tasks: ['Take three sample inquiries', 'Check missing details', 'Search internal data', 'Prepare response or missing-details request'], requiredOutput: 'Three quotation readiness reports.', buttonText: 'Submit Quotation Readiness Reports', completionMessage: 'You now understand how to respond faster without giving incomplete or careless quotations.', repeatGroups: [{ id: 'quotationReports', label: 'Quotation readiness reports', minEntries: 3, fields: [noteField('inquiryText', 'Inquiry text'), baseField('product', 'Product'), baseField('quantity', 'Quantity'), baseField('specificationComplete', 'Specification complete', 'select', true, yesNo), baseField('supplierAvailable', 'Supplier available', 'select', true, ['Yes', 'No', 'Need search']), baseField('priceAvailable', 'Price available', 'select', true, ['Yes', 'No', 'Need update']), baseField('paymentClear', 'Payment clear', 'select', true, yesNo), baseField('deliveryTermClear', 'Delivery term clear', 'select', true, yesNo), noteField('missingDetails', 'Missing details'), baseField('readinessStatus', 'Quotation readiness status', 'select', true, ['Ready to quote', 'Need supplier confirmation', 'Need buyer clarification', 'Need price update', 'Need payment clarification', 'Need delivery clarification', 'Not feasible', 'Not serious']), noteField('draftResponse', 'Draft response'), noteField('nextAction', 'Next action')] }], metricMaps: [{ metric: 'quotationReadyInquiries', groupId: 'quotationReports', fieldId: 'readinessStatus', mode: 'countTruthy' }] },
];

const momentumSeeds: DaySeed[] = [
  { day: 26, id: 'day-26-multiple-inquiries', title: 'Handle Multiple Inquiries', category: 'deal', dayType: 'Momentum', description: 'Create a multi-inquiry tracker with at least five inquiries.', purpose: 'Manage inquiry flow without emotional pressure or dependence on one opportunity.', learn: ['Immediate, quotation-ready, need supplier confirmation, need buyer clarification, follow-up, future, weak, not feasible, closed'], tasks: ['Select or create five inquiries', 'Classify each', 'Add next action and follow-up date'], requiredOutput: 'Multi-inquiry tracker.', buttonText: 'Submit Multi-Inquiry Tracker', completionMessage: 'You are now learning to manage inquiry flow like an operator, not depend on one opportunity.', repeatGroups: [{ id: 'inquiries', label: 'Inquiry tracker', minEntries: 5, fields: [baseField('inquiryTitle', 'Inquiry title'), baseField('product', 'Product'), baseField('side', 'Buyer/supplier side'), baseField('statusCategory', 'Status category'), baseField('seriousnessLevel', 'Seriousness level', 'select', true, lowMediumHigh), noteField('missingDetails', 'Missing details'), baseField('clusterSearchNeeded', 'Cluster search needed', 'select', true, yesNo), noteField('nextAction', 'Next action'), baseField('followUpDate', 'Follow-up date', 'date', false), noteField('notes', 'Notes')] }] },
  { day: 27, id: 'day-27-follow-up-pipeline', title: 'Build Follow-Up Pipeline', category: 'deal', dayType: 'Relationship Discipline', description: 'Create a follow-up pipeline with at least ten contacts.', purpose: 'Most trade opportunities do not convert in one conversation; follow-up keeps relationships active.', learn: ['Same-day clarification, two-day follow-up, seven-day follow-up, price update, stock update, requirement update, monthly check'], tasks: ['Review active contacts', 'Assign follow-up type and dates', 'Save message template and priority'], requiredOutput: 'Follow-up pipeline with ten contacts.', buttonText: 'Create Follow-Up Pipeline', completionMessage: 'Your follow-up pipeline is ready. This helps you build relationship continuity and avoid losing useful contacts.', repeatGroups: [{ id: 'pipeline', label: 'Follow-up pipeline', minEntries: 10, fields: [baseField('contactName', 'Contact name'), baseField('contactType', 'Contact type'), baseField('product', 'Product'), noteField('lastDiscussion', 'Last discussion'), baseField('followUpType', 'Follow-up type'), baseField('followUpDate', 'Follow-up date', 'date'), baseField('priority', 'Priority', 'select', true, lowMediumHigh), noteField('messageTemplate', 'Message template'), noteField('expectedOutcome', 'Expected outcome'), noteField('notes', 'Notes')] }], metricMaps: [{ metric: 'followUpsPending', groupId: 'pipeline', mode: 'countGroupEntries' }] },
  { day: 28, id: 'day-28-opportunity-scoring', title: 'Score Opportunity Quality', category: 'deal', dayType: 'Opportunity Scoring', description: 'Score five opportunities out of 100 and identify priority.', purpose: 'Prioritize serious and executable trade signals instead of treating every inquiry equally.', learn: ['Ten scoring factors worth ten points each', '80-100 strong, 60-79 good but needs clarification, 40-59 weak, below 40 low priority'], tasks: ['Select five opportunities', 'Score each', 'Add reason and next action'], requiredOutput: 'Five opportunity scores.', buttonText: 'Submit Opportunity Scores', completionMessage: 'You can now prioritize trade opportunities based on execution feasibility, not emotion or excitement.', repeatGroups: [{ id: 'opportunities', label: 'Opportunity scores', minEntries: 5, fields: [baseField('opportunityName', 'Opportunity name'), ...['Product clarity', 'Quantity clarity', 'Specification clarity', 'Price realism', 'Payment clarity', 'Delivery clarity', 'Seriousness', 'Document readiness', 'Timeline clarity', 'Execution feasibility'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), `${label} score`, 'number', true, undefined, 0, 10)), baseField('totalScore', 'Total score', 'number', false, undefined, 0, 100), baseField('priorityStatus', 'Priority status'), noteField('reason', 'Reason'), noteField('nextAction', 'Next action')] }], metricMaps: [{ metric: 'opportunityScoreAverage', groupId: 'opportunities', fieldId: 'totalScore', mode: 'scoreAverage' }] },
  { day: 29, id: 'day-29-revenue-potential', title: 'Revenue Potential Review', category: 'deal', dayType: 'Performance Review', description: 'Submit a 30-day performance summary and possible trade value review.', purpose: 'Revenue comes from serious opportunities, verified data, quotation speed, relationship continuity, and successful trade completion.', learn: ['Review suppliers, buyers, products, availabilities, requirements, outreach, responses, follow-ups, matches, quotation-ready inquiries, strong opportunities, product confidence, cluster usage, possible trade value'], tasks: ['Count activity', 'Identify top product/supplier/buyer relationships', 'Estimate realistic trade value', 'Write performance summary'], requiredOutput: '30-day performance summary.', buttonText: 'Submit Performance Review', completionMessage: 'Your 30-day performance review is submitted. The final day will identify your operator readiness and next direction.', formFields: ['Suppliers added count', 'Buyers added count', 'Product availabilities count', 'Buyer requirements count', 'Outreach attempts count', 'Responses received count', 'Follow-ups pending count', 'Matches attempted count', 'Quotation-ready inquiries count', 'Strong opportunities count'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, 'number')).concat([baseField('topProductCircle', 'Top product circle'), baseField('topSupplierRelationship', 'Top supplier relationship'), baseField('topBuyerRelationship', 'Top buyer relationship'), baseField('possibleTradeValue', 'Possible trade value'), noteField('operatorSummary', 'Operator summary'), noteField('challengesFaced', 'Challenges faced'), noteField('supportNeeded', 'Support needed')]) },
  { day: 30, id: 'day-30-readiness-assessment', title: 'Operator Readiness and Direction', category: 'deal', dayType: 'Final Assessment', description: 'Complete final self-assessment and receive readiness direction after admin review.', purpose: 'Identify practical direction based on actual work done during the 30-day path.', learn: ['Execution-ready, needs guided supervision, supplier-side strong, buyer-side strong, product research strong, data discipline strong, quotation support strong, follow-up strong, cluster coordination strong, needs more training, not ready currently'], tasks: ['Review full 30-day activity', 'Complete self-assessment', 'Submit reflection', 'System calculates readiness score', 'Admin reviews direction'], requiredOutput: 'Final self-assessment, calculated score, admin/system readiness status.', buttonText: 'Complete Operator Assessment', completionMessage: 'Your 30-day Operator Execution Path is complete. You now have a defined product circle, supplier-buyer data, follow-up pipeline, cluster understanding, and execution readiness direction.', formFields: [baseField('selectedProductCircle', 'Selected product circle'), baseField('strongestSkill', 'Strongest skill'), baseField('weakestArea', 'Weakest area'), baseField('preferredDirection', 'Preferred future work direction'), ...['Product confidence', 'Supplier confidence', 'Buyer confidence', 'Payment term confidence', 'Incoterm confidence', 'Cluster usage confidence'].map((label) => baseField(label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), `${label} score`, 'number', true, undefined, 0, 10)), noteField('finalReflection', 'Final reflection'), noteField('supportRequired', 'Support required')], metricMaps: [{ metric: 'executionReadinessScore', mode: 'numericField', fieldId: 'readinessScore' }] },
];

function toDayTemplate(seed: DaySeed): JourneyDayTemplate {
  return {
    ...seed,
    phase: phaseByDay(seed.day),
    isActive: true,
    reviewRequired: seed.reviewRequired ?? seed.day >= reviewRequiredFromDay,
    formFields: seed.formFields || [],
    repeatGroups: seed.repeatGroups || [],
  };
}

export const JOURNEY_DAY_TEMPLATES: JourneyDayTemplate[] = [
  ...daySeeds,
  ...repeatedDaySeeds,
  ...dataBuildingSeeds,
  ...operatingSeeds,
  ...clusterSeeds,
  ...momentumSeeds,
].sort((a, b) => a.day - b.day).map(toDayTemplate);

export const JOURNEY_PAGE_COPY = {
  title: '30-Day Operator Execution Path',
  subtitle: 'Build product depth, supplier-buyer relationships, quotation speed, cluster collaboration, and trade execution readiness inside the OBAOL system.',
  description:
    'This 30-day path helps operators build trade understanding, supplier-buyer data, quotation speed, relationship discipline, and cluster collaboration. The goal is not to depend on one inquiry, but to build continuous market momentum inside the OBAOL execution system.',
  finalRule:
    'Stay focused on your product circle, but do not reject wider opportunities. Use the cluster system to search, verify, respond, and collaborate.',
};

export const JOURNEY_MILESTONES: JourneyMilestone[] = [
  {
    id: 'day-1-workspace-orientation',
    day: 1,
    title: 'Start your operator day count',
    description: 'Review your workspace, confirm profile details, and understand where onboarding, courses, and journey tracking live.',
    category: 'setup',
    href: '/profile',
    actionLabel: 'Review profile',
  },
  {
    id: 'day-2-role-foundations',
    day: 2,
    title: 'Complete operator role foundations',
    description: 'Study how operators coordinate deals, earn through execution, and build supplier-side ownership.',
    category: 'learning',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Open foundations',
  },
  {
    id: 'day-3-commission-confidence',
    day: 3,
    title: 'Understand commission basics',
    description: 'Review commission structure, role responsibilities, and the difference between associate and operator work.',
    category: 'learning',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Continue course',
  },
  {
    id: 'day-4-incoterms-intro',
    day: 4,
    title: 'Begin incoterms learning',
    description: 'Learn the purpose of incoterms and how trade responsibilities are divided between buyer and seller.',
    category: 'learning',
    href: '/courses',
    actionLabel: 'Open courses',
  },
  {
    id: 'day-5-trading-basics',
    day: 5,
    title: 'Map the basic trading flow',
    description: 'Write down how a supplier conversation can become an inquiry, sample request, quotation, and eventual order.',
    category: 'learning',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Study workflows',
  },
  {
    id: 'day-6-product-focus',
    day: 6,
    title: 'Choose an initial product focus',
    description: 'Select one practical product category to study deeply before starting supplier conversations.',
    category: 'outreach',
  },
  {
    id: 'day-7-supplier-script',
    day: 7,
    title: 'Prepare supplier conversation scripts',
    description: 'Draft simple outreach lines for inquiry-led, product-led, and regional connection conversations.',
    category: 'outreach',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Review outreach lesson',
  },
  {
    id: 'day-8-first-supplier-list',
    day: 8,
    title: 'Build a first supplier list',
    description: 'Create a shortlist of potential suppliers or associates to approach for your chosen product focus.',
    category: 'outreach',
  },
  {
    id: 'day-9-first-outreach',
    day: 9,
    title: 'Start first outreach',
    description: 'Contact your first small batch of suppliers or associates and record the responses.',
    category: 'outreach',
  },
  {
    id: 'day-10-follow-up-rhythm',
    day: 10,
    title: 'Set a follow-up rhythm',
    description: 'Create a repeatable follow-up habit so interested suppliers do not go cold after first contact.',
    category: 'outreach',
  },
  {
    id: 'day-11-company-workflow',
    day: 11,
    title: 'Study company addition workflow',
    description: 'Learn how an associate and company are added, activated, and organized inside the platform.',
    category: 'platform',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Open platform lesson',
  },
  {
    id: 'day-12-associate-details',
    day: 12,
    title: 'Collect associate details cleanly',
    description: 'Practice the details needed for a valid associate/company record, including email and function.',
    category: 'platform',
  },
  {
    id: 'day-13-product-listing',
    day: 13,
    title: 'Learn product listing steps',
    description: 'Study category, pricing, unit, associate, and supply location choices before publishing products.',
    category: 'platform',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Study listings',
  },
  {
    id: 'day-14-live-product-check',
    day: 14,
    title: 'Prepare a product-live checklist',
    description: 'Create a short checklist for making product listings complete, accurate, and ready for marketplace action.',
    category: 'platform',
  },
  {
    id: 'day-15-sample-request-basics',
    day: 15,
    title: 'Understand sample requests',
    description: 'Study how buyer request, supplier quote, approval, shipment tracking, and acceptance fit together.',
    category: 'learning',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Open sample workflow',
  },
  {
    id: 'day-16-inquiry-management',
    day: 16,
    title: 'Understand inquiry management',
    description: 'Review how inquiries move through roles, documents, revisions, and order conversion.',
    category: 'learning',
    href: '/courses/beginner-operator-foundations',
    actionLabel: 'Open inquiry workflow',
  },
  {
    id: 'day-17-incoterms-application',
    day: 17,
    title: 'Apply incoterms to inquiry thinking',
    description: 'Practice identifying which responsibilities and costs need clarity before a trade moves forward.',
    category: 'learning',
    href: '/courses',
    actionLabel: 'Continue courses',
  },
  {
    id: 'day-18-relationship-notes',
    day: 18,
    title: 'Improve relationship notes',
    description: 'Record supplier strengths, preferred communication style, product confidence, and next follow-up date.',
    category: 'outreach',
  },
  {
    id: 'day-19-second-outreach-batch',
    day: 19,
    title: 'Run a second outreach batch',
    description: 'Approach another focused supplier batch using the strongest script from your first outreach.',
    category: 'outreach',
  },
  {
    id: 'day-20-quality-questions',
    day: 20,
    title: 'Prepare quality questions',
    description: 'Build a question list for supplier quality, availability, pricing basis, samples, and documents.',
    category: 'deal',
  },
  {
    id: 'day-21-buyer-need-practice',
    day: 21,
    title: 'Practice buyer need framing',
    description: 'Write a clean buyer need summary with product, quantity, delivery expectation, and quality requirements.',
    category: 'deal',
  },
  {
    id: 'day-22-match-supplier-to-need',
    day: 22,
    title: 'Match supplier capability to a need',
    description: 'Use your notes to match at least one supplier capability against a clear buyer-style requirement.',
    category: 'deal',
  },
  {
    id: 'day-23-document-awareness',
    day: 23,
    title: 'Review document awareness',
    description: 'Identify common trade documents and the questions you should ask before a quotation moves ahead.',
    category: 'learning',
    href: '/courses',
    actionLabel: 'Open courses',
  },
  {
    id: 'day-24-pricing-discipline',
    day: 24,
    title: 'Practice pricing discipline',
    description: 'Review how product price, logistics assumptions, sample costs, and commission thinking affect deal confidence.',
    category: 'deal',
  },
  {
    id: 'day-25-objection-handling',
    day: 25,
    title: 'Prepare objection responses',
    description: 'Write calm responses for common supplier concerns around trust, platform use, inquiry quality, and timelines.',
    category: 'outreach',
  },
  {
    id: 'day-26-active-opportunity',
    day: 26,
    title: 'Identify one active opportunity',
    description: 'Choose the most realistic supplier, product, or inquiry opportunity to pursue with focused follow-up.',
    category: 'deal',
  },
  {
    id: 'day-27-escalation-ready',
    day: 27,
    title: 'Prepare escalation details',
    description: 'Collect the information needed before asking support or senior operators for help on a real opportunity.',
    category: 'deal',
  },
  {
    id: 'day-28-deal-readiness-review',
    day: 28,
    title: 'Review deal readiness',
    description: 'Check whether your active opportunity has enough supplier trust, product clarity, pricing context, and next action.',
    category: 'deal',
  },
  {
    id: 'day-29-first-deal-plan',
    day: 29,
    title: 'Create a first deal action plan',
    description: 'Write the next three actions required to move your strongest opportunity closer to a transaction.',
    category: 'deal',
  },
  {
    id: 'day-30-operator-review',
    day: 30,
    title: 'Complete 30-day operator review',
    description: 'Review course progress, relationship pipeline, product focus, and the next milestone toward cracking a deal.',
    category: 'deal',
    href: '/courses',
    actionLabel: 'Review training',
  },
];
