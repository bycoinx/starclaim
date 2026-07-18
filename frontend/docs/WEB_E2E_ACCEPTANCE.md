# Web E2E and performance acceptance

The web acceptance gate runs against the production build and uses a deterministic catalog API fixture. It covers the user path from catalog selection to Cosmos, browser back navigation, state continuity, renderer readiness, and the central quality profile.

## Browser matrix

- Chromium (Desktop Chrome profile)
- Firefox (Desktop Firefox profile)
- WebKit (Desktop Safari profile)

WebGL initialization may enter the shared recovery policy. A browser is accepted when the runtime reaches `running`, `low-quality`, or `safe-2d`; maintenance and initialization states fail the gate.

## Budgets

- Cosmos ready state: less than 20 seconds
- JavaScript transfer on the Cosmos route: less than 1.5 MB
- Renderer surface: exactly one canvas
- Quality contract: `low`, `medium`, or `high`
- Unexpected page errors during the continuity flow: zero. The known WebGL-context initialization error is accepted only after the shared runtime reaches an accepted ready state.

## Commands

Install browser binaries once:

```bash
npm run test:e2e:install
```

Build and execute the complete acceptance gate:

```bash
npm run test:e2e
```

When `build/` is already current, run only the browser suite:

```bash
npm run test:e2e:run
```
