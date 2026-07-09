import type { InvoiceStatus } from './invoiceTypes.js';

export const calculateInvoiceStatus = (totalCents: number, paidCents: number): InvoiceStatus => {
  if (paidCents >= totalCents) {
    return 'paid';
  }

  return 'open';
};
