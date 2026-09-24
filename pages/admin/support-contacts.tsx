import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import { LoadingButtonContent } from '../../components/LoadingState';
import ThemeToggle from '../../components/theme/ThemeToggle';
import type { SupportContact } from '../../lib/supportContacts';
import styles from './admin.module.css';

type FormState = {
  id: string | null;
  name: string;
  phone: string;
  designation: string;
  category: string;
  note: string;
  displayOrder: string;
  isAvailable: boolean;
};

const emptyForm = (): FormState => ({ id: null, name: '', phone: '', designation: '', category: '', note: '', displayOrder: '0', isAvailable: true });

function SupportContactsAdminContent() {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const availableCount = useMemo(() => contacts.filter((contact) => contact.isAvailable).length, [contacts]);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/support-contacts', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load support contacts.');
      setContacts((payload.contacts || []) as SupportContact[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load support contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const edit = (contact: SupportContact) => setForm({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    designation: contact.designation || '',
    category: contact.category || '',
    note: contact.note || '',
    displayOrder: String(contact.displayOrder),
    isAvailable: contact.isAvailable !== false,
  });

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const endpoint = form.id ? `/api/admin/support-contacts/${encodeURIComponent(form.id)}` : '/api/admin/support-contacts';
      const response = await fetch(endpoint, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to save support contact.');
      setMessage(form.id ? 'Support contact updated.' : 'Support contact added.');
      setForm(emptyForm());
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save support contact.');
    } finally { setSaving(false); }
  };

  const toggle = async (contact: SupportContact) => {
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/support-contacts/${encodeURIComponent(contact.id)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...contact, isAvailable: !contact.isAvailable }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update availability.');
      setMessage(contact.isAvailable ? 'Contact hidden from operators.' : 'Contact is now available to operators.');
      await load();
    } catch (toggleError) { setError(toggleError instanceof Error ? toggleError.message : 'Failed to update availability.'); }
    finally { setSaving(false); }
  };

  const remove = async (contact: SupportContact) => {
    if (!window.confirm(`Permanently delete ${contact.name}? Disable the contact instead if this is temporary.`)) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/support-contacts/${encodeURIComponent(contact.id)}`, { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to delete support contact.');
      }
      if (form.id === contact.id) setForm(emptyForm());
      setMessage('Support contact deleted.');
      await load();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete support contact.'); }
    finally { setSaving(false); }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <p className={styles.kicker}>Communication Directory</p>
            <h1 className={styles.title}>Support Contacts</h1>
            <p className={styles.subtitle}>Manage the onboarding and operator support people visible across the operator workspace.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin">Dashboard</Link>
            <Link className={styles.linkButton} href="/support">Operator View</Link>
            <ThemeToggle size="sm" variant="surface" />
          </div>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}><p className={styles.cardLabel}>Total Contacts</p><p className={styles.cardValue}>{contacts.length}</p></article>
          <article className={styles.card}><p className={styles.cardLabel}>Available</p><p className={styles.cardValue}>{availableCount}</p></article>
          <article className={styles.card}><p className={styles.cardLabel}>Unavailable</p><p className={styles.cardValue}>{contacts.length - availableCount}</p></article>
        </section>
        {error ? <article className={styles.card}>{error}</article> : null}
        {message ? <article className={styles.card}>{message}</article> : null}

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>{form.id ? 'Edit support contact' : 'Add support contact'}</h2>
            <label className={styles.journeyEditorToggle}><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} /> Available to operators</label>
          </div>
          <div className={styles.inquiryFormGrid}>
            <label className={styles.adminInputGroup}><span>Name *</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label className={styles.adminInputGroup}><span>Phone *</span><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+919876543210" /></label>
            <label className={styles.adminInputGroup}><span>Designation</span><input value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} placeholder="Operator Onboarding" /></label>
            <label className={styles.adminInputGroup}><span>Category</span><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Onboarding or Operator Support" /></label>
            <label className={styles.adminInputGroup}><span>Display order</span><input type="number" min="0" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></label>
            <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}><span>Operator-facing note</span><textarea rows={3} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
          </div>
          <div className={styles.formActions}>
            <button className={styles.actionButton} type="button" disabled={saving} onClick={save}>{saving ? <LoadingButtonContent label="Saving…" /> : form.id ? 'Update contact' : 'Add contact'}</button>
            <button className={styles.linkButton} type="button" disabled={saving} onClick={() => setForm(emptyForm())}>Clear</button>
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}><h2 className={styles.funnelTitle}>Directory</h2><p className={styles.sectionMeta}>{loading ? 'Loading…' : `${contacts.length} contacts`}</p></div>
          {!loading && !contacts.length ? <p className={styles.emptyState}>No support contacts have been added.</p> : null}
          {contacts.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Order</th><th>Contact</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {contacts.map((contact) => <tr key={contact.id}>
              <td>{contact.displayOrder}</td>
              <td><strong>{contact.name}</strong><br /><span>{[contact.designation, contact.category].filter(Boolean).join(' · ') || 'General support'}</span></td>
              <td>{contact.phone}</td>
              <td>{contact.isAvailable ? 'Available' : 'Unavailable'}</td>
              <td><div className={styles.actions}><button className={styles.linkButton} type="button" onClick={() => edit(contact)}>Edit</button><button className={styles.linkButton} type="button" onClick={() => toggle(contact)}>{contact.isAvailable ? 'Disable' : 'Enable'}</button><button className={styles.linkButton} type="button" onClick={() => remove(contact)}>Delete</button></div></td>
            </tr>)}
          </tbody></table></div> : null}
        </section>
      </div>
    </main>
  );
}

export default function SupportContactsAdminPage() {
  return <AdminGate>{() => <SupportContactsAdminContent />}</AdminGate>;
}
