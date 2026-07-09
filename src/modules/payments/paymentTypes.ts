export type PaymentAttemptStatus = 'succeeded' | 'failed';

export interface PaymentAttempt {
  id: string;
  invoiceId: string;
  customerId: string;
  amountCents: number;
  status: PaymentAttemptStatus;
  externalReference: string;
  attemptedAt: string;
  failureReason?: string;
}

export interface Refund {
  id: string;
  paymentAttemptId: string;
  invoiceId: string;
  amountCents: number;
  reason: string;
  refundedAt: string;
}
