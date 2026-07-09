import { badRequest, conflict } from '../../shared/errors.js';
import { customerRepository } from './customerRepository.js';
import type { Customer } from './customerTypes.js';

export const customerService = {
  createCustomer(input: { name: string; email: string }): Customer {
    if (!input.name.trim()) {
      throw badRequest('Customer name is required');
    }

    if (!input.email.includes('@')) {
      throw badRequest('A valid customer email is required');
    }

    if (customerRepository.findByEmail(input.email)) {
      throw conflict('Customer email already exists');
    }

    return customerRepository.create(input);
  },

  listCustomers(): Customer[] {
    return customerRepository.list();
  }
};
