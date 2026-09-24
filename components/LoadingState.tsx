import { useEffect, useState } from 'react';
import styles from './LoadingState.module.css';

export type LoadingVariant = 'page' | 'content' | 'table' | 'inline';
export type LoadingPreset = 'cards' | 'form' | 'list' | 'metrics' | 'table';
export type SpinnerSize = 'small' | 'medium' | 'large';

const DEFAULT_TIPS = [
  'A complete operator profile helps every handoff move faster.',
  'Finish each checkpoint in order to unlock the next workspace tools.',
  'Short, accurate updates build trust across every trade.',
  'Review quantities, units, and timelines before confirming an inquiry.',
];

export function Spinner({ size = 'medium', className = '' }: { size?: SpinnerSize; className?: string }) {
  return <span className={`${styles.spinner} ${styles[`spinner${size[0].toUpperCase()}${size.slice(1)}`]} ${className}`} aria-hidden="true" />;
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`${styles.skeleton} ${className}`} aria-hidden="true" />;
}

export function LoadingButtonContent({ label }: { label: string }) {
  return (
    <span className={styles.buttonContent} role="status" aria-live="polite">
      <Spinner size="small" />
      <span>{label}</span>
    </span>
  );
}

function SkeletonContent({ preset }: { preset: LoadingPreset }) {
  if (preset === 'table') {
    return (
      <div className={styles.tableSkeleton} aria-hidden="true">
        <div className={styles.tableHeader}>{Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} />)}</div>
        {Array.from({ length: 5 }, (_, row) => (
          <div className={styles.tableRow} key={row}>{Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} />)}</div>
        ))}
      </div>
    );
  }

  if (preset === 'form') {
    return (
      <div className={styles.formSkeleton} aria-hidden="true">
        <SkeletonBlock className={styles.titleLine} />
        <SkeletonBlock className={styles.textLine} />
        <div className={styles.formGrid}>{Array.from({ length: 6 }, (_, index) => <SkeletonBlock className={styles.inputBlock} key={index} />)}</div>
        <SkeletonBlock className={styles.buttonBlock} />
      </div>
    );
  }

  const count = preset === 'list' ? 5 : preset === 'metrics' ? 4 : 3;
  return (
    <div className={`${styles.cardGrid} ${styles[`cardGrid${preset[0].toUpperCase()}${preset.slice(1)}`]}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <SkeletonBlock className={styles.shortLine} />
          <SkeletonBlock className={styles.valueLine} />
          <SkeletonBlock className={styles.textLine} />
          {preset !== 'metrics' ? <SkeletonBlock className={styles.textLineShort} /> : null}
        </div>
      ))}
    </div>
  );
}

type LoadingStateProps = {
  title?: string;
  message: string;
  label?: string;
  variant?: Exclude<LoadingVariant, 'inline'>;
  preset?: LoadingPreset;
  tips?: string[];
  showTips?: boolean;
  className?: string;
};

export default function LoadingState({
  title = 'Preparing your workspace',
  message,
  label,
  variant = 'content',
  preset = 'cards',
  tips = DEFAULT_TIPS,
  showTips = true,
  className = '',
}: LoadingStateProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!showTips || tips.length < 2 || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setTipIndex((current) => (current + 1) % tips.length), 4000);
    return () => window.clearInterval(timer);
  }, [showTips, tips]);

  return (
    <div className={`${styles.loadingState} ${styles[variant]} ${className}`} role="status" aria-live="polite" aria-busy="true" aria-label={label || message}>
      {variant === 'page' ? <><div className={styles.glowA} aria-hidden="true" /><div className={styles.glowB} aria-hidden="true" /></> : null}
      <div className={styles.inner}>
        <div className={styles.statusPanel}>
          <Spinner size={variant === 'page' ? 'large' : 'medium'} />
          <div className={styles.statusCopy}>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.message}>{message}</p>
          </div>
        </div>
        {showTips && tips.length ? (
          <p className={styles.tip} aria-atomic="true"><span>Operator tip</span>{tips[tipIndex % tips.length]}</p>
        ) : null}
        {variant !== 'page' ? <SkeletonContent preset={variant === 'table' ? 'table' : preset} /> : null}
      </div>
    </div>
  );
}
