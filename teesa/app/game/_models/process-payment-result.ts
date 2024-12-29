export enum ProcessPaymentResult {
  Success,
  FailedInsufficientFunds,
  FailedPaymentProcessingError,
  FailedWalletNotFound,
  FailedOtherError
}