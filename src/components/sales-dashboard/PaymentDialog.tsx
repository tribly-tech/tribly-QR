"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Crown,
  Shield,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { NewBusinessState, PaymentStatus } from "./types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newBusiness: NewBusinessState;
  paymentStatus: PaymentStatus;
  paymentQRCode: string | null;
  paymentTimer: number;
  onRetry: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  newBusiness,
  paymentStatus,
  paymentQRCode,
  paymentTimer,
  onRetry,
}: PaymentDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (paymentStatus === "success") {
      setTimeout(() => onOpenChange(false), 2000);
    } else if (paymentStatus === "pending") {
      if (
        window.confirm(
          "Payment is still pending. Are you sure you want to close?",
        )
      ) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {paymentStatus === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Payment Successful
              </>
            ) : paymentStatus === "failed" ? (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                Payment Failed
              </>
            ) : paymentStatus === "expired" ? (
              <>
                <Clock className="h-5 w-5 text-orange-600" />
                Payment Expired
              </>
            ) : paymentStatus === "pending" && paymentQRCode ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Payment Pending
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Complete Payment
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {paymentStatus === "pending" &&
              paymentQRCode &&
              "Scan the QR code to complete your payment"}
            {paymentStatus === "pending" &&
              !paymentQRCode &&
              "Generating payment QR code..."}
            {paymentStatus === "success" &&
              "Your payment has been processed successfully"}
            {paymentStatus === "failed" &&
              "Your payment could not be processed"}
            {paymentStatus === "expired" && "The payment session has expired"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Details */}
          {newBusiness.paymentPlan && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newBusiness.paymentPlan === "qr-plus" ? (
                    <>
                      <Crown className="h-5 w-5 text-primary" />
                      <span className="font-semibold">QR-Plus</span>
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" />
                      <span className="font-semibold">QR-Basic</span>
                    </>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ₹{newBusiness.paymentPlan === "qr-plus" ? "6,999" : "2,999"}
                  </div>
                  <div className="text-xs text-muted-foreground">per year</div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Business:</span>
                <span className="font-medium">
                  {newBusiness.name || "New Business"}
                </span>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus === "pending" && (
            <>
              {paymentQRCode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-white">
                    <img
                      src={paymentQRCode}
                      alt="Payment QR Code"
                      className="max-w-[250px] h-auto"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">
                      Scan with your UPI app
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Time remaining: {Math.floor(paymentTimer / 60)}:
                      {(paymentTimer % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Waiting for payment confirmation...</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Generating payment QR code...
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {paymentStatus === "success" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment has been processed. You can now create the
                  business.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan expires:</span>
                  <span className="font-medium">
                    {newBusiness.paymentExpiryDate
                      ? new Date(
                          newBusiness.paymentExpiryDate,
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "1 year from now"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Payment Failed</h3>
                <p className="text-sm text-muted-foreground">
                  Your payment could not be processed. Please try again.
                </p>
              </div>
              <Button onClick={onRetry} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-orange-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Payment Expired</h3>
                <p className="text-sm text-muted-foreground">
                  The payment session has expired. Please start a new payment.
                </p>
              </div>
              <Button onClick={onRetry} className="w-full">
                Start New Payment
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
