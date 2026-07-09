import { createId } from '../../shared/id.js';
import type { Subscription, SubscriptionStatus } from './subscriptionTypes.js';

const subscriptions = new Map<string, Subscription>();

interface SubscriptionFilter {
  customerId?: string;
  status?: SubscriptionStatus;
}

export const subscriptionRepository = {
  create(input: Omit<Subscription, 'id'>): Subscription {
    const subscription: Subscription = {
      id: createId('sub'),
      ...input
    };

    subscriptions.set(subscription.id, subscription);
    return subscription;
  },

  findById(id: string): Subscription | undefined {
    return subscriptions.get(id);
  },

  list(filter: SubscriptionFilter = {}): Subscription[] {
    return [...subscriptions.values()].filter(subscription => {
      if (filter.customerId && subscription.customerId !== filter.customerId) return false;
      if (filter.status && subscription.status !== filter.status) return false;
      return true;
    });
  },

  update(id: string, patch: Partial<Subscription>): Subscription {
    const current = subscriptions.get(id);

    if (!current) {
      throw new Error('Subscription not found');
    }

    const updated = { ...current, ...patch };
    subscriptions.set(id, updated);
    return updated;
  },

  clear(): void {
    subscriptions.clear();
  }
};
