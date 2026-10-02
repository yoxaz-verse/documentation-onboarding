import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminSession } from '../../../../../lib/adminAuth';
import { isMissingSupabaseTableError } from '../../../../../lib/supabaseErrors';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

const SUBMISSION_FIELDS = 'id, email, template_id, day_number, status, answers, computed_metrics, submitted_at, reviewed_at, reviewed_by, review_note, created_at, updated_at';
const PENDING_REVIEW_STATUSES = ['under_review', 'submitted'];

type SubmissionRow = {
  id: string;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function timestamp(value: string | null | undefined, fallback: number) {
  const parsed = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sortSubmissions(rows: SubmissionRow[]) {
  return [...rows].sort((a, b) => {
    const aNeedsReview = PENDING_REVIEW_STATUSES.includes(a.status);
    const bNeedsReview = PENDING_REVIEW_STATUSES.includes(b.status);
    if (aNeedsReview !== bNeedsReview) return aNeedsReview ? -1 : 1;

    if (aNeedsReview && bNeedsReview) {
      const aSubmittedAt = timestamp(a.submitted_at || a.created_at || a.updated_at, Number.POSITIVE_INFINITY);
      const bSubmittedAt = timestamp(b.submitted_at || b.created_at || b.updated_at, Number.POSITIVE_INFINITY);
      if (aSubmittedAt !== bSubmittedAt) return aSubmittedAt - bSubmittedAt;
    } else {
      const aUpdatedAt = timestamp(a.updated_at || a.submitted_at || a.created_at, 0);
      const bUpdatedAt = timestamp(b.updated_at || b.submitted_at || b.created_at, 0);
      if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
    }

    return a.id.localeCompare(b.id);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = requireAdminSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const status = String(req.query.status || '').trim();
  let data: SubmissionRow[] = [];
  let error: { message: string; code?: string } | null = null;

  if (status) {
    let query = supabaseAdmin
      .from('operator_journey_day_submissions')
      .select(SUBMISSION_FIELDS)
      .eq('status', status)
      .limit(100);
    query = PENDING_REVIEW_STATUSES.includes(status)
      ? query.order('submitted_at', { ascending: true })
      : query.order('updated_at', { ascending: false });
    const result = await query;
    data = (result.data || []) as SubmissionRow[];
    error = result.error;
  } else {
    const [pendingResult, otherResult] = await Promise.all([
      supabaseAdmin
        .from('operator_journey_day_submissions')
        .select(SUBMISSION_FIELDS)
        .in('status', PENDING_REVIEW_STATUSES)
        .order('submitted_at', { ascending: true })
        .limit(100),
      supabaseAdmin
        .from('operator_journey_day_submissions')
        .select(SUBMISSION_FIELDS)
        .not('status', 'in', '(under_review,submitted)')
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);
    data = [...(pendingResult.data || []), ...(otherResult.data || [])] as SubmissionRow[];
    error = pendingResult.error || otherResult.error;
  }

  if (error) {
    if (isMissingSupabaseTableError(error)) return res.status(500).json({ error: 'Database schema is not up to date. Apply the full journey workflow migration.' });
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ submissions: sortSubmissions(data).slice(0, 100) });
}
