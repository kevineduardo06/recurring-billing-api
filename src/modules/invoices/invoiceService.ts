import { addMonths, parseBillingDate, toIsoDate } from '../../shared/date.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { planRepository } from '../plans/planRepository.js';
import { subscriptionRepository } from '../subscriptions/subscriptionRepository.js';
import { invoiceRepository } from './invoiceRepository.js';
import type { Invoice, InvoiceStatus } from './invoiceTypes.js';

export const invoiceService = {
  generateInvoice(input: { subscriptionId: string; issuedAt: string }): Invoice {
    const subscription = subscriptionRepository.findById(input.subscriptionId);
    if (!subscription) throw notFound('Subscription');
    if (subscription.status === 'cancelled') throw badRequest('Cancelled subscriptions cannot generate invoices');
    if (subscription.status === 'paused') throw badRequest('Paused subscriptions cannot generate invoices');

    const plan = planRepository.findById(subscription.planId);
    if (!plan) throw notFound('Plan');

    const issuedAt = parseBillingDate(input.issuedAt);
    const dueDate = addMonths(issuedAt, 0);
    dueDate.setUTCDate(dueDate.getUTCDate() + 10);

    return invoiceRepository.create({
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      status: 'open',
      issuedAt: toIsoDate(issuedAt),
      dueDate: toIsoDate(dueDate),
      lines: [{ description: `${plan.name} subscription`, amountCents: plan.priceCents }],
      totalCents: plan.priceCents,
      paidCents: 0,
      refundedCents: 0
    });
  },

  listInvoices(filter: { customerId?: string; subscriptionId?: string; status?: InvoiceStatus; month?: string }): Invoice[] {
    return invoiceRepository.list(filter);
  },

  getInvoice(id: string): Invoice {
    const invoice = invoiceRepository.findById(id);
    if (!invoice) throw notFound('Invoice');
    return invoice;
  }
};
