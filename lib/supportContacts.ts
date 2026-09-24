export type SupportContactRecord = {
  id: string;
  name: string;
  phone: string;
  designation: string | null;
  category: string | null;
  note: string | null;
  display_order: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportContact = {
  id: string;
  name: string;
  phone: string;
  designation?: string;
  category?: string;
  note?: string;
  displayOrder: number;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function normalizePhone(value: unknown) {
  const raw = String(value || '').trim();
  const compact = raw.replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
    throw new Error('Phone number must use international format, for example +919876543210.');
  }
  return compact;
}

export function normalizeSupportContact(row: SupportContactRecord, includeAdminFields = false): SupportContact {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    designation: row.designation || undefined,
    category: row.category || undefined,
    note: row.note || undefined,
    displayOrder: row.display_order,
    ...(includeAdminFields ? {
      isAvailable: row.is_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } : {}),
  };
}

export function normalizeSupportContactInput(value: unknown) {
  const input = (value || {}) as Record<string, unknown>;
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Contact name is required.');
  if (name.length > 120) throw new Error('Contact name must be 120 characters or fewer.');

  const optional = (field: string, max: number) => {
    const result = String(input[field] || '').trim();
    if (result.length > max) throw new Error(`${field} must be ${max} characters or fewer.`);
    return result || null;
  };

  const displayOrder = Number(input.displayOrder ?? input.display_order ?? 0);
  if (!Number.isInteger(displayOrder) || displayOrder < 0) throw new Error('Display order must be a non-negative whole number.');

  return {
    name,
    phone: normalizePhone(input.phone),
    designation: optional('designation', 120),
    category: optional('category', 80),
    note: optional('note', 300),
    display_order: displayOrder,
    is_available: (input.isAvailable ?? input.is_available ?? true) !== false,
  };
}

export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}
