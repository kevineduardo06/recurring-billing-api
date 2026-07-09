import { createId } from '../../shared/id.js';
import type { Customer } from './customerTypes.js';

const customers = new Map<string, Customer>();

export const customerRepository = {
  create(input: Pick<Customer, 'name' | 'email'>): Customer {
    const customer: Customer = {
      id: createId('cus'),
      name: input.name,
      email: input.email,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    customers.set(customer.id, customer);
    return customer;
  },

  findById(id: string): Customer | undefined {
    return customers.get(id);
  },

  findByEmail(email: string): Customer | undefined {
    return [...customers.values()].find(customer => customer.email.toLowerCase() === email.toLowerCase());
  },

  list(): Customer[] {
    return [...customers.values()];
  },

  clear(): void {
    customers.clear();
  }
};
