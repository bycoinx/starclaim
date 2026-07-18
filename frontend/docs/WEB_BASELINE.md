# Web Stabilization Baseline

Recorded on 2026-07-13 from `feature/galaxy-worker-claim-flow` using Node 24.14.0 and npm 11.9.0.

## Reproduction

```sh
npm ci --prefer-offline --no-audit
npm run test:ci
npm run build:ci
npm run audit:production
```

## Current results

| Check | Baseline |
| --- | ---: |
| Clean install | 2,558 packages, 9 minutes on the measured Windows host |
| Test discovery | 2 suites, 7 tests |
| Tests | 7 passed |
| CI production build | Passed |
| Build time | 33 seconds with a warm dependency cache |
| Build files | 60 |
| Total build output | 10,108,221 bytes |
| JavaScript output | 2,777,490 bytes across 22 files |
| CSS output | 134,304 bytes across 4 files |
| Main JavaScript | 1,839,601 bytes raw / 507.06 kB gzip |

The CI build emits one Node/CRA deprecation warning for `fs.F_OK`. Production source maps are disabled by `.env.production`.

## Dependency security baseline

`npm audit --omit=dev` currently reports 133 findings:

| Severity | Count |
| --- | ---: |
| Critical | 4 |
| High | 34 |
| Moderate | 54 |
| Low | 41 |

The four critical paths are rooted in `aptos`, `form-data`, `protobufjs`, and `shell-quote`. The dominant dependency groups are:

- the CRA/`react-scripts` build chain;
- `@solana/wallet-adapter-wallets`, which installs many unused wallet adapters;
- deprecated Metaplex and Irys SDK chains;
- direct `axios`, `react-router-dom`, and legacy crypto/browser polyfills.

Do not run `npm audit fix --force` against this baseline. The suggested fixes include breaking downgrades or replacement of core build and wallet packages. Resolve each dependency family independently with tests and a production build.

## File hygiene

- `build/`, local `.env`, and package archives are ignored.
- `.env.production` is intentionally tracked and contains only the source-map build setting.
- The tracked `tmp_test_write.txt` probe was removed during stabilization.

## Initial risk priorities

1. Preserve the seven existing tests while expanding engine-contract coverage.
2. Reduce the 507.06 kB gzip main chunk before enabling the live Cosmos renderer.
3. Replace broad wallet bundles with explicitly supported adapters.
4. Separate CRA migration from renderer refactoring so build-system risk remains isolated.
