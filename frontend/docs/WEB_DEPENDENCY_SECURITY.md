# Web Dependency Security

## Controlled remediation result

The July 2026 production audit started with 134 findings: 41 low, 54 moderate,
34 high, and 5 critical. The wallet cleanup and supported Metaplex migration
reduced the production tree to 1,707 packages and 34 findings: 13 low, 11
moderate, 10 high, and no critical findings.

The pass intentionally did not use `npm audit fix --force`.

## Changes applied

- Replaced `@solana/wallet-adapter-wallets` with the directly used Phantom and
  Solflare adapters. This removed unused Trezor, Keystone, Particle,
  WalletConnect, and related wallet integrations.
- Removed unused direct WalletConnect, Web3Auth, and Solana codec packages.
- Updated direct Axios and React Router dependencies to patched versions.
- Updated Sentry, Zustand, and the development proxy within their compatible
  version ranges.
- Applied non-breaking npm audit updates and targeted safe overrides for the
  Ethers `ws` 8.x branch and CRA's `underscore` branch.
- Replaced deprecated `@metaplex-foundation/js` with supported Umi,
  `mpl-token-metadata`, and the wallet-adapter signer integration. This removed
  the legacy Irys/Aptos chain and all remaining critical findings.
- Corrected the Vault metadata flow: attributes are written to a new off-chain
  JSON document, then `updateV1` changes only the NFT metadata URI using the
  update-authority wallet.

## Remaining migration boundaries

Most remaining CRA findings are build-time dependencies under
`react-scripts@5`. Npm proposes an invalid `react-scripts@0.0.0` replacement, so
they require a deliberate CRA/CRACO-to-modern-build migration instead of an
audit force operation.

`@project-serum/anchor` and the Solana Web3 v1 branch also remain explicit
migration work because their replacements change transaction and program APIs.

The current backend Vault upload endpoint is still a simulated storage boundary.
Production deployment must return a durable public JSON URI from Arweave or an
equivalent content-addressed store before mainnet metadata updates are enabled.

## Verification commands

```text
npm audit --omit=dev
npm test -- --runInBand --watchAll=false
npm run build:ci
```
