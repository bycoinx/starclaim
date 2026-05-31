use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::StarClaimError;

#[derive(Accounts)]
pub struct ReclaimPrincipal<'info> {
    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub protocol_token_account: Account<'info, TokenAccount>,

    /// CHECK: Protocol authority
    pub protocol_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<ReclaimPrincipal>, amount: u64) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;

    // 1. Yetki Kontrolü
    require!(ctx.accounts.admin.key() == global_state.admin, StarClaimError::UnauthorizedYieldManager);

    // 2. Yatırım Kontrolü
    require!(amount <= global_state.total_invested, StarClaimError::InsufficientLiquidity);

    // 3. Token Transferi (Protocol -> Vault)
    let cpi_accounts = Transfer {
        from: ctx.accounts.protocol_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.protocol_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program.key(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // 4. Durumu Güncelle
    global_state.total_invested -= amount;

    msg!("Principal Reclaimed: {}. Total Invested Remaining: {}", amount, global_state.total_invested);
    Ok(())
}
