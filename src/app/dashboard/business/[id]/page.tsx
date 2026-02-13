"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockBusinesses, getReviewsByBusinessId } from "@/lib/mock-data";
import { Business, BusinessCategory, ReviewCategory, Review } from "@/lib/types";
import { generateShortUrlCode, generateReviewUrl, generateQRCodeDataUrl, downloadQRCodeAsPNG } from "@/lib/qr-utils";
import { getBusinessBySlug } from "@/lib/business-slug";
import { getStoredUser, logout, setStoredUser, getAuthToken } from "@/lib/auth";
import { BUSINESS_MAIN_TABS, BUSINESS_SETTINGS_SUB_TABS } from "@/lib/routes";
import { categorySuggestions, serviceSuggestions } from "@/lib/category-suggestions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { OverviewTab } from "@/components/dashboard/business/OverviewTab";
import { KeywordsTab } from "@/components/dashboard/business/KeywordsTab";
import { GBPHealthTab } from "@/components/dashboard/business/GBPHealthTab";
import { RecommendedActionsTab } from "@/components/dashboard/business/RecommendedActionsTab";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Plus,
  X,
  XCircle,
  Clock,
  Download,
  Copy,
  ExternalLink,
  Shield,
  Crown,
  MessageSquare,
  Bot,
  Star,
  Check,
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  LogOut,
  Loader2,
  AlertCircle,
  LayoutDashboard,
  Target,
  Lightbulb,
  Settings,
  Link2,
} from "lucide-react";

const DEFAULT_TAB: (typeof BUSINESS_MAIN_TABS)[number] = "overview";
const DEFAULT_SETTINGS_SUB: (typeof BUSINESS_SETTINGS_SUB_TABS)[number] = "business-info";

