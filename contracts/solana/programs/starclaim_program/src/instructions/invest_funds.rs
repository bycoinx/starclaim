use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::StarClaimError;

#[derive(Accounts)]
pub struct InvestFunds<'info> {
    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub protocol_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault authority (PDA)
    pub vault_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<InvestFunds>, amount: u64) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    // 1. Yetki Kontrolü
    require!(ctx.accounts.admin.key() == global_state.admin, StarClaimError::UnauthorizedYieldManager);

    // 2. Hazinede yeterli likidite var mı? (%30 likit rezerv kuralı frontend/admin tarafında kontrol edilebilir 
    // ama burada da basit bir check ekleyelim)
    let available_liquidity = ctx.accounts.vault_token_account.amount;
    require!(amount <= available_liquidity, StarClaimError::InsufficientLiquidity);

    // 3. Token Transferi (Vault -> Protocol Vault)
    // Not: Gerçek bir protokol entegrasyonunda burada protokolün 'deposit' fonksiyonuna CPI yapılır.
    // Şimdilik transfer mantığını kuruyoruz.
    let seeds = &[b"global-state".as_ref(), &[ctx.bumps.global_state]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.protocol_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program.key(), cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    // 4. Durumu Güncelle
    global_state.total_invested += amount;

    msg!("Funds Invested: {}. Total Invested: {}", amount, global_state.total_invested);
    Ok(())
}
