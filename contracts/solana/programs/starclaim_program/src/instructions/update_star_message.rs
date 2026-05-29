use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::StarClaimError;

#[derive(Accounts)]
pub struct UpdateStarMessage<'info> {
    #[account(mut, seeds = [b"star", star_account.star_id.as_bytes()], bump)]
    pub star_account: Account<'info, StarAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateStarMessage>,
    new_message_cid: String,
    unlock_time: i64,
) -> Result<()> {
    let star_account = &mut ctx.accounts.star_account;

    // Sadece mevcut sahibi mesajı güncelleyebilir
    require!(
        star_account.current_owner == ctx.accounts.owner.key(),
        StarClaimError::NotCurrentOwner
    );

    star_account.message_cid = new_message_cid;
    star_account.message_unlock_time = unlock_time;

    msg!("Star Message Updated. Unlock Time: {}", unlock_time);
    Ok(())
}
