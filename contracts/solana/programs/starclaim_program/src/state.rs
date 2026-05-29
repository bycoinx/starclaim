use anchor_lang::prelude::*;

#[account]
pub struct GlobalState {
    pub admin: Pubkey,
    pub usdc_mint: Pubkey,
    pub usdt_mint: Pubkey,
    pub total_stars_claimed: u64,
    pub total_funds_escrowed: u64,
}

impl GlobalState {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 8 + 8;
}

#[account]
pub struct StarAccount {
    pub star_id: String, // NASA/HYG ID (örn: "HIP 12345")
    pub pioneer: Pubkey, // İlk alıcı (İade hakkı sahibi)
    pub current_owner: Pubkey, // Mevcut sahibi
    pub purchase_price: u64, // Ödenen miktar (USDC/USDT cinsinden, 6 decimal)
    pub purchase_time: i64, // Satın alma timestamp
    pub lock_duration: i64, // Kilit süresi (örn: 24 ay saniye cinsinden)
    pub is_refundable: bool, // Supernova mı (true) yoksa Nova mı (false)?
    pub is_refunded: bool, // İade edildi mi?
    pub message_cid: String, // Arweave/IPFS CID
    pub message_unlock_time: i64, // Mesajın açılacağı zaman
}

impl StarAccount {
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 64 + 8;
}
