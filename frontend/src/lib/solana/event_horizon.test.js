// @vitest-environment node
import { describe, expect, it } from "vitest";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import {
  EVENT_HORIZON_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getRefundCapability,
  resolveRefundAccounts,
} from "./event_horizon";

const wallet = Keypair.generate().publicKey;
const address = () => Keypair.generate().publicKey.toBase58();
const env = {
  REACT_APP_SOLANA_RPC: "https://api.devnet.solana.com",
  REACT_APP_STARCLAIM_PROGRAM_ID: EVENT_HORIZON_PROGRAM_ID,
};
const star = {
  star_id: "SIRIUS",
  pioneer_token_account: address(),
  vault_token_account: address(),
  vault_authority: address(),
};

describe("Event Horizon refund capability", () => {
  it("stays disabled until both deployment settings are explicit", () => {
    expect(getRefundCapability(star, wallet, {})).toEqual(expect.objectContaining({
      available: false,
      reason: expect.stringContaining("not configured"),
    }));
  });

  it("rejects a program ID that differs from the tracked contract", () => {
    expect(getRefundCapability(star, wallet, {
      ...env,
      REACT_APP_STARCLAIM_PROGRAM_ID: address(),
    })).toEqual(expect.objectContaining({
      available: false,
      reason: expect.stringContaining("does not match"),
    }));
  });

  it("reports missing token and vault accounts without opening the wallet", () => {
    expect(getRefundCapability({ star_id: "SIRIUS" }, wallet, env)).toEqual(expect.objectContaining({
      available: false,
      reason: expect.stringContaining("pioneer_token_account"),
    }));
  });

  it("derives contract PDAs and resolves every strict Anchor account", () => {
    const accounts = resolveRefundAccounts(star, wallet);
    const programId = new PublicKey(EVENT_HORIZON_PROGRAM_ID);
    const [expectedStarAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("star"), Buffer.from(star.star_id)],
      programId,
    );
    const [expectedGlobalState] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-state")],
      programId,
    );

    expect(accounts.starAccount.equals(expectedStarAccount)).toBe(true);
    expect(accounts.globalState.equals(expectedGlobalState)).toBe(true);
    expect(accounts.pioneer.equals(wallet)).toBe(true);
    expect(accounts.tokenProgram.toBase58()).toBe(TOKEN_PROGRAM_ID);
    expect(getRefundCapability(star, wallet, env).available).toBe(true);
  });
});
