# Web Event Horizon contract

## Client contract

The Dashboard refund action maps to the deployed Anchor instruction
`request_refund`. The previous `instantExit` instruction and placeholder
`Star111...` program ID did not exist in the Rust program and were removed.

The tracked client IDL is intentionally limited to that instruction. Its
program ID must match the Rust `declare_id!` and Anchor configuration:

```text
AiU7GFPiL63zRfv1esuWuoHfT6D7K4vJioH5Ci9xTosb
```

## Enablement requirements

Both deployment variables are mandatory:

```text
REACT_APP_SOLANA_RPC=<approved cluster RPC URL>
REACT_APP_STARCLAIM_PROGRAM_ID=AiU7GFPiL63zRfv1esuWuoHfT6D7K4vJioH5Ci9xTosb
```

Each refundable asset returned by the backend must also contain:

- `star_id`
- `pioneer_token_account`
- `vault_token_account`
- `vault_authority`
- preferably `solana_address`; otherwise the star PDA is derived from
  `["star", star_id]`

The global state PDA is derived from `["global-state"]`. The connected wallet
is passed as the `pioneer` signer, and the standard SPL Token program is fixed
by the IDL.

Missing or invalid configuration never falls back to devnet and never submits
the backend `/stars/exit` mutation. The UI reports that the on-chain capability
is unavailable before requesting a wallet signature.

## Deployment boundary

The repository's Anchor configuration currently declares only a localnet
program. Devnet or mainnet activation therefore requires a separately audited
deployment, funded vault accounts, backend persistence of all account
addresses, and an end-to-end refund acceptance run. Setting frontend variables
alone is not deployment authorization.
