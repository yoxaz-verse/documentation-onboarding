import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CourseSubModule } from '../config/courses';
import styles from './QuizModule.module.css';
import { LoadingButtonContent } from './LoadingState';

type Props = {
  subModule: CourseSubModule;
  initialAnswers?: Record<string, string>;
  onUpdated: (completedSubModuleId?: string) => Promise<void>;
  status?: 'passed' | 'in_progress' | 'locked';
};

function getMessageTone(message: string): 'neutral' | 'success' | 'error' {
  const normalized = message.toLowerCase();
  if (normalized.includes('failed') || normalized.includes('need') || normalized.includes('error')) return 'error';
  if (normalized.includes('passed') || normalized.includes('complete') || normalized.includes('saved')) return 'success';
  return 'neutral';
}

export default function QuizModule({ subModule, initialAnswers = {}, onUpdated, status }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnswers(initialAnswers || {});
    setMessage('');
  }, [subModule.id, initialAnswers]);

  const messageTone = useMemo(() => getMessageTone(message), [message]);

  const calloutLabel = (tone: 'key' | 'example' | 'warning') => {
    if (tone === 'example') return 'Example';
    if (tone === 'warning') return 'Important';
    return 'Key point';
  };

  const saveDraft = async () => {
    setSaving(true);
    setMessage('');

    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_draft',
        subModuleId: subModule.id,
        answers,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || 'Failed to save progress.');
      setSaving(false);
      return;
    }

    await onUpdated();
    setMessage('Progress saved. You can resume anytime.');
    setSaving(false);
  };

  const submitQuiz = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    const score = subModule.questions.reduce((acc, question) => {
      return acc + (answers[question.id] === question.correctAnswer ? 1 : 0);
    }, 0);

    const passed = score >= subModule.passScore;

    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_quiz', subModuleId: subModule.id, score, passed, answers }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error || 'Failed to submit quiz.');
      setSubmitting(false);
      return;
    }

    if (!passed) {
      setMessage(`Score ${score}/${subModule.questions.length}. You need ${subModule.passScore} to pass.`);
      setSubmitting(false);
      return;
    }

    await onUpdated(subModule.id);
    setMessage(`Passed with ${score}/${subModule.questions.length}. Sub-module completed.`);
    setSubmitting(false);
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.head}>
        <h2 className={styles.title}>{subModule.title}</h2>
        <p className={styles.description}>{subModule.description}</p>
      </header>

      {subModule.videoUrl ? (
        <div className={styles.videoWrap}>
          <iframe
            className={styles.video}
            src={subModule.videoUrl}
            title={subModule.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}

      {subModule.content?.length ? (
        <article className={styles.reading} aria-label={`${subModule.title} reading material`}>
          {subModule.content.map((block, index) => {
            if (block.type === 'callout') {
              return (
                <aside key={`${block.type}-${index}`} className={`${styles.callout} ${styles[`callout_${block.tone}`]}`}>
                  <p className={styles.calloutLabel}>{calloutLabel(block.tone)}</p>
                  <h3 className={styles.calloutTitle}>{block.title}</h3>
                  <p className={styles.calloutText}>{block.text}</p>
                </aside>
              );
            }

            return (
              <section key={`${block.type}-${index}`} className={styles.readingSection}>
                <h3 className={styles.readingTitle}>{block.heading}</h3>
                {block.paragraphs?.map((paragraph) => <p key={paragraph} className={styles.readingText}>{paragraph}</p>)}
                {block.bullets?.length ? (
                  <ul className={styles.readingList}>
                    {block.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </article>
      ) : null}

      <div className={styles.quizIntro}>
        <p className={styles.quizEyebrow}>Knowledge check</p>
        <h3 className={styles.quizTitle}>Complete the lesson quiz</h3>
        <p className={styles.quizHint}>Answer all three questions. You need {subModule.passScore} correct answers to pass.</p>
      </div>

      <form onSubmit={submitQuiz} className={styles.form}>
        {subModule.questions.map((question) => (
          <fieldset key={question.id} className={styles.question}>
            <legend className={styles.legend}>{question.question}</legend>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option;
              const isPassed = status === 'passed';
              const optionClass = `${styles.option} ${
                isPassed ? styles.optionDisabled : ''
              } ${isSelected && isPassed ? styles.optionPassedChecked : ''}`;

              return (
                <label key={option} className={optionClass}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={isSelected}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                    disabled={isPassed}
                    required
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </fieldset>
        ))}

        {status === 'passed' ? (
          <div className={styles.passedBanner}>
            <span className={styles.passedIcon}>✓</span>
            <div className={styles.passedText}>
              <h3 className={styles.passedTitle}>Lesson Completed</h3>
              <p className={styles.passedDesc}>You have successfully passed this lesson quiz.</p>
            </div>
          </div>
        ) : (
          <div className={styles.actionRow}>
            <button type="button" className={styles.secondary} disabled={saving || submitting} onClick={saveDraft}>
              {saving ? <LoadingButtonContent label="Saving…" /> : 'Save progress'}
            </button>
            <button type="submit" className={styles.submit} disabled={submitting || saving}>
              {submitting ? <LoadingButtonContent label="Submitting…" /> : 'Submit quiz'}
            </button>
          </div>
        )}
      </form>

      {message ? (
        <p
          className={`${styles.message} ${
            messageTone === 'success' ? styles.messageSuccess : messageTone === 'error' ? styles.messageError : ''
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
