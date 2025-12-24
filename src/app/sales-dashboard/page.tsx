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
  ChevronDown,
  CheckCircle2,
  Crown,
  Shield,
  Check,
  Star,
  CreditCard,
  Calendar
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
    overview: "",
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
      overview: "",
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Onboard Business</h1>
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

          {/* Business Overview Section */}
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
                    onChange={(e) => setNewBusiness({ ...newBusiness, overview: e.target.value })}
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    A brief description of the business that will be displayed on the business profile
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

          {/* Business Settings Section - Google Review Link */}
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure review settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
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

          {/* Plans Section */}
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <CardDescription>
                Configure payment plan and review settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>
                    Payment Plan <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* QR-Plus Plan */}
                    <Card 
                      className={`relative cursor-pointer transition-all hover:shadow-md ${
                        newBusiness.paymentPlan === "qr-plus" ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setNewBusiness({ ...newBusiness, paymentPlan: "qr-plus" })}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                              <Crown className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-2xl">QR-Plus</CardTitle>
                                <Badge variant="secondary" className="text-xs">Premium</Badge>
                              </div>
                              <CardDescription>Advanced features for growth</CardDescription>
                              <div className="mt-1">
                                <span className="text-2xl font-bold">₹5,999</span>
                                <span className="text-sm text-muted-foreground">/year</span>
                              </div>
                            </div>
                          </div>
                          {newBusiness.paymentPlan === "qr-plus" && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">All QR-Basic Features, Plus:</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Negative Feedback Control & Care</p>
                                <p className="text-xs text-muted-foreground">Proactive management of negative reviews</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Positive Feedback Growth</p>
                                <p className="text-xs text-muted-foreground">Strategies to boost positive reviews</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">SEO Boost</p>
                                <p className="text-xs text-muted-foreground">Enhanced search engine visibility</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">AI Auto Reply</p>
                                <p className="text-xs text-muted-foreground">Intelligent automated responses</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Advanced Analytics</p>
                                <p className="text-xs text-muted-foreground">Deep insights and trend analysis</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Priority Support</p>
                                <p className="text-xs text-muted-foreground">24/7 dedicated customer support</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* QR-Basic Plan */}
                    <Card 
                      className={`relative cursor-pointer transition-all hover:shadow-md ${
                        newBusiness.paymentPlan === "qr-basic" ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setNewBusiness({ ...newBusiness, paymentPlan: "qr-basic" })}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-muted">
                              <Shield className="h-6 w-6" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl">QR-Basic</CardTitle>
                              <CardDescription>Essential features for your business</CardDescription>
                              <div className="mt-1">
                                <span className="text-2xl font-bold">₹2,499</span>
                                <span className="text-sm text-muted-foreground">/year</span>
                              </div>
                            </div>
                          </div>
                          {newBusiness.paymentPlan === "qr-basic" && (
                            <Badge variant="default" className="text-xs">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Features</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">AI Suggested Feedbacks</p>
                                <p className="text-xs text-muted-foreground">Get intelligent feedback suggestions</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Hassle-free Review Collection</p>
                                <p className="text-xs text-muted-foreground">Collect reviews in under 30 seconds</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">Dynamic Dashboard</p>
                                <p className="text-xs text-muted-foreground">Real-time insights and analytics</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-sm">No Repetition</p>
                                <p className="text-xs text-muted-foreground">Smart duplicate detection</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click on a plan card to select it. QR-Plus includes advanced features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
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
                  <Label className="text-sm font-medium text-muted-foreground">Plan Expiry Date</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">
                      Not set
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Payment will be completed after business creation
                  </p>
                </div>
                <Button
                  size="lg"
                  className="gap-2"
                  disabled={!newBusiness.paymentPlan}
                >
                  <CreditCard className="h-5 w-5" />
                  Complete Payment
                </Button>
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
                      overview: "",
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

