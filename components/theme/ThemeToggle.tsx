import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import styles from './ThemeToggle.module.css';

type Props = {
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'surface';
};

export default function ThemeToggle({ size = 'md', variant = 'ghost' }: Props) {
  const { resolvedTheme, theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveTheme = theme === 'system' ? resolvedTheme : theme;
  const isDark = mounted && effectiveTheme === 'dark';

  const label = useMemo(() => {
    if (!mounted) return 'Toggle theme';
    return isDark ? 'Switch to light theme' : 'Switch to dark theme';
  }, [isDark, mounted]);

  const onClick = () => {
    if (!mounted) return;
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      className={`${styles.toggle} ${styles[size]} ${variant === 'surface' ? styles.surface : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? '☀' : '☾'}
      </span>
      <span className={styles.label}>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
