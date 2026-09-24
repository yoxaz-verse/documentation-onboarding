import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import OnboardingLayout from './OnboardingLayout';
import LoadingState, { LoadingButtonContent } from './LoadingState';
import SupportContactList from './SupportContactList';
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
import type { CourseProgressSummary, ProgressRecord } from '../lib/types';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/LO1Hq98MF1X9lVc1PIlAwn?mode=gi_t';

function nextRouteAfter(step: MilestoneNumber) {
  const next = getMilestone(step + 1);
  return next?.route || '/courses';
}

export default function OnboardingStepScreen({ step }: { step: MilestoneNumber }) {
  const router = useRouter();
  const milestone = getMilestone(step);
  const [progress, setProgress] = useState<ProgressRecord | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [operatorPageOpened, setOperatorPageOpened] = useState(false);

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
  const [whatsappJoined, setWhatsappJoined] = useState(false);
  const [registrationChecked, setRegistrationChecked] = useState(false);
  const [communicationReady, setCommunicationReady] = useState(false);
  const [expectationsChecked, setExpectationsChecked] = useState({
    notSalaried: false,
    noGuarantees: false,
    agriSystem: false,
  });

  const canContinue = useMemo(() => {
    if (step === 2) {
      return operatorPageOpened;
    }
    if (step === 3) {
      return expectationsChecked.notSalaried && expectationsChecked.noGuarantees && expectationsChecked.agriSystem;
    }
    return true;
  }, [step, operatorPageOpened, expectationsChecked]);

  const load = async () => {
    const [bundle, currentProfile] = await Promise.all([getProgressBundle(), getProfile()]);
    setProgress(bundle.progress);
    setCourseProgress(bundle.courseProgress);
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
    if (!progress || loading) return;
    if (!canAccessStep(progress, step)) {
      const next = getNextMilestone(progress);
      router.replace(next?.route || '/courses');
    }
  }, [progress, loading, router, step]);

  if (!milestone) return null;

  const messageTone = message.toLowerCase().includes('failed') || message.toLowerCase().includes('required') || message.toLowerCase().includes('valid') || message.toLowerCase().includes('please')
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

  const confirmWhatsappJoin = async () => {
    if (!whatsappJoined) {
      setMessage('Please confirm that you joined the WhatsApp group.');
      return;
    }

    setSaving(true);
    try {
      await completeStep(step);
      await load();
      setMessage('WhatsApp group membership confirmed.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to confirm WhatsApp group membership.');
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

  const confirmCommunicationReadiness = async () => {
    if (!communicationReady) {
      setMessage('Please confirm that you joined the WhatsApp group and reviewed the guidelines.');
      return;
    }

    setSaving(true);
    try {
      await completeStep(step);
      await load();
      setMessage('Communication readiness confirmed.');
      router.push(nextRouteAfter(step));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        router.replace('/');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Failed to confirm communication readiness.');
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
          <p className={styles.calloutHint}>Required first: open and review the operator role page. Then return here to continue.</p>
          <div className={styles.actionRow}>
            <a href="https://www.obaol.com/roles/operator" className={styles.cta} target="_blank" rel="noreferrer" onClick={() => setOperatorPageOpened(true)}>
              1. Open operator role page
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
          <h2 className={styles.calloutTitle}>How to use the operator WhatsApp group</h2>
          <p className={styles.calloutText}>
            The group is the shared communication space for operator coordination, relevant questions, and important updates. Keep messages clear, professional, and focused on operator work.
          </p>
          <div className={styles.actionRow}>
            <a href={WHATSAPP_GROUP_URL} className={styles.cta} target="_blank" rel="noopener noreferrer">
              Open WhatsApp group
            </a>
          </div>
        </section>
        <ul className={styles.stepList}>
          <li>Use the group for relevant operator communication, coordination, and questions.</li>
          <li>Keep conversations respectful, concise, and useful to the group.</li>
          <li>Review important updates and avoid unrelated or promotional messages.</li>
          <li>After reviewing these guidelines, continue to the readiness check.</li>
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
        <div className={styles.experienceGrid}>
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
            {saving ? <LoadingButtonContent label="Saving…" /> : 'Save and continue'}
          </button>
        </div>
      </section>
    ) : step === 7 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Join the official operator WhatsApp group</h2>
          <p className={styles.calloutText}>
            Join the group to receive operator updates, coordinate with the team, and ask relevant questions during onboarding and execution.
          </p>
          <div className={styles.actionRow}>
            <a href={WHATSAPP_GROUP_URL} className={styles.cta} target="_blank" rel="noopener noreferrer">
              Join WhatsApp group
            </a>
          </div>
          <p className={styles.calloutHint}>The invitation opens in a new tab. Join the group, then return here to confirm.</p>
        </section>
        <label className={styles.message}>
          <input type="checkbox" checked={whatsappJoined} onChange={(event) => setWhatsappJoined(event.target.checked)} />
          {' '}I joined the official operator WhatsApp group.
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={confirmWhatsappJoin} disabled={saving}>
            {saving ? <LoadingButtonContent label="Saving…" /> : 'Confirm and continue'}
          </button>
        </div>
      </section>
    ) : step === 8 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Register on the operator platform next</h2>
          <p className={styles.calloutText}>
            Go to the operator registration page and create your OBAOL operator account. Complete the registration there, then return to this page to confirm and continue onboarding.
          </p>
          <div className={styles.actionRow}>
            <a href="https://www.obaol.com/auth/operator/register" className={styles.cta} target="_blank" rel="noreferrer">
              Open operator registration
            </a>
          </div>
          <p className={styles.calloutHint}>Complete the registration, then return here and confirm it before continuing.</p>
        </section>
        <label className={styles.message}>
          <input type="checkbox" checked={registrationChecked} onChange={(event) => setRegistrationChecked(event.target.checked)} />
          {' '}I completed my operator registration on obaol.com and came back to continue onboarding.
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={confirmOperatorRegistration} disabled={saving}>
            {saving ? <LoadingButtonContent label="Saving…" /> : 'Confirm registration and continue'}
          </button>
        </div>
      </section>
    ) : step === 10 ? (
      <section className={styles.formSection}>
        <section className={styles.callout}>
          <h2 className={styles.calloutTitle}>Confirm your communication readiness</h2>
          <p className={styles.calloutText}>
            Confirm that you joined the official operator WhatsApp group and reviewed how it should be used. This keeps team communication focused and useful for everyone.
          </p>
        </section>
        <SupportContactList
          title="Need onboarding or operator support?"
          description="Contact an available team member before confirming your communication readiness."
        />
        <label className={styles.message}>
          <input type="checkbox" checked={communicationReady} onChange={(event) => setCommunicationReady(event.target.checked)} />
          {' '}I joined the WhatsApp group and reviewed the communication guidelines.
        </label>
        <div className={styles.actionRow}>
          <button type="button" className={styles.primaryButton} onClick={confirmCommunicationReadiness} disabled={saving}>
            {saving ? <LoadingButtonContent label="Saving…" /> : 'Confirm readiness and continue'}
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
            {saving ? <LoadingButtonContent label="Opening…" /> : 'Open operator courses'}
          </button>
        </div>
      </section>
    ) : (
      <>
        {infoCards[step]}
        <div className={styles.actionRow}>
          <button type="button" className={step === 2 ? `${styles.primaryButton} ${styles.followUpButton}` : styles.primaryButton} onClick={advance} disabled={saving || !canContinue}>
            {saving ? <LoadingButtonContent label="Saving…" /> : step === 2 ? '2. I reviewed it, continue' : step === 5 ? 'I am comfortable, continue' : 'Continue'}
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
      loading={loading}
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

      {loading ? <LoadingState title={`Preparing Step ${milestone.number}`} message="Loading your saved progress and the next checkpoint…" preset="form" /> : stepContent}

    </OnboardingLayout>
  );
}
