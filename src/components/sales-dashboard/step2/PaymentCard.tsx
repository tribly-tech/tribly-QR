"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Calendar } from "lucide-react";
import { NewBusinessState } from "../types";

interface PaymentCardProps {
  newBusiness: NewBusinessState;
  onCompletePayment: () => void;
}

export function PaymentCard({
  newBusiness,
  onCompletePayment,
}: PaymentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Plan Expiry Date
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {newBusiness.paymentExpiryDate
                  ? new Date(newBusiness.paymentExpiryDate).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "Not set"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {newBusiness.paymentStatus === "active"
                ? "Payment completed successfully"
                : "Click 'Complete Payment' to process payment"}
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            disabled={!newBusiness.paymentPlan}
            onClick={onCompletePayment}
          >
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
