import type { NextApiRequest, NextApiResponse } from 'next';
import { JOURNEY_TOTAL_DAYS, type JourneyMilestone, type JourneyMilestoneCategory } from '../../../../config/operatorJourney';
import { requireAdminSession } from '../../../../lib/adminAuth';
import { normalizeJourneyTemplates, type JourneyTemplateRecord } from '../../../../lib/operatorJourney';
import { isMissingSupabaseTableError } from '../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const CATEGORIES = new Set<JourneyMilestoneCategory>(['setup', 'learning', 'outreach', 'platform', 'deal']);

function schemaError(res: NextApiResponse) {
  return res.status(500).json({ error: 'Database schema is not up to date. Apply the operator journey day template migration.' });
}

function normalizeInputMilestone(value: unknown, index: number): JourneyMilestone {
  const item = (value || {}) as Partial<JourneyMilestone>;
  const day = Number(item.day || index + 1);
  const id = String(item.id || `day-${day}-custom`).trim();
  const title = String(item.title || '').trim();
  const description = String(item.description || '').trim();
  const category = String(item.category || 'learning') as JourneyMilestoneCategory;
  const href = String(item.href || '').trim();
  const actionLabel = String(item.actionLabel || '').trim();

  if (!Number.isInteger(day) || day < 1 || day > JOURNEY_TOTAL_DAYS) throw new Error(`Day ${index + 1} has an invalid day number.`);
  if (!id) throw new Error(`Day ${day} is missing a template id.`);
  if (!title) throw new Error(`Day ${day} needs a title.`);
  if (!description) throw new Error(`Day ${day} needs a description.`);
  if (!CATEGORIES.has(category)) throw new Error(`Day ${day} has an invalid category.`);

  return {
    id,
    day,
    title,
    description,
    category,
    href: href || undefined,
    actionLabel: actionLabel || undefined,
    isActive: item.isActive !== false,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('operator_journey_day_templates')
      .select('template_id, day_number, title, description, category, href, action_label, is_active')
      .order('day_number', { ascending: true });

    if (error) {
      if (isMissingSupabaseTableError(error)) return schemaError(res);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ milestones: normalizeJourneyTemplates((data || []) as JourneyTemplateRecord[]) });
  }

  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  let milestones: JourneyMilestone[];
  try {
    const rawMilestones = Array.isArray(req.body?.milestones) ? req.body.milestones : [];
    if (rawMilestones.length !== JOURNEY_TOTAL_DAYS) throw new Error(`Exactly ${JOURNEY_TOTAL_DAYS} journey days are required.`);
    milestones = rawMilestones.map(normalizeInputMilestone).sort((a, b) => a.day - b.day);

    const daySet = new Set(milestones.map((milestone) => milestone.day));
    const idSet = new Set(milestones.map((milestone) => milestone.id));
    if (daySet.size !== JOURNEY_TOTAL_DAYS) throw new Error('Each journey day number must be unique.');
    if (idSet.size !== JOURNEY_TOTAL_DAYS) throw new Error('Each journey template id must be unique.');
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid journey template.' });
  }

  const rows = milestones.map((milestone) => ({
    template_id: milestone.id,
    day_number: milestone.day,
    title: milestone.title,
    description: milestone.description,
    category: milestone.category,
    href: milestone.href || null,
    action_label: milestone.actionLabel || null,
    is_active: milestone.isActive !== false,
  }));

  const { data, error } = await supabaseAdmin
    .from('operator_journey_day_templates')
    .upsert(rows, { onConflict: 'template_id' })
    .select('template_id, day_number, title, description, category, href, action_label, is_active')
    .order('day_number', { ascending: true });

  if (error) {
    if (isMissingSupabaseTableError(error)) return schemaError(res);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ milestones: normalizeJourneyTemplates((data || []) as JourneyTemplateRecord[]) });
}
