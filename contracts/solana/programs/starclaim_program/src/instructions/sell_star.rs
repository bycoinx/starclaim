use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;

#[derive(Accounts)]
pub struct SellStar<'info> {
    #[account(mut, seeds = [b"star", star_account.star_id.as_bytes()], bump)]
    pub star_account: Account<'info, StarAccount>,

    #[account(mut, seeds = [b"global-state"], bump)]
    pub global_state: Account<'info, GlobalState>,

    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<SellStar>, price: u64) -> Result<()> {
    let star_account = &mut ctx.accounts.star_account;
    
    // 1. Güvenlik: Sadece mevcut sahibi satabilir
    require_keys_eq!(star_account.current_owner, ctx.accounts.seller.key());

    // 2. Komisyon Hesaplama (%5 Royalty)
    let royalty_amount = (price * 5) / 100;
    let seller_amount = price - royalty_amount;

    // 3. Transfer: Alıcı -> Satıcı (Net Tutar)
    let cpi_accounts_seller = Transfer {
        from: ctx.accounts.buyer_token_account.to_account_info(),
        to: ctx.accounts.seller_token_account.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_seller = CpiContext::new(cpi_program.key(), cpi_accounts_seller);
    token::transfer(cpi_ctx_seller, seller_amount)?;

    // 4. Transfer: Alıcı -> Treasury (%5 Komisyon)
    let cpi_accounts_treasury = Transfer {
        from: ctx.accounts.buyer_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_ctx_treasury = CpiContext::new(cpi_program.key(), cpi_accounts_treasury);
    token::transfer(cpi_ctx_treasury, royalty_amount)?;

    // 5. Mülkiyet Güncelleme
    star_account.current_owner = ctx.accounts.buyer.key();

    msg!("Star Sold! Price: {}, Royalty: {}, New Owner: {}", price, royalty_amount, star_account.current_owner);
    Ok(())
}
