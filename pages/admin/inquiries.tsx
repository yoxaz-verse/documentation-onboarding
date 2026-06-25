import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminGate from '../../components/AdminGate';
import ThemeToggle from '../../components/theme/ThemeToggle';
import type { InquiryProductLineItem, LiveInquiry } from '../../lib/types';
import styles from './admin.module.css';

type InquiryForm = {
  id: string | null;
  title: string;
  orderSummary: string;
  products: InquiryProductLineItem[];
  isPublished: boolean;
};

const EMPTY_PRODUCT: InquiryProductLineItem = {
  product: '',
  quantity: '',
  unit: '',
  specification: '',
};

function emptyForm(): InquiryForm {
  return {
    id: null,
    title: '',
    orderSummary: '',
    products: [{ ...EMPTY_PRODUCT }],
    isPublished: false,
  };
}

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function toForm(inquiry: LiveInquiry): InquiryForm {
  return {
    id: inquiry.id,
    title: inquiry.title,
    orderSummary: inquiry.orderSummary,
    products: inquiry.products.length ? inquiry.products : [{ ...EMPTY_PRODUCT }],
    isPublished: inquiry.isPublished,
  };
}

function InquiriesAdminContent() {
  const [inquiries, setInquiries] = useState<LiveInquiry[]>([]);
  const [form, setForm] = useState<InquiryForm>(() => emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const publishedCount = useMemo(() => inquiries.filter((inquiry) => inquiry.isPublished).length, [inquiries]);
  const totalProducts = useMemo(() => inquiries.reduce((sum, inquiry) => sum + inquiry.products.length, 0), [inquiries]);

  const loadInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/inquiries', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to load inquiries.');
      setInquiries((payload.inquiries || []) as LiveInquiry[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const updateProduct = (index: number, patch: Partial<InquiryProductLineItem>) => {
    setForm((current) => ({
      ...current,
      products: current.products.map((product, productIndex) => (productIndex === index ? { ...product, ...patch } : product)),
    }));
    setMessage('');
    setError('');
  };

  const addProduct = () => {
    setForm((current) => ({ ...current, products: [...current.products, { ...EMPTY_PRODUCT }] }));
  };

  const removeProduct = (index: number) => {
    setForm((current) => ({
      ...current,
      products: current.products.length > 1 ? current.products.filter((_, productIndex) => productIndex !== index) : [{ ...EMPTY_PRODUCT }],
    }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setMessage('');
    setError('');
  };

  const saveInquiry = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const endpoint = form.id ? `/api/admin/inquiries/${encodeURIComponent(form.id)}` : '/api/admin/inquiries';
      const response = await fetch(endpoint, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          orderSummary: form.orderSummary,
          products: form.products,
          isPublished: form.isPublished,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to save inquiry.');
      setMessage(form.id ? 'Inquiry updated.' : 'Inquiry created.');
      setForm(emptyForm());
      await loadInquiries();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const deleteInquiry = async (inquiry: LiveInquiry) => {
    if (!window.confirm(`Delete "${inquiry.title}"?`)) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiry.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete inquiry.');
      setMessage('Inquiry deleted.');
      if (form.id === inquiry.id) setForm(emptyForm());
      await loadInquiries();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete inquiry.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (inquiry: LiveInquiry) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(inquiry.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: inquiry.title,
          orderSummary: inquiry.orderSummary,
          products: inquiry.products,
          isPublished: !inquiry.isPublished,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Failed to update display status.');
      setMessage(!inquiry.isPublished ? 'Inquiry is now visible to operators.' : 'Inquiry hidden from operators.');
      await loadInquiries();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Failed to update display status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.bgOrbA} aria-hidden="true" />
      <div className={styles.bgOrbB} aria-hidden="true" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headingBlock}>
            <p className={styles.kicker}>Live Inquiries</p>
            <h1 className={styles.title}>Inquiry Order Board</h1>
            <p className={styles.subtitle}>Post generic order-style inquiries for operators without buyer, company, contact, or quality details.</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.linkButton} href="/admin">Dashboard</Link>
            <Link className={styles.linkButton} href="/inquiries">Operator View</Link>
            <ThemeToggle size="sm" variant="surface" />
          </div>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Total Inquiries</p>
            <p className={styles.cardValue}>{inquiries.length}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Displayed</p>
            <p className={styles.cardValue}>{publishedCount}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Drafts</p>
            <p className={styles.cardValue}>{Math.max(inquiries.length - publishedCount, 0)}</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardLabel}>Product Lines</p>
            <p className={styles.cardValue}>{totalProducts}</p>
          </article>
        </section>

        {error ? <article className={styles.card}>{error}</article> : null}
        {message ? <article className={styles.card}>{message}</article> : null}

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>{form.id ? 'Edit inquiry' : 'Post inquiry'}</h2>
            <label className={styles.journeyEditorToggle}>
              <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))} />
              Display to operators
            </label>
          </div>

          <div className={styles.inquiryFormGrid}>
            <label className={styles.adminInputGroup}>
              <span>Inquiry title</span>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Example: Bulk commodity inquiry" />
            </label>
            <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}>
              <span>Order summary</span>
              <textarea value={form.orderSummary} onChange={(event) => setForm((current) => ({ ...current, orderSummary: event.target.value }))} rows={4} placeholder="Simple summary of the order requirement" />
            </label>
          </div>

          <div className={styles.inquiryLineHeader}>
            <h3 className={styles.timelineTitle}>Product line items</h3>
            <button className={styles.linkButton} type="button" onClick={addProduct}>Add product</button>
          </div>

          <div className={styles.inquiryLineStack}>
            {form.products.map((product, index) => (
              <article key={index} className={styles.inquiryLineItem}>
                <label className={styles.adminInputGroup}>
                  <span>Product</span>
                  <input value={product.product} onChange={(event) => updateProduct(index, { product: event.target.value })} />
                </label>
                <label className={styles.adminInputGroup}>
                  <span>Quantity</span>
                  <input value={product.quantity} onChange={(event) => updateProduct(index, { quantity: event.target.value })} />
                </label>
                <label className={styles.adminInputGroup}>
                  <span>Unit</span>
                  <input value={product.unit} onChange={(event) => updateProduct(index, { unit: event.target.value })} placeholder="MT, kg, boxes" />
                </label>
                <label className={`${styles.adminInputGroup} ${styles.adminInputWide}`}>
                  <span>Specification / notes</span>
                  <textarea value={product.specification} onChange={(event) => updateProduct(index, { specification: event.target.value })} rows={2} />
                </label>
                <button className={styles.linkButton} type="button" onClick={() => removeProduct(index)}>Remove</button>
              </article>
            ))}
          </div>

          <div className={styles.formActions}>
            <button className={styles.actionButton} type="button" onClick={saveInquiry} disabled={saving}>{saving ? 'Saving...' : form.id ? 'Update inquiry' : 'Create inquiry'}</button>
            <button className={styles.linkButton} type="button" onClick={resetForm} disabled={saving}>Clear</button>
          </div>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.funnelTitle}>Existing inquiries</h2>
            <button className={styles.linkButton} type="button" onClick={loadInquiries}>Refresh</button>
          </div>

          <div className={styles.inquiryAdminList}>
            {loading ? <p className={styles.emptyState}>Loading inquiries...</p> : null}
            {!loading && inquiries.length === 0 ? <p className={styles.emptyState}>No inquiries have been posted yet.</p> : null}
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} className={styles.inquiryAdminCard}>
                <div>
                  <div className={styles.timelineHeader}>
                    <div>
                      <span className={inquiry.isPublished ? styles.badgeDone : styles.badgePending}>{inquiry.isPublished ? 'Displayed' : 'Draft'}</span>
                      <h3 className={styles.timelineTitle}>{inquiry.title}</h3>
                    </div>
                    <p className={styles.meta}>{formatDate(inquiry.updatedAt || inquiry.createdAt)}</p>
                  </div>
                  {inquiry.orderSummary ? <p className={styles.timelineSummary}>{inquiry.orderSummary}</p> : null}
                  <p className={styles.meta}>{inquiry.products.length} product line{inquiry.products.length === 1 ? '' : 's'}</p>
                </div>
                <div className={styles.actions}>
                  <button className={styles.linkButton} type="button" onClick={() => setForm(toForm(inquiry))}>Edit</button>
                  <button className={styles.linkButton} type="button" onClick={() => togglePublish(inquiry)} disabled={saving}>{inquiry.isPublished ? 'Hide' : 'Display'}</button>
                  <button className={styles.actionButton} type="button" onClick={() => deleteInquiry(inquiry)} disabled={saving}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminInquiriesPage() {
  return <AdminGate>{() => <InquiriesAdminContent />}</AdminGate>;
}
