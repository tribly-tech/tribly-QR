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
import { Crown, Shield, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { NewBusinessState } from "./types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newBusiness: NewBusinessState;
  paymentQRCode: string | null;
  paymentTimer: number;
  onMarkCompleted: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  newBusiness,
  paymentQRCode,
  paymentTimer,
  onMarkCompleted,
}: PaymentDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Payment Pending
          </DialogTitle>
          <DialogDescription>
            {paymentQRCode
              ? "Scan the QR code to complete your payment"
              : "Generating payment QR code..."}
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
                <p className="text-sm font-medium">Scan with your UPI app</p>
                <p className="text-xs text-muted-foreground">
                  Time remaining: {Math.floor(paymentTimer / 60)}:
                  {(paymentTimer % 60).toString().padStart(2, "0")}
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                variant="secondary"
                onClick={onMarkCompleted}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark payment completed
              </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
