import { addMonths, parseBillingDate, toIsoDate } from '../../shared/date.js';
import { badRequest, notFound } from '../../shared/errors.js';
import { customerRepository } from '../customers/customerRepository.js';
import { planRepository } from '../plans/planRepository.js';
import { subscriptionRepository } from './subscriptionRepository.js';
import type { Subscription, SubscriptionStatus } from './subscriptionTypes.js';

export const subscriptionService = {
  createSubscription(input: { customerId: string; planId: string; startDate: string; trialDays?: number }): Subscription {
    const customer = customerRepository.findById(input.customerId);
    if (!customer) throw notFound('Customer');
    if (customer.status !== 'active') throw badRequest('Customer must be active');

    const plan = planRepository.findById(input.planId);
    if (!plan) throw notFound('Plan');
    if (!plan.active) throw badRequest('Plan must be active');

    const start = parseBillingDate(input.startDate);
    const periodEnd = addMonths(start, plan.interval === 'yearly' ? 12 : 1);
    const status: SubscriptionStatus = input.trialDays && input.trialDays > 0 ? 'trialing' : 'active';

    return subscriptionRepository.create({
      customerId: customer.id,
      planId: plan.id,
      status,
      startedAt: toIsoDate(start),
      currentPeriodStart: toIsoDate(start),
      currentPeriodEnd: toIsoDate(periodEnd),
      cancelAtPeriodEnd: false
    });
  },

  listSubscriptions(filter: { customerId?: string; status?: SubscriptionStatus }): Subscription[] {
    return subscriptionRepository.list(filter);
  },

  markPastDue(subscriptionId: string, invoiceDate: string): Subscription {
    const subscription = subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw notFound('Subscription');
    if (subscription.status === 'cancelled') return subscription;

    return subscriptionRepository.update(subscriptionId, {
      status: 'past_due',
      pastDueSince: subscription.pastDueSince ?? invoiceDate
    });
  },

  pause(subscriptionId: string): Subscription {
    const subscription = subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw notFound('Subscription');
    if (subscription.status === 'cancelled') throw badRequest('Cancelled subscriptions cannot be paused');

    return subscriptionRepository.update(subscriptionId, { status: 'paused' });
  },

  resume(subscriptionId: string): Subscription {
    const subscription = subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw notFound('Subscription');
    if (subscription.status !== 'paused') throw badRequest('Only paused subscriptions can be resumed');

    return subscriptionRepository.update(subscriptionId, { status: 'active' });
  },

  cancel(subscriptionId: string, cancelledAt: string): Subscription {
    const subscription = subscriptionRepository.findById(subscriptionId);
    if (!subscription) throw notFound('Subscription');

    return subscriptionRepository.update(subscriptionId, {
      status: 'cancelled',
      cancelledAt,
      cancelAtPeriodEnd: false
    });
  }
};
