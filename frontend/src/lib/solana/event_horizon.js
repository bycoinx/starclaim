import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

// Program ID (Placeholder - should match lib.rs)
const PROGRAM_ID = new PublicKey("Star111111111111111111111111111111111111111");

/**
 * Event Horizon Solana Bridge
 * Handles interaction with the StarClaim Smart Contract
 */
export class EventHorizonBridge {
  constructor(wallet, connectionString = "https://api.devnet.solana.com") {
    this.connection = new Connection(connectionString);
    this.wallet = wallet;
    this.provider = new anchor.AnchorProvider(this.connection, this.wallet, {
      preflightCommitment: "processed",
    });
    // Note: IDL would be generated after anchor build
    this.program = new anchor.Program(null, PROGRAM_ID, this.provider);
  }

  /**
   * Yıldız alımı ve rezerv kilitleme
   * @param {string} starId 
   * @param {number} price (in SOL)
   * @param {boolean} hasInsurance 
   */
  async buyStar(starId, price, hasInsurance) {
    const starAccount = anchor.web3.Keypair.generate();
    const lamports = price * anchor.web3.LAMPORTS_PER_SOL;

    try {
      const tx = await this.program.methods
        .buyStar(new anchor.BN(lamports), hasInsurance)
        .accounts({
          starAccount: starAccount.publicKey,
          buyer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([starAccount])
        .rpc();

      return { tx, starAccount: starAccount.publicKey.toString() };
    } catch (err) {
      console.error("Event Horizon: Buy failed", err);
      throw err;
    }
  }

  /**
   * Rezervi anında nakit olarak çekme (Instant Exit)
   */
  async instantExit(starAccountPubKey) {
    try {
      const tx = await this.program.methods
        .instantExit()
        .accounts({
          starAccount: new PublicKey(starAccountPubKey),
          owner: this.wallet.publicKey,
        })
        .rpc();
      return tx;
    } catch (err) {
      console.error("Event Horizon: Instant Exit failed", err);
      throw err;
    }
  }

  /**
   * Satışı başlat (Stasis moduna al)
   */
  async initiateSale(starAccountPubKey) {
    try {
      const tx = await this.program.methods
        .initiateSale()
        .accounts({
          starAccount: new PublicKey(starAccountPubKey),
          owner: this.wallet.publicKey,
        })
        .rpc();
      return tx;
    } catch (err) {
      console.error("Event Horizon: Sale initiation failed", err);
      throw err;
    }
  }

  /**
   * 24 saat içinde satışı iptal et (Quantum Retrieval)
   */
  async cancelSale(starAccountPubKey) {
    try {
      const tx = await this.program.methods
        .cancelSale()
        .accounts({
          starAccount: new PublicKey(starAccountPubKey),
          owner: this.wallet.publicKey,
        })
        .rpc();
      return tx;
    } catch (err) {
      console.error("Event Horizon: Retrieval failed", err);
      throw err;
    }
  }
}
