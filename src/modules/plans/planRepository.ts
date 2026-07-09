import { createId } from '../../shared/id.js';
import type { Plan } from './planTypes.js';

const plans = new Map<string, Plan>();

export const planRepository = {
  create(input: Omit<Plan, 'id' | 'active'> & { active?: boolean }): Plan {
    const plan: Plan = {
      id: createId('plan'),
      code: input.code,
      name: input.name,
      priceCents: input.priceCents,
      interval: input.interval,
      active: input.active ?? true
    };

    plans.set(plan.id, plan);
    return plan;
  },

  findById(id: string): Plan | undefined {
    return plans.get(id);
  },

  findByCode(code: string): Plan | undefined {
    return [...plans.values()].find(plan => plan.code === code);
  },

  list(): Plan[] {
    return [...plans.values()];
  },

  clear(): void {
    plans.clear();
  }
};
