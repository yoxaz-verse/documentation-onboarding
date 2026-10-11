import useSWR from 'swr';
import { apiFetcher } from '../lib/clientData';
import { whatsappHref, type SupportContact } from '../lib/supportContacts';
import styles from './SupportContactList.module.css';

type Props = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function useSupportContacts() {
  return useSWR<{ contacts: SupportContact[] }>('/api/support-contacts', apiFetcher, {
    dedupingInterval: 30_000,
    revalidateOnFocus: false,
  });
}

export default function SupportContactList({
  title = 'Operator support contacts',
  description = 'Reach an available Getting Started or operator support contact when you need help.',
}: Props) {
  const { data, error, isLoading } = useSupportContacts();
  const contacts = data?.contacts || [];
  const status = isLoading ? 'loading' : error ? 'error' : 'ready';

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
