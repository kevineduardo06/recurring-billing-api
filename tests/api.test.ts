import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { resetState } from './testSupport.js';

beforeEach(() => {
  resetState();
});

describe('Recurring Billing API', () => {
  it('creates a customer, plan, subscription, invoice, and payment through HTTP', async () => {
    const customerResponse = await request(app)
      .post('/customers')
      .send({ name: 'HTTP Customer', email: 'http@example.com' })
      .expect(201);

    const planResponse = await request(app)
      .post('/plans')
      .send({ code: 'PRO', name: 'Pro', priceCents: 19900, interval: 'monthly' })
      .expect(201);

    const subscriptionResponse = await request(app)
      .post('/subscriptions')
      .send({ customerId: customerResponse.body.id, planId: planResponse.body.id, startDate: '2026-08-01' })
      .expect(201);

    const invoiceResponse = await request(app)
      .post('/invoices/generate')
      .send({ subscriptionId: subscriptionResponse.body.id, issuedAt: '2026-08-01' })
      .expect(201);

    await request(app)
      .post('/payments/attempts')
      .send({
        invoiceId: invoiceResponse.body.id,
        amountCents: 19900,
        status: 'succeeded',
        externalReference: 'http-payment-001',
        attemptedAt: '2026-08-02T10:00:00.000Z'
      })
      .expect(201);

    const updatedInvoiceResponse = await request(app).get(`/invoices/${invoiceResponse.body.id}`).expect(200);
    expect(updatedInvoiceResponse.body.status).toBe('paid');
  });

  it('returns a monthly recognition report', async () => {
    const customerResponse = await request(app)
      .post('/customers')
      .send({ name: 'Report Customer', email: 'report@example.com' })
      .expect(201);

    const planResponse = await request(app)
      .post('/plans')
      .send({ code: 'REPORT', name: 'Report Plan', priceCents: 5000, interval: 'monthly' })
      .expect(201);

    const subscriptionResponse = await request(app)
      .post('/subscriptions')
      .send({ customerId: customerResponse.body.id, planId: planResponse.body.id, startDate: '2026-09-01' })
      .expect(201);

    const invoiceResponse = await request(app)
      .post('/invoices/generate')
      .send({ subscriptionId: subscriptionResponse.body.id, issuedAt: '2026-09-01' })
      .expect(201);

    await request(app)
      .post('/payments/attempts')
      .send({
        invoiceId: invoiceResponse.body.id,
        amountCents: 3000,
        status: 'succeeded',
        externalReference: 'report-payment-001',
        attemptedAt: '2026-09-02T10:00:00.000Z'
      })
      .expect(201);

    const reportResponse = await request(app).get('/reports/monthly-recognition?month=2026-09').expect(200);
    expect(reportResponse.body.totalInvoicedCents).toBe(5000);
    expect(reportResponse.body.totalPaidCents).toBe(3000);
    expect(reportResponse.body.outstandingCents).toBe(2000);
  });
});
