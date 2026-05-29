pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("AiU7GFPiL63zRfv1esuWuoHfT6D7K4vJioH5Ci9xTosb");

#[program]
pub mod starclaim_program {
    use super::*;

    pub fn initialize_global_state(
        ctx: Context<InitializeGlobalState>,
        usdc_mint: Pubkey,
        usdt_mint: Pubkey
    ) -> Result<()> {
        initialize_global_state::handler(ctx, usdc_mint, usdt_mint)
    }

    pub fn purchase_star(
        ctx: Context<PurchaseStar>,
        star_id: String,
        price: u64,
        lock_duration: i64,
        is_refundable: bool
    ) -> Result<()> {
        purchase_star::handler(ctx, star_id, price, lock_duration, is_refundable)
    }

    pub fn request_refund(ctx: Context<RequestRefund>) -> Result<()> {
        request_refund::handler(ctx)
    }

    pub fn update_star_message(
        ctx: Context<UpdateStarMessage>,
        new_message_cid: String,
        unlock_time: i64
    ) -> Result<()> {
        update_star_message::handler(ctx, new_message_cid, unlock_time)
    }

    pub fn sell_star(ctx: Context<SellStar>, price: u64) -> Result<()> {
        sell_star::handler(ctx, price)
    }
}
