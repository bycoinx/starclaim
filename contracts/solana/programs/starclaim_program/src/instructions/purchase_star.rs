use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

#[derive(Accounts)]
#[instruction(star_id: String)]
pub struct PurchaseStar<'info> {
    #[account(
        init,
        payer = buyer,
        space = StarAccount::SIZE,
        seeds = [b"star", star_id.as_bytes()],
        bump
    )]
    pub star_account: Account<'info, StarAccount>,

    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PurchaseStar>,
    star_id: String,
    price: u64,
    lock_duration: i64,
    is_refundable: bool,
) -> Result<()> {
    let star_account = &mut ctx.accounts.star_account;
    let global_state = &mut ctx.accounts.global_state;

    // 1. Yıldız Bilgilerini Kaydet
    star_account.star_id = star_id;
    star_account.pioneer = ctx.accounts.buyer.key();
    star_account.current_owner = ctx.accounts.buyer.key();
    star_account.purchase_price = price;
    star_account.purchase_time = Clock::get()?.unix_timestamp;
    star_account.lock_duration = lock_duration;
    star_account.is_refundable = is_refundable;
    star_account.is_refunded = false;
    star_account.message_cid = "".to_string(); // Başlangıçta boş
    star_account.message_unlock_time = 0;

    // 2. Token Transferi (USDC/USDT) - CPI
    let cpi_accounts = Transfer {
        from: ctx.accounts.buyer_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program.key(), cpi_accounts);
    token::transfer(cpi_ctx, price)?;

    // 3. Global State Güncelle
    global_state.total_stars_claimed += 1;
    if is_refundable {
        global_state.total_funds_escrowed += price;
    }

    msg!("Star Claimed Successfully: {}", star_account.star_id);
    Ok(())
}
