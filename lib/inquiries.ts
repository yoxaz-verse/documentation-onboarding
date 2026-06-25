export type InquiryProductLineItem = {
  product: string;
  quantity: string;
  unit: string;
  specification: string;
};

export type LiveInquiryRecord = {
  id: string;
  title: string;
  order_summary: string | null;
  products: unknown;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LiveInquiry = {
  id: string;
  title: string;
  orderSummary: string;
  products: InquiryProductLineItem[];
  isPublished: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PublicLiveInquiry = Omit<LiveInquiry, 'isPublished'>;

export type LiveInquiryInput = {
  title: string;
  orderSummary: string;
  products: InquiryProductLineItem[];
  isPublished: boolean;
};

function cleanText(value: unknown) {
  return String(value ?? '').trim();
}

export function normalizeInquiryProducts(value: unknown): InquiryProductLineItem[] {
  if (!Array.isArray(value)) {
    throw new Error('Products must be an array.');
  }

  const products = value.map((item) => {
    const row = (item || {}) as Partial<InquiryProductLineItem>;
    return {
      product: cleanText(row.product),
      quantity: cleanText(row.quantity),
      unit: cleanText(row.unit),
      specification: cleanText(row.specification),
    };
  });

  const usableProducts = products.filter((item) => item.product || item.quantity || item.unit || item.specification);
  if (!usableProducts.length) throw new Error('At least one product line item is required.');

  usableProducts.forEach((item, index) => {
    if (!item.product) throw new Error(`Product line ${index + 1} needs a product name.`);
    if (!item.quantity) throw new Error(`Product line ${index + 1} needs a quantity.`);
  });

  return usableProducts;
}

export function normalizeInquiryInput(value: unknown): LiveInquiryInput {
  const input = (value || {}) as Partial<LiveInquiryInput>;
  const title = cleanText(input.title);
  if (!title) throw new Error('Title is required.');

  return {
    title,
    orderSummary: cleanText(input.orderSummary),
    products: normalizeInquiryProducts(input.products),
    isPublished: input.isPublished === true,
  };
}

export function normalizeLiveInquiry(row: LiveInquiryRecord): LiveInquiry {
  return {
    id: row.id,
    title: row.title,
    orderSummary: row.order_summary || '',
    products: Array.isArray(row.products) ? row.products.map((item) => {
      const product = item as Partial<InquiryProductLineItem>;
      return {
        product: cleanText(product.product),
        quantity: cleanText(product.quantity),
        unit: cleanText(product.unit),
        specification: cleanText(product.specification),
      };
    }) : [],
    isPublished: row.is_published === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizePublicLiveInquiry(row: LiveInquiryRecord): PublicLiveInquiry {
  const inquiry = normalizeLiveInquiry(row);
  return {
    id: inquiry.id,
    title: inquiry.title,
    orderSummary: inquiry.orderSummary,
    products: inquiry.products,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
  };
}

export function toInquiryRow(input: LiveInquiryInput) {
  return {
    title: input.title,
    order_summary: input.orderSummary,
    products: input.products,
    is_published: input.isPublished,
  };
}
