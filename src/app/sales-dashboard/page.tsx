"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BusinessCategory, BusinessStatus, UserRole } from "@/lib/types";
import { logout, setStoredUser, getStoredUser, getAuthToken } from "@/lib/auth";
import { generateQRCodeDataUrl } from "@/lib/qr-utils";
import { GooglePlacePrediction } from "@/lib/google-places";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// Import refactored components
import {
  DashboardHeader,
  LoadingState,
  ErrorState,
  Step1BusinessAnalysis,
  PaymentDialog,
  BasicInformationCard,
  BusinessOverviewCard,
  ContactInformationCard,
  LocationInformationCard,
  BusinessSettingsCard,
  PlansCard,
  PaymentCard,
  SubmitButtonCard,
  NewBusinessState,
  generateMockBusinessData,
} from "@/components/sales-dashboard";
import type { PlaceDetailsData } from "@/components/sales-dashboard/types";

function SalesDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(getStoredUser());

  // QR code set when user scans in BusinessSettingsCard (step 2), used in API payload
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null);

  // Get current step from URL pathname
  const getStepFromPath = (): 1 | 2 => {
    if (pathname?.includes("/step-2")) return 2;
    if (pathname?.includes("/step-1")) return 1;
    return 1;
  };

  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(getStepFromPath());

  // Sync step with URL when pathname changes
  useEffect(() => {
    const stepFromUrl = getStepFromPath();
    if (stepFromUrl !== currentStep) {
      setCurrentStep(stepFromUrl);
    }

    if (pathname === "/sales-dashboard" || pathname === "/sales-dashboard/") {
      const business = searchParams.get("business");
      const query = business
        ? `?business=${encodeURIComponent(business)}`
        : "";
      router.replace(`/sales-dashboard/step-1${query}`);
    }
  }, [pathname, router, currentStep, searchParams]);

  // Prefill business name from URL when coming from landing "Get report" flow
  useEffect(() => {
    const businessFromUrl = searchParams.get("business");
    if (businessFromUrl?.trim()) {
      setBusinessName(decodeURIComponent(businessFromUrl.trim()));
    }
  }, [searchParams]);

  // Business analysis state
  const [businessName, setBusinessName] = useState("");
  const [gbpScore, setGbpScore] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState("");
  const [selectedBusiness, setSelectedBusiness] =
    useState<GooglePlacePrediction | null>(null);

  // Form state
  const [newBusiness, setNewBusiness] = useState<NewBusinessState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    area: "",
    pincode: "",
    category: "" as BusinessCategory | "",
    overview: "",
    googleBusinessReviewLink: "",
    paymentPlan: "" as "qr-basic" | "qr-plus" | "",
    status: "active" as BusinessStatus,
    paymentExpiryDate: "",
    paymentStatus: undefined,
    services: [],
  });

  // Business search state
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState<
    BusinessCategory[]
  >([]);
  const [serviceInput, setServiceInput] = useState("");
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

  // Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showOnboardSuccessModal, setShowOnboardSuccessModal] = useState(false);
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(900);

  // Onboarding state
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardError, setOnboardError] = useState<string | null>(null);
  const [isLoadingScanData, setIsLoadingScanData] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role === "admin") {
      router.push("/dashboard/admin");
      return;
    }

    if (!currentUser.role) {
      let role: UserRole = "business";

      const userType = (currentUser.userType || "").toLowerCase().trim();
      if (userType === "admin") {
        role = "admin";
      } else if (userType === "business_qr_user") {
        role = "business";
      } else if (
        currentUser.email === "admin@tribly.com" ||
        currentUser.email === "admin@tribly.ai"
      ) {
        role = "admin";
      }

      const updatedUser = { ...currentUser, role };

      if (role === "admin") {
        setStoredUser(updatedUser);
        router.push("/dashboard/admin");
        return;
      }

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

  // Fetch place details from API
  const fetchPlaceDetails = async (
    placeId: string
  ): Promise<PlaceDetailsData | null> => {
    try {
      const params = new URLSearchParams({ place_id: placeId });
      const headers: HeadersInit = { "Content-Type": "application/json" };

      const authToken = getAuthToken();
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(
        `/api/locations/details?${params.toString()}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  // Handle Analyse button click
  const handleAnalyse = async () => {
    if (!businessName.trim()) return;

    setIsAnalyzing(true);
    try {
      // If user selected a business from suggestions, fetch its details first
      let placeDetails: PlaceDetailsData | null = null;

      if (selectedBusiness?.place_id) {
        placeDetails = await fetchPlaceDetails(selectedBusiness.place_id);

        // Set phone number if available from place details
        if (placeDetails) {
          const phoneNumber =
            placeDetails.formatted_phone_number ||
            placeDetails.international_phone_number ||
            "";
          if (phoneNumber) {
            setBusinessPhoneNumber(phoneNumber);
          }
        }
      }

      // Call GBP analyze API (backend)
      const payload: Record<string, unknown> = { business_name: businessName.trim() };
      if (placeDetails?.place_id) payload.place_id = placeDetails.place_id;
      if (placeDetails) payload.place_details = placeDetails;

      const authToken = getAuthToken();
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const res = await fetch("/api/gbp/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.error ?? json?.error ?? "Analysis failed");
      }
      const result = json?.data ?? json;
      setGbpScore(result.overallScore);

      setNewBusiness((prev) => ({ ...prev, name: businessName }));

      // business_review_url: from API or construct from place_id (https://search.google.com/local/writereview?placeid={place_id})
      const businessReviewUrl = placeDetails?.place_id
        ? `https://search.google.com/local/writereview?placeid=${placeDetails.place_id}`
        : undefined;

      sessionStorage.setItem(
        "gbpAnalysisData",
        JSON.stringify({
          overallScore: result.overallScore,
          analysisData: result.analysisData,
          businessName: businessName,
          businessPhoneNumber:
            placeDetails?.formatted_phone_number ||
            placeDetails?.international_phone_number ||
            businessPhoneNumber,
          placeDetails: placeDetails, // Store full details for later use
          business_review_url: businessReviewUrl,
        })
      );

      const reportUrl = `/sales-dashboard/analysis-report?business=${encodeURIComponent(
        businessName
      )}`;
      router.push(reportUrl);
    } catch (error) {
      console.error("Error analyzing business:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prefill step-2 fields when navigating to step-2
  // Prefill step-2 fields when navigating to step-2
  useEffect(() => {
    if (currentStep === 2) {
      // First, try to load prefill data from sessionStorage (set by analysis-report page)
      const prefillDataStr = sessionStorage.getItem("step2PrefillData");
      if (prefillDataStr) {
        try {
          const prefillData = JSON.parse(prefillDataStr);
          setNewBusiness((prev) => ({
            ...prev,
            name: prefillData.name || prev.name,
            email: prefillData.email || prev.email,
            phone: prefillData.phone || prev.phone,
            address: prefillData.address || prev.address,
            city: prefillData.city || prev.city,
            area: prefillData.area || prev.area,
            pincode: prefillData.pincode || prev.pincode,
            category: prefillData.category || prev.category,
            overview: prefillData.overview || prev.overview,
            googleBusinessReviewLink:
              prev.googleBusinessReviewLink ||
              prefillData.googleBusinessReviewLink,
            services:
              prefillData.services?.length > 0
                ? prefillData.services
                : prev.services,
          }));
          // Update businessName state if available
          if (prefillData.name) {
            setBusinessName(prefillData.name);
          }
          // Update phone number state if available
          if (prefillData.phone) {
            setBusinessPhoneNumber(prefillData.phone);
          }
          // Clear the prefill data after using it
          sessionStorage.removeItem("step2PrefillData");
          return; // Exit early, we've loaded the data
        } catch (error) {
          console.error("Error parsing step2PrefillData:", error);
        }
      }

      // Fallback: use mock data if no prefill data and we have a business name
      if (businessName) {
        const mockData = generateMockBusinessData(
          businessName,
          businessPhoneNumber
        );

        setNewBusiness((prev) => {
          if (
            prev.name !== businessName ||
            !prev.email ||
            !prev.phone ||
            !prev.address
          ) {
            return {
              ...prev,
              name: businessName || mockData.name || prev.name,
              email: prev.email || mockData.email,
              phone: prev.phone || mockData.phone || businessPhoneNumber || "",
              address: prev.address || mockData.address,
              city: prev.city || mockData.city,
              area: prev.area || mockData.area,
              pincode: prev.pincode || mockData.pincode || "",
              category: prev.category || mockData.category,
              overview: prev.overview || mockData.overview,
              googleBusinessReviewLink:
                prev.googleBusinessReviewLink ||
                mockData.googleBusinessReviewLink,
              services:
                prev.services.length > 0 ? prev.services : mockData.services,
            };
          }
          return prev;
        });
      }
    }
  }, [currentStep, businessName, businessPhoneNumber]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".service-input-container") &&
        !target.closest(".service-suggestions-dropdown")
      ) {
        setShowServiceSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch business data from scan API when a QR code was scanned (step 2)
  useEffect(() => {
    const fetchScanData = async () => {
      if (!scannedQrCode) return;

      setIsLoadingScanData(true);
      setScanError(null);

      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
        const authToken = getAuthToken();

        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(
          `${apiBaseUrl}/dashboard/v1/business_qr/scan?qr_id=${scannedQrCode}`,
          {
            method: "GET",
            headers,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch business data");
        }

        const apiResponse = await response.json();
        const qrData = apiResponse.data;

        if (qrData) {
          const businessNameFromQr = qrData.business_name || "";
          if (businessNameFromQr) {
            setBusinessName(businessNameFromQr);
          }

          setNewBusiness((prev) => ({
            ...prev,
            name: businessNameFromQr || prev.name,
            email: qrData.business_contact?.email || prev.email,
            phone: qrData.business_contact?.phone || prev.phone,
            address: qrData.business_address?.address_line1 || prev.address,
            city: qrData.business_address?.city || prev.city,
            area: qrData.business_address?.area || prev.area,
            pincode:
              qrData.business_address?.pincode ||
              qrData.business_address?.postal_code ||
              prev.pincode,
            category:
              (qrData.business_category as BusinessCategory) || prev.category,
            overview: qrData.business_description || prev.overview,
            googleBusinessReviewLink:
              qrData.business_google_review_url ||
              prev.googleBusinessReviewLink,
            paymentPlan: qrData.plan || prev.paymentPlan,
          }));
        }
      } catch (error: any) {
        console.error("Error fetching scan data:", error);
        setScanError(error.message || "Failed to load business data");
      } finally {
        setIsLoadingScanData(false);
      }
    };

    fetchScanData();
  }, [scannedQrCode]);

  // Payment timer countdown
  useEffect(() => {
    if (showPaymentDialog && paymentTimer > 0) {
      const interval = setInterval(() => {
        setPaymentTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showPaymentDialog, paymentTimer]);

  // Generate payment QR code
  useEffect(() => {
    if (showPaymentDialog && newBusiness.paymentPlan && !paymentQRCode) {
      const generatePaymentQR = async () => {
        try {
          const planPrice =
            newBusiness.paymentPlan === "qr-plus" ? "6999" : "2999";
          const planName =
            newBusiness.paymentPlan === "qr-plus" ? "QR-Plus" : "QR-Basic";
          const businessNameForQR = newBusiness.name || "New Business";

          const paymentUrl = `upi://pay?pa=tribly@pay&pn=Tribly%20QR&am=${planPrice}&cu=INR&tn=${planName}%20Subscription%20-%20${encodeURIComponent(
            businessNameForQR
          )}`;

          const qrCode = await generateQRCodeDataUrl(paymentUrl);
          setPaymentQRCode(qrCode);
          setPaymentTimer(900);
        } catch (error) {
          console.error("Error generating payment QR code:", error);
        }
      };
      generatePaymentQR();
    }
  }, [
    showPaymentDialog,
    newBusiness.paymentPlan,
    newBusiness.name,
    paymentQRCode,
  ]);

  // Reset payment state when dialog closes
  useEffect(() => {
    if (!showPaymentDialog) {
      setTimeout(() => {
        setPaymentQRCode(null);
        setPaymentTimer(900);
      }, 0);
    }
  }, [showPaymentDialog]);

  const handleCompletePayment = () => {
    if (!newBusiness.paymentPlan) return;
    setShowPaymentDialog(true);
  };

  const handleMarkPaymentCompleted = () => {
    if (!newBusiness.paymentPlan) return;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    setNewBusiness((prev) => ({
      ...prev,
      paymentExpiryDate: expiryDate.toISOString(),
      paymentStatus: "active",
    }));
    setShowPaymentDialog(false);
  };

  const handleOnboardBusiness = async () => {
    if (!user || !newBusiness.paymentPlan) return;
    if (!scannedQrCode || scannedQrCode.length !== 8) {
      setOnboardError(
        "Please scan a valid QR code (8 characters) before submitting."
      );
      return;
    }

    setIsOnboarding(true);
    setOnboardError(null);

    try {
      const authToken = getAuthToken();
      const gbpSessionId =
        (typeof window !== "undefined" &&
          sessionStorage.getItem("gbp_completed_session_id")) ||
        "";

      const payload: Record<string, unknown> = {
        qr_code: scannedQrCode,
        gbp_session_id: gbpSessionId,
        name: newBusiness.name.trim() || undefined,
        description: newBusiness.overview?.trim() || undefined,
        email: newBusiness.email.trim() || undefined,
        phone: newBusiness.phone?.trim() || undefined,
        category: newBusiness.category || undefined,
        google_review_url:
          newBusiness.googleBusinessReviewLink?.trim() || undefined,
        plan: newBusiness.paymentPlan,
      };

      if (newBusiness.services && newBusiness.services.length > 0) {
        payload.tags = newBusiness.services;
      }

      if (
        newBusiness.address?.trim() ||
        newBusiness.city?.trim() ||
        newBusiness.area?.trim() ||
        newBusiness.pincode?.trim()
      ) {
        payload.address = {
          address_line1: newBusiness.address?.trim() || undefined,
          address_line2: undefined,
          city: newBusiness.city?.trim() || undefined,
          area: newBusiness.area?.trim() || undefined,
          pincode: newBusiness.pincode?.trim() || undefined,
        };
      }

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/business/register", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to onboard business");
      }

      const businessId = data?.business_id;
      if (businessId && typeof window !== "undefined") {
        sessionStorage.setItem("last_registered_business_id", businessId);
        sessionStorage.removeItem("gbp_completed_session_id");
      }

      // Reset form on success
      setNewBusiness({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        area: "",
        pincode: "",
        category: "" as BusinessCategory | "",
        overview: "",
        googleBusinessReviewLink: "",
        paymentPlan: "" as "qr-basic" | "qr-plus" | "",
        status: "active" as BusinessStatus,
        paymentExpiryDate: "",
        paymentStatus: undefined,
        services: [],
      });

      setBusinessSearchQuery("");
      setSuggestedCategories([]);
      setServiceInput("");

      setShowOnboardSuccessModal(true);
    } catch (error: any) {
      console.error("Error onboarding business:", error);
      setOnboardError(
        error.message || "Failed to onboard business. Please try again."
      );
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setGbpScore(null);
    setBusinessPhoneNumber("");
    router.push("/sales-dashboard/step-1");
  };

  const handleClearForm = () => {
    setBusinessSearchQuery("");
    setSuggestedCategories([]);
    setServiceInput("");
    setOnboardError(null);
  };

  if (!user || user.role !== "sales-team") {
    return null;
  }

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] relative"
      style={{ isolation: "isolate" }}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Header */}
        <DashboardHeader
          user={user}
          qrId={scannedQrCode}
          onLogout={handleLogout}
        />

        {/* Loading State for Scan Data */}
        {isLoadingScanData && <LoadingState />}

        {/* Error State for Scan Data */}
        {scanError && !isLoadingScanData && <ErrorState error={scanError} />}

        {/* Two-Step Onboarding Flow */}
        {currentStep === 1 ? (
          <Step1BusinessAnalysis
            businessName={businessName}
            setBusinessName={setBusinessName}
            selectedBusiness={selectedBusiness}
            setSelectedBusiness={setSelectedBusiness}
            gbpScore={gbpScore}
            isAnalyzing={isAnalyzing}
            onAnalyse={handleAnalyse}
          />
        ) : (
          <div className="grid gap-6 mt-8">
            {/* Step 2 Header */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Step 2: Complete Business Information
                </CardTitle>
                <CardDescription>
                  Fill in the remaining business details to complete onboarding
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Step 2 Form Cards */}
            <BasicInformationCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
              suggestedCategories={suggestedCategories}
              serviceInput={serviceInput}
              setServiceInput={setServiceInput}
              showServiceSuggestions={showServiceSuggestions}
              setShowServiceSuggestions={setShowServiceSuggestions}
              isLoadingScanData={isLoadingScanData}
            />

            <BusinessOverviewCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
            />

            <ContactInformationCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
            />

            <LocationInformationCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
            />

            <BusinessSettingsCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
              scannedQrCode={scannedQrCode}
              onQrCodeScanned={setScannedQrCode}
              onQrCodeCleared={() => setScannedQrCode(null)}
            />

            <PlansCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
            />

            <PaymentCard
              newBusiness={newBusiness}
              onCompletePayment={handleCompletePayment}
            />

            {/* Error Display */}
            {onboardError && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {onboardError}
                  </div>
                </CardContent>
              </Card>
            )}

            <SubmitButtonCard
              newBusiness={newBusiness}
              setNewBusiness={setNewBusiness}
              businessName={businessName}
              isOnboarding={isOnboarding}
              onBackToStep1={handleBackToStep1}
              onClearForm={handleClearForm}
              onSubmit={handleOnboardBusiness}
            />
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        newBusiness={newBusiness}
        paymentQRCode={paymentQRCode}
        paymentTimer={paymentTimer}
        onMarkCompleted={handleMarkPaymentCompleted}
      />

      {/* Onboard Success Modal */}
      <Dialog
        open={showOnboardSuccessModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowOnboardSuccessModal(false);
            setCurrentStep(1);
            setGbpScore(null);
            setBusinessPhoneNumber("");
            router.push("/sales-dashboard/step-1");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Successfully onboarded
            </DialogTitle>
            <DialogDescription>
              The business has been onboarded successfully. You can now start onboarding another business.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowOnboardSuccessModal(false);
                setCurrentStep(1);
                setGbpScore(null);
                setBusinessPhoneNumber("");
                router.push("/sales-dashboard/step-1");
              }}
            >
              Back to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SalesDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen w-full bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center relative"
          style={{ isolation: "isolate" }}
        >
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SalesDashboardContent />
    </Suspense>
  );
}
