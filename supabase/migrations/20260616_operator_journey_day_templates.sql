create table if not exists public.operator_journey_day_templates (
  template_id text primary key,
  day_number integer not null unique check (day_number between 1 and 30),
  title text not null,
  description text not null,
  category text not null check (category in ('setup', 'learning', 'outreach', 'platform', 'deal')),
  href text,
  action_label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.operator_journey_day_templates (template_id, day_number, title, description, category, href, action_label, is_active)
values
  ('day-1-workspace-orientation', 1, 'Start your operator day count', 'Review your workspace, confirm profile details, and understand where onboarding, courses, and journey tracking live.', 'setup', '/profile', 'Review profile', true),
  ('day-2-role-foundations', 2, 'Complete operator role foundations', 'Study how operators coordinate deals, earn through execution, and build supplier-side ownership.', 'learning', '/courses/beginner-operator-foundations', 'Open foundations', true),
  ('day-3-commission-confidence', 3, 'Understand commission basics', 'Review commission structure, role responsibilities, and the difference between associate and operator work.', 'learning', '/courses/beginner-operator-foundations', 'Continue course', true),
  ('day-4-incoterms-intro', 4, 'Begin incoterms learning', 'Learn the purpose of incoterms and how trade responsibilities are divided between buyer and seller.', 'learning', '/courses', 'Open courses', true),
  ('day-5-trading-basics', 5, 'Map the basic trading flow', 'Write down how a supplier conversation can become an inquiry, sample request, quotation, and eventual order.', 'learning', '/courses/beginner-operator-foundations', 'Study workflows', true),
  ('day-6-product-focus', 6, 'Choose an initial product focus', 'Select one practical product category to study deeply before starting supplier conversations.', 'outreach', null, null, true),
  ('day-7-supplier-script', 7, 'Prepare supplier conversation scripts', 'Draft simple outreach lines for inquiry-led, product-led, and regional connection conversations.', 'outreach', '/courses/beginner-operator-foundations', 'Review outreach lesson', true),
  ('day-8-first-supplier-list', 8, 'Build a first supplier list', 'Create a shortlist of potential suppliers or associates to approach for your chosen product focus.', 'outreach', null, null, true),
  ('day-9-first-outreach', 9, 'Start first outreach', 'Contact your first small batch of suppliers or associates and record the responses.', 'outreach', null, null, true),
  ('day-10-follow-up-rhythm', 10, 'Set a follow-up rhythm', 'Create a repeatable follow-up habit so interested suppliers do not go cold after first contact.', 'outreach', null, null, true),
  ('day-11-company-workflow', 11, 'Study company addition workflow', 'Learn how an associate and company are added, activated, and organized inside the platform.', 'platform', '/courses/beginner-operator-foundations', 'Open platform lesson', true),
  ('day-12-associate-details', 12, 'Collect associate details cleanly', 'Practice the details needed for a valid associate/company record, including email and function.', 'platform', null, null, true),
  ('day-13-product-listing', 13, 'Learn product listing steps', 'Study category, pricing, unit, associate, and supply location choices before publishing products.', 'platform', '/courses/beginner-operator-foundations', 'Study listings', true),
  ('day-14-live-product-check', 14, 'Prepare a product-live checklist', 'Create a short checklist for making product listings complete, accurate, and ready for marketplace action.', 'platform', null, null, true),
  ('day-15-sample-request-basics', 15, 'Understand sample requests', 'Study how buyer request, supplier quote, approval, shipment tracking, and acceptance fit together.', 'learning', '/courses/beginner-operator-foundations', 'Open sample workflow', true),
  ('day-16-inquiry-management', 16, 'Understand inquiry management', 'Review how inquiries move through roles, documents, revisions, and order conversion.', 'learning', '/courses/beginner-operator-foundations', 'Open inquiry workflow', true),
  ('day-17-incoterms-application', 17, 'Apply incoterms to inquiry thinking', 'Practice identifying which responsibilities and costs need clarity before a trade moves forward.', 'learning', '/courses', 'Continue courses', true),
  ('day-18-relationship-notes', 18, 'Improve relationship notes', 'Record supplier strengths, preferred communication style, product confidence, and next follow-up date.', 'outreach', null, null, true),
  ('day-19-second-outreach-batch', 19, 'Run a second outreach batch', 'Approach another focused supplier batch using the strongest script from your first outreach.', 'outreach', null, null, true),
  ('day-20-quality-questions', 20, 'Prepare quality questions', 'Build a question list for supplier quality, availability, pricing basis, samples, and documents.', 'deal', null, null, true),
  ('day-21-buyer-need-practice', 21, 'Practice buyer need framing', 'Write a clean buyer need summary with product, quantity, delivery expectation, and quality requirements.', 'deal', null, null, true),
  ('day-22-match-supplier-to-need', 22, 'Match supplier capability to a need', 'Use your notes to match at least one supplier capability against a clear buyer-style requirement.', 'deal', null, null, true),
  ('day-23-document-awareness', 23, 'Review document awareness', 'Identify common trade documents and the questions you should ask before a quotation moves ahead.', 'learning', '/courses', 'Open courses', true),
  ('day-24-pricing-discipline', 24, 'Practice pricing discipline', 'Review how product price, logistics assumptions, sample costs, and commission thinking affect deal confidence.', 'deal', null, null, true),
  ('day-25-objection-handling', 25, 'Prepare objection responses', 'Write calm responses for common supplier concerns around trust, platform use, inquiry quality, and timelines.', 'outreach', null, null, true),
  ('day-26-active-opportunity', 26, 'Identify one active opportunity', 'Choose the most realistic supplier, product, or inquiry opportunity to pursue with focused follow-up.', 'deal', null, null, true),
  ('day-27-escalation-ready', 27, 'Prepare escalation details', 'Collect the information needed before asking support or senior operators for help on a real opportunity.', 'deal', null, null, true),
  ('day-28-deal-readiness-review', 28, 'Review deal readiness', 'Check whether your active opportunity has enough supplier trust, product clarity, pricing context, and next action.', 'deal', null, null, true),
  ('day-29-first-deal-plan', 29, 'Create a first deal action plan', 'Write the next three actions required to move your strongest opportunity closer to a transaction.', 'deal', null, null, true),
  ('day-30-operator-review', 30, 'Complete 30-day operator review', 'Review course progress, relationship pipeline, product focus, and the next milestone toward cracking a deal.', 'deal', '/courses', 'Review training', true)
on conflict (template_id) do update set
  day_number = excluded.day_number,
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  href = excluded.href,
  action_label = excluded.action_label,
  is_active = excluded.is_active;

drop trigger if exists set_operator_journey_day_templates_updated_at on public.operator_journey_day_templates;
create trigger set_operator_journey_day_templates_updated_at
before update on public.operator_journey_day_templates
for each row execute function public.set_updated_at();

alter table public.operator_journey_day_templates enable row level security;

drop policy if exists "Service role can manage operator journey day templates" on public.operator_journey_day_templates;
create policy "Service role can manage operator journey day templates"
on public.operator_journey_day_templates
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
