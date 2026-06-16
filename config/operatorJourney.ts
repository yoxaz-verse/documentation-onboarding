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
