export enum ProcessPaymentResult {
  Success,
  FailedInsufficientFunds,
  FailedPaymentProcessingError,
  FailedOtherError
}

export async function processPayment(walletAddress: string): Promise<ProcessPaymentResult> {
  console.log("Processing payment...");
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log("Payment processed successfully");

  return ProcessPaymentResult.FailedOtherError;
}
