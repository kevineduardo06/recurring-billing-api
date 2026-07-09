import { badRequest } from '../../shared/errors.js';
import { invoiceRepository } from '../invoices/invoiceRepository.js';
import { paymentRepository } from '../payments/paymentRepository.js';

export interface MonthlyRecognitionReport {
  month: string;
  invoiceCount: number;
  totalInvoicedCents: number;
  totalPaidCents: number;
  totalRefundedCents: number;
  netRecognizedCents: number;
  outstandingCents: number;
}

export const reportService = {
  monthlyRecognition(month: string): MonthlyRecognitionReport {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw badRequest('month must be in YYYY-MM format');
    }

    const invoices = invoiceRepository.list({ month });
    const invoiceIds = new Set(invoices.map(invoice => invoice.id));
    const attempts = paymentRepository
      .listAttempts()
      .filter(attempt => invoiceIds.has(attempt.invoiceId) && attempt.status === 'succeeded');
    const refunds = paymentRepository.listRefunds().filter(refund => invoiceIds.has(refund.invoiceId));

    const totalInvoicedCents = invoices.reduce((sum, invoice) => sum + invoice.totalCents, 0);
    const totalPaidCents = attempts.reduce((sum, attempt) => sum + attempt.amountCents, 0);
    const totalRefundedCents = refunds.reduce((sum, refund) => sum + refund.amountCents, 0);
    const netRecognizedCents = totalPaidCents - totalRefundedCents;

    return {
      month,
      invoiceCount: invoices.length,
      totalInvoicedCents,
      totalPaidCents,
      totalRefundedCents,
      netRecognizedCents,
      outstandingCents: Math.max(0, totalInvoicedCents - netRecognizedCents)
    };
  }
};
