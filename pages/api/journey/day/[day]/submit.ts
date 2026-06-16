import type { NextApiRequest, NextApiResponse } from 'next';
import { ensureOperatorSeed } from '../../../../../lib/ensureOperatorSeed';
import { computeJourneySubmissionMetrics, normalizeJourneyDayTemplates, validateJourneyAnswers, type JourneyTemplateRecord } from '../../../../../lib/operatorJourney';
import { requireSession } from '../../../../../lib/serverAuth';
import { isMissingSupabaseTableError } from '../../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const day = Number(req.query.day);
  if (!Number.isInteger(day) || day < 1 || day > 30) return res.status(400).json({ error: 'Invalid journey day.' });

  const seedError = await ensureOperatorSeed(session.email);
  if (seedError) return res.status(500).json({ error: `Failed to ensure operator record: ${seedError}` });

  const { data: templateRows, error: templateError } = await supabaseAdmin
    .from('operator_journey_day_templates')
    .select('template_id, day_number, title, description, category, href, action_label, is_active, rich_template, review_required, button_text, completion_message')
    .order('day_number', { ascending: true });

  if (templateError && !isMissingSupabaseTableError(templateError)) return res.status(500).json({ error: templateError.message });

  const templates = normalizeJourneyDayTemplates(templateError ? null : (templateRows || []) as JourneyTemplateRecord[]);
  const template = templates.find((item) => item.day === day && item.isActive !== false);
  if (!template) return res.status(404).json({ error: 'Journey day is not available.' });

  const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers as Record<string, unknown> : {};
  const validation = validateJourneyAnswers(template, answers);
  if (!validation.valid) return res.status(400).json({ error: 'Please complete the required day fields.', errors: validation.errors });

  const now = new Date().toISOString();
  const status = template.reviewRequired ? 'under_review' : 'completed';
  const computedMetrics = computeJourneySubmissionMetrics(template, answers);

  const { data: submission, error } = await supabaseAdmin
    .from('operator_journey_day_submissions')
    .upsert({
      email: session.email,
      template_id: template.id,
      day_number: day,
      status,
      answers,
      computed_metrics: computedMetrics,
      submitted_at: now,
      reviewed_at: status === 'completed' ? now : null,
      reviewed_by: status === 'completed' ? 'system' : null,
      review_note: null,
    }, { onConflict: 'email,day_number' })
    .select('id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at')
    .single();

  if (error) {
    if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Database schema is not up to date. Apply the full journey workflow migration.' });
    return res.status(500).json({ error: error.message });
  }

  if (status === 'completed') {
    await supabaseAdmin
      .from('operator_journey_milestone_state')
      .upsert({ email: session.email, milestone_id: template.id, completed_at: now }, { onConflict: 'email,milestone_id' });
  }

  return res.status(200).json({ submission, status, completionMessage: template.completionMessage });
}
