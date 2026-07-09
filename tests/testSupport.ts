import { customerRepository } from '../src/modules/customers/customerRepository.js';
import { dunningRepository } from '../src/modules/dunning/dunningRepository.js';
import { invoiceRepository } from '../src/modules/invoices/invoiceRepository.js';
import { paymentRepository } from '../src/modules/payments/paymentRepository.js';
import { planRepository } from '../src/modules/plans/planRepository.js';
import { subscriptionRepository } from '../src/modules/subscriptions/subscriptionRepository.js';
import { customerService } from '../src/modules/customers/customerService.js';
import { planService } from '../src/modules/plans/planService.js';
import { subscriptionService } from '../src/modules/subscriptions/subscriptionService.js';
import { invoiceService } from '../src/modules/invoices/invoiceService.js';
import { resetIdsForTests } from '../src/shared/id.js';

export const resetState = (): void => {
  customerRepository.clear();
  planRepository.clear();
  subscriptionRepository.clear();
  invoiceRepository.clear();
  paymentRepository.clear();
  dunningRepository.clear();
  resetIdsForTests();
};

export const createBillingFixture = () => {
  const customer = customerService.createCustomer({ name: 'Maria Customer', email: 'maria@example.com' });
  const plan = planService.createPlan({ code: 'STANDARD', name: 'Standard', priceCents: 12900, interval: 'monthly' });
  const subscription = subscriptionService.createSubscription({
    customerId: customer.id,
    planId: plan.id,
    startDate: '2026-07-01'
  });
  const invoice = invoiceService.generateInvoice({ subscriptionId: subscription.id, issuedAt: '2026-07-01' });

  return { customer, plan, subscription, invoice };
};
