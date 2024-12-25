import { Card, CardContent } from "@/components/card";
import { ProcessPaymentResult } from "../_data/process-payment";
import { AlertCircle } from "lucide-react";

export function PaymentErrorChatMessage({
  error
}: {
  error: ProcessPaymentResult
}) {
  return (
    <div className="flex items-start mb-8 flex-row">
      <Card className="flex-1 bg-slate-800/50 border border-red-700/50 backdrop-blur-sm">
        <CardContent className="p-3">
          <p className="text-sm mb-2 text-slate-200">
            {(() => {
              switch (error) {
                case ProcessPaymentResult.FailedInsufficientFunds:
                  return "Insufficient funds to process payment. Please ensure you have enough funds and try again.";
                case ProcessPaymentResult.FailedPaymentProcessingError:
                  return "There was an error processing your payment. Please try again later.";
                default:
                  return "An unexpected error occurred. Please try again later.";
              }
            })()}
          </p>
          <div className="flex items-center justify-end">
            <AlertCircle className="w-4 h-4 text-red-400 me-1" />
            <span className="text-xs text-red-400">
              System message
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}