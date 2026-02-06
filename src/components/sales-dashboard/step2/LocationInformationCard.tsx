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

interface LocationInformationCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
}

export function LocationInformationCard({
  newBusiness,
  setNewBusiness,
}: LocationInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Information</CardTitle>
        <CardDescription>
          Enter the physical location of the business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="123 Main Street, Building Name"
              value={newBusiness.address}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, address: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Complete street address including building number and name
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Mumbai"
                value={newBusiness.city}
                onChange={(e) =>
                  setNewBusiness({ ...newBusiness, city: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="area">Area / Locality</Label>
              <Input
                id="area"
                placeholder="Bandra"
                value={newBusiness.area}
                onChange={(e) =>
                  setNewBusiness({ ...newBusiness, area: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
