export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: CustomerStatus;
  createdAt: string;
}
