export type DunningActionType = 'email_sent' | 'subscription_marked_past_due' | 'subscription_cancelled';

export interface DunningAction {
  id: string;
  subscriptionId: string;
  invoiceId: string;
  type: DunningActionType;
  createdAt: string;
  note: string;
}
