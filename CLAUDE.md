# CLAUDE.md

## Commands

- Install dependencies: `npm install`
- Run tests: `npm test`
- Type-check/build: `npm run build`
- Lint/type-check: `npm run lint`

## Workflow Rules

- Do not push changes unless explicitly asked.
- Do not use `--no-verify`.
- Do not run destructive git commands such as `git reset --hard`, `git clean -fd`, deleting branches, or force-pushing without confirmation.
- Keep changes focused on the requested behavior.
- Add or update tests for behavior changes.
- Before finishing, report the exact commands run and whether they passed or failed.

## Architecture

- Routes should handle HTTP parsing and response formatting only.
- Services own business rules and state transitions.
- Repositories own in-memory persistence and querying.
- Keep money as integer cents. Do not use floating point values for billing calculations.
- Reuse existing filtering and status calculation helpers instead of duplicating rules.

## Domain Notes

- A subscription can be `trialing`, `active`, `past_due`, `cancelled`, or `paused`.
- Failed payment attempts can move a subscription to `past_due` and create dunning actions.
- Invoices become `paid` only when their paid amount is greater than or equal to their total amount.
- Refunds reduce recognized paid amount for reporting, but should not silently erase the original payment attempt history.
