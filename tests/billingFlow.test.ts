import { beforeEach, describe, expect, it } from 'vitest';
import { invoiceService } from '../src/modules/invoices/invoiceService.js';
import { paymentService } from '../src/modules/payments/paymentService.js';
import { subscriptionRepository } from '../src/modules/subscriptions/subscriptionRepository.js';
import { createBillingFixture, resetState } from './testSupport.js';

beforeEach(() => {
  resetState();
});

describe('billing flow', () => {
  it('marks an invoice as paid after a full successful payment', () => {
    const { invoice } = createBillingFixture();

    paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
      status: 'succeeded',
      externalReference: 'gateway-001',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    const updatedInvoice = invoiceService.getInvoice(invoice.id);
    expect(updatedInvoice.status).toBe('paid');
    expect(updatedInvoice.paidCents).toBe(invoice.totalCents);
  });

  it('keeps an invoice open after a partial successful payment', () => {
    const { invoice } = createBillingFixture();

    paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: 5000,
      status: 'succeeded',
      externalReference: 'gateway-002',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    const updatedInvoice = invoiceService.getInvoice(invoice.id);
    expect(updatedInvoice.status).toBe('open');
    expect(updatedInvoice.paidCents).toBe(5000);
  });

  it('returns an existing attempt for an idempotent retry with the same data', () => {
    const { invoice } = createBillingFixture();
    const firstAttempt = paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: 5000,
      status: 'succeeded',
      externalReference: 'gateway-003',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    const secondAttempt = paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: 5000,
      status: 'succeeded',
      externalReference: 'gateway-003',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    expect(secondAttempt.id).toBe(firstAttempt.id);
  });

  it('rejects duplicate external references with different payment data', () => {
    const { invoice } = createBillingFixture();
    paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: 5000,
      status: 'succeeded',
      externalReference: 'gateway-004',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    expect(() =>
      paymentService.recordAttempt({
        invoiceId: invoice.id,
        amountCents: 6000,
        status: 'succeeded',
        externalReference: 'gateway-004',
        attemptedAt: '2026-07-02T10:00:00.000Z'
      })
    ).toThrow('External reference already used with different payment data');
  });

  it('moves a subscription to past due after a failed payment', () => {
    const { invoice, subscription } = createBillingFixture();

    paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
      status: 'failed',
      externalReference: 'gateway-005',
      attemptedAt: '2026-07-02T10:00:00.000Z',
      failureReason: 'insufficient_funds'
    });

    const updatedSubscription = subscriptionRepository.findById(subscription.id);
    expect(updatedSubscription?.status).toBe('past_due');
    expect(updatedSubscription?.pastDueSince).toBe('2026-07-02');
  });

  it('reopens a paid invoice when a full payment is refunded', () => {
    const { invoice } = createBillingFixture();
    const payment = paymentService.recordAttempt({
      invoiceId: invoice.id,
      amountCents: invoice.totalCents,
      status: 'succeeded',
      externalReference: 'gateway-006',
      attemptedAt: '2026-07-02T10:00:00.000Z'
    });

    paymentService.refund({
      paymentAttemptId: payment.id,
      amountCents: invoice.totalCents,
      reason: 'customer_request',
      refundedAt: '2026-07-03T10:00:00.000Z'
    });

    const updatedInvoice = invoiceService.getInvoice(invoice.id);
    expect(updatedInvoice.status).toBe('open');
    expect(updatedInvoice.paidCents).toBe(0);
    expect(updatedInvoice.refundedCents).toBe(invoice.totalCents);
  });
});
