"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NewBusinessState } from "../types";

interface BusinessOverviewCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
}

export function BusinessOverviewCard({
  newBusiness,
  setNewBusiness,
}: BusinessOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Overview</CardTitle>
        <CardDescription>
          Provide a brief description of the business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="overview">Business Overview</Label>
            <Textarea
              id="overview"
              placeholder="Describe the business, its services, specialties, and what makes it unique..."
              value={newBusiness.overview}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, overview: e.target.value })
              }
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              A brief description of the business that will be displayed on the
              business profile
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
