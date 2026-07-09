import { createId } from '../../shared/id.js';
import type { PaymentAttempt, Refund } from './paymentTypes.js';

const attempts = new Map<string, PaymentAttempt>();
const refunds = new Map<string, Refund>();

export const paymentRepository = {
  createAttempt(input: Omit<PaymentAttempt, 'id'>): PaymentAttempt {
    const attempt: PaymentAttempt = {
      id: createId('pay'),
      ...input
    };

    attempts.set(attempt.id, attempt);
    return attempt;
  },

  findAttemptById(id: string): PaymentAttempt | undefined {
    return attempts.get(id);
  },

  findAttemptByExternalReference(externalReference: string): PaymentAttempt | undefined {
    return [...attempts.values()].find(attempt => attempt.externalReference === externalReference);
  },

  listAttempts(invoiceId?: string): PaymentAttempt[] {
    return [...attempts.values()].filter(attempt => !invoiceId || attempt.invoiceId === invoiceId);
  },

  createRefund(input: Omit<Refund, 'id'>): Refund {
    const refund: Refund = {
      id: createId('ref'),
      ...input
    };

    refunds.set(refund.id, refund);
    return refund;
  },

  listRefunds(invoiceId?: string): Refund[] {
    return [...refunds.values()].filter(refund => !invoiceId || refund.invoiceId === invoiceId);
  },

  clear(): void {
    attempts.clear();
    refunds.clear();
  }
};
