# Recurring Billing API

A compact Greenfield API for subscription billing workflows. The project is intentionally small enough to understand quickly, while still containing realistic business rules around recurring invoices, payment attempts, refunds, subscription status transitions, and dunning.

## Stack

- Node.js
- TypeScript
- Express
- Zod
- Vitest
- Supertest
- In-memory repositories

## Commands

```bash
npm install
npm test
npm run build
npm run dev
```

## Main Concepts

- Customers subscribe to plans.
- Subscriptions generate invoices.
- Invoices receive payment attempts.
- Failed attempts can trigger dunning actions.
- Payment/refund history is preserved for reporting.

## API Overview

### Customers

- `POST /customers`
- `GET /customers`

### Plans

- `POST /plans`
- `GET /plans`

### Subscriptions

- `POST /subscriptions`
- `GET /subscriptions`
- `POST /subscriptions/:id/pause`
- `POST /subscriptions/:id/resume`
- `POST /subscriptions/:id/cancel`

### Invoices

- `POST /invoices/generate`
- `GET /invoices`
- `GET /invoices/:id`

### Payments

- `POST /payments/attempts`
- `POST /payments/refunds`

### Reports

- `GET /reports/monthly-recognition?month=YYYY-MM`

## Good Future Task Ideas

- Fix invoice status when a refund occurs after a full payment.
- Ensure retry attempts do not duplicate dunning actions.
- Add billing cycle proration for mid-cycle plan changes.
- Refactor duplicated invoice filtering logic between list and reports.
- Investigate why paused subscriptions still generate invoices.
- Add a safer idempotency rule for payment attempts.


## Current limitations and future development

This is a personal development prototype, not a production deployment. Repositories currently use in-memory storage. Planned enhancements and estimated work are documented in [ROADMAP.md](ROADMAP.md). No production users or deployments are claimed.

## License

MIT; see [LICENSE](LICENSE).
