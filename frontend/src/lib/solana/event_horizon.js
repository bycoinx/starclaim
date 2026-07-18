import { Connection, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import eventHorizonIdl from "./idl/starclaim_program.json";

export const EVENT_HORIZON_PROGRAM_ID = eventHorizonIdl.address;
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const ACCOUNT_FIELDS = {
  pioneerTokenAccount: ["pioneer_token_account", "pioneerTokenAccount"],
  vaultTokenAccount: ["vault_token_account", "vaultTokenAccount"],
  vaultAuthority: ["vault_authority", "vaultAuthority"],
};

export class EventHorizonUnavailableError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "EventHorizonUnavailableError";
    this.code = "EVENT_HORIZON_UNAVAILABLE";
  }
}

function firstValue(record, keys) {
  return keys.map((key) => record?.[key]).find(Boolean);
}

function parsePublicKey(value, label) {
  try {
    return new PublicKey(value);
  } catch {
    throw new EventHorizonUnavailableError(`${label} is not a valid Solana address.`);
  }
}

export function resolveEventHorizonConfig(env = import.meta.env) {
  const rpcUrl = env?.REACT_APP_SOLANA_RPC;
  const configuredProgramId = env?.REACT_APP_STARCLAIM_PROGRAM_ID;

  if (!rpcUrl || !configuredProgramId) {
    return {
      available: false,
      reason: "The on-chain refund service is not configured for this deployment.",
    };
  }

  if (configuredProgramId !== EVENT_HORIZON_PROGRAM_ID) {
    return {
      available: false,
      reason: "The configured refund program does not match the audited StarClaim contract.",
    };
  }

  try {
    return {
      available: true,
      rpcUrl,
      programId: parsePublicKey(configuredProgramId, "Program ID"),
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

export function resolveRefundAccounts(star, pioneerPublicKey) {
  if (!star?.star_id) {
    throw new EventHorizonUnavailableError("The asset has no StarClaim contract identifier.");
  }

  const pioneer = parsePublicKey(pioneerPublicKey, "Connected wallet");
  const programId = new PublicKey(EVENT_HORIZON_PROGRAM_ID);
  const explicitStarAccount = firstValue(star, ["solana_address", "solanaAddress", "star_account", "starAccount"]);
  let starAccount;

  if (explicitStarAccount) {
    starAccount = parsePublicKey(explicitStarAccount, "Star account");
  } else {
    const starIdSeed = Buffer.from(String(star.star_id));
    if (starIdSeed.length > 32) {
      throw new EventHorizonUnavailableError("The star identifier is too long to derive its contract account.");
    }
    [starAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("star"), starIdSeed],
      programId,
    );
  }

  const resolved = {};
  for (const [field, aliases] of Object.entries(ACCOUNT_FIELDS)) {
    const value = firstValue(star, aliases);
    if (!value) {
      throw new EventHorizonUnavailableError(`The asset is missing its ${aliases[0]} account.`);
    }
    resolved[field] = parsePublicKey(value, aliases[0]);
  }

  const [globalState] = PublicKey.findProgramAddressSync(
    [Buffer.from("global-state")],
    programId,
  );

  return {
    starAccount,
    globalState,
    pioneer,
    ...resolved,
    tokenProgram: new PublicKey(TOKEN_PROGRAM_ID),
  };
}

export function getRefundCapability(star, pioneerPublicKey, env = import.meta.env) {
  const config = resolveEventHorizonConfig(env);
  if (!config.available) return config;

  try {
    return {
      available: true,
      config,
      accounts: resolveRefundAccounts(star, pioneerPublicKey),
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof EventHorizonUnavailableError
        ? error.message
        : "The refund accounts could not be resolved.",
    };
  }
}

export async function requestStarRefund({ star, wallet, env = import.meta.env }) {
  const adapter = wallet?.adapter || wallet;
  if (!adapter?.publicKey || !adapter?.signTransaction || !adapter?.signAllTransactions) {
    throw new EventHorizonUnavailableError("A transaction-capable Solana wallet is required.");
  }

  const capability = getRefundCapability(star, adapter.publicKey, env);
  if (!capability.available) {
    throw new EventHorizonUnavailableError(capability.reason);
  }

  const { AnchorProvider, Program } = await import("@anchor-lang/core");
  const connection = new Connection(capability.config.rpcUrl, "confirmed");
  const provider = new AnchorProvider(connection, adapter, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  const program = new Program(eventHorizonIdl, provider);

  return program.methods
    .requestRefund()
    .accountsStrict(capability.accounts)
    .rpc();
}
