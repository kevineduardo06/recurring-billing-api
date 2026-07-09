export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface InvoiceLine {
  description: string;
  amountCents: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  lines: InvoiceLine[];
  totalCents: number;
  paidCents: number;
  refundedCents: number;
}
