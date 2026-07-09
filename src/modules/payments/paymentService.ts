import { badRequest, conflict, notFound } from '../../shared/errors.js';
import { dunningRepository } from '../dunning/dunningRepository.js';
import { invoiceRepository } from '../invoices/invoiceRepository.js';
import { calculateInvoiceStatus } from '../invoices/invoiceStatus.js';
import { subscriptionService } from '../subscriptions/subscriptionService.js';
import { paymentRepository } from './paymentRepository.js';
import type { PaymentAttempt, Refund } from './paymentTypes.js';

export const paymentService = {
  recordAttempt(input: {
    invoiceId: string;
    amountCents: number;
    status: 'succeeded' | 'failed';
    externalReference: string;
    attemptedAt: string;
    failureReason?: string;
  }): PaymentAttempt {
    const invoice = invoiceRepository.findById(input.invoiceId);
    if (!invoice) throw notFound('Invoice');
    if (invoice.status === 'void' || invoice.status === 'uncollectible') {
      throw badRequest('Cannot record payments for closed invoices');
    }

    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw badRequest('Payment amount must be a positive integer in cents');
    }

    const existing = paymentRepository.findAttemptByExternalReference(input.externalReference);
    if (existing) {
      if (existing.invoiceId !== invoice.id || existing.amountCents !== input.amountCents || existing.status !== input.status) {
        throw conflict('External reference already used with different payment data');
      }

      return existing;
    }

    const attempt = paymentRepository.createAttempt({
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      amountCents: input.amountCents,
      status: input.status,
      externalReference: input.externalReference,
      attemptedAt: input.attemptedAt,
      failureReason: input.failureReason
    });

    if (attempt.status === 'succeeded') {
      const paidCents = invoice.paidCents + attempt.amountCents;
      invoiceRepository.update(invoice.id, {
        paidCents,
        status: calculateInvoiceStatus(invoice.totalCents, paidCents)
      });
    } else {
      subscriptionService.markPastDue(invoice.subscriptionId, input.attemptedAt.slice(0, 10));
      dunningRepository.create({
        subscriptionId: invoice.subscriptionId,
        invoiceId: invoice.id,
        type: 'email_sent',
        createdAt: input.attemptedAt,
        note: input.failureReason ?? 'Payment attempt failed'
      });
    }

    return attempt;
  },

  refund(input: { paymentAttemptId: string; amountCents: number; reason: string; refundedAt: string }): Refund {
    const attempt = paymentRepository.findAttemptById(input.paymentAttemptId);
    if (!attempt) throw notFound('Payment attempt');
    if (attempt.status !== 'succeeded') throw badRequest('Only succeeded payments can be refunded');
    if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
      throw badRequest('Refund amount must be a positive integer in cents');
    }

    const previousRefunds = paymentRepository.listRefunds(attempt.invoiceId);
    const alreadyRefundedForAttempt = previousRefunds
      .filter(refund => refund.paymentAttemptId === attempt.id)
      .reduce((sum, refund) => sum + refund.amountCents, 0);

    if (alreadyRefundedForAttempt + input.amountCents > attempt.amountCents) {
      throw badRequest('Refund cannot exceed captured payment amount');
    }

    const invoice = invoiceRepository.findById(attempt.invoiceId);
    if (!invoice) throw notFound('Invoice');

    const refund = paymentRepository.createRefund({
      paymentAttemptId: attempt.id,
      invoiceId: attempt.invoiceId,
      amountCents: input.amountCents,
      reason: input.reason,
      refundedAt: input.refundedAt
    });

    const refundedCents = invoice.refundedCents + input.amountCents;
    const netPaidCents = Math.max(0, invoice.paidCents - input.amountCents);

    invoiceRepository.update(invoice.id, {
      refundedCents,
      paidCents: netPaidCents,
      status: calculateInvoiceStatus(invoice.totalCents, netPaidCents)
    });

    return refund;
  },

  listAttempts(invoiceId?: string): PaymentAttempt[] {
    return paymentRepository.listAttempts(invoiceId);
  },

  listRefunds(invoiceId?: string): Refund[] {
    return paymentRepository.listRefunds(invoiceId);
  }
};
