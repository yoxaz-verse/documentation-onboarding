import { useState } from 'react';
import styles from './JourneyReviewActions.module.css';

const READINESS_STATUSES = [
  'Execution-ready operator',
  'Needs guided supervision',
  'Supplier-side strong',
  'Buyer-side strong',
  'Product research strong',
  'Data discipline strong',
  'Quotation support strong',
  'Follow-up strong',
  'Cluster coordination strong',
  'Needs more training',
  'Not ready currently',
];

type ReviewAction = 'approve' | 'needs_correction';

type JourneyReviewActionsProps = {
  submissionId: string;
  dayNumber: number;
  onReviewed: (action: ReviewAction) => void | Promise<void>;
};

export default function JourneyReviewActions({ submissionId, dayNumber, onReviewed }: JourneyReviewActionsProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [readinessStatus, setReadinessStatus] = useState('');
  const [platformVerified, setPlatformVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async (action: ReviewAction) => {
    if (action === 'needs_correction' && !reviewNote.trim()) {
      setError('Add a review note before requesting a correction.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/journey/submissions/${submissionId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          reviewNote: reviewNote.trim(),
          readinessStatus,
          platformVerificationConfirmed: platformVerified,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to review submission.');
      await onReviewed(action);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review submission.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.reviewForm}>
      {dayNumber === 11 ? (
        <div className={styles.verificationBox}>
          <span className={styles.label}>External platform verification required</span>
          <p>Verify five supplier associates and their associate companies on the main OBAOL platform for this operator.</p>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={platformVerified} onChange={(event) => setPlatformVerified(event.target.checked)} />
            Verified five suppliers on the platform
          </label>
        </div>
      ) : null}

      {dayNumber === 30 ? (
        <label className={styles.field}>
          <span className={styles.label}>Final readiness status</span>
          <select value={readinessStatus} onChange={(event) => setReadinessStatus(event.target.value)}>
            <option value="">Select</option>
            {READINESS_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Review note</span>
        <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={3} placeholder="Required when requesting correction" />
      </label>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.actions}>
        <button className={styles.approveButton} type="button" disabled={saving || (dayNumber === 11 && !platformVerified)} onClick={() => submitReview('approve')}>
          {saving ? 'Saving…' : 'Approve and unblock operator'}
        </button>
        <button className={styles.correctionButton} type="button" disabled={saving || !reviewNote.trim()} onClick={() => submitReview('needs_correction')}>
          Needs correction
        </button>
      </div>
    </div>
  );
}
