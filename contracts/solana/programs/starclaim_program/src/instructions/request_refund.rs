use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::StarClaimError;

#[derive(Accounts)]
pub struct RequestRefund<'info> {
    #[account(mut, seeds = [b"star", star_account.star_id.as_bytes()], bump)]
    pub star_account: Account<'info, StarAccount>,

    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub pioneer: Signer<'info>,

    #[account(mut)]
    pub pioneer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: Kasa yetkilisi (PDA veya Admin)
    pub vault_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<RequestRefund>) -> Result<()> {
    let star_account = &mut ctx.accounts.star_account;
    let global_state = &mut ctx.accounts.global_state;
    let now = Clock::get()?.unix_timestamp;

    // 1. Güvenlik Kontrolleri
    require!(star_account.is_refundable, StarClaimError::NotRefundable);
    require!(!star_account.is_refunded, StarClaimError::AlreadyRefunded);
    require!(star_account.pioneer == ctx.accounts.pioneer.key(), StarClaimError::NotPioneer);

    // 2. İade Tutarı Hesaplama (Mutualist Mantık)
    // 24 ay (730 gün) dolduysa %100, dolmadıysa %90 iade (Örn: Basitleştirilmiş kural)
    let elapsed = now - star_account.purchase_time;
    let lock_period = star_account.lock_duration;
    
    let refund_amount = if elapsed >= lock_period {
        star_account.purchase_price // %100 İade
    } else {
        (star_account.purchase_price * 90) / 100 // %90 İade (Küçük kesinti)
    };

    // 3. Token Transferi (Vault -> Pioneer)
    let seeds = &[b"global-state".as_ref(), &[ctx.bumps.global_state]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.pioneer_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program.key(), cpi_accounts, signer);
    token::transfer(cpi_ctx, refund_amount)?;

    // 4. Durumu Güncelle
    star_account.is_refunded = true;
    global_state.total_funds_escrowed -= star_account.purchase_price;

    msg!("Refund Processed for Star: {}. Amount: {}", star_account.star_id, refund_amount);
    Ok(())
}
