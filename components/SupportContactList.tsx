import { useEffect, useState } from 'react';
import { whatsappHref, type SupportContact } from '../lib/supportContacts';
import styles from './SupportContactList.module.css';

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export default function SupportContactList({
  title = 'Operator support contacts',
  description = 'Reach an available onboarding or operator support contact when you need help.',
}: Props) {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    fetch('/api/support-contacts', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || 'Failed to load support contacts.');
        if (active) {
          setContacts((payload.contacts || []) as SupportContact[]);
          setStatus('ready');
        }
      })
      .catch(() => active && setStatus('error'));
    return () => { active = false; };
  }, []);

  return (
    <section className={styles.section} aria-label={title}>
      <header className={styles.header}>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {status === 'loading' ? <p className={styles.state}>Loading available support contacts…</p> : null}
      {status === 'error' ? <p className={styles.state}>Support contacts are temporarily unavailable. Please use the official operator communication group.</p> : null}
      {status === 'ready' && !contacts.length ? <p className={styles.state}>No support person is currently available. Please use the official operator communication group and check again later.</p> : null}
      {status === 'ready' && contacts.length ? (
        <div className={styles.grid}>
          {contacts.map((contact) => (
            <article key={contact.id} className={styles.card}>
              <div className={styles.identity}>
                <h3>{contact.name}</h3>
                {contact.designation || contact.category ? <p className={styles.meta}>{[contact.designation, contact.category].filter(Boolean).join(' · ')}</p> : null}
              </div>
              {contact.note ? <p className={styles.note}>{contact.note}</p> : null}
              <a className={styles.phone} href={`tel:${contact.phone}`}>{contact.phone}</a>
              <div className={styles.actions}>
                <a className={`${styles.action} ${styles.actionPrimary}`} href={`tel:${contact.phone}`}>Call</a>
                <a className={styles.action} href={whatsappHref(contact.phone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
