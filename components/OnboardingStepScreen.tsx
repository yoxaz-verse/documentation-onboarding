import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './OnboardingLayout';
import styles from '../pages/onboarding.module.css';
import { isUnauthorizedError } from '../lib/http';
import {
  areCoursesUnlocked,
  canAccessStep,
  FINAL_MILESTONE,
  getMilestone,
  getNextMilestone,
  isMilestoneCompleted,
  type MilestoneNumber,
} from '../lib/onboarding';
import { completeStep, getProgressBundle } from '../lib/progress';
import { getProfile, saveProfile } from '../lib/profile';
import type { CourseProgressSummary, OperatorProfile, ProgressRecord } from '../lib/types';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_ONBOARDING_SUPPORT_PHONE || 'Support number not configured';

function parseElapsedState(acknowledgedAt: string | null) {
  if (!acknowledgedAt) return { reveal: false, stage: 'pending' };
  const diffMs = Date.now() - new Date(acknowledgedAt).getTime();
  if (diffMs >= 6 * 60 * 60 * 1000) return { reveal: true, stage: 'six_hours' };
  if (diffMs >= 60 * 60 * 1000) return { reveal: true, stage: 'one_hour' };
  return { reveal: false, stage: 'pending' };
}

function nextRouteAfter(step: MilestoneNumber) {
  const next = getMilestone(step + 1);
  return next?.route || '/courses';
}

function emptyProfile(): OperatorProfile {
  return {
    email: '',
    full_name: '',
    phone: '',
    role_title: '',
    city: '',
    state: '',
    years_experience: '',
    total_work_experience_years: '',
    group_trading_experience_years: '',
    preferred_language: '',
    operator_background: '',
    motivation: '',
    official_company_email: '',
    zoho_acknowledged_at: null,
    zoho_contact_revealed_at: null,
    zoho_support_stage: 'pending',
    created_at: null,
    updated_at: null,
  };
}

