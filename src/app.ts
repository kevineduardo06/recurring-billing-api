import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { HttpError } from './shared/errors.js';
import { customerService } from './modules/customers/customerService.js';
import { planService } from './modules/plans/planService.js';
import { subscriptionService } from './modules/subscriptions/subscriptionService.js';
import { invoiceService } from './modules/invoices/invoiceService.js';
import { paymentService } from './modules/payments/paymentService.js';
import { reportService } from './modules/reports/reportService.js';
import { dunningRepository } from './modules/dunning/dunningRepository.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

app.post('/customers', (req, res) => {
  const input = customerSchema.parse(req.body);
  res.status(201).json(customerService.createCustomer(input));
});

app.get('/customers', (_req, res) => {
  res.json(customerService.listCustomers());
});

const planSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  priceCents: z.number().int().positive(),
  interval: z.enum(['monthly', 'yearly'])
});

app.post('/plans', (req, res) => {
  const input = planSchema.parse(req.body);
  res.status(201).json(planService.createPlan(input));
});

app.get('/plans', (_req, res) => {
  res.json(planService.listPlans());
});

const subscriptionSchema = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1),
  startDate: z.string().min(10),
  trialDays: z.number().int().nonnegative().optional()
});

app.post('/subscriptions', (req, res) => {
  const input = subscriptionSchema.parse(req.body);
  res.status(201).json(subscriptionService.createSubscription(input));
});

app.get('/subscriptions', (req, res) => {
  const query = z
    .object({
      customerId: z.string().optional(),
      status: z.enum(['trialing', 'active', 'past_due', 'paused', 'cancelled']).optional()
    })
    .parse(req.query);

  res.json(subscriptionService.listSubscriptions(query));
});

app.post('/subscriptions/:id/pause', (req, res) => {
  res.json(subscriptionService.pause(req.params.id));
});

app.post('/subscriptions/:id/resume', (req, res) => {
  res.json(subscriptionService.resume(req.params.id));
});

app.post('/subscriptions/:id/cancel', (req, res) => {
  const body = z.object({ cancelledAt: z.string().min(10) }).parse(req.body);
  res.json(subscriptionService.cancel(req.params.id, body.cancelledAt));
});

const invoiceGenerationSchema = z.object({
  subscriptionId: z.string().min(1),
  issuedAt: z.string().min(10)
});

app.post('/invoices/generate', (req, res) => {
  const input = invoiceGenerationSchema.parse(req.body);
  res.status(201).json(invoiceService.generateInvoice(input));
});

app.get('/invoices', (req, res) => {
  const query = z
    .object({
      customerId: z.string().optional(),
      subscriptionId: z.string().optional(),
      status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']).optional(),
      month: z.string().optional()
    })
    .parse(req.query);

  res.json(invoiceService.listInvoices(query));
});

app.get('/invoices/:id', (req, res) => {
  res.json(invoiceService.getInvoice(req.params.id));
});

const paymentAttemptSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.number().int().positive(),
  status: z.enum(['succeeded', 'failed']),
  externalReference: z.string().min(1),
  attemptedAt: z.string().min(10),
  failureReason: z.string().optional()
});

app.post('/payments/attempts', (req, res) => {
  const input = paymentAttemptSchema.parse(req.body);
  res.status(201).json(paymentService.recordAttempt(input));
});

const refundSchema = z.object({
  paymentAttemptId: z.string().min(1),
  amountCents: z.number().int().positive(),
  reason: z.string().min(1),
  refundedAt: z.string().min(10)
});

app.post('/payments/refunds', (req, res) => {
  const input = refundSchema.parse(req.body);
  res.status(201).json(paymentService.refund(input));
});

app.get('/payments/attempts', (req, res) => {
  const query = z.object({ invoiceId: z.string().optional() }).parse(req.query);
  res.json(paymentService.listAttempts(query.invoiceId));
});

app.get('/dunning-actions', (req, res) => {
  const query = z.object({ subscriptionId: z.string().optional() }).parse(req.query);
  res.json(dunningRepository.list(query.subscriptionId));
});

app.get('/reports/monthly-recognition', (req, res) => {
  const query = z.object({ month: z.string() }).parse(req.query);
  res.json(reportService.monthlyRecognition(query.month));
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ message: 'Validation failed', issues: err.issues });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Unexpected error' });
});

export default app;
