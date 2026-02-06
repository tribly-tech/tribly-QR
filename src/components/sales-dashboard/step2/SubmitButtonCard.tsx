"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { BusinessCategory, BusinessStatus } from "@/lib/types";
import { NewBusinessState } from "../types";

interface SubmitButtonCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
  businessName: string;
  isOnboarding: boolean;
  onBackToStep1: () => void;
  onClearForm: () => void;
  onSubmit: () => void;
}

export function SubmitButtonCard({
  newBusiness,
  setNewBusiness,
  businessName,
  isOnboarding,
  onBackToStep1,
  onClearForm,
  onSubmit,
}: SubmitButtonCardProps) {
  const handleClearForm = () => {
    setNewBusiness({
      name: businessName || "",
      email: "",
      phone: "",
      address: "",
      city: "",
      area: "",
      category: "" as BusinessCategory | "",
      overview: "",
      googleBusinessReviewLink: "",
      paymentPlan: "" as "qr-basic" | "qr-plus" | "",
      status: "active" as BusinessStatus,
      paymentExpiryDate: "",
      paymentStatus: undefined,
      services: [],
    });
    onClearForm();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center gap-3">
          <Button
            variant="outline"
            onClick={onBackToStep1}
            disabled={isOnboarding}
          >
            Back to Step 1
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClearForm}
              disabled={isOnboarding}
            >
              Clear Form
            </Button>
            <Button
              onClick={onSubmit}
              disabled={
                !newBusiness.name ||
                !newBusiness.email ||
                !newBusiness.category ||
                !newBusiness.paymentPlan ||
                isOnboarding
              }
              className="gap-2"
            >
              {isOnboarding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Create Business
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
