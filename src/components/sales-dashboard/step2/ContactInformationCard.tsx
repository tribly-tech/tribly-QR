"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewBusinessState } from "../types";

interface ContactInformationCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
}

export function ContactInformationCard({
  newBusiness,
  setNewBusiness,
}: ContactInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          Provide contact details for the business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">
              Business Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@business.com"
              value={newBusiness.email}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, email: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Primary email address for business communications
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={newBusiness.phone}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, phone: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +91 for India)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
