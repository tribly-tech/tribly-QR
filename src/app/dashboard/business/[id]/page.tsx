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
import { Toast } from "@/components/ui/toast";
import { OverviewTab } from "@/components/dashboard/business/OverviewTab";
import { KeywordsTab } from "@/components/dashboard/business/KeywordsTab";
import { GBPHealthTab } from "@/components/dashboard/business/GBPHealthTab";
import { RecommendedActionsTab } from "@/components/dashboard/business/RecommendedActionsTab";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
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
const DEFAULT_SETTINGS_SUB: (typeof BUSINESS_SETTINGS_SUB_TABS)[number] = "links";

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

  // Category suggestions state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "expired">("pending");
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 minutes in seconds
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [website, setWebsite] = useState<string>("");
  const [isQRId, setIsQRId] = useState(false);
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Sync tab state from URL (deep links, refresh, back/forward)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const mainTab: (typeof BUSINESS_MAIN_TABS)[number] =
      tab && BUSINESS_MAIN_TABS.includes(tab as (typeof BUSINESS_MAIN_TABS)[number]) ? (tab as (typeof BUSINESS_MAIN_TABS)[number]) : DEFAULT_TAB;
    setActiveTab(mainTab);
    if (mainTab === "settings") {
      const sub = searchParams.get("sub");
      const subTab: (typeof BUSINESS_SETTINGS_SUB_TABS)[number] =
        sub && BUSINESS_SETTINGS_SUB_TABS.includes(sub as (typeof BUSINESS_SETTINGS_SUB_TABS)[number]) ? (sub as (typeof BUSINESS_SETTINGS_SUB_TABS)[number]) : DEFAULT_SETTINGS_SUB;
      setSettingsSubTab(subTab);
    }
  }, [searchParams]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
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
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{business.name}</h1>
                {getStatusBadge(business.status)}
              </div>
              <p className="text-muted-foreground">{business.email}</p>
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

        <Tabs value={activeTab} onValueChange={handleMainTabChange} className="flex flex-col lg:flex-row gap-6">
          <TabsList className="flex flex-col lg:w-64 w-full bg-white/80 backdrop-blur-sm border border-purple-100 p-2 rounded-lg shadow-sm h-fit space-y-1">
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
              value="keywords"
              className="w-full justify-start rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm transition-all py-3 h-auto"
            >
              <div className="flex items-start gap-3 w-full">
                <Hash className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col items-start gap-0.5 flex-1">
                  <span className="font-medium">Keywords</span>
                  <span className="text-xs opacity-70">Manage search terms</span>
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

          <div className="flex-1 min-w-0">
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
              {/* Horizontal tab bar: pill style with icons for quick scanning */}
              <div className="rounded-xl border border-border/80 bg-white p-1.5 shadow-sm">
                <TabsList className="flex flex-row h-auto gap-1.5 p-0 bg-transparent border-0 shadow-none w-full">
                  <TabsTrigger
                    value="links"
                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                  >
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">Links & QR</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="auto-reply"
                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                  >
                    <Bot className="h-4 w-4 shrink-0" />
                    <span className="truncate">Auto Reply</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                  >
                    <CreditCard className="h-4 w-4 shrink-0" />
                    <span className="truncate">Payment</span>
                  </TabsTrigger>
                </TabsList>
              </div>
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

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-6 mt-0">
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
        </Tabs>
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