const MOBILE_MAIN_TAB_ITEMS: Array<{
  value: (typeof BUSINESS_MAIN_TABS)[number];
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}> = [
  { value: "overview", label: "Overview", shortLabel: "Overview", icon: LayoutDashboard },
  { value: "gmb-health", label: "Business Health", shortLabel: "Health", icon: Target },
  { value: "recommended-actions", label: "Actions", shortLabel: "Actions", icon: Lightbulb },
  { value: "reviews", label: "Reviews", shortLabel: "Reviews", icon: Star },
  { value: "settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

export default function BusinessDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const businessSlug = params.id as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [settingsSubTab, setSettingsSubTab] = useState(DEFAULT_SETTINGS_SUB);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [reviewUrl, setReviewUrl] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedReviewFilter, setSelectedReviewFilter] = useState<ReviewCategory | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [suggestionsLimit, setSuggestionsLimit] = useState(12);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "expired">("pending");
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 minutes in seconds
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [website, setWebsite] = useState<string>("");
  const [isQRId, setIsQRId] = useState(false);
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [businessServiceInput, setBusinessServiceInput] = useState("");
  const [showBusinessServiceSuggestions, setShowBusinessServiceSuggestions] = useState(false);

  const suggestedCategories = useMemo(
    () => Object.keys(categorySuggestions) as BusinessCategory[],
    [],
  );

  // Sync tab state from URL (deep links, refresh, back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab");
    // Redirect legacy ?tab=keywords to Settings > Keywords
    if (tab === "keywords") {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("tab", "settings");
      next.set("sub", "keywords");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      return;
    }
    const mainTab: (typeof BUSINESS_MAIN_TABS)[number] =
      tab && BUSINESS_MAIN_TABS.includes(tab as (typeof BUSINESS_MAIN_TABS)[number]) ? (tab as (typeof BUSINESS_MAIN_TABS)[number]) : DEFAULT_TAB;
    setActiveTab(mainTab);
    if (mainTab === "settings") {
      const sub = searchParams.get("sub");
      const subTab: (typeof BUSINESS_SETTINGS_SUB_TABS)[number] =
        sub && BUSINESS_SETTINGS_SUB_TABS.includes(sub as (typeof BUSINESS_SETTINGS_SUB_TABS)[number]) ? (sub as (typeof BUSINESS_SETTINGS_SUB_TABS)[number]) : DEFAULT_SETTINGS_SUB;
      setSettingsSubTab(subTab);
    }
  }, [searchParams, pathname, router]);

  const handleMainTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", value);
    if (value === "settings") {
      if (!next.has("sub")) next.set("sub", DEFAULT_SETTINGS_SUB);
    } else {
      next.delete("sub");
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSettingsSubChange = (value: string) => {
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", "settings");
    next.set("sub", value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const businessServiceSuggestions = useMemo(() => {
    if (!business?.category) return [];
    return serviceSuggestions[business.category as BusinessCategory] || [];
  }, [business?.category]);

  // Close business service suggestions on outside tap/click
  useEffect(() => {
    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".service-input-container") &&
        !target.closest(".service-suggestions-dropdown")
      ) {
        setShowBusinessServiceSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideInteraction);
    document.addEventListener("touchstart", handleOutsideInteraction, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleOutsideInteraction);
      document.removeEventListener("touchstart", handleOutsideInteraction);
    };
  }, []);

  useEffect(() => {
    const loadBusinessData = async () => {
      // First, try to find business by slug (existing businesses)
      let businessData = getBusinessBySlug(businessSlug, mockBusinesses);

      // If not found by slug, try as ID (for backward compatibility)
      if (!businessData) {
        businessData = mockBusinesses.find(b => b.id === businessSlug) || undefined;
      }

      // If still not found, treat it as a QR ID and fetch from API
      if (!businessData) {
        setIsQRId(true);
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";
          const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/scan?qr_id=${businessSlug}`);

          if (!response.ok) {
            console.error("Failed to fetch business QR data");
            setIsLoading(false);
            return;
          }

          const apiResponse = await response.json();
          const qrData = apiResponse.data;

          // Map API response to Business type
          const mappedBusiness: Business = {
            id: businessSlug,
            name: qrData.business_name || "",
            status: "active",
            category: (qrData.business_category as BusinessCategory) || "other",
            email: qrData.business_contact?.email || "",
            phone: qrData.business_contact?.phone || "",
            address: qrData.business_address?.address_line1 || "",
            city: qrData.business_address?.city || "",
            area: qrData.business_address?.area || "",
            pincode: qrData.business_address?.pincode || qrData.business_address?.postal_code || "",
            overview: qrData.business_description || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewUrl: qrData.business_review_url || "",
            googleBusinessReviewLink: qrData.business_google_review_url || "",
            keywords: Array.isArray(qrData.business_tags) ? qrData.business_tags : [],
            feedbackTone: "professional",
            autoReplyEnabled: false,
            paymentPlan: (qrData.plan === "qr-plus" || qrData.plan === "qr-basic") ? qrData.plan : undefined,
            totalReviews: 0,
            activeReviews: 0,
            inactiveReviews: 0,
            reviewsInQueue: 0,
          };

          setBusiness(mappedBusiness);
          setWebsite(qrData.business_website || "");
          setReviewUrl(qrData.business_review_url || "");

          // Use business_qr_code_url from API if available, otherwise generate QR code
          if (qrData.business_qr_code_url) {
            setQrCodeDataUrl(qrData.business_qr_code_url);
            setBusiness((prev) => prev ? { ...prev, qrCodeUrl: qrData.business_qr_code_url } : null);
          } else if (qrData.business_review_url) {
            // Fallback: Generate QR code if review URL exists but no QR code URL provided
            generateQRCodeDataUrl(qrData.business_review_url).then((dataUrl) => {
              setQrCodeDataUrl(dataUrl);
              setBusiness((prev) => prev ? { ...prev, qrCodeUrl: dataUrl } : null);
            }).catch((error) => {
              console.error("Error generating QR code:", error);
            });
          }

          const user = getStoredUser();
          setCurrentUser(user);
          setIsLoading(false);

          // Fetch manual reviews from API
          await fetchManualReviews(businessSlug);
          return;
        } catch (error) {
          console.error("Error fetching business QR data:", error);
          setIsLoading(false);
          return;
        }
      }

      // Existing business logic
      if (businessData) {
        setBusiness(businessData);

        // Check if logged-in user is the business owner
        const user = getStoredUser();
        if (user && user.role === "business" && user.businessId === businessData.id) {
          setIsBusinessOwner(true);
        }
        setCurrentUser(user);

        // Generate unique review URL and QR code
        const code = generateShortUrlCode(businessData.id);
        const url = generateReviewUrl(code);
        setReviewUrl(url);

        // Generate QR code
        generateQRCodeDataUrl(url).then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
          // Update business with review URL and QR code
          setBusiness((prev) => prev ? { ...prev, reviewUrl: url, qrCodeUrl: dataUrl } : null);
        }).catch((error) => {
          console.error("Error generating QR code:", error);
        });
      } else {
        // Business not found, redirect based on user role
        const user = getStoredUser();
        if (user && user.role === "business") {
          // Business owner trying to access non-existent business, redirect to login
          router.push("/login");
        } else {
        router.push("/dashboard");
        }
      }
      setIsLoading(false);
    };

    loadBusinessData();
  }, [businessSlug, router]);

  // Reset suggestions limit when business or keywords change
  useEffect(() => {
    setSuggestionsLimit(12);
  }, [business?.id, business?.keywords]);

  // Payment timer countdown
  useEffect(() => {
    if (showPaymentDialog && paymentStatus === "pending" && paymentTimer > 0) {
      const interval = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            setPaymentStatus("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showPaymentDialog, paymentStatus, paymentTimer]);

  // Simulate payment verification (polling)
  useEffect(() => {
    if (showPaymentDialog && paymentStatus === "pending" && paymentSessionId) {
      // Simulate payment verification - in real app, this would poll your payment gateway
      const checkPayment = async () => {
        // Simulate random payment success after 5-10 seconds
        const delay = Math.random() * 5000 + 5000;
        setTimeout(() => {
          // 90% success rate for demo
          if (Math.random() > 0.1) {
            setPaymentStatus("success");
            // Update business with new expiry date (1 year from now)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            handleUpdateBusiness({
              paymentExpiryDate: expiryDate.toISOString(),
              paymentStatus: "active",
            });
            setToastMessage("Payment processed successfully!");
            setShowToast(true);
          } else {
            setPaymentStatus("failed");
          }
        }, delay);
      };
      checkPayment();
    }
  }, [showPaymentDialog, paymentStatus, paymentSessionId]);

  // Generate payment QR code when dialog opens
  useEffect(() => {
    if (showPaymentDialog && business && !paymentQRCode) {
      const generatePaymentQR = async () => {
        try {
          const planPrice = business.paymentPlan === "qr-plus" ? "6999" : "2999";
          const planName = business.paymentPlan === "qr-plus" ? "QR-Plus" : "QR-Basic";
          const sessionId = `payment-${business.id}-${Date.now()}`;
          setPaymentSessionId(sessionId);

          // Generate UPI payment URL (format: upi://pay?pa=merchant@upi&pn=MerchantName&am=Amount&cu=INR&tn=TransactionNote)
          // For demo, we'll use a generic payment URL
          const paymentUrl = `upi://pay?pa=tribly@pay&pn=Tribly%20QR&am=${planPrice}&cu=INR&tn=${planName}%20Subscription%20-%20${business.name}`;

          const qrCode = await generateQRCodeDataUrl(paymentUrl);
          setPaymentQRCode(qrCode);
          setPaymentStatus("pending");
          setPaymentTimer(900); // Reset to 15 minutes
        } catch (error) {
          console.error("Error generating payment QR code:", error);
          setPaymentStatus("failed");
        }
      };
      generatePaymentQR();
    }
  }, [showPaymentDialog, business, paymentQRCode]);

  // Reset payment state when dialog closes
  useEffect(() => {
    if (!showPaymentDialog) {
      // Reset after a delay to allow success state to be visible
      setTimeout(() => {
        setPaymentQRCode(null);
        setPaymentStatus("pending");
        setPaymentTimer(900);
        setPaymentSessionId(null);
      }, paymentStatus === "success" ? 2000 : 0);
    }
  }, [showPaymentDialog, paymentStatus]);

  // Fetch manual reviews from API
  const fetchManualReviews = async (qrId: string) => {
    setIsLoadingReviews(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

      // Get auth token
      const authToken = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token to headers if available
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/manual_reviews?qr_id=${qrId}`, {
        headers,
      });

      if (!response.ok) {
        console.error("Failed to fetch manual reviews");
        setIsLoadingReviews(false);
        return;
      }

      const apiResponse = await response.json();
      // API returns array directly or wrapped in data property
      const reviewsData = Array.isArray(apiResponse) ? apiResponse : (apiResponse.data || apiResponse.reviews || []);

      // Map API response to Review type
      const mappedReviews: Review[] = reviewsData.map((review: any, index: number) => {
        // Parse contact - could be email or phone
        const contact = review.contact || "";
        const isEmail = contact.includes("@");

        return {
          id: `api-review-${index}-${review.created_at || Date.now()}`,
          businessId: qrId,
          rating: "need-improvement" as const, // Manual reviews are from "Need Improvement" rating
          feedback: review.feedback || "",
          category: "customer-experience" as ReviewCategory, // Default category
          customerName: review.name || "",
          customerEmail: isEmail ? contact : undefined,
          customerPhone: !isEmail ? contact : undefined,
          status: "pending" as const,
          autoReplySent: false,
          createdAt: review.created_at || new Date().toISOString(),
        };
      });

      setApiReviews(mappedReviews);
    } catch (error) {
      console.error("Error fetching manual reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // Get all reviews for the business
  const allReviews = useMemo(() => {
    if (!business) return [];
    // If it's a QR ID, use API reviews (even if empty), otherwise use mock reviews
    if (isQRId) {
      return apiReviews;
    }
    return getReviewsByBusinessId(business.id);
  }, [business, isQRId, apiReviews]);

  // Filter reviews based on selected category
  const filteredReviews = useMemo(() => {
    if (!selectedReviewFilter) return allReviews;
    return allReviews.filter((review) => review.category === selectedReviewFilter);
  }, [allReviews, selectedReviewFilter]);

  const handleUpdateBusiness = (updates: Partial<Business>) => {
    if (business) {
      setBusiness({ ...business, ...updates });
    }
  };

  const sendKeywordsToAPI = async (keywords: string[]) => {
    if (!isQRId || !business) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

      // Prepare payload with tags as array of strings
      const payload: any = {
        name: business.name,
        description: business.overview || null,
        website: website || null,
        email: business.email || null,
        phone: business.phone || null,
        category: business.category || null,
        google_review_url: business.googleBusinessReviewLink || null,
        business_id: businessSlug,
        tags: keywords, // Send keywords as tags array
      };

      // Only include address if address_line1 is provided (required field)
      if (business.address) {
        payload.address = {
          address_line1: business.address,
          address_line2: null,
          city: business.city || "",
          area: business.area || "",
        };
      }

      // Get auth token
      const authToken = getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token to headers if available
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/configure_qr`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save keywords");
      }
    } catch (error) {
      console.error("Error sending keywords to API:", error);
      // Don't show error toast on every keyword add/remove to avoid spam
    }
  };

  const handleAddKeyword = async () => {
    if (newKeyword.trim() && business) {
      const trimmedKeyword = newKeyword.trim();
      const currentKeywords = business.keywords || [];

      // Check if keyword already exists (case-insensitive)
      if (currentKeywords.some(k => k.toLowerCase() === trimmedKeyword.toLowerCase())) {
        setToastMessage("Keyword already exists");
        setShowToast(true);
        return;
      }

      const updatedKeywords = [...currentKeywords, trimmedKeyword];
      handleUpdateBusiness({
        keywords: updatedKeywords
      });
      setNewKeyword("");

      // Send keywords to API
      await sendKeywordsToAPI(updatedKeywords);
    }
  };

  const handleRemoveKeyword = async (keywordToRemove: string) => {
    if (business && business.keywords) {
      const updatedKeywords = business.keywords.filter(k => k !== keywordToRemove);
      handleUpdateBusiness({
        keywords: updatedKeywords
      });

      // Send updated keywords to API
      await sendKeywordsToAPI(updatedKeywords);
    }
  };

  // Get service suggestions based on category
  // Generate SEO-optimized suggested keywords based on business category, location, and name
  const suggestedKeywords = useMemo(() => {
    if (!business) return [];

    const suggestions: string[] = [];
    const currentKeywords = business.keywords || [];

    // SEO-focused category-based keyword suggestions
    const categoryKeywords: Record<string, string[]> = {
      restaurant: [
        "best restaurant", "top dining", "authentic cuisine", "fine dining",
        "family restaurant", "casual dining", "restaurant near me",
        "local restaurant", "popular restaurant", "restaurant reviews",
        "delicious food", "fresh ingredients", "chef special", "menu items"
      ],
      retail: [
        "best shop", "top store", "quality products", "affordable prices",
        "retail store near me", "local shop", "popular store",
        "best deals", "shopping destination", "product reviews",
        "customer service", "wide selection", "premium quality"
      ],
      healthcare: [
        "best clinic", "top doctor", "medical care", "health services",
        "healthcare near me", "experienced doctor", "quality treatment",
        "patient care", "medical consultation", "health checkup",
        "professional medical", "trusted healthcare", "expert doctor"
      ],
      beauty: [
        "best salon", "top beauty", "professional styling", "beauty services",
        "salon near me", "skincare treatment", "hair salon", "beauty spa",
        "makeup services", "beauty experts", "luxury salon", "beauty care"
      ],
      fitness: [
        "best gym", "top fitness", "personal training", "fitness center",
        "gym near me", "workout facility", "fitness classes", "health club",
        "exercise training", "fitness experts", "modern gym", "fitness programs"
      ],
      automotive: [
        "best auto service", "top garage", "car repair", "auto maintenance",
        "automotive near me", "car service center", "vehicle repair",
        "auto experts", "quality service", "trusted mechanic", "car care"
      ],
      "real-estate": [
        "best real estate", "top property", "real estate agent", "property listings",
        "real estate near me", "home for sale", "property investment",
        "realty services", "property experts", "housing solutions", "real estate agency"
      ],
      education: [
        "best school", "top education", "quality education", "learning center",
        "education near me", "expert teachers", "educational programs",
        "academic excellence", "student success", "education services", "learning academy"
      ],
      hospitality: [
        "best hotel", "top accommodation", "luxury stay", "hotel booking",
        "hotel near me", "comfortable stay", "hospitality services",
        "guest services", "quality accommodation", "popular hotel", "hotel reviews"
      ],
      other: [
        "best service", "top business", "quality service", "professional service",
        "service near me", "trusted business", "customer satisfaction",
        "expert service", "reliable business", "quality work", "professional team"
      ]
    };

    // Add category-based SEO keywords
    if (business.category && categoryKeywords[business.category]) {
      suggestions.push(...categoryKeywords[business.category]);
    }

    // Add high-value location-based SEO keywords
    if (business.city) {
      const cityName = business.city;
      const categoryName = business.category.charAt(0).toUpperCase() + business.category.slice(1);

      // Long-tail location keywords (high SEO value)
      suggestions.push(
        `best ${business.category} in ${cityName}`,
        `top ${business.category} ${cityName}`,
        `${business.category} ${cityName}`,
        `${categoryName} near ${cityName}`,
        `${business.category} ${cityName} reviews`
      );

      if (business.area) {
        suggestions.push(
          `best ${business.category} ${business.area}`,
          `${business.category} in ${business.area}`,
          `${business.area} ${business.category}`,
          `${business.category} near ${business.area} ${cityName}`
        );
      }
    }

    // Add business name-based SEO keywords
    const nameWords = business.name.toLowerCase().split(/\s+/);
    if (nameWords.length > 0) {
      const businessName = business.name;
      suggestions.push(
        `${businessName} reviews`,
        `${businessName} ${business.category}`,
        `visit ${businessName}`,
        `${businessName} location`
      );
    }

    // Add high-intent action keywords
    suggestions.push(
      "book now",
      "contact us",
      "get quote",
      "visit us",
      "call today"
    );

    // Filter out keywords that are already added (case-insensitive)
    const filtered = suggestions.filter(
      keyword => !currentKeywords.some(k => k.toLowerCase() === keyword.toLowerCase())
    );

    // Return all filtered suggestions (will be limited in display)
    return filtered;
  }, [business]);

  // Display limited suggestions based on suggestionsLimit
  const displayedSuggestions = useMemo(() => {
    return suggestedKeywords.slice(0, suggestionsLimit);
  }, [suggestedKeywords, suggestionsLimit]);

  const handleSaveChanges = async (section: string) => {
    if (!business) return;

    // If it's a QR ID, save via API
    if (isQRId) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

        // Prepare payload according to API specification
        const payload: any = {
          name: business.name,
          description: business.overview || null,
          website: website || null,
          email: business.email || null,
          phone: business.phone || null,
          category: business.category || null,
          google_review_url: business.googleBusinessReviewLink || null,
          business_id: businessSlug,
        };

        // Include tags (keywords) when saving keywords section
        if (section === "Keywords") {
          payload.tags = business.keywords || [];
        }

        // Include services when saving business information
        if (section === "Business information" && business.services && business.services.length > 0) {
          payload.services = business.services;
        }

        // Only include address if address_line1 is provided (required field)
        if (business.address) {
          payload.address = {
            address_line1: business.address,
            address_line2: null,
            city: business.city || "",
            area: business.area || "",
            pincode: business.pincode || "",
          };
        }

        // Get auth token
        const authToken = getAuthToken();
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // Add auth token to headers if available
        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${apiBaseUrl}/dashboard/v1/business_qr/configure_qr`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save business QR configuration");
        }

        setToastMessage(`${section} saved successfully!`);
        setShowToast(true);
      } catch (error) {
        console.error("Error saving business QR configuration:", error);
        setToastMessage(error instanceof Error ? error.message : "Failed to save changes");
        setShowToast(true);
      }
    } else {
      setToastMessage(`${section} saved successfully!`);
      setShowToast(true);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Copied to clipboard!");
      setShowToast(true);
    } catch (err) {
      console.error("Failed to copy text:", err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          setToastMessage("Copied to clipboard!");
          setShowToast(true);
        } else {
          setToastMessage("Failed to copy to clipboard");
          setShowToast(true);
        }
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        setToastMessage("Failed to copy to clipboard");
        setShowToast(true);
      }
    }
  };

  const handleDownloadQR = async () => {
    if (qrCodeDataUrl && business) {
      const filename = `${business.name.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;

      // If it's a data URL, use it directly
      if (qrCodeDataUrl.startsWith("data:")) {
        downloadQRCodeAsPNG(qrCodeDataUrl, filename);
      } else {
        // If it's a regular URL, fetch it and convert to blob for download
        try {
          const response = await fetch(qrCodeDataUrl);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = filename;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error("Error downloading QR code:", error);
          // Fallback: try direct download
          const link = document.createElement("a");
          link.download = filename;
          link.href = qrCodeDataUrl;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Business Not Found</CardTitle>
            <CardDescription>The business you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            {currentUser?.userType !== "business_qr_user" && (
              <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: Business["status"]) => {
    const variants = {
      active: "default",
      inactive: "secondary",
    } as const;

    const icons = {
      active: <CheckCircle2 className="h-3 w-3 mr-1" />,
      inactive: <XCircle className="h-3 w-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleLogout = async () => {
    await logout();
    setStoredUser(null);
    router.push("/login");
  };

  const activeMobileTabItem = MOBILE_MAIN_TAB_ITEMS.find((item) => item.value === activeTab) ?? MOBILE_MAIN_TAB_ITEMS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto max-w-7xl px-3 pb-[calc(88px+env(safe-area-inset-bottom))] pt-3 md:px-4 md:py-8">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          {!isBusinessOwner && currentUser?.userType !== "business_qr_user" && (
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          )}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                <img src="/icon.png" alt="" className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-white/10 to-transparent" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-semibold">{business.name}</h1>
                  {getStatusBadge(business.status)}
                </div>
                <p className="text-xs font-medium text-muted-foreground">powered by tribly.ai</p>
              </div>
            </div>
            {currentUser && (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header - clean, minimal top bar */}
        <div className="md:hidden">
          <div className="sticky top-0 z-30 -mx-3 mb-3 px-3 pb-2 pt-2.5">
            <div className="rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                {!isBusinessOwner && currentUser?.userType !== "business_qr_user" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/dashboard")}
                    className="h-9 w-9 rounded-full text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/60"
                    aria-label="Back to dashboard"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-border/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]">
                  <img src="/icon.png" alt="" className="h-full w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/50 via-white/10 to-transparent" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold leading-tight text-foreground">{business.name}</h1>
                  <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">powered by tribly.ai</p>
                </div>
              </div>
                <div className="flex items-center gap-1.5">
                  {currentUser && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-9 w-9 rounded-full border border-slate-200 bg-white/80 text-muted-foreground hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/60"
                      aria-label="Logout"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                      >
                        <path
                          d="M13.5628 11.4375H12.4644C12.3894 11.4375 12.3191 11.4703 12.2722 11.5281C12.1628 11.661 12.0457 11.7891 11.9222 11.911C11.4174 12.4163 10.8194 12.8191 10.1613 13.0969C9.4795 13.3849 8.7467 13.5326 8.0066 13.5313C7.25816 13.5313 6.53316 13.3844 5.85191 13.0969C5.19382 12.8191 4.59582 12.4163 4.09097 11.911C3.58522 11.4073 3.18194 10.8103 2.90347 10.1531C2.61441 9.4719 2.4691 8.74846 2.4691 8.00002C2.4691 7.25159 2.61597 6.52815 2.90347 5.8469C3.1816 5.18909 3.5816 4.5969 4.09097 4.08909C4.60035 3.58127 5.19254 3.18127 5.85191 2.90315C6.53316 2.61565 7.25816 2.46877 8.0066 2.46877C8.75504 2.46877 9.48003 2.61409 10.1613 2.90315C10.8207 3.18127 11.4128 3.58127 11.9222 4.08909C12.0457 4.21252 12.1613 4.34065 12.2722 4.4719C12.3191 4.52971 12.391 4.56252 12.4644 4.56252H13.5628C13.6613 4.56252 13.7222 4.45315 13.6675 4.37034C12.4691 2.50784 10.3722 1.27502 7.98941 1.28127C4.24566 1.29065 1.2441 4.32971 1.2816 8.06877C1.3191 11.7485 4.31597 14.7188 8.0066 14.7188C10.3832 14.7188 12.4707 13.4875 13.6675 11.6297C13.7207 11.5469 13.6613 11.4375 13.5628 11.4375ZM14.9519 7.90159L12.7347 6.15159C12.6519 6.08596 12.5316 6.14534 12.5316 6.25002V7.43752H7.62535C7.5566 7.43752 7.50035 7.49377 7.50035 7.56252V8.43752C7.50035 8.50627 7.5566 8.56252 7.62535 8.56252H12.5316V9.75002C12.5316 9.85471 12.6535 9.91409 12.7347 9.84846L14.9519 8.09846C14.9669 8.08677 14.9789 8.07183 14.9872 8.05477C14.9956 8.03772 14.9999 8.019 14.9999 8.00002C14.9999 7.98105 14.9956 7.96233 14.9872 7.94527C14.9789 7.92822 14.9669 7.91328 14.9519 7.90159Z"
                          fill="currentColor"
                        />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleMainTabChange} className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <TabsList className="hidden h-fit w-full flex-col space-y-1 rounded-lg border border-purple-100 bg-white/80 p-2 shadow-sm backdrop-blur-sm md:flex md:w-64">
            <TabsTrigger
              value="overview"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <LayoutDashboard className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Overview</span>
                  <span className="text-xs opacity-70">Unified performance snapshot</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="gmb-health"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <Target className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Google Business Health</span>
                  <span className="text-xs opacity-70">Profile performance</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="recommended-actions"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <Lightbulb className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Recommended Actions</span>
                  <span className="text-xs opacity-70">Priority improvements</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <Star className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Reviews</span>
                  <span className="text-xs opacity-70">Customer feedback</span>
                </div>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <Settings className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Settings</span>
                  <span className="text-xs opacity-70">Business, links, payment</span>
                </div>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="min-w-0 flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <OverviewTab
              businessName={business?.name}
              businessId={business?.id ?? businessSlug}
              isLoading={isLoading}
              onViewGbpReport={() => handleMainTabChange("gmb-health")}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-0">
            <Tabs value={settingsSubTab} onValueChange={handleSettingsSubChange} className="w-full">
              {/* Settings sub-tabs */}
              {/* Desktop: 5-column grid (Business Info, Keywords, Links, Auto Reply, Payment) */}
              <div className="hidden md:block">
                <div className="rounded-xl border border-border/80 bg-white p-1.5 shadow-sm">
                  <TabsList className="grid h-auto w-full grid-cols-5 gap-1.5 border-0 bg-transparent p-0 shadow-none">
                    <TabsTrigger
                      value="business-info"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      <span>Business Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="keywords"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Hash className="h-4 w-4 shrink-0" />
                      <span>Keywords</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="links"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Link2 className="h-4 w-4 shrink-0" />
                      <span>Links & QR</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="auto-reply"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Bot className="h-4 w-4 shrink-0" />
                      <span>Auto Reply</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span>Payment</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Mobile: horizontally scrollable "carousel" tabs with full labels */}
              <div className="md:hidden">
                <div className="overflow-x-auto px-2">
                  <TabsList
                    aria-label="Settings sections"
                    className="h-auto w-max min-w-full items-stretch justify-start gap-2 rounded-xl border border-border/80 bg-white p-2 shadow-sm"
                  >
                    <TabsTrigger
                      value="business-info"
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <LayoutDashboard className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Business Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="keywords"
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Hash className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Keywords</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="links"
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Link2 className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Links &amp; QR</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="auto-reply"
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Bot className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Auto Reply</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment"
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <CreditCard className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Payment</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              <TabsContent value="business-info" className="mt-5 space-y-6">
                {/* Basic Information (matches onboarding BasicInformationCard) */}
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
                        <Label htmlFor="business-name">
                          Business Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="business-name"
                          placeholder="e.g., The Coffee House"
                          value={business.name}
                          onChange={(e) => handleUpdateBusiness({ name: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the official business name as it appears on legal documents
                        </p>
                      </div>

                      {/* Dotted separator */}
                      <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dotted border-muted-foreground/30" />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="business-category">
                          Business Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={business.category}
                          onValueChange={(value) => {
                            handleUpdateBusiness({
                              category: value as BusinessCategory,
                            });
                            setBusinessServiceInput("");
                          }}
                        >
                          <SelectTrigger id="business-category">
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
                            <SelectItem value="manufacturing">Manufacturing/Industrial</SelectItem>
                            <SelectItem value="services">Professional & Local Services</SelectItem>
                            <SelectItem value="technology">Technology / IT / SaaS</SelectItem>
                            <SelectItem value="finance">Financial Services</SelectItem>
                            <SelectItem value="logistics">Logistics & Transport</SelectItem>
                            <SelectItem value="media-entertainment">Media & Entertainment</SelectItem>
                            <SelectItem value="non-profit">Non-profit / NGO</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Suggested categories */}
                        {suggestedCategories.length > 0 && !business.category && (
                          <div className="mt-2">
                            <p className="mb-2 text-xs text-muted-foreground">
                              Suggested categories:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {suggestedCategories.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant="outline"
                                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                  onClick={() =>
                                    handleUpdateBusiness({
                                      category: cat,
                                    })
                                  }
                                >
                                  {cat
                                    .split("-")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() + word.slice(1),
                                    )
                                    .join(" ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Category suggestions */}
                        {business.category &&
                          categorySuggestions[business.category as BusinessCategory] && (
                            <div className="mt-2">
                              <p className="mb-2 text-xs text-muted-foreground">
                                Common types for {business.category}:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {categorySuggestions[business.category as BusinessCategory]
                                  .slice(0, 5)
                                  .map((suggestion) => (
                                    <Badge
                                      key={suggestion}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {suggestion}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}

                        <p className="text-xs text-muted-foreground">
                          Select the primary category that best describes the business
                        </p>
                      </div>

                      {/* Dotted separator */}
                      <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-dotted border-muted-foreground/30" />
                        </div>
                      </div>

                      {/* Services section (matches onboarding) */}
                      <div className="grid gap-2">
                        <Label htmlFor="business-services">Business Services</Label>
                        <div className="relative service-input-container">
                          <Input
                            id="business-services"
                            placeholder={
                              business.category
                                ? `Add a service (e.g., ${
                                    businessServiceSuggestions[0] || "Service name"
                                  })`
                                : "Select a category first to see suggestions"
                            }
                            value={businessServiceInput}
                            onChange={(e) => {
                              setBusinessServiceInput(e.target.value);
                              setShowBusinessServiceSuggestions(
                                e.target.value.length > 0 &&
                                  businessServiceSuggestions.length > 0,
                              );
                            }}
                            onFocus={() => {
                              if (businessServiceSuggestions.length > 0) {
                                setShowBusinessServiceSuggestions(true);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && businessServiceInput.trim()) {
                                e.preventDefault();
                                const service = businessServiceInput.trim();
                                const current = business.services || [];
                                if (!current.includes(service)) {
                                  handleUpdateBusiness({
                                    services: [...current, service],
                                  });
                                }
                                setBusinessServiceInput("");
                                setShowBusinessServiceSuggestions(false);
                              }
                            }}
                            disabled={!business.category}
                          />

                          {/* Service suggestions dropdown */}
                          {showBusinessServiceSuggestions &&
                            businessServiceSuggestions.length > 0 && (
                              <div className="service-suggestions-dropdown absolute top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white">
                                {businessServiceSuggestions
                                  .filter((suggestion) =>
                                    suggestion
                                      .toLowerCase()
                                      .includes(businessServiceInput.toLowerCase()),
                                  )
                                  .map((suggestion) => (
                                    <div
                                      key={suggestion}
                                      className="cursor-pointer border-b p-2 last:border-b-0 hover:bg-muted"
                                      onClick={() => {
                                        const current = business.services || [];
                                        if (!current.includes(suggestion)) {
                                          handleUpdateBusiness({
                                            services: [...current, suggestion],
                                          });
                                        }
                                        setBusinessServiceInput("");
                                        setShowBusinessServiceSuggestions(false);
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{suggestion}</span>
                                      </div>
                                    </div>
                                  ))}

                                {businessServiceInput.trim() &&
                                  !businessServiceSuggestions.some(
                                    (s) =>
                                      s.toLowerCase() ===
                                      businessServiceInput.toLowerCase(),
                                  ) && (
                                    <div
                                      className="cursor-pointer border-t p-2 hover:bg-muted"
                                      onClick={() => {
                                        const service = businessServiceInput.trim();
                                        const current = business.services || [];
                                        if (!current.includes(service)) {
                                          handleUpdateBusiness({
                                            services: [...current, service],
                                          });
                                        }
                                        setBusinessServiceInput("");
                                        setShowBusinessServiceSuggestions(false);
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Plus className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                          Add &quot;{businessServiceInput}&quot;
                                        </span>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                        </div>

                        {/* Added services */}
                        {business.services && business.services.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-2 text-xs text-muted-foreground">
                              Added business services:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {business.services.map((service) => (
                                <Badge
                                  key={service}
                                  variant="default"
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const remaining = (business.services || []).filter(
                                      (s) => s !== service,
                                    );
                                    handleUpdateBusiness({ services: remaining });
                                  }}
                                >
                                  {service}
                                  <X className="ml-1 h-3 w-3" />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          {business.category
                            ? "Click on suggested business services or type to add custom services"
                            : "Select a business category first to see business service suggestions"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Overview (matches onboarding BusinessOverviewCard) */}
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
                          value={business.overview || ""}
                          onChange={(e) =>
                            handleUpdateBusiness({ overview: e.target.value })
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

                {/* Contact Information (matches onboarding ContactInformationCard) */}
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
                          value={business.email}
                          onChange={(e) =>
                            handleUpdateBusiness({ email: e.target.value })
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
                          value={business.phone || ""}
                          onChange={(e) =>
                            handleUpdateBusiness({ phone: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Include country code (e.g., +91 for India)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information (matches onboarding LocationInformationCard) */}
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
                          value={business.address || ""}
                          onChange={(e) =>
                            handleUpdateBusiness({ address: e.target.value })
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
                            value={business.city || ""}
                            onChange={(e) =>
                              handleUpdateBusiness({ city: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="area">Area / Locality</Label>
                          <Input
                            id="area"
                            placeholder="Bandra"
                            value={business.area || ""}
                            onChange={(e) =>
                              handleUpdateBusiness({ area: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="400001"
                          value={business.pincode || ""}
                          onChange={(e) =>
                            handleUpdateBusiness({ pincode: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => handleSaveChanges("Business information")}
                        className="gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="keywords" className="mt-5 space-y-6">
                <KeywordsTab
                  business={business}
                  newKeyword={newKeyword}
                  setNewKeyword={setNewKeyword}
                  handleAddKeyword={handleAddKeyword}
                  handleRemoveKeyword={handleRemoveKeyword}
                  handleUpdateBusiness={handleUpdateBusiness}
                  sendKeywordsToAPI={sendKeywordsToAPI}
                  handleSaveChanges={handleSaveChanges}
                  suggestedKeywords={suggestedKeywords}
                  suggestionsLimit={suggestionsLimit}
                  setSuggestionsLimit={setSuggestionsLimit}
                  displayedSuggestions={displayedSuggestions}
                />
              </TabsContent>
              <TabsContent value="links" className="mt-5 space-y-6">
            {qrCodeDataUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>Dynamic QR code for your business review page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-8 border rounded-lg bg-white">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code"
                        className="max-w-[200px] h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleDownloadQR}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download PNG
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This QR code links to your unique review page. Scan it to leave a review.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Business Links</CardTitle>
                <CardDescription>Manage your business links and URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={reviewUrl}
                      readOnly
                      className="bg-muted"
                      placeholder="Generating review URL..."
                    />
                    {reviewUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(reviewUrl)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(reviewUrl, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is your unique review URL. Share it with customers or use the QR code above.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Google Business Review Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={business.googleBusinessReviewLink || ""}
                      onChange={(e) => handleUpdateBusiness({ googleBusinessReviewLink: e.target.value })}
                      placeholder="https://g.page/r/your-business/review"
                    />
                    {business.googleBusinessReviewLink && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(business.googleBusinessReviewLink!)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(business.googleBusinessReviewLink, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After customers submit feedback, they will be redirected to this Google Business review page.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Social Media Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={business.socialMediaLink || ""}
                      onChange={(e) => handleUpdateBusiness({ socialMediaLink: e.target.value })}
                      placeholder="https://facebook.com/your-business or https://instagram.com/your-business"
                    />
                    {business.socialMediaLink && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(business.socialMediaLink!)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(business.socialMediaLink, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: Add your social media profile link (Facebook, Instagram, Twitter, etc.)
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveChanges("Business links")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
              <TabsContent value="auto-reply" className="mt-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Replies</CardTitle>
                <CardDescription>
                  Configure automatic responses to customer feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Label>Enable Auto Replies</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically respond to customer feedback based on their rating
                    </p>
                  </div>
                  <Switch
                    checked={business.autoReplyEnabled}
                    onCheckedChange={(checked) => handleUpdateBusiness({ autoReplyEnabled: checked })}
                  />
                </div>

                {business.autoReplyEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Excellent Rating Response</Label>
                        <Textarea
                          placeholder="Thank you for your excellent feedback! We're thrilled to hear about your positive experience..."
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be sent when customers rate their experience as "Excellent"
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Good Rating Response</Label>
                        <Textarea
                          placeholder="Thank you for your feedback! We appreciate you taking the time to share your experience..."
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be sent when customers rate their experience as "Good"
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Average Rating Response</Label>
                        <Textarea
                          placeholder="Thank you for your feedback. We value your input and are always working to improve our service..."
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be sent when customers rate their experience as "Average"
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Need Improvement Rating Response</Label>
                        <Textarea
                          placeholder="We're sorry to hear about your experience. We'd like to make things right. Please contact us at..."
                          className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This message will be sent when customers rate their experience as "Need Improvement"
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveChanges("Auto-reply settings")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
              <TabsContent value="payment" className="mt-5 space-y-6">
            {/* Plan Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* QR-Plus Plan */}
              <Card className={`relative ${business.paymentPlan === "qr-plus" ? "ring-2 ring-primary" : ""}`}>
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
                          <span className="text-2xl font-bold">₹6,999</span>
                          <span className="text-sm text-muted-foreground">/year</span>
                        </div>
                      </div>
                    </div>
                    {business.paymentPlan === "qr-plus" && (
                      <Badge variant="default" className="text-xs">
                        Current Plan
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
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Free AI QR Stand</p>
                          <p className="text-xs text-muted-foreground">Free AI QR stand to boost your google reviews</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">GBP Score Analysis & Insights</p>
                          <p className="text-xs text-muted-foreground">Track your Google Business Profile performance score</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">SEO Keyword Suggestions</p>
                          <p className="text-xs text-muted-foreground">Location-based keyword recommendations for better rankings</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Review Collection Automation</p>
                          <p className="text-xs text-muted-foreground">Fully automated review collection workflows</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Direct Review Links</p>
                          <p className="text-xs text-muted-foreground">Generate direct links to your Google review page</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {business.paymentPlan !== "qr-plus" && (
                    <Button
                      className="w-full"
                      onClick={() => handleUpdateBusiness({ paymentPlan: "qr-plus" })}
                    >
                      Upgrade to QR-Plus
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* QR-Basic Plan */}
              <Card className={`relative ${business.paymentPlan === "qr-basic" ? "ring-2 ring-primary" : ""}`}>
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
                          <span className="text-2xl font-bold">₹2,999</span>
                          <span className="text-sm text-muted-foreground">/year</span>
                        </div>
                      </div>
                    </div>
                    {business.paymentPlan === "qr-basic" && (
                      <Badge variant="default" className="text-xs">
                        Current Plan
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
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Free AI QR Stand</p>
                          <p className="text-xs text-muted-foreground">Free AI QR stand to boost your google reviews</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">GBP Score Analysis & Insights</p>
                          <p className="text-xs text-muted-foreground">Track your Google Business Profile performance score</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Direct Review Links</p>
                          <p className="text-xs text-muted-foreground">Generate direct links to your Google review page</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {business.paymentPlan !== "qr-basic" && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleUpdateBusiness({ paymentPlan: "qr-basic" })}
                    >
                      Switch to QR-Basic
                    </Button>
                  )}
                </CardContent>
              </Card>
                </div>

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
                        {business.paymentExpiryDate
                          ? new Date(business.paymentExpiryDate).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not set"}
                      </span>
                    </div>
                    {business.paymentExpiryDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(business.paymentExpiryDate) > new Date()
                          ? `${Math.ceil((new Date(business.paymentExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
                          : "Expired"}
                      </p>
                    )}
                    </div>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      if (business.paymentStatus === "active" && business.paymentExpiryDate) {
                        const expiryDate = new Date(business.paymentExpiryDate);
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        if (expiryDate > new Date() && daysUntilExpiry > 60) {
                          setToastMessage(`Your subscription is active. Payment can be renewed ${daysUntilExpiry - 60} days before expiry (when ${daysUntilExpiry} days or less remain).`);
                          setShowToast(true);
                          return;
                        }
                      }
                      setShowPaymentDialog(true);
                    }}
                    disabled={
                      !business.paymentPlan ||
                      !!(business.paymentStatus === "active" &&
                       business.paymentExpiryDate &&
                       (() => {
                         const expiryDate = new Date(business.paymentExpiryDate);
                         const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                         return expiryDate > new Date() && daysUntilExpiry > 60;
                       })())
                    }
                  >
                    <CreditCard className="h-5 w-5" />
                    Complete Payment
                  </Button>
                          </div>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Google Business Health Tab */}
          <TabsContent value="gmb-health" className="space-y-6 mt-0">
            {business && (
              <GBPHealthTab
                businessName={business.name}
              />
            )}
          </TabsContent>

          {/* Recommended Actions Tab */}
          <TabsContent value="recommended-actions" className="space-y-6 mt-0">
            {business && (
              <RecommendedActionsTab businessName={business.name} />
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Customer Manual Reviews
                  </CardTitle>
                  <CardDescription>
                  Reviews from customers who selected "Need Improvement" rating
                  </CardDescription>
                </CardHeader>
              <CardContent>
                {isLoadingReviews ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground">Loading reviews...</p>
                      </div>
                ) : filteredReviews.length === 0 && allReviews.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No manual reviews yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Reviews from customers who selected "Need Improvement" will appear here
                      </p>
                      </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Reviews List */}
                      {filteredReviews.length > 0 && (
                  <div className="space-y-4">
                          {filteredReviews.map((review) => (
                        <Card key={review.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  {review.feedback && (
                                    <p className="text-sm text-foreground leading-relaxed mb-3">
                                      {review.feedback}
                                    </p>
                                  )}
                    </div>
                      </div>
                              <Separator />
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                {review.customerName && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{review.customerName}</span>
                      </div>
                                )}
                                {review.customerEmail && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span>{review.customerEmail}</span>
                              </div>
                                )}
                                {review.customerPhone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{review.customerPhone}</span>
                              </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                            </div>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>

          {/* Mobile bottom navigation - app style */}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:hidden">
            <div className="mx-auto max-w-7xl px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-1.5">
              <Card className="pointer-events-auto rounded-2xl border border-white/25 bg-gradient-to-r from-white/35 via-white/20 to-white/35 shadow-[0_18px_45px_rgba(80,48,160,0.35)] backdrop-blur-xl">
                <CardContent className="p-1.5">
                  <TabsList
                    aria-label="Primary navigation"
                    className="flex h-auto w-full items-stretch justify-between gap-1 bg-transparent p-0"
                  >
                    {MOBILE_MAIN_TAB_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <TabsTrigger
                          key={item.value}
                          value={item.value}
                          className="h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-[11px] font-medium text-muted-foreground data-[state=active]:bg-[#F4EBFF] data-[state=active]:text-[#7C3AED] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E0D4FF] focus-visible:ring-2 focus-visible:ring-primary/60"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.shortLabel}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 hidden border-t border-border/60 pt-8 md:block md:mt-[120px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">tribly.ai</span>
              <span className="text-border">·</span>
              <span>Business dashboard</span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-1">
              <a
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms & Conditions
              </a>
              <a
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="mailto:growth@tribly.ai"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </a>
              <a
                href="https://tribly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Help
              </a>
            </nav>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/80">
            © {new Date().getFullYear()} tribly.ai · Turn Google reviews into growth
          </p>
        </footer>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Payment QR Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (paymentStatus === "success") {
          // Auto-close after showing success for 2 seconds
          setTimeout(() => setShowPaymentDialog(false), 2000);
        } else if (paymentStatus === "pending") {
          // Warn user before closing during pending payment
          if (window.confirm("Payment is still pending. Are you sure you want to close?")) {
            setShowPaymentDialog(false);
          }
        } else {
          setShowPaymentDialog(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {paymentStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Payment Successful
                </>
              ) : paymentStatus === "failed" ? (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Payment Failed
                </>
              ) : paymentStatus === "expired" ? (
                <>
                  <Clock className="h-5 w-5 text-orange-600" />
                  Payment Expired
                </>
              ) : paymentStatus === "pending" && paymentQRCode ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Payment Pending
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Complete Payment
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {paymentStatus === "pending" && paymentQRCode && "Scan the QR code to complete your payment"}
              {paymentStatus === "pending" && !paymentQRCode && "Generating payment QR code..."}
              {paymentStatus === "success" && "Your payment has been processed successfully"}
              {paymentStatus === "failed" && "Your payment could not be processed"}
              {paymentStatus === "expired" && "The payment session has expired"}
              {!paymentStatus && "Scan the QR code to complete your payment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Plan Details */}
            {business?.paymentPlan && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {business.paymentPlan === "qr-plus" ? (
                      <>
                        <Crown className="h-5 w-5 text-primary" />
                        <span className="font-semibold">QR-Plus</span>
                        <Badge variant="secondary" className="text-xs">Premium</Badge>
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
                      ₹{business.paymentPlan === "qr-plus" ? "6,999" : "2,999"}
                    </div>
                    <div className="text-xs text-muted-foreground">per year</div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">{business.name}</span>
                </div>
              </div>
            )}

            {/* Payment Status */}
            {paymentStatus === "pending" && (
              <>
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
                        Time remaining: {Math.floor(paymentTimer / 60)}:{(paymentTimer % 60).toString().padStart(2, "0")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Waiting for payment confirmation...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating payment QR code...</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {paymentStatus === "success" && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Payment Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your subscription has been activated. You will be redirected shortly.
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan expires:</span>
                    <span className="font-medium">
                      {business?.paymentExpiryDate
                        ? new Date(business.paymentExpiryDate).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "1 year from now"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Payment Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    Your payment could not be processed. Please try again.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentStatus("pending");
                    setPaymentQRCode(null);
                    setPaymentTimer(900);
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}

            {paymentStatus === "expired" && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-10 w-10 text-orange-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Payment Session Expired</h3>
                  <p className="text-sm text-muted-foreground">
                    The payment session has expired. Please start a new payment.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentStatus("pending");
                    setPaymentQRCode(null);
                    setPaymentTimer(900);
                  }}
                  className="w-full"
                >
                  Start New Payment
                </Button>
              </div>
            )}

            {/* Error handling for edge cases */}
            {!business?.paymentPlan && (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-yellow-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">No Plan Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Please select a plan before proceeding with payment.
                  </p>
                </div>
                <Button
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
            </div>
  );
}
