# Web build migration

## Result

The frontend now uses Vite 8 with Rolldown for development and production builds,
and Vitest 4 for unit tests. CRA, CRACO, the custom Webpack configuration, and the
CRA proxy middleware have been removed.

The migration preserves the existing contracts:

- `@` resolves to `src/`.
- Browser polyfills expose Buffer, process, global, crypto, stream, path, assert,
  and vm for the current wallet and Solana dependencies.
- `REACT_APP_` variables remain supported during the transition.
- `/api` is proxied to `REACT_APP_BACKEND_URL` or `REACT_APP_API_URL` in development.
- Production output remains in `build/`, so deployment and Playwright paths stay stable.
- React, observability, and shared vendor modules use explicit Rolldown chunk groups.

## Commands

```text
npm start
npm run build:ci
npm run test:ci
npm run test:e2e:run
npm run audit:production
```

## Acceptance snapshot

- Production build: approximately 2.6 seconds on the migration workstation.
- Entry application chunk: 211.20 kB minified / 68.73 kB gzip.
- Unit tests: 18 files and 58 tests.
- Browser acceptance: 6 tests across Chromium, Firefox, and WebKit.
- Production audit: 4 low, 6 moderate, 0 high, and 0 critical findings.

## Event Horizon follow-up

The lazy Event Horizon client now uses `@anchor-lang/core` and a tracked,
minimal refund IDL. The deprecated `@project-serum/anchor` and `js-sha256`
direct-eval path have been removed instead of suppressing the build warning.

Refund capability is fail-closed. It is only exposed when the audited program
ID, RPC endpoint, star account, and required token/vault accounts are present.
See `WEB_EVENT_HORIZON_CONTRACT.md` for the deployment boundary.
