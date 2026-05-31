use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::StarClaimError;

#[derive(Accounts)]
pub struct WithdrawYield<'info> {
    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub protocol_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub yield_vault_account: Account<'info, TokenAccount>,

    /// CHECK: Protocol authority or direct access if allowed
    pub protocol_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawYield>, amount: u64) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    // 1. Yetki Kontrolü
    require!(ctx.accounts.admin.key() == global_state.admin, StarClaimError::UnauthorizedYieldManager);
    require!(ctx.accounts.yield_vault_account.key() == global_state.yield_vault, StarClaimError::UnauthorizedYieldManager);

    // 2. Kâr Kontrolü
    // Bu basitleştirilmiş bir kontroldür. Gerçekte protokolün iç değerlemesi kullanılır.
    // Burada kârın (ana paradan fazla olan kısmın) çekildiğinden emin olunmalı.
    let total_value = ctx.accounts.protocol_token_account.amount;
    let principal = global_state.total_invested;
    
    require!(total_value > principal, StarClaimError::InsufficientYield);
    let max_yield = total_value - principal;
    require!(amount <= max_yield, StarClaimError::InsufficientYield);

    // 3. Token Transferi (Protocol -> Yield Vault)
    // Not: Gerçek entegrasyonda burada 'withdraw' CPI yapılır.
    let cpi_accounts = Transfer {
        from: ctx.accounts.protocol_token_account.to_account_info(),
        to: ctx.accounts.yield_vault_account.to_account_info(),
        authority: ctx.accounts.protocol_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program.key(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    msg!("Yield Withdrawn: {}. Remaining Principal Safe.", amount);
    Ok(())
}
