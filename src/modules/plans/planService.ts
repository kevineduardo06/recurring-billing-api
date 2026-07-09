import { badRequest, conflict } from '../../shared/errors.js';
import { planRepository } from './planRepository.js';
import type { BillingInterval, Plan } from './planTypes.js';

export const planService = {
  createPlan(input: { code: string; name: string; priceCents: number; interval: BillingInterval }): Plan {
    if (!input.code.trim()) throw badRequest('Plan code is required');
    if (!input.name.trim()) throw badRequest('Plan name is required');
    if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) {
      throw badRequest('Plan price must be a positive integer in cents');
    }

    if (planRepository.findByCode(input.code)) {
      throw conflict('Plan code already exists');
    }

    return planRepository.create(input);
  },

  listPlans(): Plan[] {
    return planRepository.list();
  }
};
