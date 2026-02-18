"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { mockBusinesses, getReviewsByBusinessId } from "@/lib/mock-data";
import { Business, BusinessCategory, ReviewCategory, Review } from "@/lib/types";
import { generateShortUrlCode, generateReviewUrl, generateQRCodeDataUrl, downloadQRCodeAsPNG } from "@/lib/qr-utils";
import { getWhatsAppLinkWithMessage, parseWhatsAppNumberFromUrl } from "@/lib/whatsapp-utils";
import { getBusinessBySlug } from "@/lib/business-slug";
import {
  getBusinessEditOverrides,
  updateBusinessEditOverrides,
  mergeBusinessWithOverrides,
} from "@/lib/business-local-storage";
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
import { AddressAutocompleteInput } from "@/components/address-autocomplete";
import { OverviewTab } from "@/components/dashboard/business/OverviewTab";
import { KeywordsTab } from "@/components/dashboard/business/KeywordsTab";
import { GBPHealthTab } from "@/components/dashboard/business/GBPHealthTab";
import { RecommendedActionsTab } from "@/components/dashboard/business/RecommendedActionsTab";
import { ReviewsTab } from "@/components/dashboard/business/reviews";
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
  Sparkles,
  ChevronDown,
  Share2,
  Receipt,
  Building2,
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

const REVIEW_OLD_BASE = "https://triblyqr.netlify.app/review";
const REVIEW_NEW_BASE = "https://qr.tribly.ai/review";

function normalizeReviewUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(REVIEW_OLD_BASE, REVIEW_NEW_BASE);
}

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
  const [newKeyword, setNewKeyword] = useState("");
  const [suggestionsLimit, setSuggestionsLimit] = useState(12);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getStoredUser>>(null);

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed" | "expired">("pending");
  const [paymentQRCode, setPaymentQRCode] = useState<string | null>(null);
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 minutes in seconds
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [paymentSuccessAt, setPaymentSuccessAt] = useState<string | null>(null);
  const [receiptAccordionOpen, setReceiptAccordionOpen] = useState(false);
  const [receiptShareLoading, setReceiptShareLoading] = useState(false);
  const [receiptShareSuccess, setReceiptShareSuccess] = useState(false);
  const [website, setWebsite] = useState<string>("");
  const [isQRId, setIsQRId] = useState(false);
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [businessServiceInput, setBusinessServiceInput] = useState("");
  const [showBusinessServiceSuggestions, setShowBusinessServiceSuggestions] = useState(false);
  const [aiServiceSuggestions, setAiServiceSuggestions] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadRetryKey, setLoadRetryKey] = useState(0);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<{
    type: "main-tab" | "settings-sub" | "route";
    value?: string;
    url?: string;
  } | null>(null);

  // Last-saved snapshots for change detection
  const lastSavedRef = useRef<{
    businessInfo: Record<string, unknown> | null;
    links: Record<string, string> | null;
    autoReply: { autoReplyEnabled: boolean } | null;
    keywords: string[] | null;
  }>({ businessInfo: null, links: null, autoReply: null, keywords: null });

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

  // Ref to read current settings unsaved state when handling tab change (avoids stale closure)
  const settingsUnsavedRef = useRef<{ hasChanges: boolean; sectionKey: string | null }>({
    hasChanges: false,
    sectionKey: null,
  });

  const handleMainTabChange = (value: string) => {
    if (activeTab === "settings" && settingsUnsavedRef.current.hasChanges) {
      setPendingLeaveAction({ type: "main-tab", value });
      setLeaveConfirmOpen(true);
      return;
    }
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
    if (settingsUnsavedRef.current.hasChanges) {
      setPendingLeaveAction({ type: "settings-sub", value });
      setLeaveConfirmOpen(true);
      return;
    }
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("tab", "settings");
    next.set("sub", value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const performPendingLeave = () => {
    if (!pendingLeaveAction) return;
    if (pendingLeaveAction.type === "main-tab" && pendingLeaveAction.value !== undefined) {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("tab", pendingLeaveAction.value);
      if (pendingLeaveAction.value === "settings") {
        if (!next.has("sub")) next.set("sub", DEFAULT_SETTINGS_SUB);
      } else {
        next.delete("sub");
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    } else if (pendingLeaveAction.type === "settings-sub" && pendingLeaveAction.value !== undefined) {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      next.set("tab", "settings");
      next.set("sub", pendingLeaveAction.value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    } else if (pendingLeaveAction.type === "route" && pendingLeaveAction.url) {
      router.push(pendingLeaveAction.url);
    }
    setPendingLeaveAction(null);
    setLeaveConfirmOpen(false);
  };

  const handleLeaveConfirmSave = async () => {
    const sectionKey = settingsUnsavedRef.current.sectionKey;
    if (sectionKey) {
      await handleSectionSave(sectionKey);
    }
    performPendingLeave();
  };

  const staticServiceSuggestions = useMemo(() => {
    if (!business?.category) return [];
    return serviceSuggestions[business.category as BusinessCategory] || [];
  }, [business?.category]);

  // Fetch AI service suggestions when category changes
  useEffect(() => {
    if (!business?.category) {
      setAiServiceSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsLoadingAiSuggestions(true);
    setAiServiceSuggestions([]);

    fetch("/api/ai/suggest-services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: business.category }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("AI not available"))))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.services) && data.services.length > 0) {
          setAiServiceSuggestions(data.services);
        }
      })
      .catch(() => {
        // Silently fall back to static suggestions
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAiSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [business?.category]);

  const businessServiceSuggestions = aiServiceSuggestions.length > 0
    ? aiServiceSuggestions
    : staticServiceSuggestions;

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
      setLoadError(null);
      setIsLoading(true);

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
            const errData = await response.json().catch(() => ({}));
            setLoadError(errData.message || "Failed to load business. Please check your connection and try again.");
            setIsLoading(false);
            return;
          }

          const apiResponse = await response.json();
          const qrData = apiResponse.data;

          const normalizedReviewUrl = normalizeReviewUrl(qrData.business_review_url);

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
            reviewUrl: normalizedReviewUrl,
            googleBusinessReviewLink: qrData.business_google_review_url || "",
            googlePlaceId: qrData.google_place_id || qrData.place_id || undefined,
            instagramUrl: qrData.instagram_url || undefined,
            youtubeUrl: qrData.youtube_url || undefined,
            whatsappNumber: parseWhatsAppNumberFromUrl(qrData.whatsapp_url || "") || undefined,
            whatsappUrl: qrData.whatsapp_url || undefined,
            keywords: Array.isArray(qrData.business_tags) ? qrData.business_tags : [],
            feedbackTone: "professional",
            autoReplyEnabled: false,
            paymentPlan: (qrData.plan === "qr-plus" || qrData.plan === "qr-basic") ? qrData.plan : undefined,
            totalReviews: 0,
            activeReviews: 0,
            inactiveReviews: 0,
            reviewsInQueue: 0,
          };

          // Merge with localStorage overrides (user may have saved when API didn't persist)
          const qrOverrides = typeof window !== "undefined"
            ? getBusinessEditOverrides(businessSlug)
            : null;
          const { business: mergedQrBusiness, website: mergedQrWebsite } =
            mergeBusinessWithOverrides(mappedBusiness, qrOverrides, qrData.business_website || "");
          setBusiness(mergedQrBusiness);
          setWebsite(mergedQrWebsite || qrData.business_website || "");
          setReviewUrl(normalizedReviewUrl);

          // Use business_qr_code_url from API if available, otherwise generate QR code
          if (qrData.business_qr_code_url) {
            setQrCodeDataUrl(qrData.business_qr_code_url);
            setBusiness((prev) => prev ? { ...prev, qrCodeUrl: qrData.business_qr_code_url } : null);
          } else if (qrData.business_review_url) {
            // Fallback: Generate QR code if review URL exists but no QR code URL provided
            setQrCodeError(null);
            generateQRCodeDataUrl(qrData.business_review_url).then((dataUrl) => {
              setQrCodeDataUrl(dataUrl);
              setQrCodeError(null);
              setBusiness((prev) => prev ? { ...prev, qrCodeUrl: dataUrl } : null);
            }).catch((error) => {
              console.error("Error generating QR code:", error);
              setQrCodeError("Failed to generate QR code");
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
          setLoadError("Failed to load business. Please check your connection and try again.");
          setIsLoading(false);
          return;
        }
      }

      // Existing business logic (mock businesses)
      if (businessData) {
        const overrides = getBusinessEditOverrides(businessData.id);
        const { business: mergedBusiness, website: mergedWebsite } =
          mergeBusinessWithOverrides(businessData, overrides);
        setBusiness(mergedBusiness);
        if (mergedWebsite) setWebsite(mergedWebsite);

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
        setQrCodeError(null);
        generateQRCodeDataUrl(url).then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
          setQrCodeError(null);
          // Update business with review URL and QR code
          setBusiness((prev) => prev ? { ...prev, reviewUrl: url, qrCodeUrl: dataUrl } : null);
        }).catch((error) => {
          console.error("Error generating QR code:", error);
          setQrCodeError("Failed to generate QR code");
        });
      } else {
        // Business not found, redirect based on user role
        const user = getStoredUser();
        if (user && user.role === "business") {
          // Business owner trying to access non-existent business, redirect to login
          router.push("/login");
        } else {
        router.push("/dashboard/admin");
        }
      }
      setIsLoading(false);
    };

    loadBusinessData();
  }, [businessSlug, router, loadRetryKey]);

  // Initialize last-saved snapshots when business loads (for change detection)
  useEffect(() => {
    if (business && !isLoading) {
      lastSavedRef.current = {
        businessInfo: {
          name: business.name,
          category: business.category,
          email: business.email,
          phone: business.phone || "",
          address: business.address || "",
          city: business.city || "",
          area: business.area || "",
          pincode: business.pincode || "",
          overview: business.overview || "",
          services: [...(business.services || [])].sort(),
        },
        links: {
          googleBusinessReviewLink: business.googleBusinessReviewLink || "",
          googlePlaceId: business.googlePlaceId ?? "",
          instagramUrl: business.instagramUrl || "",
          youtubeUrl: business.youtubeUrl || "",
          whatsappNumber: business.whatsappNumber || "",
          website,
        },
        autoReply: { autoReplyEnabled: business.autoReplyEnabled },
        keywords: [...(business.keywords || [])].sort(),
      };
    }
  }, [business?.id, isLoading]); // Only init on load; website from closure is correct on first run

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
            setPaymentSuccessAt(new Date().toISOString());
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
        setPaymentSuccessAt(null);
        setReceiptAccordionOpen(false);
        setReceiptShareLoading(false);
        setReceiptShareSuccess(false);
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
        setToastMessage("Could not load reviews. You can still use the page.");
        setShowToast(true);
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
      setToastMessage("Could not load reviews. You can still use the page.");
      setShowToast(true);
    } finally {
      setIsLoadingReviews(false);
    }
  };

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
      setToastMessage("Failed to save keywords. Please try again.");
      setShowToast(true);
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
        keywords: updatedKeywords,
      });
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = async (keywordToRemove: string) => {
    if (business && business.keywords) {
      const updatedKeywords = business.keywords.filter((k) => k !== keywordToRemove);
      handleUpdateBusiness({
        keywords: updatedKeywords,
      });
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

  // Change detection for disabling Save buttons
  const hasBusinessInfoChanges = useMemo(() => {
    if (!business || !lastSavedRef.current.businessInfo) return false;
    const s = lastSavedRef.current.businessInfo;
    const cur = business;
    if (s.name !== cur.name || s.category !== cur.category || s.email !== cur.email) return true;
    if ((s.phone as string) !== (cur.phone || "")) return true;
    if ((s.address as string) !== (cur.address || "")) return true;
    if ((s.city as string) !== (cur.city || "")) return true;
    if ((s.area as string) !== (cur.area || "")) return true;
    if ((s.pincode as string) !== (cur.pincode || "")) return true;
    if ((s.overview as string) !== (cur.overview || "")) return true;
    const savedServices = (s.services as string[]) || [];
    const curServices = cur.services || [];
    if (savedServices.length !== curServices.length) return true;
    const a = [...savedServices].sort();
    const b = [...curServices].sort();
    return a.some((v, i) => v !== b[i]);
  }, [business]);

  const hasLinksChanges = useMemo(() => {
    if (!business || !lastSavedRef.current.links) return false;
    const s = lastSavedRef.current.links;
    return (
      s.googleBusinessReviewLink !== (business.googleBusinessReviewLink || "") ||
      s.googlePlaceId !== (business.googlePlaceId ?? "") ||
      s.instagramUrl !== (business.instagramUrl || "") ||
      s.youtubeUrl !== (business.youtubeUrl || "") ||
      s.whatsappNumber !== (business.whatsappNumber || "") ||
      s.website !== website
    );
  }, [business, website]);

  const hasAutoReplyChanges = useMemo(() => {
    if (!business || !lastSavedRef.current.autoReply) return false;
    return lastSavedRef.current.autoReply.autoReplyEnabled !== business.autoReplyEnabled;
  }, [business]);

  const hasKeywordsChanges = useMemo(() => {
    if (!business || !lastSavedRef.current.keywords) return false;
    const saved = lastSavedRef.current.keywords;
    const cur = business.keywords || [];
    if (saved.length !== cur.length) return true;
    const a = [...saved].sort();
    const b = [...cur].sort();
    return a.some((v, i) => v !== b[i]);
  }, [business]);

  // Settings save state (must be useMemo so hooks below run unconditionally)
  const settingsSaveState = useMemo(() => {
    let sectionKey: string | null = null;
    let label = "Save changes";
    let hasChanges = false;
    if (settingsSubTab === "business-info") {
      sectionKey = "Business information";
      label = "Save business information";
      hasChanges = hasBusinessInfoChanges;
    } else if (settingsSubTab === "keywords") {
      sectionKey = "Keywords";
      label = "Save keywords";
      hasChanges = hasKeywordsChanges;
    } else if (settingsSubTab === "links") {
      sectionKey = "Business links";
      label = "Save links";
      hasChanges = hasLinksChanges;
    } else if (settingsSubTab === "auto-reply") {
      sectionKey = "Auto-reply settings";
      label = "Save auto-reply settings";
      hasChanges = hasAutoReplyChanges;
    }
    return { settingsSaveSectionKey: sectionKey, settingsSaveLabel: label, settingsHasChanges: hasChanges };
  }, [settingsSubTab, hasBusinessInfoChanges, hasKeywordsChanges, hasLinksChanges, hasAutoReplyChanges]);

  // Keep ref in sync so tab-change handlers see current unsaved state (must run before any return)
  useEffect(() => {
    if (activeTab === "settings") {
      settingsUnsavedRef.current = {
        hasChanges: settingsSaveState.settingsHasChanges,
        sectionKey: settingsSaveState.settingsSaveSectionKey,
      };
    } else {
      settingsUnsavedRef.current = { hasChanges: false, sectionKey: null };
    }
  }, [activeTab, settingsSaveState.settingsHasChanges, settingsSaveState.settingsSaveSectionKey]);

  // Browser beforeunload when leaving page with unsaved settings (must run before any return)
  useEffect(() => {
    if (activeTab !== "settings" || !settingsSaveState.settingsHasChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeTab, settingsSaveState.settingsHasChanges]);

  const updateLastSaved = (section: string) => {
    if (!business) return;
    const r = lastSavedRef.current;
    if (section === "Business information") {
      r.businessInfo = {
        name: business.name,
        category: business.category,
        email: business.email,
        phone: business.phone || "",
        address: business.address || "",
        city: business.city || "",
        area: business.area || "",
        pincode: business.pincode || "",
        overview: business.overview || "",
        services: [...(business.services || [])].sort(),
      };
    } else if (section === "Business links") {
      r.links = {
        googleBusinessReviewLink: business.googleBusinessReviewLink || "",
        googlePlaceId: business.googlePlaceId ?? "",
        instagramUrl: business.instagramUrl || "",
        youtubeUrl: business.youtubeUrl || "",
        whatsappNumber: business.whatsappNumber || "",
        website,
      };
    } else if (section === "Auto-reply settings") {
      r.autoReply = { autoReplyEnabled: business.autoReplyEnabled };
    } else if (section === "Keywords") {
      r.keywords = [...(business.keywords || [])].sort();
    }
  };

  const handleSaveChanges = async (section: string, isAutosave = false) => {
    if (!business) return;

    // If it's a QR ID, save via API
    if (isQRId) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

        // Prepare payload according to API specification (autosave sends full payload)
        const payload: any = {
          name: business.name,
          description: business.overview || null,
          website: website || null,
          email: business.email || null,
          phone: business.phone || null,
          category: business.category || null,
          business_category: business.category || null, // Some APIs expect snake_case
          google_review_url: business.googleBusinessReviewLink || null,
          instagram_url: business.instagramUrl || null,
          youtube_url: business.youtubeUrl || null,
          whatsapp_url: getWhatsAppLinkWithMessage(business.whatsappNumber || "") || null,
          business_id: businessSlug,
          tags: business.keywords || [],
          services: business.services && business.services.length > 0 ? business.services : [],
        };

        // Only include address if address_line1 is provided (required field)
        if (business.address) {
          const pincode = business.pincode || "";
          payload.address = {
            address_line1: business.address,
            address_line2: null,
            city: business.city || "",
            area: business.area || "",
            pincode,
            postal_code: pincode, // Some APIs expect postal_code
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

        if (!isAutosave) {
          setToastMessage(`${section} saved successfully!`);
          setShowToast(true);
        }
        updateLastSaved("Business information");
        updateLastSaved("Business links");
        updateLastSaved("Auto-reply settings");
        updateLastSaved("Keywords");
        // Persist to localStorage as fallback (in case API doesn't return persisted data)
        if (section === "Business information" || isAutosave) {
          updateBusinessEditOverrides(businessSlug, {
            name: business.name,
            category: business.category,
            email: business.email,
            phone: business.phone,
            address: business.address,
            city: business.city,
            area: business.area,
            pincode: business.pincode,
            overview: business.overview,
            services: business.services,
          });
        }
        if (section === "Business links" || isAutosave) {
          updateBusinessEditOverrides(businessSlug, {
            googleBusinessReviewLink: business.googleBusinessReviewLink,
            googlePlaceId: business.googlePlaceId,
            instagramUrl: business.instagramUrl,
            youtubeUrl: business.youtubeUrl,
            whatsappNumber: business.whatsappNumber,
            website,
          });
        }
        // Refetch to get latest from server (e.g. pincode persisted correctly)
        try {
          const refetchRes = await fetch(
            `${apiBaseUrl}/dashboard/v1/business_qr/scan?qr_id=${businessSlug}`
          );
          if (refetchRes.ok) {
            const refetchJson = await refetchRes.json();
            const d = refetchJson.data;
            if (d) {
              setBusiness((prev) =>
                prev
                  ? {
                      ...prev,
                      name: d.business_name ?? prev.name,
                      email: d.business_contact?.email ?? prev.email,
                      phone: d.business_contact?.phone ?? prev.phone,
                      address: d.business_address?.address_line1 ?? prev.address,
                      city: d.business_address?.city ?? prev.city,
                      area: d.business_address?.area ?? prev.area,
                      pincode:
                        d.business_address?.pincode ??
                        d.business_address?.postal_code ??
                        prev.pincode,
                      overview: d.business_description ?? prev.overview,
                      googleBusinessReviewLink:
                        d.business_google_review_url ??
                        prev.googleBusinessReviewLink,
                      instagramUrl: d.instagram_url ?? prev.instagramUrl,
                      youtubeUrl: d.youtube_url ?? prev.youtubeUrl,
                      whatsappNumber: parseWhatsAppNumberFromUrl(d.whatsapp_url ?? "") ?? prev.whatsappNumber,
                      whatsappUrl: d.whatsapp_url ?? prev.whatsappUrl,
                      keywords: Array.isArray(d.business_tags)
                        ? d.business_tags
                        : prev.keywords,
                      category:
                        (d.business_category as BusinessCategory) || prev.category,
                      // Only overwrite services if API returns a non-empty array (avoid losing just-saved data)
                      services:
                        Array.isArray(d.services) && d.services.length > 0
                          ? d.services
                          : prev.services,
                    }
                  : null
              );
              if (d.business_website !== undefined)
                setWebsite(d.business_website || "");
            }
          }
        } catch {
          // Ignore refetch errors
        }
      } catch (error) {
        console.error("Error saving business QR configuration:", error);
        setToastMessage(error instanceof Error ? error.message : "Failed to save changes");
        setShowToast(true);
      }
    } else {
      // Mock business: persist to localStorage so it survives refresh
      const overrides: Parameters<typeof updateBusinessEditOverrides>[1] = {
        name: business.name,
        category: business.category,
        email: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        area: business.area,
        pincode: business.pincode,
        overview: business.overview,
        services: business.services,
        googleBusinessReviewLink: business.googleBusinessReviewLink,
        googlePlaceId: business.googlePlaceId,
        instagramUrl: business.instagramUrl,
        youtubeUrl: business.youtubeUrl,
        whatsappNumber: business.whatsappNumber,
        website,
        autoReplyEnabled: business.autoReplyEnabled,
        keywords: business.keywords,
      };
      updateBusinessEditOverrides(business.id, overrides);
      if (!isAutosave) {
        setToastMessage(`${section} saved successfully!`);
        setShowToast(true);
      }
      updateLastSaved("Business information");
      updateLastSaved("Business links");
      updateLastSaved("Auto-reply settings");
      updateLastSaved("Keywords");
    }
  };

  // Manual save handler for individual sections (triggered by Save buttons)
  const handleSectionSave = async (section: string) => {
    if (!business || savingSection === section) return;
    setSavingSection(section);
    try {
      await handleSaveChanges(section, false);
    } finally {
      setSavingSection(null);
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
    const isQrUser = currentUser?.userType === "business_qr_user";
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>
              {loadError ? "Failed to Load" : "Business Not Found"}
            </CardTitle>
            <CardDescription>
              {loadError || "The business you're looking for doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {loadError && (
              <Button
                onClick={() => {
                  setLoadError(null);
                  setLoadRetryKey((k) => k + 1);
                }}
                className="w-full"
              >
                Try Again
              </Button>
            )}
            {!isQrUser && (
              <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
                Back to Dashboard
              </Button>
            )}
            <Button
              variant={isQrUser && !loadError ? "default" : "ghost"}
              onClick={() => router.push("/login")}
            >
              Go to Login
            </Button>
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

  const activeMobileTabItem =
    MOBILE_MAIN_TAB_ITEMS.find((item) => item.value === activeTab) ??
    MOBILE_MAIN_TAB_ITEMS[0];

  const isOnSettingsTab = activeTab === "settings";

  const { settingsSaveSectionKey, settingsSaveLabel, settingsHasChanges } = settingsSaveState;

  const isSettingsSectionSaving =
    !!settingsSaveSectionKey && savingSection === settingsSaveSectionKey;

  const settingsSaveDisabled =
    !settingsSaveSectionKey || !settingsHasChanges || isSettingsSectionSaving;

  const handleBackClick = () => {
    if (activeTab === "settings" && settingsUnsavedRef.current.hasChanges) {
      setPendingLeaveAction({ type: "route", url: "/dashboard/admin" });
      setLeaveConfirmOpen(true);
      return;
    }
    router.push("/dashboard/admin");
  };

  const discardSettingsChanges = () => {
    const r = lastSavedRef.current;
    if (!business) return;
    setBusiness((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(r.businessInfo && {
          name: r.businessInfo.name as string,
          category: r.businessInfo.category as BusinessCategory,
          email: r.businessInfo.email as string,
          phone: (r.businessInfo.phone as string) ?? prev.phone,
          address: (r.businessInfo.address as string) ?? prev.address,
          city: (r.businessInfo.city as string) ?? prev.city,
          area: (r.businessInfo.area as string) ?? prev.area,
          pincode: (r.businessInfo.pincode as string) ?? prev.pincode,
          overview: (r.businessInfo.overview as string) ?? prev.overview,
          services: (r.businessInfo.services as string[]) ?? prev.services,
        }),
        ...(r.links && {
          googleBusinessReviewLink: r.links.googleBusinessReviewLink ?? prev.googleBusinessReviewLink,
          googlePlaceId: r.links.googlePlaceId ?? prev.googlePlaceId,
          instagramUrl: r.links.instagramUrl ?? prev.instagramUrl,
          youtubeUrl: r.links.youtubeUrl ?? prev.youtubeUrl,
          whatsappNumber: r.links.whatsappNumber ?? prev.whatsappNumber,
        }),
        ...(r.autoReply && { autoReplyEnabled: r.autoReply.autoReplyEnabled }),
        ...(r.keywords && { keywords: (r.keywords as string[]) ?? prev.keywords }),
      };
    });
    if (r.links && typeof r.links.website === "string") setWebsite(r.links.website);
  };

  const handleLeaveWithoutSaving = () => {
    discardSettingsChanges();
    performPendingLeave();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      {/* Leave with unsaved changes confirmation */}
      <Dialog open={leaveConfirmOpen} onOpenChange={(open) => {
        if (!open) {
          setLeaveConfirmOpen(false);
          setPendingLeaveAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Save your changes before leaving, or leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleLeaveWithoutSaving}
            >
              Leave without saving
            </Button>
            <Button
              onClick={handleLeaveConfirmSave}
              disabled={!settingsSaveSectionKey || settingsSaveDisabled}
            >
              {isSettingsSectionSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-7xl px-3 pb-[calc(88px+env(safe-area-inset-bottom))] pt-3 md:px-4 md:py-8">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          {!isBusinessOwner && currentUser?.userType !== "business_qr_user" && (
          <Button
                variant="ghost"
                onClick={handleBackClick}
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
                    onClick={handleBackClick}
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
                  <TabsList className="grid h-auto w-full grid-cols-4 gap-1.5 border-0 bg-transparent p-0 shadow-none">
                    <TabsTrigger
                      value="business-info"
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:ring-1 data-[state=active]:ring-primary/60 data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted/60 data-[state=inactive]:hover:text-foreground"
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
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
                    {/* Payment tab temporarily hidden */}
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
                      <Building2 className="h-5 w-5 shrink-0" />
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
                    {/* Payment tab temporarily hidden on mobile as well */}
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
                              services: [],
                              keywords: [],
                            });
                            setBusinessServiceInput("");
                            setSuggestionsLimit(12);
                            setNewKeyword("");
                            setShowBusinessServiceSuggestions(false);
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
                                  onClick={() => {
                                    handleUpdateBusiness({
                                      category: cat,
                                      services: [],
                                      keywords: [],
                                    });
                                    setBusinessServiceInput("");
                                    setSuggestionsLimit(12);
                                    setNewKeyword("");
                                    setShowBusinessServiceSuggestions(false);
                                  }}
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
                                  .map((suggestion) => {
                                    const currentServices = business.services || [];
                                    const isSelected = currentServices.includes(suggestion);
                                    return (
                                      <Badge
                                        key={suggestion}
                                        variant={isSelected ? "default" : "secondary"}
                                        className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                        onClick={() => {
                                          if (isSelected) {
                                            handleUpdateBusiness({
                                              services: currentServices.filter((s) => s !== suggestion),
                                            });
                                          } else {
                                            handleUpdateBusiness({
                                              services: [...currentServices, suggestion],
                                            });
                                          }
                                        }}
                                      >
                                        {suggestion}
                                      </Badge>
                                    );
                                  })}
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

                      {/* Services section (AI-suggested or static) */}
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="business-services">Business Services</Label>
                          {isLoadingAiSuggestions && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              AI suggesting…
                            </span>
                          )}
                          {!isLoadingAiSuggestions && aiServiceSuggestions.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Sparkles className="h-3.5 w-3.5 text-primary/70" />
                              AI suggested
                            </span>
                          )}
                        </div>
                        <div className="relative service-input-container">
                          <Input
                            id="business-services"
                            autoComplete="off"
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
                        <AddressAutocompleteInput
                          id="address"
                          placeholder="Search address (e.g., 123 Main Street, Mumbai)"
                          value={business.address || ""}
                          onChange={(value) =>
                            handleUpdateBusiness({ address: value })
                          }
                          onAddressSelect={(components) =>
                            handleUpdateBusiness({
                              address: components.address,
                              city: components.city,
                              area: components.area,
                              pincode: components.pincode,
                            })
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
                  suggestedKeywords={suggestedKeywords}
                  suggestionsLimit={suggestionsLimit}
                  setSuggestionsLimit={setSuggestionsLimit}
                  displayedSuggestions={displayedSuggestions}
                />
              </TabsContent>
              <TabsContent value="links" className="mt-5 space-y-6">
            {(qrCodeDataUrl || qrCodeError) && (
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>Dynamic QR code for your business review page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {qrCodeError ? (
                      <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30 gap-3">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                        <p className="text-sm text-muted-foreground">{qrCodeError}</p>
                        {reviewUrl && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setQrCodeError(null);
                              generateQRCodeDataUrl(reviewUrl)
                                .then((dataUrl) => {
                                  setQrCodeDataUrl(dataUrl);
                                  setQrCodeError(null);
                                  setBusiness((prev) =>
                                    prev ? { ...prev, qrCodeUrl: dataUrl } : null
                                  );
                                })
                                .catch(() => setQrCodeError("Failed to generate QR code"));
                            }}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center p-8 border rounded-lg bg-white">
                          <img
                            src={qrCodeDataUrl!}
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
                      </>
                    )}
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
                  <Label>Google Place ID</Label>
                  <Input
                    value={business.googlePlaceId || ""}
                    onChange={(e) => handleUpdateBusiness({ googlePlaceId: e.target.value.trim() || undefined })}
                    placeholder="Enter your Google Place ID"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Paste your Google Place ID to show Google reviews from your Google Business Profile.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Instagram Profile URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={business.instagramUrl || ""}
                      onChange={(e) => handleUpdateBusiness({ instagramUrl: e.target.value.trim() || undefined })}
                      placeholder="https://instagram.com/your-business"
                    />
                    {business.instagramUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl bg-white border border-input hover:bg-muted/50"
                          onClick={() => copyToClipboard(business.instagramUrl!)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl bg-white border border-input hover:bg-muted/50"
                          onClick={() => window.open(business.instagramUrl, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown on the thank-you page after feedback. Customers can follow your profile.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>YouTube Channel URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={business.youtubeUrl || ""}
                      onChange={(e) => handleUpdateBusiness({ youtubeUrl: e.target.value.trim() || undefined })}
                      placeholder="https://youtube.com/@your-channel"
                    />
                    {business.youtubeUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl bg-white border border-input hover:bg-muted/50"
                          onClick={() => copyToClipboard(business.youtubeUrl!)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl bg-white border border-input hover:bg-muted/50"
                          onClick={() => window.open(business.youtubeUrl, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown on the thank-you page. Customers can subscribe to your channel.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Business WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={business.whatsappNumber ?? ""}
                      onChange={(e) => handleUpdateBusiness({ whatsappNumber: e.target.value.trim() || undefined })}
                      placeholder="e.g. 919876543210 or +91 98765 43210"
                    />
                    {business.whatsappNumber && (
                      (() => {
                        const whatsappLink = getWhatsAppLinkWithMessage(business.whatsappNumber!);
                        if (!whatsappLink) return null;
                        return (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl bg-white border border-input hover:bg-muted/50"
                              onClick={() => copyToClipboard(whatsappLink)}
                              title="Copy link"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl bg-white border border-input hover:bg-muted/50"
                              onClick={() => window.open(whatsappLink, "_blank")}
                              title="Open link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </>
                        );
                      })()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown on the thank-you page. Link is created with prefilled message: &quot;Keep me updated with offers, rewards, and important messages on WhatsApp.&quot;
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <div className="flex gap-2">
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-business.com"
                      autoComplete="off"
                    />
                    {website && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(website)}
                          title="Copy link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(website, "_blank")}
                          title="Open link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional: Your business website URL
                  </p>
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
              </CardContent>
            </Card>
            </TabsContent>
            </Tabs>

            {settingsSaveSectionKey && (
              <div className="sticky bottom-0 z-40 mt-6 -mb-3 md:-mb-8">
                <div className="border-t border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:py-4 flex items-center justify-between gap-3 px-6 rounded-t-xl">
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {settingsHasChanges
                      ? "You have unsaved changes in Settings."
                      : "All changes are saved."}
                  </p>
                  <Button
                    size="sm"
                    className="ml-auto min-w-[150px]"
                    disabled={settingsSaveDisabled}
                    onClick={() => {
                      if (!settingsSaveSectionKey || settingsSaveDisabled) return;
                      void handleSectionSave(settingsSaveSectionKey);
                    }}
                  >
                    {isSettingsSectionSaving ? "Saving..." : settingsSaveLabel}
                  </Button>
                </div>
              </div>
            )}
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
            <ReviewsTab
              business={business}
              manualReviews={isQRId ? apiReviews : (business ? getReviewsByBusinessId(business.id) : [])}
              isLoadingManual={isLoadingReviews}
              placeId={business?.googlePlaceId}
            />
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
        if (!open) {
          if (paymentStatus === "pending") {
            if (window.confirm("Payment is still pending. Are you sure you want to close?")) {
              setShowPaymentDialog(false);
            }
          } else {
            setShowPaymentDialog(false);
          }
        }
      }}>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
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

          <div
            className={`space-y-6 py-4 ${paymentStatus === "success" && receiptAccordionOpen ? "max-h-[70vh] overflow-y-auto overflow-x-hidden" : ""}`}
          >
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

                {/* Share receipt — accordion with receipt details + Share receipt button */}
                <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setReceiptAccordionOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Receipt className="h-4 w-4" />
                      </span>
                      Receipt details
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${receiptAccordionOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${receiptAccordionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border bg-stone-50/80 min-w-0">
                        <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pt-3 pb-1">
                          Payment summary
                        </div>
                        <div className="divide-y divide-border/80">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Business name</span>
                            <span className="text-sm font-medium text-foreground sm:text-right break-all min-w-0">{business?.name ?? "—"}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Business phone</span>
                            <span className="text-sm font-medium text-foreground sm:text-right break-all min-w-0">{business?.phone ?? "—"}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Business ID</span>
                            <span className="text-sm font-medium font-mono text-foreground sm:text-right break-all min-w-0">{business?.id ?? business?.name ?? "—"}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Transaction ID</span>
                            <span className="text-sm font-medium font-mono text-foreground sm:text-right break-all min-w-0">
                              {paymentSessionId ? `9Ex - ${paymentSessionId.split("-").pop() ?? paymentSessionId}` : "—"}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Date & time</span>
                            <span className="text-sm font-medium text-foreground sm:text-right break-all min-w-0">
                              {paymentSuccessAt
                                ? new Date(paymentSuccessAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                                : "—"}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-2.5 min-w-0">
                            <span className="text-xs text-muted-foreground shrink-0">Plan</span>
                            <span className="text-sm font-medium text-foreground sm:text-right break-all min-w-0">
                              {business?.paymentPlan === "qr-plus" ? "QR-Plus Premium" : "QR-Basic"}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3 px-4 py-3 bg-primary/5 min-w-0">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">Invoice value</span>
                            <span className="text-sm font-semibold text-foreground sm:text-right break-all min-w-0">
                              ₹{business?.paymentPlan === "qr-plus" ? "6,999" : "2,999"}
                              <span className="text-muted-foreground font-normal"> /year</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Share your receipt to activate your plan immediately.
                  </p>
                  {receiptShareSuccess ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 py-3 px-4">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span className="text-sm font-medium text-emerald-800">Receipt sent to Tribly team</span>
                    </div>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      disabled={receiptShareLoading}
                      onClick={() => {
                        setReceiptShareLoading(true);
                        const lines = [
                          "Payment receipt",
                          `Business name: ${business?.name ?? "—"}`,
                          `Business phone number: ${business?.phone ?? "—"}`,
                          `Business ID: ${business?.id ?? business?.name ?? "—"}`,
                          `Transaction ID: ${paymentSessionId ? `9Ex - ${paymentSessionId.split("-").pop() ?? paymentSessionId}` : "—"}`,
                          `Date & time: ${paymentSuccessAt ? new Date(paymentSuccessAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}`,
                          `Plan name: ${business?.paymentPlan === "qr-plus" ? "QR-Plus Premium" : "QR-Basic"}`,
                          `Invoice value: ₹${business?.paymentPlan === "qr-plus" ? "6,999" : "2,999"} per year`,
                        ];
                        const text = lines.join("\n");
                        const onSuccess = () => {
                          setReceiptShareLoading(false);
                          setReceiptShareSuccess(true);
                        };
                        const onError = () => {
                          setReceiptShareLoading(false);
                          setToastMessage("Could not share receipt. Please try again.");
                          setShowToast(true);
                        };
                        // Copy to clipboard only — no system share dialog. Tribly can collect receipt from backend or clipboard.
                        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(text).then(onSuccess).catch(onError);
                        } else {
                          onError();
                        }
                      }}
                    >
                      {receiptShareLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending receipt...
                        </>
                      ) : (
                        <>
                          <Share2 className="h-4 w-4" />
                          Share receipt with Tribly team
                        </>
                      )}
                    </Button>
                  )}
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