export default function OnboardingStepScreen({ step }: { step: MilestoneNumber }) {
  const router = useRouter();
  const milestone = getMilestone(step);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [profile, setProfile] = useState<OperatorProfile>(emptyProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [experienceForm, setExperienceForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    preferred_language: '',
    total_work_experience_years: '',
    group_trading_experience_years: '',
    operator_background: '',
    motivation: '',
  });
  const [officialEmail, setOfficialEmail] = useState('');
  const [registrationChecked, setRegistrationChecked] = useState(false);
  const [zohoChecked, setZohoChecked] = useState(false);
  const [expectationsChecked, setExpectationsChecked] = useState({
    notSalaried: false,
    noGuarantees: false,
    agriSystem: false,
  });

  const revealState = useMemo(
    () => parseElapsedState(profile.zoho_acknowledged_at),
    [profile.zoho_acknowledged_at]
  );

  const canContinue = useMemo(() => {
    if (step === 3) {
      return expectationsChecked.notSalaried && expectationsChecked.noGuarantees && expectationsChecked.agriSystem;
    }
    return true;
  }, [step, expectationsChecked]);

  const load = async () => {
    const [bundle, currentProfile] = await Promise.all([getProgressBundle(), getProfile()]);
    setProgress(bundle.progress);
    setCourseProgress(bundle.courseProgress);
    setProfile(currentProfile);
    setExperienceForm({
      full_name: currentProfile.full_name || '',
      phone: currentProfile.phone || '',
      city: currentProfile.city || '',
      state: currentProfile.state || '',
      preferred_language: currentProfile.preferred_language || '',
      total_work_experience_years: currentProfile.total_work_experience_years || '',
      group_trading_experience_years: currentProfile.group_trading_experience_years || '',
      operator_background: currentProfile.operator_background || '',
      motivation: currentProfile.motivation || '',
    });
    setOfficialEmail(currentProfile.official_company_email || '');
    setZohoChecked(Boolean(currentProfile.zoho_acknowledged_at));
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        await load();
        if (!active) return;
        setMessage('');
      } catch (error) {
        if (!active) return;
        if (isUnauthorizedError(error)) {
          router.replace('/');
          return;
        }
        setMessage(error instanceof Error ? error.message : 'Failed to load onboarding step.');
      } finally {
        if (active) setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [router, step]);

  useEffect(() => {
    if (step !== 10) return;
    if (!profile.zoho_acknowledged_at) return;
    if (profile.zoho_support_stage === revealState.stage && (!revealState.reveal || profile.zoho_contact_revealed_at)) return;

    const sync = async () => {
      try {
        const updated = await saveProfile({
          zoho_support_stage: revealState.stage,
          zoho_contact_revealed_at: revealState.reveal ? profile.zoho_contact_revealed_at || new Date().toISOString() : null,
        });
        setProfile(updated);
      } catch {
        // Best effort: the timer UI can still render from the acknowledgement timestamp.
      }
    };

    sync();
  }, [step, profile.zoho_acknowledged_at, profile.zoho_support_stage, profile.zoho_contact_revealed_at, revealState.stage, revealState.reveal]);

  useEffect(() => {
    if (!progress || loading) return;
    if (!canAccessStep(progress, step)) {
      const next = getNextMilestone(progress);
      router.replace(next?.route || '/courses');
    }
  }, [progress, loading, router, step]);

  if (!milestone) return null;

  const messageTone = message.toLowerCase().includes('failed') || message.toLowerCase().includes('required') || message.toLowerCase().includes('valid')
    ? styles.messageError
    : message
      ? styles.messageSuccess
      : '';

  const advance = async () => {
    setSaving(true);
    try {
      await completeStep(step);
      await load();
      setMessage('Step completed.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to complete this step.');
    } finally {
      setSaving(false);
    }
  };

  const saveExperience = async () => {
    const requiredEntries = Object.entries(experienceForm);
    const missing = requiredEntries.find(([, value]) => !String(value || '').trim());
    if (missing) {
      setMessage('Please complete every field before continuing.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        ...experienceForm,
        role_title: 'Operator',
        years_experience: experienceForm.group_trading_experience_years,
      });
      await completeStep(step);
      await load();
      setMessage('Experience details saved.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  const saveOfficialEmail = async () => {
    const normalized = officialEmail.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      setMessage('Enter a valid official email before continuing.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({ official_company_email: normalized });
      await completeStep(step);
      await load();
      setMessage('Official email saved.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to save the official email.');
    } finally {
      setSaving(false);
    }
  };

  const confirmOperatorRegistration = async () => {
    if (!registrationChecked) {
      setMessage('Please confirm that you completed the operator registration step.');
      return;
    }

    setSaving(true);
    try {
      await completeStep(step);
      await load();
      setMessage('Operator registration confirmed.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to confirm operator registration.');
    } finally {
      setSaving(false);
    }
  };

  const saveZohoAck = async () => {
    if (!zohoChecked) {
      setMessage('Please confirm that you completed the Zoho step.');
      return;
    }

    setSaving(true);
    try {
      await saveProfile({
        zoho_acknowledged_at: profile.zoho_acknowledged_at || new Date().toISOString(),
        zoho_support_stage: 'pending',
      });
      await completeStep(step);
      await load();
      setMessage('Zoho completion recorded.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to save the Zoho confirmation.');
    } finally {
      setSaving(false);
    }
  };

  const openCourses = async () => {
    setSaving(true);
    try {
      if (!isMilestoneCompleted(progress, FINAL_MILESTONE)) {
        await completeStep(step);
      }
      await load();
      router.push('/courses');
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to unlock the training library.');
    } finally {
      setSaving(false);
    }
  };

  const infoCards = {
    1: (
      <>
        <section className={styles.embedWrap}>
          <iframe
            className={styles.embed}
            src="https://www.youtube.com/embed/RpDVucls7uw"
            title="Company overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Why this comes first</h2>
          <p className={styles.calloutText}>
            Before someone starts operating, they need context on what the company does, what the system supports, and why this onboarding exists.
          </p>
        </section>
        <ul className={styles.stepList}>
          <li>OBAOL builds and coordinates digital agri-trade execution.</li>
          <li>The operator system supports opportunity validation, counterparty coordination, and trade completion.</li>
          <li>This workspace is meant to help operators understand the system before touching the training library.</li>
        </ul>
      </>
    ),
    2: (
      <>
        <section className={styles.embedWrap}>
          <iframe
            className={styles.embed}
            src="https://www.youtube.com/embed/k9EXz9oULcc"
            title="Operator Model Overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>What the operator model means</h2>
          <p className={styles.calloutText}>
            You are being introduced as part of the operator system. Review how the role works, what operators are expected to do, and where the practical guidance lives before you continue.
          </p>
          <div className={styles.actionRow}>
            <a href="https://www.obaol.com/roles/operator" className={styles.cta} target="_blank" rel="noreferrer">
              Open operator page
            </a>
          </div>
        </section>
        <ul className={styles.stepList}>
          <li>Operators work inside a structured system, not a loose referral loop.</li>
          <li>The operator page explains the practical side of the role and how the system is meant to be used.</li>
          <li>We want clarity before data collection or course access.</li>
        </ul>
      </>
    ),
    3: (
      <>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Important expectation</h2>
          <p className={styles.calloutText}>
            This is not a full-time salaried job. The operator system requires involvement, consistency, and execution responsibility.
          </p>
        </section>
        <div className={styles.checkboxList}>
          <label className={styles.checkboxItem}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={expectationsChecked.notSalaried}
              onChange={(event) =>
                setExpectationsChecked((prev) => ({ ...prev, notSalaried: event.target.checked }))
              }
            />
            <span className={styles.checkboxLabel}>
              I understand this is not a regular salaried job and my earnings are tied to completed work and completed trades.
            </span>
          </label>
          <label className={styles.checkboxItem}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={expectationsChecked.noGuarantees}
              onChange={(event) =>
                setExpectationsChecked((prev) => ({ ...prev, noGuarantees: event.target.checked }))
              }
            />
            <span className={styles.checkboxLabel}>
              I acknowledge that no fixed salary is attached and no assigned leads are guaranteed simply by joining.
            </span>
          </label>
          <label className={styles.checkboxItem}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={expectationsChecked.agriSystem}
              onChange={(event) =>
                setExpectationsChecked((prev) => ({ ...prev, agriSystem: event.target.checked }))
              }
            />
            <span className={styles.checkboxLabel}>
              I understand that the operator role is designed to optimize and execute transactions within the digital agri-trade (import/export) system.
            </span>
          </label>
        </div>
      </>
    ),
    4: (
      <>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Review the commission material before you continue</h2>
          <p className={styles.calloutText}>
            This step is here so the operator can review the commission context and watch the supporting explanation before filling anything important.
          </p>
          <div className={styles.actionRow}>
            <a href="https://www.obaol.com/commission-structure" className={styles.secondaryButton} target="_blank" rel="noreferrer">
              Review commission
            </a>
          </div>
          <p className={styles.calloutHint}>You can replace this link later if the final public page changes.</p>
        </section>
        <section className={styles.embedWrap}>
          <iframe
            className={styles.embed}
            src="https://www.youtube.com/embed/-08ODNSg8io"
            title="Commission Structure Overview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
      </>
    ),
    5: (
      <>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Decision checkpoint</h2>
          <p className={styles.calloutText}>
            This moment is intentionally separate. After seeing the company context, the operator role, and the commission model, the candidate confirms that they are comfortable proceeding.
          </p>
        </section>
        <ul className={styles.stepList}>
          <li>You understand what OBAOL does.</li>
          <li>You understand the operator role and support structure.</li>
          <li>You are comfortable continuing into the personal setup steps.</li>
        </ul>
      </>
    ),
    9: (
      <>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Why Zoho Cliq is used</h2>
          <p className={styles.calloutText}>
            Zoho Cliq is only the communication layer. It is where operators can coordinate, ask questions, and receive structured follow-up during execution.
          </p>
          <div className={styles.actionRow}>
            <a href="https://cliq.zoho.com/" className={styles.cta} target="_blank" rel="noreferrer">
              Open Zoho Cliq
            </a>
          </div>
        </section>
        <ul className={styles.stepList}>
          <li>Use the official email you created in the previous step.</li>
          <li>Join only for relevant operator communication and coordination.</li>
          <li>After setup, return here and confirm completion in the next step.</li>
        </ul>
      </>
    ),
  } as Partial<Record<MilestoneNumber, JSX.Element>>;

  const stepContent =
    step === 6 ? (
      <section className={styles.formSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.calloutTitle}>Tell us about your operating context</h2>
            <p className={styles.calloutText}>
              This section is intentionally guided. We collect each detail so the operator can be onboarded with the right communication, expectations, and support.
            </p>
          </div>
        </div>
        <div className={styles.profileGrid}>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>Full name</span>
            <input className={styles.textInput} value={experienceForm.full_name} onChange={(event) => setExperienceForm((prev) => ({ ...prev, full_name: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>Phone number</span>
            <input className={styles.textInput} value={experienceForm.phone} onChange={(event) => setExperienceForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>City</span>
            <input className={styles.textInput} value={experienceForm.city} onChange={(event) => setExperienceForm((prev) => ({ ...prev, city: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>State</span>
            <input className={styles.textInput} value={experienceForm.state} onChange={(event) => setExperienceForm((prev) => ({ ...prev, state: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>Preferred language</span>
            <input className={styles.textInput} value={experienceForm.preferred_language} onChange={(event) => setExperienceForm((prev) => ({ ...prev, preferred_language: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>Total work experience</span>
            <input className={styles.textInput} value={experienceForm.total_work_experience_years} onChange={(event) => setExperienceForm((prev) => ({ ...prev, total_work_experience_years: event.target.value }))} />
          </label>
          <label className={styles.inputGroup}>
            <span className={styles.inputLabel}>Agro-trade experience</span>
            <input className={styles.textInput} value={experienceForm.group_trading_experience_years} onChange={(event) => setExperienceForm((prev) => ({ ...prev, group_trading_experience_years: event.target.value }))} />
          </label>
        </div>
        <label className={styles.inputGroup}>
          <span className={styles.inputLabel}>Background and experience</span>
          <textarea className={styles.textArea} rows={4} value={experienceForm.operator_background} onChange={(event) => setExperienceForm((prev) => ({ ...prev, operator_background: event.target.value }))} />
        </label>
        <label className={styles.inputGroup}>
          <span className={styles.inputLabel}>Why do you want to work for OBAOL/Uber-style operator ecosystem?</span>
          <textarea className={styles.textArea} rows={4} value={experienceForm.motivation} onChange={(event) => setExperienceForm((prev) => ({ ...prev, motivation: event.target.value }))} />
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={saveExperience} disabled={saving}>
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </section>
    ) : step === 7 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Create your official email first</h2>
          <p className={styles.calloutText}>
            Use a professional naming format such as <strong>name.company@provider.com</strong>. This email is mainly for Zoho Workspace access and official company communication.
          </p>
          <p className={styles.calloutHint}>Example: `jacob.obaol@gmail.com` or `jacob.obaol@outlook.com`. You can also reuse this same email in the next step when registering on OBAOL.</p>
        </section>
        <label className={styles.inputGroup}>
          <span className={styles.inputLabel}>Official company email</span>
          <input className={styles.textInput} type="email" value={officialEmail} onChange={(event) => setOfficialEmail(event.target.value)} placeholder="name.company@provider.com" />
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={saveOfficialEmail} disabled={saving}>
            {saving ? 'Saving...' : 'Save email and continue'}
          </button>
        </div>
      </section>
    ) : step === 8 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Register on the operator platform next</h2>
          <p className={styles.calloutText}>
            Now go to the operator registration page and create your OBAOL operator account. It is recommended to use the same official company email you just created so Zoho access and platform activity stay organized separately from your personal email.
          </p>
          <div className={styles.actionRow}>
            <a href="https://www.obaol.com/auth/operator/register" className={styles.cta} target="_blank" rel="noreferrer">
              Open operator registration
            </a>
          </div>
          <p className={styles.calloutHint}>Using the same official email is best practice for organization, but it is not mandatory. Complete the registration, then return here and confirm it before continuing.</p>
        </section>
        <label className={styles.message}>
          <input type="checkbox" checked={registrationChecked} onChange={(event) => setRegistrationChecked(event.target.checked)} />
          {' '}I completed my operator registration on obaol.com and came back to continue onboarding.
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={confirmOperatorRegistration} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm registration and continue'}
          </button>
        </div>
      </section>
    ) : step === 10 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Confirm the Zoho setup</h2>
          <p className={styles.calloutText}>
            Once you have completed the Zoho step, confirm it here. If there is no response after the waiting window, the support number becomes visible so the operator can call directly.
          </p>
        </section>
        <label className={styles.message}>
          <input type="checkbox" checked={zohoChecked} onChange={(event) => setZohoChecked(event.target.checked)} />
          {' '}I completed the Zoho/Cliq setup using my official email.
        </label>
        {profile.zoho_acknowledged_at ? (
          <section className={styles.codePanel}>
            <p className={styles.codeLabel}>Support escalation</p>
            <p className={styles.calloutText}>
              Acknowledged at {new Date(profile.zoho_acknowledged_at).toLocaleString()}.
            </p>
            <p className={styles.calloutHint}>
              Support stage: {revealState.stage === 'six_hours' ? '6 hour follow-up' : revealState.stage === 'one_hour' ? '1 hour follow-up' : 'Waiting window active'}
            </p>
            {revealState.reveal ? <p className={styles.codeValue}>{SUPPORT_PHONE}</p> : null}
          </section>
        ) : null}
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={saveZohoAck} disabled={saving}>
            {saving ? 'Saving...' : 'Confirm Zoho completion'}
          </button>
        </div>
      </section>
    ) : step === 11 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Your training library is now available</h2>
          <p className={styles.calloutText}>
            You have completed the guided onboarding checkpoints. The operator courses are now unlocked so you can begin structured training.
          </p>
        </section>
        <div className={styles.kpiGrid}>
          <section className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Pre-course milestones</p>
            <p className={styles.kpiValue}>{areCoursesUnlocked(progress) ? 'Unlocked' : 'Locked'}</p>
          </section>
          <section className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Training library</p>
            <p className={styles.kpiValue}>{courseProgress?.totalCourses || 0} operator tracks ready</p>
          </section>
        </div>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={openCourses} disabled={saving}>
            {saving ? 'Opening...' : 'Open operator courses'}
          </button>
        </div>
      </section>
    ) : (
      <>
        {infoCards[step]}
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={advance} disabled={saving || !canContinue}>
            {saving ? 'Saving...' : step === 5 ? 'I am comfortable, continue' : 'Continue'}
          </button>
        </div>
      </>
    );

  return (
    <OnboardingLayout
      title={`Step ${milestone.number}: ${milestone.label}`}
      subtitle={milestone.summary}
      progress={progress}
      courseProgress={courseProgress}
    >
      <div className={styles.kpiGrid}>
        <section className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Current checkpoint</p>
          <p className={styles.kpiValue}>{milestone.shortLabel}</p>
        </section>
        <section className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Upcoming</p>
          <p className={styles.kpiValue}>{getMilestone(step + 1)?.label || 'Training library'}</p>
        </section>
      </div>

      <section className={styles.trainingIntro}>
        <p>
          This step is guided on purpose: the operator should understand what they are doing, why the information is being collected, and what happens after the step is submitted.
        </p>
      </section>

      {message ? <p className={`${styles.message} ${messageTone}`}>{message}</p> : null}

      {loading ? <p className={styles.message}>Loading onboarding step...</p> : stepContent}

    </OnboardingLayout>
  );
}
