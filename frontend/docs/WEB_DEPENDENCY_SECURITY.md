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
- Applied non-breaking npm audit updates and a targeted safe override for the
  Ethers `ws` 8.x branch.
- Replaced deprecated `@metaplex-foundation/js` with supported Umi,
  `mpl-token-metadata`, and the wallet-adapter signer integration. This removed
  the legacy Irys/Aptos chain and all remaining critical findings.
- Corrected the Vault metadata flow: attributes are written to a new off-chain
  JSON document, then `updateV1` changes only the NFT metadata URI using the
  update-authority wallet.

## Remaining migration boundaries

CRA and CRACO were replaced by Vite 8 and Vitest 4. The production audit now
contains 10 findings: 4 low, 6 moderate, and no high or critical findings.

The deprecated `@project-serum/anchor` client was replaced with
`@anchor-lang/core`. The fake program ID and nonexistent `instantExit`
instruction were removed; the client now uses the contract's tracked
`request_refund` IDL subset and strict accounts. This also removes the
`js-sha256` direct-eval dependency from the tree.

Solana Web3 remains on its supported v1 compatibility line because the current
Anchor TypeScript client and wallet adapters use that API. Event Horizon is
disabled unless its audited program ID, RPC endpoint, and per-asset token/vault
accounts are explicit.

The current backend Vault upload endpoint is still a simulated storage boundary.
Production deployment must return a durable public JSON URI from Arweave or an
equivalent content-addressed store before mainnet metadata updates are enabled.

## Verification commands

```text
npm audit --omit=dev
npm run test:ci
npm run build:ci
```
