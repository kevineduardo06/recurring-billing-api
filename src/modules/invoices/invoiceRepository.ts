import { createId } from '../../shared/id.js';
import type { Invoice, InvoiceStatus } from './invoiceTypes.js';

const invoices = new Map<string, Invoice>();

interface InvoiceFilter {
  customerId?: string;
  subscriptionId?: string;
  status?: InvoiceStatus;
  month?: string;
}

export const invoiceRepository = {
  create(input: Omit<Invoice, 'id'>): Invoice {
    const invoice: Invoice = {
      id: createId('inv'),
      ...input
    };

    invoices.set(invoice.id, invoice);
    return invoice;
  },

  findById(id: string): Invoice | undefined {
    return invoices.get(id);
  },

  list(filter: InvoiceFilter = {}): Invoice[] {
    return [...invoices.values()].filter(invoice => {
      if (filter.customerId && invoice.customerId !== filter.customerId) return false;
      if (filter.subscriptionId && invoice.subscriptionId !== filter.subscriptionId) return false;
      if (filter.status && invoice.status !== filter.status) return false;
      if (filter.month && !invoice.issuedAt.startsWith(filter.month)) return false;
      return true;
    });
  },

  update(id: string, patch: Partial<Invoice>): Invoice {
    const current = invoices.get(id);

    if (!current) {
      throw new Error('Invoice not found');
    }

    const updated = { ...current, ...patch };
    invoices.set(id, updated);
    return updated;
  },

  clear(): void {
    invoices.clear();
  }
};
