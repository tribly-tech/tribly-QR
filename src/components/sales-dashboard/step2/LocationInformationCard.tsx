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
import { AddressAutocompleteInput } from "@/components/address-autocomplete";
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
            <AddressAutocompleteInput
              id="address"
              placeholder="Search address (e.g., 123 Main Street, Mumbai)"
              value={newBusiness.address}
              onChange={(value) =>
                setNewBusiness({ ...newBusiness, address: value })
              }
              onAddressSelect={(components) =>
                setNewBusiness((prev) => ({
                  ...prev,
                  address: components.address,
                  city: components.city,
                  area: components.area,
                  pincode: components.pincode,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Start typing to search and auto-fill address, city, area, and pincode from Google
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
          <div className="grid gap-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input
              id="pincode"
              placeholder="400001"
              value={newBusiness.pincode}
              onChange={(e) =>
                setNewBusiness({ ...newBusiness, pincode: e.target.value })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
