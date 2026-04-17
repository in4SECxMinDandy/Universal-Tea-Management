# Testing Guide

## Local Commands

- `npm test -- --run` runs unit and integration tests once.
- `npm run test:coverage -- --run` runs the same suite with V8 coverage and writes text, JSON, HTML, and LCOV reports.
- `npm run test:e2e` runs Playwright end-to-end tests.
- `npm run build` verifies Next.js compile, lint, and type checks.

## Test Layers

- Unit tests cover pure utilities such as validation, rate limiting, pagination, performance metrics, and formatting.
- Integration tests cover hooks, API routes, auth gates, chat behavior, catalog caching, and order submission with mocked Supabase clients.
- E2E tests should focus on complete user journeys: browsing foods, ordering, chatting, and admin management.

## Shared Utilities

- Supabase test doubles live in `src/test/mocks/supabase.ts`.
- Reusable entities live in `src/test/utils/fixtures.ts`.
- Provider-aware render helpers live in `src/test/utils/test-helpers.tsx`.

## Coverage Notes

The current suite passes the configured coverage gate and reports coverage through `text`, `json`, `html`, and `lcov`. The latest local run reported about 73% line coverage overall. Keep adding tests around UI-heavy files before raising the global threshold to 80%.

## New Test Pattern

When testing React Query hooks or components that use query hooks, wrap the unit under test in `QueryClientProvider` using `createQueryClient()`. Prefer the helper in `src/test/utils/test-helpers.tsx` for new tests.
