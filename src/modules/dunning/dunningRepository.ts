import { createId } from '../../shared/id.js';
import type { DunningAction } from './dunningTypes.js';

const actions = new Map<string, DunningAction>();

export const dunningRepository = {
  create(input: Omit<DunningAction, 'id'>): DunningAction {
    const action: DunningAction = {
      id: createId('dun'),
      ...input
    };

    actions.set(action.id, action);
    return action;
  },

  list(subscriptionId?: string): DunningAction[] {
    return [...actions.values()].filter(action => !subscriptionId || action.subscriptionId === subscriptionId);
  },

  clear(): void {
    actions.clear();
  }
};
