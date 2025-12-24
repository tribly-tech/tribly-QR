"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { addBusiness } from "@/lib/mock-data";
import { BusinessStatus, BusinessCategory } from "@/lib/types";
import { logout, setStoredUser, getStoredUser } from "@/lib/auth";
import { 
  LogOut,
  User,
  ChevronDown,
  CheckCircle2
} from "lucide-react";

export default function SalesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    
    // Redirect admin users to regular dashboard
    if (currentUser.role === "admin") {
      router.push("/dashboard");
      return;
    }
    
    // Ensure user has role property
    if (!currentUser.role) {
      const updatedUser = {
        ...currentUser,
        role: "sales-team",
      };
      setStoredUser(updatedUser);
      setUser(updatedUser);
    } else {
      setUser(currentUser);
    }
    
  }, [router]);

  const handleLogout = async () => {
    await logout();
    setStoredUser(null);
    router.push("/login");
  };


  const [newBusiness, setNewBusiness] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    category: "" as BusinessCategory | "",
    googleBusinessReviewLink: "",
    paymentPlan: "" as "qr-basic" | "qr-plus" | "",
    status: "active" as BusinessStatus,
  });


  const handleOnboardBusiness = () => {
    if (!user) return;
    
    // Create business with salesTeamId
    const businessData = {
      ...newBusiness,
      salesTeamId: user.id,
      feedbackTone: "professional" as const,
      autoReplyEnabled: false,
    };
    
    addBusiness(businessData);
    
    // Reset form
    setNewBusiness({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      area: "",
      category: "" as BusinessCategory | "",
      googleBusinessReviewLink: "",
      paymentPlan: "" as "qr-basic" | "qr-plus" | "",
      status: "active" as BusinessStatus,
    });
    
    // Show success message (you can add a toast notification here)
    alert("Business onboarded successfully!");
  };


  if (!user || user.role !== "sales-team") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Onboard New Business</h1>
            <p className="text-muted-foreground">Fill in the business details to onboard a new client</p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>

        {/* Onboarding Form */}
        <div className="grid gap-6 mt-8">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the essential details about the business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., The Coffee House"
                    value={newBusiness.name}
                    onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the official business name as it appears on legal documents
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">
                    Business Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newBusiness.category}
                    onValueChange={(value) => setNewBusiness({ ...newBusiness, category: value as BusinessCategory })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select business category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="beauty">Beauty</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select the primary category that best describes the business
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Section */}
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
                    onChange={(e) => setNewBusiness({ ...newBusiness, email: e.target.value })}
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
                    onChange={(e) => setNewBusiness({ ...newBusiness, phone: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +91 for India)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information Section */}
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
                    onChange={(e) => setNewBusiness({ ...newBusiness, address: e.target.value })}
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
                      onChange={(e) => setNewBusiness({ ...newBusiness, city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="area">Area / Locality</Label>
                    <Input
                      id="area"
                      placeholder="Bandra"
                      value={newBusiness.area}
                      onChange={(e) => setNewBusiness({ ...newBusiness, area: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure payment plan and review settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="payment-plan">
                    Payment Plan <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newBusiness.paymentPlan}
                    onValueChange={(value) => setNewBusiness({ ...newBusiness, paymentPlan: value as "qr-basic" | "qr-plus" })}
                  >
                    <SelectTrigger id="payment-plan">
                      <SelectValue placeholder="Select a payment plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qr-basic">QR-Basic</SelectItem>
                      <SelectItem value="qr-plus">QR-Plus</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the subscription plan for this business. QR-Plus includes advanced features.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="google-review-link">Google Business Review Link</Label>
                  <Input
                    id="google-review-link"
                    type="url"
                    placeholder="https://g.page/r/your-business/review"
                    value={newBusiness.googleBusinessReviewLink}
                    onChange={(e) => setNewBusiness({ ...newBusiness, googleBusinessReviewLink: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Add your Google Business review link to redirect customers after they submit feedback
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewBusiness({
                      name: "",
                      email: "",
                      phone: "",
                      address: "",
                      city: "",
                      area: "",
                      category: "" as BusinessCategory | "",
                      googleBusinessReviewLink: "",
                      paymentPlan: "" as "qr-basic" | "qr-plus" | "",
                      status: "active" as BusinessStatus,
                    });
                  }}
                >
                  Clear Form
                </Button>
                <Button
                  onClick={handleOnboardBusiness}
                  disabled={!newBusiness.name || !newBusiness.email || !newBusiness.category || !newBusiness.paymentPlan}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Create Business
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

