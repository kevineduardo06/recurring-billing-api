export type BillingInterval = 'monthly' | 'yearly';

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  interval: BillingInterval;
  active: boolean;
}
