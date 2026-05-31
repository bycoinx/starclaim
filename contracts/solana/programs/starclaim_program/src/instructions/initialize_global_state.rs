use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeGlobalState<'info> {
    #[account(
        init,
        payer = admin,
        space = GlobalState::SIZE,
        seeds = [b"global-state"],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    
    #[account(mut)]
    pub admin: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeGlobalState>,
    usdc_mint: Pubkey,
    usdt_mint: Pubkey,
    yield_vault: Pubkey
) -> Result<()> {
    let global_state = &mut ctx.accounts.global_state;
    global_state.admin = ctx.accounts.admin.key();
    global_state.usdc_mint = usdc_mint;
    global_state.usdt_mint = usdt_mint;
    global_state.total_stars_claimed = 0;
    global_state.total_funds_escrowed = 0;
    global_state.total_invested = 0;
    global_state.yield_vault = yield_vault;
    
    msg!("StarClaim Global State Initialized!");
    Ok(())
}
