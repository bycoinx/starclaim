use anchor_lang::prelude::*;

#[error_code]
pub enum StarClaimError {
    #[msg("This star is not eligible for a refund.")]
    NotRefundable,
    #[msg("Refund has already been claimed for this star.")]
    AlreadyRefunded,
    #[msg("Only the original pioneer can request a refund.")]
    NotPioneer,
    #[msg("Only the current owner can update the message.")]
    NotCurrentOwner,
    #[msg("Invalid lock duration.")]
    InvalidLockDuration,
}
