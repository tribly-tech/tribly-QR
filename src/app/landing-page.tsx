/**
 * Growth QR Landing Page
 *
 * Main landing page for Growth QR - Google Reviews Management System
 * Fully responsive for mobile and desktop
 */

"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { TypingAnimation } from "@/components/ui";
import { FAQAccordion } from "@/components/ui";
import { ChevronIcon } from "@/components/ui";
import { BRAND_COLORS } from "@/lib/constants/brand";

const PFB_IMAGES = [
  "pfb06.png",
  "pfb05.png",
  "pfb04.png",
  "pfb03.png",
  "pfb02.png",
  "pfb01.png",
] as const;
const PFB_IMAGES_DUPLICATED = [...PFB_IMAGES, ...PFB_IMAGES];

/** Mock business search recommendations (title + address) */
const MOCK_BUSINESS_RECOMMENDATIONS = [
  {
    id: "1",
    title: "Mia by Tanishq - Asilmetta, Visakhapatnam",
    address:
      "2, Sampath Vinayaka Temple Rd, near Sampath Vinayaka Temple, CBM Compound, Asilmetta, Visakhapatnam, Visakhapatnam Urban, Andhra Pradesh 530003, India",
  },
  {
    id: "2",
    title: "MAMMA MIA STREET EATS",
    address:
      "P8F4+9J8, Dwaraka Nagar, Visakhapatnam, Visakhapatnam Urban, Andhra Pradesh 530016, India",
  },
  {
    id: "3",
    title: "Mia by Tanishq - Kakinada",
    address:
      "Door No: 20-1-46, Revenue Ward, 14, Main Rd, opp. to SRMT, Rama Rao Peta, Kakinada, Andhra Pradesh 533001, India",
  },
  {
    id: "4",
    title: "Tanishq - Vijayawada",
    address: "MG Road, Governorpet, Vijayawada, Andhra Pradesh 520002, India",
  },
  {
    id: "5",
    title: "Mia Café - Hyderabad",
    address: "Jubilee Hills, Road No. 36, Hyderabad, Telangana 500033, India",
  },
  {
    id: "6",
    title: "Mia Salon & Spa",
    address: "Banjara Hills, Hyderabad, Telangana 500034, India",
  },
];

type BusinessRecommendation = (typeof MOCK_BUSINESS_RECOMMENDATIONS)[number];

export default function LandingPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchOverlayEntered, setSearchOverlayEntered] = useState(false);
  const [searchOverlayExiting, setSearchOverlayExiting] = useState(false);
  /** Step in search overlay: 'search' = business name, 'contact' = WhatsApp/email to send report */
  const [reportStep, setReportStep] = useState<"search" | "contact">("search");
  const [reportWhatsApp, setReportWhatsApp] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const searchOverlayInputRef = useRef<HTMLInputElement>(null);
  const searchOverlayCloseTimeoutRef = useRef<number | null>(null);

  const recommendations = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return MOCK_BUSINESS_RECOMMENDATIONS.filter(
      (b) =>
        b.title.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
    );
  }, [searchValue]);

  const updateDropdownPosition = () => {
    const el = searchAnchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (showRecommendations && recommendations.length > 0) {
      updateDropdownPosition();
      const onScrollOrResize = () => updateDropdownPosition();
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      return () => {
        window.removeEventListener("scroll", onScrollOrResize, true);
        window.removeEventListener("resize", onScrollOrResize);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [showRecommendations, recommendations.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inContainer = searchContainerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) setShowRecommendations(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openContactModal = () => {
    setIsContactModalOpen(true);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsContactModalOpen(false);
    };
    if (isContactModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isContactModalOpen]);

  const openSearchOverlay = () => {
    if (searchOverlayCloseTimeoutRef.current) {
      clearTimeout(searchOverlayCloseTimeoutRef.current);
      searchOverlayCloseTimeoutRef.current = null;
    }
    setSearchOverlayExiting(false);
    setSearchOverlayEntered(false);
    setReportStep("search");
    setIsSearchOverlayOpen(true);
  };

  const closeSearchOverlay = () => {
    setSearchOverlayExiting(true);
    searchOverlayCloseTimeoutRef.current = window.setTimeout(() => {
      searchOverlayCloseTimeoutRef.current = null;
      setIsSearchOverlayOpen(false);
      setSearchOverlayExiting(false);
      setSearchOverlayEntered(false);
      setReportStep("search");
      setReportWhatsApp("");
      setReportEmail("");
    }, 280);
  };

  const handleGetReportClick = () => {
    if (!searchValue.trim()) return;
    setReportStep("contact");
  };

  const handleSendReportSubmit = () => {
    const phone = reportWhatsApp.trim();
    const email = reportEmail.trim();
    if (!phone && !email) return;
    sessionStorage.setItem(
      "reportContactDetails",
      JSON.stringify({
        businessName: searchValue.trim(),
        whatsappPhone: phone,
        email,
      })
    );
    closeSearchOverlay();
    router.push(
      `/sales-dashboard?business=${encodeURIComponent(searchValue.trim())}`
    );
  };

  useEffect(() => {
    if (!isSearchOverlayOpen) return;
    const frame = requestAnimationFrame(() => setSearchOverlayEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [isSearchOverlayOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOverlayOpen) closeSearchOverlay();
    };
    if (isSearchOverlayOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      searchOverlayInputRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!isContactModalOpen) document.body.style.overflow = "";
    };
  }, [isSearchOverlayOpen, isContactModalOpen]);

  return (
    <div
      className="min-h-screen w-full bg-white relative"
      style={{ isolation: "isolate" }}
    >
      {/* Navigation - sticky on top with blur/gloss */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4 md:p-6">
        <div className="flex flex-col items-center w-full md:w-auto max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between w-full md:w-auto md:gap-10 backdrop-blur-xl px-6 md:px-10 py-4 rounded-full shadow-[0px_4px_0px_0px_rgba(151,71,255,0.32)] md:shadow-[0px_4px_0px_0px_rgba(151,71,255,0.32)] border border-white/30 bg-gradient-to-b from-white/70 to-white/25">
            <span className="text-[#9747ff] text-[32px] md:text-[40px] font-semibold font-clash-grotesk leading-tight tracking-[-0.8px]">
              tribly.ai
            </span>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M33.332 15H6.66536M33.332 25H16.6654"
                  stroke="#9747FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={openContactModal}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#f7f1ff] border border-[#9747ff] rounded-full text-[#9747ff] text-[15.1px] font-medium leading-[26px] h-12 hover:bg-[#9747ff] hover:text-white transition-colors"
              >
                Talk to expert for free
                <ChevronIcon className="w-6 h-6" />
              </button>
              <button
                onClick={() => router.push("/login")}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-[#f7f1ff] border border-[#9747ff] rounded-full text-[#9747ff] text-[15.1px] font-medium leading-[26px] h-12 hover:bg-[#9747ff] hover:text-white transition-colors"
              >
                Login to tribly.ai
                <ChevronIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 w-full bg-white/40 backdrop-blur-xl rounded-[40px] shadow-[0px_4px_0px_0px_rgba(151,71,255,0.32)] border border-white/20 px-6 py-6 bg-gradient-to-b from-white/60 to-white/20">
              <div className="flex flex-col gap-3 items-start">
                <button
                  onClick={openContactModal}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#f7f1ff] border border-[#9747ff] rounded-full text-[#9747ff] text-[15.1px] font-medium leading-[26px] h-12 w-fit hover:bg-[#9747ff] hover:text-white transition-colors"
                >
                  Talk to expert for free
                  <ChevronIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-[#f7f1ff] border border-[#9747ff] rounded-full text-[#9747ff] text-[15.1px] font-medium leading-[26px] h-12 w-fit hover:bg-[#9747ff] hover:text-white transition-colors"
                >
                  Login to tribly.ai
                  <ChevronIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-[#f7f1ff] overflow-hidden min-h-[906px] md:min-h-screen pt-[88px] md:pt-[96px]">
        {/* Hero Content */}
        <div className="relative z-10 px-4 md:px-8 pt-2 md:pt-4 pb-32 md:pb-40">
          {/* New Badge */}
          <div className="flex justify-center mb-6 md:mb-8 mt-12">
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-white/80 backdrop-blur-sm border border-[#c5b4fe]/50 rounded-full">
              <span className="px-2 py-0.5 bg-[#9747ff] text-white text-xs rounded-full font-medium">
                New
              </span>
              <span className="text-[#374151] text-sm md:text-base font-medium">
                Turn Google reviews into revenue
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            <div className="space-y-2">
              {/* Mobile Heading */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <h1 className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk">
                    your
                  </h1>
                  <div className="inline-flex h-[29px] w-[89px] relative">
                    <Image
                      src="/assets/google.svg"
                      alt="Google"
                      width={89}
                      height={29}
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk">
                    reputation
                  </h1>
                </div>
                <div className="space-y-2">
                  <h1 className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk min-h-[50px]">
                    <TypingAnimation
                      texts={[
                        "Drives your revenue",
                        "increases your footfalls",
                      ]}
                      className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk"
                      speed={100}
                      delay={3000}
                    />
                  </h1>
                </div>
              </div>
              {/* Desktop Heading */}
              <div className="hidden md:block">
                <div className="flex items-center justify-center gap-6">
                  <h1 className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk">
                    your
                  </h1>
                  <div className="inline-flex h-[66px] w-[201px] relative">
                    <Image
                      src="/assets/google.svg"
                      alt="Google"
                      width={201}
                      height={66}
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk">
                    reputation
                  </h1>
                </div>
                <div className="space-y-2">
                  <h1 className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk min-h-[90px]">
                    <TypingAnimation
                      texts={[
                        "Drives your revenue",
                        "increases your footfalls",
                      ]}
                      className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk"
                      speed={100}
                      delay={3000}
                    />
                  </h1>
                </div>
              </div>
            </div>
            <p className="text-[#374151] text-sm md:text-xl leading-6 md:leading-7 max-w-xs md:max-w-2xl mx-auto px-4">
              Turn every satisfied customer into a 5-star review. Build trust,
              boost visibility, and watch your business grow—all on autopilot.
            </p>
          </div>

          {/* Floating Cards - Desktop Only */}
          <div className="hidden lg:block">
            <div className="absolute top-[30px] left-[73px] bg-white shadow-[0px_10.221px_22.713px_0px_rgba(151,71,255,0.15)] rounded-[9px] p-[14px_38px]">
              <div className="flex gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-[22.713px] h-[22.713px]">
                    <svg viewBox="0 0 24 24" fill="#FFC107">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                ))}
              </div>
              <p className="text-[#1f2937] text-[16.416px] font-bold leading-[23.451px]">
                <span className="text-[#1c54e3]">4.6</span>
                <span className="font-normal text-[#1c54e3]">/5</span>
                <span className="font-normal"> - from 12k reviews</span>
              </p>
              <div className="h-[22.722px] w-[69.248px] relative mt-2">
                <Image
                  src="/assets/google.svg"
                  alt="Google"
                  width={69}
                  height={23}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="absolute top-[8px] right-[120px] bg-white border border-[#d8b4fe] rounded-[7.081px] p-4 rotate-[16.428deg]">
              <p className="text-[#1a1a1a] text-base leading-[1.4] w-[132px]">
                <span className="font-bold">Reduce negative reviews </span>by up
                to
              </p>
              <p className="text-[#ff9696] text-[38.129px] font-semibold leading-[28.597px] mt-2">
                90%
              </p>
            </div>

            <div className="absolute top-[259px] right-[120px] bg-white border border-[#d8b4fe] rounded-[7.081px] p-4">
              <p className="text-[#1a1a1a] text-base leading-[1.4] font-medium">
                You need 144 more
                <br />
                reviews to beat
              </p>
              <p className="text-[#059669] text-[38.129px] font-semibold leading-[28.597px] mt-2">
                #2
              </p>
            </div>

            <div className="absolute top-[328px] left-[21px] bg-white border border-[#d8b4fe] rounded-[7.081px] p-4">
              <p className="text-[#1a1a1a] text-base leading-[1.4] font-bold w-[132px]">
                Bost Your business Visibility
              </p>
              <p className="text-[#ff9696] text-[38.129px] font-semibold leading-[28.597px] mt-2">
                78%
              </p>
            </div>
          </div>

          {/* Review Group Component - Mobile */}
          <div
            className="lg:hidden mt-12 relative w-full flex justify-center"
            style={{ minHeight: "120px" }}
          >
            <div className="relative w-full max-w-[400px]">
              {/* "Get" Text */}
              <p
                className="absolute left-0 top-0 text-[48px] leading-[1.4] text-black not-italic"
                style={{
                  fontFamily: "var(--font-sacramento), Sacramento, cursive",
                  fontWeight: 400,
                  fontStyle: "normal",
                  letterSpacing: "normal",
                }}
              >
                Get
              </p>

              {/* Arrow */}
              <div className="absolute left-[69.37px] top-[31.94px] flex h-[67.866px] items-center justify-center w-[62.633px]">
                <div className="flex-none rotate-[330deg]">
                  <svg
                    width="63"
                    height="44"
                    viewBox="0 0 63 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="block"
                  >
                    <path
                      d="M0.717135 8.0009C2.18989 10.5518 5.45171 11.4258 8.0026 9.95303C10.5535 8.48027 11.4275 5.21846 9.95474 2.66756C8.48198 0.116668 5.22016 -0.757333 2.66927 0.715426C0.118377 2.18819 -0.755624 5.45 0.717135 8.0009ZM62.3363 35.8338L51.4352 32.0261L53.5882 43.3706L62.3363 35.8338ZM5.33594 5.33423L4.33594 5.33419C4.33591 6.01857 4.34508 6.69067 4.36331 7.35069L5.36293 7.32308L6.36255 7.29546C6.34484 6.65441 6.33591 6.00075 6.33594 5.33426L5.33594 5.33423ZM5.59038 11.2325L4.59449 11.323C4.72012 12.7045 4.89093 14.0265 5.1056 15.291L6.0915 15.1237L7.07739 14.9563C6.8719 13.7459 6.70752 12.4753 6.58627 11.1419L5.59038 11.2325ZM6.92861 18.9666L5.96332 19.2278C6.32922 20.5802 6.75479 21.8554 7.23789 23.0564L8.16565 22.6832L9.09341 22.31C8.64147 21.1865 8.24049 19.9864 7.89391 18.7055L6.92861 18.9666ZM9.87777 26.2093L9.01284 26.7112C9.71837 27.927 10.498 29.0452 11.3475 30.0706L12.1176 29.4327L12.8877 28.7947C12.1107 27.8568 11.3941 26.83 10.7427 25.7074L9.87777 26.2093ZM14.875 32.2193L14.2294 32.9829C15.276 33.8677 16.3921 34.6519 17.5714 35.3433L18.0772 34.4806L18.5829 33.6179C17.4983 32.982 16.4763 32.2635 15.5206 31.4556L14.875 32.2193ZM21.6042 36.1947L21.2347 37.1239C22.4702 37.6153 23.7562 38.029 25.087 38.3724L25.3368 37.4041L25.5866 36.4358C24.3302 36.1116 23.1248 35.7232 21.9738 35.2655L21.6042 36.1947ZM29.1861 38.1839L29.0355 39.1725C30.3309 39.3698 31.6607 39.5138 33.021 39.6099L33.0915 38.6124L33.162 37.6149C31.8502 37.5222 30.574 37.3837 29.3366 37.1953L29.1861 38.1839ZM37.0104 38.759L37.0038 39.7589C38.3083 39.7676 39.6366 39.7398 40.9856 39.6796L40.9411 38.6806L40.8965 37.6816C39.5783 37.7404 38.2843 37.7674 37.017 37.759L37.0104 38.759ZM44.8563 38.4224L44.9418 39.4188C46.2406 39.3073 47.5558 39.1706 48.8851 39.012L48.7666 38.019L48.6481 37.0261C47.3387 37.1823 46.0455 37.3167 44.7708 37.4261L44.8563 38.4224ZM52.6562 37.5002L52.8012 38.4896C54.0923 38.3004 55.3945 38.094 56.7057 37.873L56.5395 36.8869L56.3734 35.9008C55.0747 36.1197 53.7867 36.3238 52.5112 36.5107L52.6562 37.5002Z"
                      fill="#9747FF"
                    />
                  </svg>
                </div>
              </div>

              {/* Review Card */}
              <div className="absolute left-[calc(50%+70.5px)] top-[34px] translate-x-[-50%] bg-white border-[#3686f7] border-[0.234px] border-solid flex flex-col h-[80px] items-start p-[11.22px] rounded-[7.48px] w-[234px]">
                <div className="flex gap-[7.48px] items-center relative shrink-0">
                  {/* Google Icon */}
                  <div className="flex flex-row items-center self-stretch">
                    <div className="w-12 h-12 flex-shrink-0">
                      <Image
                        src="/assets/Google-icon.svg"
                        alt="Google"
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* User Detail */}
                  <div className="flex flex-col gap-[8px] items-start relative shrink-0 flex-1">
                    <p className="font-clash-grotesk font-semibold leading-[14.025px] not-italic relative shrink-0 text-[#1a1a1a] text-[14px]">
                      Boost reviews with AI
                    </p>
                    <div className="flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                      <div className="flex gap-[7.48px] items-center relative shrink-0 w-full">
                        <p className="font-bold leading-[14.025px] not-italic relative shrink-0 text-[#ffb300] text-[18.699px]">
                          4.9
                        </p>
                        <div className="flex gap-[1.87px] items-start relative shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="relative shrink-0 size-[18.699px]"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="#FFC107"
                                className="w-full h-full"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="font-medium leading-[7.012px] not-italic relative shrink-0 text-[7.48px] text-[rgba(0,0,0,0.5)] w-full whitespace-pre-wrap">
                        See all our reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section - 16px padding on mobile for full-width search area; shifted 120px up */}
        <div className="relative z-20 -mt-26 md:-mt-30 -translate-y-[120px] mx-auto w-full max-w-[1160px] px-4 md:px-6">
          {/* Outer gradient stroke (top, left, right) */}
          <div
            className="rounded-t-[24px] md:rounded-t-[40px] overflow-hidden"
            style={{
              background:
                "linear-gradient(to bottom, #F7F1FF 0%, rgba(247,241,255,0) 100%)",
              paddingTop: "0.5px",
              paddingLeft: "0.5px",
              paddingRight: "0.5px",
            }}
          >
            <div
              className="backdrop-blur-[20px] rounded-t-[24px] md:rounded-t-[40px] overflow-hidden"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
              }}
            >
              {/* Inner gradient stroke (top, left, right) */}
              <div
                className="rounded-t-[16px] md:rounded-t-[24px] overflow-hidden m-0 md:m-6"
                style={{
                  background:
                    "linear-gradient(to bottom, #F7F1FF 0%, rgba(247,241,255,0) 100%)",
                  paddingTop: "1px",
                  paddingLeft: "1px",
                  paddingRight: "1px",
                }}
              >
                <div
                  className="rounded-t-[16px] md:rounded-t-[24px] px-4 md:px-6 py-8 md:py-12"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)",
                  }}
                >
                  <p className="text-[#000] text-lg md:text-[32px] font-medium md:font-semibold leading-6 md:leading-[40px] text-center mb-6 md:mb-8 lowercase font-clash-grotesk">
                    Find your business position Among Local Competitors
                  </p>
                  <div
                    className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-center w-full md:max-w-[940px] mx-auto"
                    ref={searchContainerRef}
                  >
                    <div className="hidden md:flex flex-shrink-0 items-center -mr-2">
                      <svg
                        width="131"
                        height="82"
                        viewBox="0 0 131 82"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-[123px] h-[77px]"
                      >
                        <path
                          d="M65.1934 0L72.3374 9.65565L83.5605 1.64449L86.0467 12.1624L100.44 6.44474L98.0666 16.9728L114.463 14.0119L107.423 23.6971L124.495 23.7328L113.359 31.7907L129.723 34.82L115.392 40.5977L129.723 46.3753L113.359 49.4047L124.495 57.4626L107.423 57.4982L114.463 67.1835L98.0666 64.2226L100.44 74.7506L86.0467 69.033L83.5605 79.5509L72.3374 71.5397L65.1934 81.1954L58.0493 71.5397L46.8263 79.5509L44.34 69.033L29.9472 74.7506L32.3201 64.2226L15.9235 67.1835L22.9634 57.4982L5.8914 57.4626L17.0279 49.4047L0.663574 46.3753L14.9945 40.5977L0.663574 34.82L17.0279 31.7907L5.8914 23.7328L22.9634 23.6971L15.9235 14.0119L32.3201 16.9728L29.9472 6.44474L44.34 12.1624L46.8263 1.64449L58.0493 9.65565L65.1934 0Z"
                          fill="#9747FF"
                        />
                        <path
                          d="M39.7129 47.3305L36.1247 47.0388L37.4276 31.0117L49.46 31.9898L49.1974 35.2192L40.7533 34.5327L40.4557 38.1926L48.5411 38.8499L48.2805 42.0554L40.1952 41.3981L39.7129 47.3305ZM53.4021 48.4433L49.8139 48.1517L51.1169 32.1245L58.4846 32.7235C62.3119 33.0346 64.297 34.9779 64.0442 38.0876C63.8322 40.695 62.4141 42.1449 59.6437 42.1604L59.6243 42.3996C60.9767 42.943 61.5784 43.8347 62.1012 45.1052L63.8078 49.2893L59.6216 48.949L58.0332 45.0876C57.4284 43.6418 56.9986 43.0049 55.3002 42.8668L53.8649 42.7501L53.4021 48.4433ZM54.4425 35.6456L54.1061 39.7839L58.053 40.1048C59.7275 40.2409 60.3185 39.7833 60.4469 38.2045C60.5714 36.6736 60.064 36.1026 58.3895 35.9664L54.4425 35.6456ZM77.0584 50.3665L64.8347 49.3728L66.1376 33.3456L78.3613 34.3394L78.0988 37.5687L69.4633 36.8667L69.2085 40.0003L77.4852 40.6732L77.2246 43.8786L68.9479 43.2058L68.6854 46.4351L77.3209 47.1371L77.0584 50.3665ZM91.1681 51.5135L78.9444 50.5198L80.2473 34.4927L92.471 35.4864L92.2085 38.7157L83.573 38.0137L83.3182 41.1474L91.5949 41.8202L91.3343 45.0257L83.0576 44.3528L82.7951 47.5822L91.4306 48.2842L91.1681 51.5135Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-center md:hidden mb-2">
                      <svg
                        width="131"
                        height="82"
                        viewBox="0 0 131 82"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-[150px] h-[95px]"
                      >
                        <path
                          d="M65.1934 0L72.3374 9.65565L83.5605 1.64449L86.0467 12.1624L100.44 6.44474L98.0666 16.9728L114.463 14.0119L107.423 23.6971L124.495 23.7328L113.359 31.7907L129.723 34.82L115.392 40.5977L129.723 46.3753L113.359 49.4047L124.495 57.4626L107.423 57.4982L114.463 67.1835L98.0666 64.2226L100.44 74.7506L86.0467 69.033L83.5605 79.5509L72.3374 71.5397L65.1934 81.1954L58.0493 71.5397L46.8263 79.5509L44.34 69.033L29.9472 74.7506L32.3201 64.2226L15.9235 67.1835L22.9634 57.4982L5.8914 57.4626L17.0279 49.4047L0.663574 46.3753L14.9945 40.5977L0.663574 34.82L17.0279 31.7907L5.8914 23.7328L22.9634 23.6971L15.9235 14.0119L32.3201 16.9728L29.9472 6.44474L44.34 12.1624L46.8263 1.64449L58.0493 9.65565L65.1934 0Z"
                          fill="#9747FF"
                        />
                        <path
                          d="M39.7129 47.3305L36.1247 47.0388L37.4276 31.0117L49.46 31.9898L49.1974 35.2192L40.7533 34.5327L40.4557 38.1926L48.5411 38.8499L48.2805 42.0554L40.1952 41.3981L39.7129 47.3305ZM53.4021 48.4433L49.8139 48.1517L51.1169 32.1245L58.4846 32.7235C62.3119 33.0346 64.297 34.9779 64.0442 38.0876C63.8322 40.695 62.4141 42.1449 59.6437 42.1604L59.6243 42.3996C60.9767 42.943 61.5784 43.8347 62.1012 45.1052L63.8078 49.2893L59.6216 48.949L58.0332 45.0876C57.4284 43.6418 56.9986 43.0049 55.3002 42.8668L53.8649 42.7501L53.4021 48.4433ZM54.4425 35.6456L54.1061 39.7839L58.053 40.1048C59.7275 40.2409 60.3185 39.7833 60.4469 38.2045C60.5714 36.6736 60.064 36.1026 58.3895 35.9664L54.4425 35.6456ZM77.0584 50.3665L64.8347 49.3728L66.1376 33.3456L78.3613 34.3394L78.0988 37.5687L69.4633 36.8667L69.2085 40.0003L77.4852 40.6732L77.2246 43.8786L68.9479 43.2058L68.6854 46.4351L77.3209 47.1371L77.0584 50.3665ZM91.1681 51.5135L78.9444 50.5198L80.2473 34.4927L92.471 35.4864L92.2085 38.7157L83.573 38.0137L83.3182 41.1474L91.5949 41.8202L91.3343 45.0257L83.0576 44.3528L82.7951 47.5822L91.4306 48.2842L91.1681 51.5135Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div
                      className="w-full md:flex-1 relative"
                      ref={searchAnchorRef}
                    >
                      <div
                        className="flex items-center bg-white border rounded-full p-2 gap-2 min-h-[48px] md:min-h-[56px]"
                        style={{ borderColor: BRAND_COLORS.primary }}
                      >
                        <div
                          className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: BRAND_COLORS.primary }}
                        >
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <input
                          type="text"
                          placeholder="Enter your business name"
                          value={searchValue}
                          onChange={(e) => {
                            setSearchValue(e.target.value);
                            setShowRecommendations(true);
                          }}
                          onFocus={() => openSearchOverlay()}
                          onClick={() => openSearchOverlay()}
                          readOnly
                          className="flex-1 px-2 md:px-3 py-2 text-sm md:text-base text-[#1a1a1a] font-medium outline-none placeholder:text-[#9ca3af] bg-transparent min-w-0 cursor-pointer"
                          aria-autocomplete="list"
                          aria-expanded={
                            showRecommendations && recommendations.length > 0
                          }
                          aria-controls="search-recommendations"
                          id="business-search"
                          aria-label="Search for your business (opens search)"
                        />
                        {searchValue && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchValue("");
                            }}
                            className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a] transition-colors"
                            aria-label="Clear search"
                          >
                            <svg
                              className="w-4 h-4 md:w-5 md:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-fit flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-white rounded-full font-medium transition-colors font-clash-grotesk whitespace-nowrap border opacity-50 cursor-not-allowed self-center"
                      style={{
                        color: BRAND_COLORS.primary,
                        borderColor: BRAND_COLORS.primary,
                        boxShadow: `0px 4px 0px 0px ${BRAND_COLORS.primaryDark}`,
                      }}
                    >
                      Get Free Report
                      <ChevronIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                  {typeof document !== "undefined" &&
                    !isSearchOverlayOpen &&
                    showRecommendations &&
                    recommendations.length > 0 &&
                    dropdownPosition &&
                    createPortal(
                      <ul
                        ref={dropdownRef}
                        id="search-recommendations"
                        role="listbox"
                        className="fixed z-[9999] mt-1 bg-white border-t-0 rounded-b-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.08)] overflow-hidden max-h-[280px] overflow-y-auto"
                        style={{
                          top: dropdownPosition.top + 4,
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          borderColor: BRAND_COLORS.primary,
                          borderWidth: "0 1px 1px 1px",
                        }}
                      >
                        {recommendations.map((item: BusinessRecommendation) => (
                          <li
                            key={item.id}
                            role="option"
                            tabIndex={0}
                            className="px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors"
                            style={{
                              borderColor: `rgba(${BRAND_COLORS.primaryRgb}, 0.12)`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `rgba(${BRAND_COLORS.primaryRgb}, 0.08)`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "";
                            }}
                            onClick={() => {
                              setSearchValue(item.title);
                              setShowRecommendations(false);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setSearchValue(item.title);
                                setShowRecommendations(false);
                              }
                            }}
                          >
                            <p className="font-semibold text-[#1a1a1a] text-sm md:text-base leading-snug">
                              {item.title}
                            </p>
                            <p className="text-[#6b7280] text-xs md:text-sm font-normal leading-snug mt-0.5">
                              {item.address}
                            </p>
                          </li>
                        ))}
                      </ul>,
                      document.body
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Google Review Matters */}
      <section className="relative py-12 md:py-20 px-4 md:px-8 bg-white overflow-visible">
        {/* Desktop Container - max 883px, responsive */}
        <div
          className="hidden md:block relative w-full max-w-[883px] mx-auto px-0"
          style={{ minHeight: "464px" }}
        >
          {/* Curved Arrow - Desktop: x=237.5px, y=64.75px */}
          <div className="absolute left-[237.5px] top-[64.75px] w-[204.5px] h-[170.245px] z-10">
            <Image
              src="/assets/arrow 1.svg"
              alt=""
              width={204.5}
              height={170.245}
              className="object-contain"
            />
          </div>

          {/* Review Card - Desktop: x=466px, y=0px */}
          <div className="absolute left-[466px] top-0 z-20">
            <div className="bg-white border-[#3686f7] border-[0.373px] rounded-[11.943px] shadow-[0px_4px_4px_0px_rgba(151,71,255,0.5)] p-[17.914px] w-[350.819px]">
              {/* User Info */}
              <div className="flex items-center gap-[11.943px] mb-[11.943px]">
                <div className="w-[29.857px] h-[29.857px] rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/assets/Img 2.png"
                    alt="Hema Chowdhary"
                    width={29.857}
                    height={29.857}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[#1a1a1a] text-[11.943px] font-semibold leading-[14.928px]">
                    Hema Chowdhary
                  </p>
                  <p className="text-[rgba(0,0,0,0.5)] text-[8.957px] leading-[11.196px]">
                    on Dec 26, 2024
                  </p>
                </div>
              </div>

              {/* Rating Stars */}
              <div className="mb-[11.943px]">
                <Image
                  src="/assets/Review stars.svg"
                  alt="5 stars"
                  width={101.514}
                  height={17.914}
                />
              </div>

              {/* Review Text */}
              <p className="text-[#333a4b] text-[14.545px] leading-[18.182px]">
                "I was completely impressed by their professionalism and the
                quality of their work. The final result exceeded my expectations
              </p>
            </div>
          </div>

          {/* Title Frame - Desktop: y=248px, single line */}
          <div className="absolute left-0 right-0 top-[248px] w-full px-2">
            <div className="flex flex-nowrap items-center justify-center gap-x-2 lg:gap-x-4 min-w-0">
              <h2 className="text-[36px] md:text-[42px] lg:text-[56px] xl:text-[66px] font-semibold leading-[1.4] text-[#374151] font-clash-grotesk whitespace-nowrap shrink-0">
                Why
              </h2>
              <div className="inline-flex shrink-0">
                <Image
                  src="/assets/google.svg"
                  alt="Google"
                  width={201}
                  height={66}
                  className="object-contain w-[80px] md:w-[100px] lg:w-[140px] xl:w-[201px] h-auto"
                />
              </div>
              <h2 className="text-[36px] md:text-[42px] lg:text-[56px] xl:text-[66px] font-semibold leading-[1.4] text-[#374151] font-clash-grotesk whitespace-nowrap shrink-0">
                review matters?
              </h2>
            </div>
          </div>

          {/* Description - Desktop: y=362px */}
          <div className="absolute left-0 right-0 top-[362px] w-full px-2">
            <p className="text-[#374151] text-[22px] lg:text-[26px] leading-[1.4] text-center max-w-full">
              As per report,{" "}
              <span className="font-bold">
                Around 80–88% of customers—rely on Google reviews before
                choosing a business.
              </span>{" "}
              This underscores the importance of maintaining a strong and
              positive Google review profile for customer acquisition and trust
              building
            </p>
          </div>
        </div>

        {/* Mobile Container - responsive, prevents overflow */}
        <div
          className="md:hidden relative w-full max-w-[min(375px,100%)] mx-auto px-4"
          style={{ minHeight: "356px" }}
        >
          {/* Curved Arrow - Mobile */}
          <div className="absolute left-0 top-[44px] w-[100px] min-[360px]:w-[119.4px] h-[98px] min-[360px]:h-[117.5625px] z-10">
            <Image
              src="/assets/arrow 1.svg"
              alt=""
              width={119.4}
              height={117.5625}
              className="object-contain rotate-[-40.859deg] origin-center"
            />
          </div>

          {/* Review Card - Mobile: responsive left so it doesn't overflow on narrow screens */}
          <div className="absolute left-4 min-[360px]:left-[112px] top-0 z-20">
            <div className="bg-white border-[#f7f1ff] border-[0.28px] rounded-[8.957px] shadow-[0px_1px_2px_0px_#9747ff] p-[13.436px] w-[240px] min-[360px]:w-[263.114px] max-w-[calc(100vw-2rem)]">
              {/* User Info */}
              <div className="flex items-center gap-[8.957px] mb-[8.957px]">
                <div className="w-[22.393px] h-[22.393px] rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src="/assets/Img 2.png"
                    alt="Hema Chowdhary"
                    width={22.393}
                    height={22.393}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[#1a1a1a] text-[8.957px] font-semibold leading-[11.196px]">
                    Hema Chowdhary
                  </p>
                  <p className="text-[rgba(0,0,0,0.5)] text-[6.718px] leading-[8.397px]">
                    on Dec 26, 2024
                  </p>
                </div>
              </div>

              {/* Rating Stars */}
              <div className="mb-[8.957px]">
                <Image
                  src="/assets/Review stars.svg"
                  alt="5 stars"
                  width={76.135}
                  height={13.436}
                />
              </div>

              {/* Review Text */}
              <p className="text-[#333a4b] text-[10.909px] leading-[13.636px]">
                "I was completely impressed by their professionalism and the
                quality of their work. The final result exceeded my expectations
              </p>
            </div>
          </div>

          {/* Title Frame - Mobile: contained so it doesn't break on small screens */}
          <div className="absolute left-0 right-0 top-[196px] w-full px-0">
            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
              <h2 className="text-[20px] min-[360px]:text-[22px] min-[400px]:text-[26px] font-semibold leading-[1.4] text-black font-clash-grotesk whitespace-nowrap">
                Why
              </h2>
              <Image
                src="/assets/google.svg"
                alt="Google"
                width={88.593}
                height={29.07}
                className="object-contain mx-0.5 w-[60px] min-[360px]:w-[72px] min-[400px]:w-[89px] h-auto shrink-0"
              />
              <h2 className="text-[20px] min-[360px]:text-[22px] min-[400px]:text-[26px] font-semibold leading-[1.4] text-black font-clash-grotesk whitespace-nowrap">
                review matters?
              </h2>
            </div>
          </div>

          {/* Description - Mobile: full width with max so it doesn't overflow */}
          <div className="absolute left-0 right-0 top-[246px] w-full max-w-[344px] mx-auto text-center">
            <p className="text-[#374151] text-[16px] min-[360px]:text-[18px] leading-[1.4]">
              As per report,{" "}
              <span className="font-bold">
                Around 80–88% of customers—rely on Google reviews before
                choosing a business.
              </span>{" "}
              This underscores the importance of maintaining a strong and
              positive Google review profile for customer acquisition and trust
              building
            </p>
          </div>
        </div>

        {/* Three Cards */}
        <div className="max-w-7xl mx-auto mt-[80px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Instant Trust Card */}
            <div className="bg-white border border-[#9747ff] rounded-3xl p-6 md:p-8 space-y-6 shadow-[0px_6px_12px_0px_rgba(151,71,255,0.25)]">
              <div>
                <h3 className="text-[#9747ff] text-xl md:text-2xl font-bold leading-7 md:leading-8 mb-2 font-clash-grotesk">
                  Instant trust
                </h3>
                <p className="text-[#4b5563] text-sm md:text-base leading-5 md:leading-6 font-medium font-clash-grotesk">
                  Your rating speaks before you do—five stars build instant
                  trust.
                </p>
              </div>
              <div className="bg-[#FAF7FF] border border-[#e2e8f0] rounded-2xl h-[280px] md:h-[320px] p-4 md:p-6 flex flex-col justify-center">
                <div className="flex gap-2 md:gap-4 mb-3 md:mb-4">
                  <div className="w-5 h-5 md:w-6 md:h-6">
                    <Image
                      src="/assets/Google-icon.svg"
                      alt="Google"
                      width={24}
                      height={24}
                    />
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-[18px] h-[18px] md:w-[22.713px] md:h-[22.713px]"
                    >
                      <svg viewBox="0 0 24 24" fill="#FFC107">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  ))}
                </div>
                <p className="text-[#1a1a1a] text-sm md:text-base leading-4 md:leading-5 mb-3 md:mb-4">
                  The best service I&apos;ve received in a long time! The team
                  was incredibly responsive, and their expertise was evident in
                  the final product. There was a small miscommunication
                  initially, but they quickly resolved it. I would definitely
                  work with them again.
                </p>
                <div className="flex items-center gap-3 md:gap-4 mt-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden">
                    <Image
                      src="/assets/Img 3.png"
                      alt="User"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base text-[#1a1a1a]">
                      Samarth Asthana
                    </p>
                    <p className="text-xs text-[rgba(0,0,0,0.5)]">
                      Project Manager
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* High Visibility Card */}
            <div className="bg-white border border-[#9747ff] rounded-3xl p-6 md:p-8 space-y-6 shadow-[0px_6px_12px_0px_rgba(151,71,255,0.25)]">
              <div>
                <h3 className="text-[#9747ff] text-xl md:text-2xl font-bold leading-7 md:leading-8 mb-2 font-clash-grotesk">
                  High Visibility
                </h3>
                <p className="text-[#4b5563] text-sm md:text-base leading-5 md:leading-6 font-medium font-clash-grotesk">
                  Higher ratings make your business easier to find—and easier to
                  choose.
                </p>
              </div>
              <div className="bg-[#FAF7FF] backdrop-blur-sm rounded-2xl h-[280px] md:h-[320px] p-4 md:p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div>
                    <p
                      className="text-3xl md:text-5xl font-black leading-9 md:leading-[48px] font-clash-grotesk mb-1"
                      style={{ color: BRAND_COLORS.primary }}
                    >
                      10X
                    </p>
                    <p className="text-[#6b7280] text-[10px] md:text-xs font-semibold leading-3 md:leading-4 font-clash-grotesk">
                      Engagement Growth
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xl md:text-2xl font-bold leading-7 md:leading-8 font-clash-grotesk"
                      style={{ color: BRAND_COLORS.primary }}
                    >
                      22K
                    </p>
                    <p className="text-[#6b7280] text-[10px] md:text-xs font-medium leading-3 md:leading-4 font-clash-grotesk">
                      Total Reach
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-4 right-4 md:left-6 md:right-6">
                  <Image
                    src="/assets/Graph.svg"
                    alt="Graph"
                    width={300}
                    height={140}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* More Business Card */}
            <div className="bg-white border border-[#9747ff] rounded-3xl p-6 md:p-8 space-y-6 shadow-[0px_6px_12px_0px_rgba(151,71,255,0.25)]">
              <div>
                <h3 className="text-[#9747ff] text-xl md:text-2xl font-bold leading-7 md:leading-8 mb-2 font-clash-grotesk">
                  More business
                </h3>
                <p className="text-[#4b5563] text-sm md:text-base leading-5 md:leading-6 font-medium font-clash-grotesk">
                  More reviews consistently generate calls, visits, enquiries,
                  and leads
                </p>
              </div>
              <div className="bg-[#FAF7FF] border border-[#e2e8f0] rounded-2xl h-[280px] md:h-[320px] p-4 md:p-6 relative">
                <div className="absolute top-4 md:top-6 left-4 md:left-6">
                  <div className="relative inline-block">
                    <div className="flex items-center gap-2.5 md:gap-2 px-4 py-3 md:px-4 md:py-2 bg-[#7929E6] border-2 border-[#7929E6] rounded-[99px] min-h-[44px] md:min-h-0">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                      <span className="text-white text-base font-medium">
                        Website
                      </span>
                    </div>
                    <span
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-6 h-6 flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12.5922 23.258L12.5802 23.26L12.5092 23.295L12.4892 23.299L12.4752 23.295L12.4042 23.259C12.3936 23.2563 12.3856 23.2583 12.3802 23.265L12.3762 23.275L12.3592 23.703L12.3642 23.723L12.3742 23.736L12.4782 23.81L12.4932 23.814L12.5052 23.81L12.6092 23.736L12.6212 23.72L12.6252 23.703L12.6082 23.276C12.6056 23.2653 12.6002 23.2593 12.5922 23.258ZM12.8562 23.145L12.8422 23.147L12.6582 23.24L12.6482 23.25L12.6452 23.261L12.6632 23.691L12.6682 23.703L12.6762 23.711L12.8772 23.803C12.8899 23.8063 12.8996 23.8037 12.9062 23.795L12.9102 23.781L12.8762 23.167C12.8729 23.1543 12.8662 23.147 12.8562 23.145ZM12.1412 23.147C12.1368 23.1443 12.1315 23.1435 12.1265 23.1446C12.1215 23.1457 12.1171 23.1487 12.1142 23.153L12.1082 23.167L12.0742 23.781C12.0749 23.793 12.0806 23.801 12.0912 23.805L12.1062 23.803L12.3072 23.71L12.3172 23.702L12.3202 23.691L12.3382 23.261L12.3352 23.249L12.3252 23.239L12.1412 23.147Z"
                          fill="#9747FF"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10 3C10 2.73478 9.89464 2.48043 9.70711 2.29289C9.51957 2.10536 9.26522 2 9 2C8.73478 2 8.48043 2.10536 8.29289 2.29289C8.10536 2.48043 8 2.73478 8 3V5C8 5.26522 8.10536 5.51957 8.29289 5.70711C8.48043 5.89464 8.73478 6 9 6C9.26522 6 9.51957 5.89464 9.70711 5.70711C9.89464 5.51957 10 5.26522 10 5V3ZM5.464 4.05C5.37175 3.95449 5.26141 3.87831 5.1394 3.8259C5.0174 3.77349 4.88618 3.7459 4.7534 3.74475C4.62062 3.7436 4.48894 3.7689 4.36605 3.81918C4.24315 3.86946 4.1315 3.94371 4.0376 4.0376C3.94371 4.1315 3.86946 4.24315 3.81918 4.36605C3.7689 4.48894 3.7436 4.62062 3.74475 4.7534C3.7459 4.88618 3.77349 5.0174 3.8259 5.1394C3.87831 5.26141 3.95449 5.37175 4.05 5.464L5.464 6.88C5.55698 6.97298 5.66735 7.04673 5.78883 7.09705C5.91031 7.14736 6.04051 7.17326 6.172 7.17326C6.30349 7.17326 6.43369 7.14736 6.55517 7.09705C6.67665 7.04673 6.78702 6.97298 6.88 6.88C6.97298 6.78702 7.04673 6.67665 7.09705 6.55517C7.14736 6.43369 7.17326 6.30349 7.17326 6.172C7.17326 6.04051 7.14736 5.91031 7.09705 5.78883C7.04673 5.66735 6.97298 5.55698 6.88 5.464L5.464 4.05ZM9.791 8.21C8.813 7.884 7.884 8.813 8.209 9.79L11.742 20.388C12.099 21.46 13.582 21.546 14.061 20.522L16.116 16.116L20.522 14.061C21.546 13.583 21.46 12.099 20.388 11.742L9.791 8.21ZM13.95 4.05C14.1375 4.23753 14.2428 4.49184 14.2428 4.757C14.2428 5.02216 14.1375 5.27647 13.95 5.464L12.536 6.88C12.4431 6.97291 12.3328 7.04661 12.2114 7.09689C12.09 7.14718 11.9599 7.17306 11.8285 7.17306C11.6971 7.17306 11.567 7.14718 11.4456 7.09689C11.3242 7.04661 11.2139 6.97291 11.121 6.88C11.0281 6.78709 10.9544 6.67679 10.9041 6.5554C10.8538 6.434 10.8279 6.3039 10.8279 6.1725C10.8279 6.04111 10.8538 5.911 10.9041 5.7896C10.9544 5.66821 11.0281 5.55791 11.121 5.465L12.536 4.051C12.7235 3.86353 12.9778 3.75821 13.243 3.75821C13.5082 3.75821 13.7625 3.86253 13.95 4.05ZM2 9C2 8.73478 2.10536 8.48043 2.29289 8.29289C2.48043 8.10536 2.73478 8 3 8H5C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9C6 9.26522 5.89464 9.51957 5.70711 9.70711C5.51957 9.89464 5.26522 10 5 10H3C2.73478 10 2.48043 9.89464 2.29289 9.70711C2.10536 9.51957 2 9.26522 2 9ZM6.879 12.536C6.97191 12.4431 7.04561 12.3328 7.09589 12.2114C7.14618 12.09 7.17206 11.9599 7.17206 11.8285C7.17206 11.6971 7.14618 11.567 7.09589 11.4456C7.04561 11.3242 6.97191 11.2139 6.879 11.121C6.78609 11.0281 6.67579 10.9544 6.5544 10.9041C6.433 10.8538 6.3029 10.8279 6.1715 10.8279C6.04011 10.8279 5.91 10.8538 5.7886 10.9041C5.66721 10.9544 5.55691 11.0281 5.464 11.121L4.05 12.536C3.95449 12.6282 3.87831 12.7386 3.8259 12.8606C3.77349 12.9826 3.7459 13.1138 3.74475 13.2466C3.7436 13.3794 3.7689 13.5111 3.81918 13.634C3.86946 13.7569 3.94371 13.8685 4.0376 13.9624C4.1315 14.0563 4.24315 14.1305 4.36605 14.1808C4.48894 14.2311 4.62062 14.2564 4.7534 14.2552C4.88618 14.2541 5.0174 14.2265 5.1394 14.1741C5.26141 14.1217 5.37175 14.0455 5.464 13.95L6.879 12.536Z"
                          fill="#9747FF"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="absolute top-[120px] md:top-[160px] left-4 md:left-6">
                  <div className="relative inline-block">
                    <div className="flex items-center gap-2.5 md:gap-2 px-4 py-3 md:px-4 md:py-2 bg-[#9747FF] border-2 border-[#9747FF] rounded-[99px] min-h-[44px] md:min-h-0">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                      </svg>
                      <span className="text-white text-base font-medium">
                        Direction
                      </span>
                    </div>
                    <span
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-6 h-6 flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12.5922 23.258L12.5802 23.26L12.5092 23.295L12.4892 23.299L12.4752 23.295L12.4042 23.259C12.3936 23.2563 12.3856 23.2583 12.3802 23.265L12.3762 23.275L12.3592 23.703L12.3642 23.723L12.3742 23.736L12.4782 23.81L12.4932 23.814L12.5052 23.81L12.6092 23.736L12.6212 23.72L12.6252 23.703L12.6082 23.276C12.6056 23.2653 12.6002 23.2593 12.5922 23.258ZM12.8562 23.145L12.8422 23.147L12.6582 23.24L12.6482 23.25L12.6452 23.261L12.6632 23.691L12.6682 23.703L12.6762 23.711L12.8772 23.803C12.8899 23.8063 12.8996 23.8037 12.9062 23.795L12.9102 23.781L12.8762 23.167C12.8729 23.1543 12.8662 23.147 12.8562 23.145ZM12.1412 23.147C12.1368 23.1443 12.1315 23.1435 12.1265 23.1446C12.1215 23.1457 12.1171 23.1487 12.1142 23.153L12.1082 23.167L12.0742 23.781C12.0749 23.793 12.0806 23.801 12.0912 23.805L12.1062 23.803L12.3072 23.71L12.3172 23.702L12.3202 23.691L12.3382 23.261L12.3352 23.249L12.3252 23.239L12.1412 23.147Z"
                          fill="#9747FF"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10 3C10 2.73478 9.89464 2.48043 9.70711 2.29289C9.51957 2.10536 9.26522 2 9 2C8.73478 2 8.48043 2.10536 8.29289 2.29289C8.10536 2.48043 8 2.73478 8 3V5C8 5.26522 8.10536 5.51957 8.29289 5.70711C8.48043 5.89464 8.73478 6 9 6C9.26522 6 9.51957 5.89464 9.70711 5.70711C9.89464 5.51957 10 5.26522 10 5V3ZM5.464 4.05C5.37175 3.95449 5.26141 3.87831 5.1394 3.8259C5.0174 3.77349 4.88618 3.7459 4.7534 3.74475C4.62062 3.7436 4.48894 3.7689 4.36605 3.81918C4.24315 3.86946 4.1315 3.94371 4.0376 4.0376C3.94371 4.1315 3.86946 4.24315 3.81918 4.36605C3.7689 4.48894 3.7436 4.62062 3.74475 4.7534C3.7459 4.88618 3.77349 5.0174 3.8259 5.1394C3.87831 5.26141 3.95449 5.37175 4.05 5.464L5.464 6.88C5.55698 6.97298 5.66735 7.04673 5.78883 7.09705C5.91031 7.14736 6.04051 7.17326 6.172 7.17326C6.30349 7.17326 6.43369 7.14736 6.55517 7.09705C6.67665 7.04673 6.78702 6.97298 6.88 6.88C6.97298 6.78702 7.04673 6.67665 7.09705 6.55517C7.14736 6.43369 7.17326 6.30349 7.17326 6.172C7.17326 6.04051 7.14736 5.91031 7.09705 5.78883C7.04673 5.66735 6.97298 5.55698 6.88 5.464L5.464 4.05ZM9.791 8.21C8.813 7.884 7.884 8.813 8.209 9.79L11.742 20.388C12.099 21.46 13.582 21.546 14.061 20.522L16.116 16.116L20.522 14.061C21.546 13.583 21.46 12.099 20.388 11.742L9.791 8.21ZM13.95 4.05C14.1375 4.23753 14.2428 4.49184 14.2428 4.757C14.2428 5.02216 14.1375 5.27647 13.95 5.464L12.536 6.88C12.4431 6.97291 12.3328 7.04661 12.2114 7.09689C12.09 7.14718 11.9599 7.17306 11.8285 7.17306C11.6971 7.17306 11.567 7.14718 11.4456 7.09689C11.3242 7.04661 11.2139 6.97291 11.121 6.88C11.0281 6.78709 10.9544 6.67679 10.9041 6.5554C10.8538 6.434 10.8279 6.3039 10.8279 6.1725C10.8279 6.04111 10.8538 5.911 10.9041 5.7896C10.9544 5.66821 11.0281 5.55791 11.121 5.465L12.536 4.051C12.7235 3.86353 12.9778 3.75821 13.243 3.75821C13.5082 3.75821 13.7625 3.86253 13.95 4.05ZM2 9C2 8.73478 2.10536 8.48043 2.29289 8.29289C2.48043 8.10536 2.73478 8 3 8H5C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9C6 9.26522 5.89464 9.51957 5.70711 9.70711C5.51957 9.89464 5.26522 10 5 10H3C2.73478 10 2.48043 9.89464 2.29289 9.70711C2.10536 9.51957 2 9.26522 2 9ZM6.879 12.536C6.97191 12.4431 7.04561 12.3328 7.09589 12.2114C7.14618 12.09 7.17206 11.9599 7.17206 11.8285C7.17206 11.6971 7.14618 11.567 7.09589 11.4456C7.04561 11.3242 6.97191 11.2139 6.879 11.121C6.78609 11.0281 6.67579 10.9544 6.5544 10.9041C6.433 10.8538 6.3029 10.8279 6.1715 10.8279C6.04011 10.8279 5.91 10.8538 5.7886 10.9041C5.66721 10.9544 5.55691 11.0281 5.464 11.121L4.05 12.536C3.95449 12.6282 3.87831 12.7386 3.8259 12.8606C3.77349 12.9826 3.7459 13.1138 3.74475 13.2466C3.7436 13.3794 3.7689 13.5111 3.81918 13.634C3.86946 13.7569 3.94371 13.8685 4.0376 13.9624C4.1315 14.0563 4.24315 14.1305 4.36605 14.1808C4.48894 14.2311 4.62062 14.2564 4.7534 14.2552C4.88618 14.2541 5.0174 14.2265 5.1394 14.1741C5.26141 14.1217 5.37175 14.0455 5.464 13.95L6.879 12.536Z"
                          fill="#9747FF"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="absolute top-[80px] md:top-[110px] right-[32px] md:right-[40px]">
                  <div className="relative inline-block">
                    <div className="flex items-center gap-2.5 md:gap-2 px-4 py-3 md:px-4 md:py-2 bg-[#B673FF] border-2 border-[#B673FF] rounded-[99px] min-h-[44px] md:min-h-0">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                      </svg>
                      <span className="text-white text-base font-medium">
                        Call
                      </span>
                    </div>
                    <span
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-6 h-6 flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12.5922 23.258L12.5802 23.26L12.5092 23.295L12.4892 23.299L12.4752 23.295L12.4042 23.259C12.3936 23.2563 12.3856 23.2583 12.3802 23.265L12.3762 23.275L12.3592 23.703L12.3642 23.723L12.3742 23.736L12.4782 23.81L12.4932 23.814L12.5052 23.81L12.6092 23.736L12.6212 23.72L12.6252 23.703L12.6082 23.276C12.6056 23.2653 12.6002 23.2593 12.5922 23.258ZM12.8562 23.145L12.8422 23.147L12.6582 23.24L12.6482 23.25L12.6452 23.261L12.6632 23.691L12.6682 23.703L12.6762 23.711L12.8772 23.803C12.8899 23.8063 12.8996 23.8037 12.9062 23.795L12.9102 23.781L12.8762 23.167C12.8729 23.1543 12.8662 23.147 12.8562 23.145ZM12.1412 23.147C12.1368 23.1443 12.1315 23.1435 12.1265 23.1446C12.1215 23.1457 12.1171 23.1487 12.1142 23.153L12.1082 23.167L12.0742 23.781C12.0749 23.793 12.0806 23.801 12.0912 23.805L12.1062 23.803L12.3072 23.71L12.3172 23.702L12.3202 23.691L12.3382 23.261L12.3352 23.249L12.3252 23.239L12.1412 23.147Z"
                          fill="#9747FF"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10 3C10 2.73478 9.89464 2.48043 9.70711 2.29289C9.51957 2.10536 9.26522 2 9 2C8.73478 2 8.48043 2.10536 8.29289 2.29289C8.10536 2.48043 8 2.73478 8 3V5C8 5.26522 8.10536 5.51957 8.29289 5.70711C8.48043 5.89464 8.73478 6 9 6C9.26522 6 9.51957 5.89464 9.70711 5.70711C9.89464 5.51957 10 5.26522 10 5V3ZM5.464 4.05C5.37175 3.95449 5.26141 3.87831 5.1394 3.8259C5.0174 3.77349 4.88618 3.7459 4.7534 3.74475C4.62062 3.7436 4.48894 3.7689 4.36605 3.81918C4.24315 3.86946 4.1315 3.94371 4.0376 4.0376C3.94371 4.1315 3.86946 4.24315 3.81918 4.36605C3.7689 4.48894 3.7436 4.62062 3.74475 4.7534C3.7459 4.88618 3.77349 5.0174 3.8259 5.1394C3.87831 5.26141 3.95449 5.37175 4.05 5.464L5.464 6.88C5.55698 6.97298 5.66735 7.04673 5.78883 7.09705C5.91031 7.14736 6.04051 7.17326 6.172 7.17326C6.30349 7.17326 6.43369 7.14736 6.55517 7.09705C6.67665 7.04673 6.78702 6.97298 6.88 6.88C6.97298 6.78702 7.04673 6.67665 7.09705 6.55517C7.14736 6.43369 7.17326 6.30349 7.17326 6.172C7.17326 6.04051 7.14736 5.91031 7.09705 5.78883C7.04673 5.66735 6.97298 5.55698 6.88 5.464L5.464 4.05ZM9.791 8.21C8.813 7.884 7.884 8.813 8.209 9.79L11.742 20.388C12.099 21.46 13.582 21.546 14.061 20.522L16.116 16.116L20.522 14.061C21.546 13.583 21.46 12.099 20.388 11.742L9.791 8.21ZM13.95 4.05C14.1375 4.23753 14.2428 4.49184 14.2428 4.757C14.2428 5.02216 14.1375 5.27647 13.95 5.464L12.536 6.88C12.4431 6.97291 12.3328 7.04661 12.2114 7.09689C12.09 7.14718 11.9599 7.17306 11.8285 7.17306C11.6971 7.17306 11.567 7.14718 11.4456 7.09689C11.3242 7.04661 11.2139 6.97291 11.121 6.88C11.0281 6.78709 10.9544 6.67679 10.9041 6.5554C10.8538 6.434 10.8279 6.3039 10.8279 6.1725C10.8279 6.04111 10.8538 5.911 10.9041 5.7896C10.9544 5.66821 11.0281 5.55791 11.121 5.465L12.536 4.051C12.7235 3.86353 12.9778 3.75821 13.243 3.75821C13.5082 3.75821 13.7625 3.86253 13.95 4.05ZM2 9C2 8.73478 2.10536 8.48043 2.29289 8.29289C2.48043 8.10536 2.73478 8 3 8H5C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9C6 9.26522 5.89464 9.51957 5.70711 9.70711C5.51957 9.89464 5.26522 10 5 10H3C2.73478 10 2.48043 9.89464 2.29289 9.70711C2.10536 9.51957 2 9.26522 2 9ZM6.879 12.536C6.97191 12.4431 7.04561 12.3328 7.09589 12.2114C7.14618 12.09 7.17206 11.9599 7.17206 11.8285C7.17206 11.6971 7.14618 11.567 7.09589 11.4456C7.04561 11.3242 6.97191 11.2139 6.879 11.121C6.78609 11.0281 6.67579 10.9544 6.5544 10.9041C6.433 10.8538 6.3029 10.8279 6.1715 10.8279C6.04011 10.8279 5.91 10.8538 5.7886 10.9041C5.66721 10.9544 5.55691 11.0281 5.464 11.121L4.05 12.536C3.95449 12.6282 3.87831 12.7386 3.8259 12.8606C3.77349 12.9826 3.7459 13.1138 3.74475 13.2466C3.7436 13.3794 3.7689 13.5111 3.81918 13.634C3.86946 13.7569 3.94371 13.8685 4.0376 13.9624C4.1315 14.0563 4.24315 14.1305 4.36605 14.1808C4.48894 14.2311 4.62062 14.2564 4.7534 14.2552C4.88618 14.2541 5.0174 14.2265 5.1394 14.1741C5.26141 14.1217 5.37175 14.0455 5.464 13.95L6.879 12.536Z"
                          fill="#9747FF"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-4 md:bottom-6 right-[32px] md:right-[40px]">
                  <div className="relative inline-block">
                    <div className="flex items-center gap-2.5 md:gap-2 px-4 py-3 md:px-4 md:py-2 bg-[#C5A3FF] border-2 border-[#C5A3FF] rounded-[99px] min-h-[44px] md:min-h-0">
                      <svg
                        className="w-5 h-5 md:w-6 md:h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                      </svg>
                      <span className="text-white text-base font-medium">
                        Share
                      </span>
                    </div>
                    <span
                      className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-6 h-6 flex items-center justify-center shrink-0"
                      aria-hidden
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12.5922 23.258L12.5802 23.26L12.5092 23.295L12.4892 23.299L12.4752 23.295L12.4042 23.259C12.3936 23.2563 12.3856 23.2583 12.3802 23.265L12.3762 23.275L12.3592 23.703L12.3642 23.723L12.3742 23.736L12.4782 23.81L12.4932 23.814L12.5052 23.81L12.6092 23.736L12.6212 23.72L12.6252 23.703L12.6082 23.276C12.6056 23.2653 12.6002 23.2593 12.5922 23.258ZM12.8562 23.145L12.8422 23.147L12.6582 23.24L12.6482 23.25L12.6452 23.261L12.6632 23.691L12.6682 23.703L12.6762 23.711L12.8772 23.803C12.8899 23.8063 12.8996 23.8037 12.9062 23.795L12.9102 23.781L12.8762 23.167C12.8729 23.1543 12.8662 23.147 12.8562 23.145ZM12.1412 23.147C12.1368 23.1443 12.1315 23.1435 12.1265 23.1446C12.1215 23.1457 12.1171 23.1487 12.1142 23.153L12.1082 23.167L12.0742 23.781C12.0749 23.793 12.0806 23.801 12.0912 23.805L12.1062 23.803L12.3072 23.71L12.3172 23.702L12.3202 23.691L12.3382 23.261L12.3352 23.249L12.3252 23.239L12.1412 23.147Z"
                          fill="#9747FF"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10 3C10 2.73478 9.89464 2.48043 9.70711 2.29289C9.51957 2.10536 9.26522 2 9 2C8.73478 2 8.48043 2.10536 8.29289 2.29289C8.10536 2.48043 8 2.73478 8 3V5C8 5.26522 8.10536 5.51957 8.29289 5.70711C8.48043 5.89464 8.73478 6 9 6C9.26522 6 9.51957 5.89464 9.70711 5.70711C9.89464 5.51957 10 5.26522 10 5V3ZM5.464 4.05C5.37175 3.95449 5.26141 3.87831 5.1394 3.8259C5.0174 3.77349 4.88618 3.7459 4.7534 3.74475C4.62062 3.7436 4.48894 3.7689 4.36605 3.81918C4.24315 3.86946 4.1315 3.94371 4.0376 4.0376C3.94371 4.1315 3.86946 4.24315 3.81918 4.36605C3.7689 4.48894 3.7436 4.62062 3.74475 4.7534C3.7459 4.88618 3.77349 5.0174 3.8259 5.1394C3.87831 5.26141 3.95449 5.37175 4.05 5.464L5.464 6.88C5.55698 6.97298 5.66735 7.04673 5.78883 7.09705C5.91031 7.14736 6.04051 7.17326 6.172 7.17326C6.30349 7.17326 6.43369 7.14736 6.55517 7.09705C6.67665 7.04673 6.78702 6.97298 6.88 6.88C6.97298 6.78702 7.04673 6.67665 7.09705 6.55517C7.14736 6.43369 7.17326 6.30349 7.17326 6.172C7.17326 6.04051 7.14736 5.91031 7.09705 5.78883C7.04673 5.66735 6.97298 5.55698 6.88 5.464L5.464 4.05ZM9.791 8.21C8.813 7.884 7.884 8.813 8.209 9.79L11.742 20.388C12.099 21.46 13.582 21.546 14.061 20.522L16.116 16.116L20.522 14.061C21.546 13.583 21.46 12.099 20.388 11.742L9.791 8.21ZM13.95 4.05C14.1375 4.23753 14.2428 4.49184 14.2428 4.757C14.2428 5.02216 14.1375 5.27647 13.95 5.464L12.536 6.88C12.4431 6.97291 12.3328 7.04661 12.2114 7.09689C12.09 7.14718 11.9599 7.17306 11.8285 7.17306C11.6971 7.17306 11.567 7.14718 11.4456 7.09689C11.3242 7.04661 11.2139 6.97291 11.121 6.88C11.0281 6.78709 10.9544 6.67679 10.9041 6.5554C10.8538 6.434 10.8279 6.3039 10.8279 6.1725C10.8279 6.04111 10.8538 5.911 10.9041 5.7896C10.9544 5.66821 11.0281 5.55791 11.121 5.465L12.536 4.051C12.7235 3.86353 12.9778 3.75821 13.243 3.75821C13.5082 3.75821 13.7625 3.86253 13.95 4.05ZM2 9C2 8.73478 2.10536 8.48043 2.29289 8.29289C2.48043 8.10536 2.73478 8 3 8H5C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9C6 9.26522 5.89464 9.51957 5.70711 9.70711C5.51957 9.89464 5.26522 10 5 10H3C2.73478 10 2.48043 9.89464 2.29289 9.70711C2.10536 9.51957 2 9.26522 2 9ZM6.879 12.536C6.97191 12.4431 7.04561 12.3328 7.09589 12.2114C7.14618 12.09 7.17206 11.9599 7.17206 11.8285C7.17206 11.6971 7.14618 11.567 7.09589 11.4456C7.04561 11.3242 6.97191 11.2139 6.879 11.121C6.78609 11.0281 6.67579 10.9544 6.5544 10.9041C6.433 10.8538 6.3029 10.8279 6.1715 10.8279C6.04011 10.8279 5.91 10.8538 5.7886 10.9041C5.66721 10.9544 5.55691 11.0281 5.464 11.121L4.05 12.536C3.95449 12.6282 3.87831 12.7386 3.8259 12.8606C3.77349 12.9826 3.7459 13.1138 3.74475 13.2466C3.7436 13.3794 3.7689 13.5111 3.81918 13.634C3.86946 13.7569 3.94371 13.8685 4.0376 13.9624C4.1315 14.0563 4.24315 14.1305 4.36605 14.1808C4.48894 14.2311 4.62062 14.2564 4.7534 14.2552C4.88618 14.2541 5.0174 14.2265 5.1394 14.1741C5.26141 14.1217 5.37175 14.0455 5.464 13.95L6.879 12.536Z"
                          fill="#9747FF"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section - Modern redesign */}
      <section
        className="relative py-16 md:py-24 px-4 md:px-8 overflow-hidden"
        aria-labelledby="key-features-heading"
      >
        {/* Subtle gradient background for depth */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f7f1ff]/60 via-white to-white"
          aria-hidden="true"
        />
        {/* Optional subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(151,71,255,0.12) 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto">
          {/* Section header - clear hierarchy */}
          <div className="text-center mb-14 md:mb-20">
            <p className="text-[#9747ff] text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-3 font-clash-grotesk">
              Features
            </p>
            <h2
              id="key-features-heading"
              className="text-[32px] md:text-[52px] lg:text-[58px] font-semibold leading-[1.2] tracking-tight mb-4 font-clash-grotesk text-[#111827]"
            >
              Everything you need to grow with reviews
            </h2>
            <p className="text-[#4b5563] text-base md:text-lg leading-relaxed font-clash-grotesk max-w-2xl mx-auto">
              Collect better reviews, respond uniquely every time, and improve
              local visibility with AI-powered tools.
            </p>
          </div>

          {/* 3×2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                img: "keyfeature-ai-feedback-pencil.png",
                title: "AI feedback suggestions",
                desc: "AI suggests relevant reply options based on the feedback—send the one you prefer.",
              },
              {
                img: "keyfeature-ai-reply.png",
                title: "AI Auto Reply",
                desc: "Automatically respond to reviews and messages in real time.",
              },
              {
                img: "keyfeature-seo.png",
                title: "SEO Boost",
                desc: "Higher ratings and fresh reviews improve local rankings and increase discovery on Google.",
              },
              {
                img: "keyfeature-reduce-negative.png",
                title: "Reduce negative feedback",
                desc: "Identify issues internally and resolve them before they turn into public negative reviews.",
              },
              {
                img: "keyfeature-no-repetition.png",
                title: "No Repetition",
                desc: "AI ensures unique, human-like responses every time—no copy-paste, no spam signals.",
              },
              {
                img: "keyfeature-dashboard.png",
                title: "Dynamic dashboard",
                desc: "Track reviews, ratings, engagement, and growth trends in one real-time dashboard.",
              },
            ].map((feature, i) => (
              <article
                key={i}
                className="
                  group relative rounded-2xl md:rounded-3xl p-6 md:p-8
                  bg-white/90 backdrop-blur-sm
                  border border-[#e5e7eb] hover:border-[#9747ff]/40
                  shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-12px_rgba(151,71,255,0.18),0_8px_16px_-8px_rgba(0,0,0,0.08)]
                  transition-all duration-300 ease-out
                  hover:-translate-y-1
                  focus-within:ring-2 focus-within:ring-[#9747ff]/50 focus-within:ring-offset-2
                "
              >
                {/* Icon area with brand tint */}
                <div className="flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-[#9747ff]/12 to-[#9747ff]/6 text-[#9747ff] mb-4 md:mb-5 group-hover:from-[#9747ff]/18 group-hover:to-[#9747ff]/10 transition-colors duration-300">
                  <div className="relative w-[72px] h-[72px] md:w-20 md:h-20">
                    <Image
                      src={`/assets/${feature.img}`}
                      alt=""
                      width={80}
                      height={80}
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
                <h3 className="text-[#111827] text-lg md:text-xl font-semibold leading-tight mb-2 font-clash-grotesk">
                  {feature.title}
                </h3>
                <p className="text-[#4b5563] text-sm md:text-base leading-relaxed font-clash-grotesk">
                  {feature.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 bg-white">
        {/* Desktop Version */}
        <div className="hidden md:block max-w-[1164px] mx-auto">
          {/* Title */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-6 mb-2">
              <h2 className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk text-black">
                How
              </h2>
              <h2 className="text-[64px] font-semibold leading-[1.4] text-[#9747ff] font-clash-grotesk">
                growth QR
              </h2>
              <h2 className="text-[64px] font-semibold leading-[1.4] font-clash-grotesk text-black">
                works
              </h2>
            </div>
            <p className="text-[#374151] text-[20px] leading-[28px] font-clash-grotesk max-w-[613px] mx-auto">
              Three simple steps to turn happy customers into 5-star reviews.
              From QR code to Google, we make it effortless.
            </p>
          </div>

          {/* Steps Container */}
          <div className="relative h-[1500px]">
            {/* Step 1: Scan the QR */}
            <div className="absolute left-0 top-0 w-[1105px] h-[478px]">
              {/* Google Card with Stars - 40px up, 15% bigger, brand stroke & dropshadow */}
              <div
                className="absolute left-0 top-[-40px] bg-white p-7 rounded-2xl w-[313px] z-20"
                style={{
                  border: "0.5px solid #9747FF",
                  boxShadow: "0px 8px 24px rgba(151, 71, 255, 0.25)",
                }}
              >
                <div className="flex flex-col gap-4 items-center">
                  <div className="flex flex-col gap-2 items-center">
                    <Image
                      src="/assets/Google-icon.svg"
                      alt="Google"
                      width={40}
                      height={40}
                    />
                    <Image
                      src="/assets/Review stars.svg"
                      alt="5 stars"
                      width={153.57}
                      height={22.71}
                    />
                    <div className="flex gap-2 items-center text-base leading-5 text-center">
                      <span className="font-bold text-[#1a1a1a]">5.0</span>
                      <span className="font-medium text-black">
                        rating from
                      </span>
                      <span className="font-bold text-[#1a1a1a]">
                        492 reviews
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[
                      "/assets/placeholder-01.png",
                      "/assets/placeholder-02.png",
                      "/assets/placeholder-03.png",
                      "/assets/placeholder-04.png",
                    ].map((img, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white -ml-[5px] first:ml-0 overflow-hidden relative"
                      >
                        <Image
                          src={img}
                          alt=""
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Image */}
              <div className="absolute left-[216px] top-[74px] w-[310px] h-[404px] rounded-3xl shadow-[-8px_8px_0px_0px_#ddff6f] overflow-hidden">
                <Image
                  src="/assets/hiw02.png"
                  alt="Scan QR"
                  width={310}
                  height={404}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Text Content */}
              <div className="absolute left-[655px] top-[146px] w-[450px]">
                <h3 className="text-[48px] font-semibold leading-[1.4] mb-2 font-clash-grotesk text-black">
                  Scan the QR
                </h3>
                <p className="text-[#374151] text-[20px] leading-[28px] font-clash-grotesk">
                  Customers scan your unique QR code right after their
                  experience. No searching, no typing—just one quick scan and
                  they're ready to review.
                </p>
              </div>
            </div>

            {/* Arrow between Step 1 and 2 */}
            <div className="absolute left-[484.5px] top-[481.9px] w-[175.37px] h-[165.13px] rotate-[353.092deg] z-10">
              <Image
                src="/assets/hiw arrows02.svg"
                alt=""
                width={175.37}
                height={165.13}
                className="w-full h-full"
              />
            </div>

            {/* Step 2: Select the feedback */}
            <div className="absolute left-[130px] top-[481.9px] w-[871px] h-[480.1px]">
              {/* AI Suggestion Card - 24px up, 40px right */}
              <div className="absolute right-[-40px] top-[12.1px] bg-white border-[#3686f7] border-[0.234px] p-[11.22px] rounded-[7.48px] w-[284px] z-20">
                <div className="flex gap-4 items-center">
                  <Image
                    src="/assets/Google-icon.svg"
                    alt="Google"
                    width={53.7}
                    height={53.7}
                  />
                  <div className="flex flex-col gap-4">
                    <p className="text-[14px] leading-[14px] font-semibold font-clash-grotesk">
                      <span className="text-[#9747ff]">AI</span> suggested{" "}
                      <span className="text-[#1976d2]">G</span>
                      <span className="text-[#ff3d00]">o</span>
                      <span className="text-[#ffc107]">o</span>
                      <span className="text-[#1976d2]">gl</span>
                      <span className="text-[#ff3d00]">e</span> Reviews
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[24px] font-bold text-[#ffc107]">
                        4.9
                      </span>
                      <Image
                        src="/assets/Review stars.svg"
                        alt="stars"
                        width={153.57}
                        height={22.71}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Image */}
              <div className="absolute left-[561px] top-[76.1px] w-[310px] h-[404px] rounded-3xl shadow-[-8px_8px_0px_0px_#ddff6f] overflow-hidden">
                <Image
                  src="/assets/hiw03.png"
                  alt="Select feedback"
                  width={310}
                  height={404}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Text Content */}
              <div className="absolute left-0 top-[219.1px] w-[450px]">
                <h3 className="text-[48px] font-semibold leading-[1.4] mb-2 font-clash-grotesk text-black">
                  select the feedback
                </h3>
                <p className="text-[#374151] text-[20px] leading-[28px] font-clash-grotesk">
                  Our AI suggests personalized review options based on their
                  experience. Customers pick what resonates, making it easy to
                  leave authentic feedback.
                </p>
              </div>
            </div>

            {/* Arrow between Step 2 and 3 */}
            <div className="absolute left-[634px] top-[993px] w-[164.5px] h-[170.52px] z-10">
              <Image
                src="/assets/hiw-arrow-step2-step3.png"
                alt=""
                width={164.5}
                height={170.52}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Step 3: Post the feedback */}
            <div className="absolute left-[0.32px] top-[993px] w-[1163.68px] h-[522.53px]">
              {/* Review Card */}
              <div className="absolute left-0 top-[27px] bg-white border-[#3686f7] border-[0.387px] p-[18.6px] rounded-[12.4px] shadow-[0px_33.323px_9.299px_0px_rgba(0,0,0,0),0px_21.699px_8.524px_0px_rgba(0,0,0,0.01),0px_12.399px_6.975px_0px_rgba(0,0,0,0.05),0px_5.425px_5.425px_0px_rgba(0,0,0,0.09),0px_1.55px_3.1px_0px_rgba(0,0,0,0.1)] w-[364.23px] z-20">
                <div className="flex gap-3 items-center mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src="/assets/Img 4.png"
                      alt="User"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-[12.4px] font-semibold leading-[15.5px] text-[#1a1a1a]">
                      Rahul Krishna
                    </p>
                    <p className="text-[9.3px] leading-[11.6px] text-[rgba(0,0,0,0.5)]">
                      on Dec 26, 2024
                    </p>
                  </div>
                  <Image
                    src="/assets/Google-icon.svg"
                    alt="Google"
                    width={40}
                    height={40}
                  />
                </div>
                <Image
                  src="/assets/Review stars.svg"
                  alt="5 stars"
                  width={153.57}
                  height={22.71}
                  className="mb-3"
                />
                <p className="text-[12.4px] leading-[15.5px] text-[#333a4b]">
                  "I was completely impressed by their professionalism and the
                  quality of their work. The final result exceeded my
                  expectations
                </p>
              </div>

              {/* Main Image */}
              <div className="absolute left-[296.68px] top-[92px] w-[310px] h-[404px] rounded-3xl shadow-[-8px_8px_0px_0px_#ddff6f] overflow-hidden">
                <Image
                  src="/assets/hiw01.png"
                  alt="Post feedback"
                  width={310}
                  height={404}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Rating Badge */}
              <div className="absolute left-[521.69px] top-[438.53px] flex flex-col items-center gap-px z-20">
                <div className="border-2 border-white rounded-[30px] shadow-[0px_1.741px_5.222px_0px_rgba(0,0,0,0.1),0px_1.741px_20px_-1.741px_rgba(0,0,0,0.1)] w-[60px] h-[60px] overflow-hidden -mb-[41px] z-10">
                  <Image
                    src="/assets/Img 4.png"
                    alt="User"
                    width={60}
                    height={60}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-[0px_1.741px_5.222px_0px_rgba(0,0,0,0.1),0px_1.741px_20px_-1.741px_rgba(0,0,0,0.1)]">
                  <div className="flex gap-3 items-center">
                    <Image
                      src="/assets/Review stars.svg"
                      alt="stars"
                      width={153.57}
                      height={22.71}
                    />
                    <span className="text-[30px] font-bold text-[#2d2e30]">
                      5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Text Content */}
              <div className="absolute left-[713.68px] top-[202px] w-[450px]">
                <h3 className="text-[48px] font-semibold leading-[1.4] mb-2 font-clash-grotesk text-black">
                  Post the feedback
                </h3>
                <p className="text-[#374151] text-[20px] leading-[28px] font-clash-grotesk">
                  With one tap, their review goes live on Google. You get
                  notified instantly, and our AI helps you craft the perfect
                  response to show you care.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Version */}
        <div className="md:hidden max-w-[356px] mx-auto">
          {/* Title */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk text-black">
                How
              </h2>
              <h2 className="text-[24px] font-semibold leading-[1.4] text-[#9747ff] font-clash-grotesk">
                growth QR
              </h2>
              <h2 className="text-[24px] font-semibold leading-[1.4] font-clash-grotesk text-black">
                works
              </h2>
            </div>
            <p className="text-[#374151] text-[16px] leading-[20px] font-clash-grotesk">
              Three simple steps to turn happy customers into 5-star reviews.
              From QR code to Google, we make it effortless.
            </p>
          </div>

          {/* Step 1 - 80px gap to Step 2 on mobile */}
          <div className="relative mb-[80px] h-[496px] w-[263px] mx-auto">
            <div className="text-center mb-[80px]">
              <span className="text-[#9747ff] text-base font-semibold font-clash-grotesk">
                STEP - 1
              </span>
              <h3 className="text-[24px] font-semibold leading-[1.4] mb-1 font-clash-grotesk">
                Scan the QR
              </h3>
              <p className="text-[#374151] text-[14px] leading-[1.4] font-clash-grotesk">
                Customers scan your unique QR code right after their experience.
                No searching, no typing—just one quick scan and they're ready to
                review.
              </p>
            </div>

            {/* Google Card - 80px below text, 40px up, 15% bigger, brand stroke & dropshadow on mobile */}
            <div
              className="absolute left-0 top-[155px] bg-white p-[14px] rounded-lg w-[157px] z-20"
              style={{
                border: "0.5px solid #9747FF",
                boxShadow: "0px 6px 16px rgba(151, 71, 255, 0.25)",
              }}
            >
              <div className="flex flex-col gap-2 items-center">
                <Image
                  src="/assets/Google-icon.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                <Image
                  src="/assets/Review stars.svg"
                  alt="5 stars"
                  width={68}
                  height={12}
                />
                <div className="flex gap-1 items-center text-[8px] leading-[10px]">
                  <span className="font-bold text-[#1a1a1a]">5.0</span>
                  <span className="font-medium">rating from</span>
                  <span className="font-bold text-[#1a1a1a]">492 reviews</span>
                </div>
                <div className="flex items-center -space-x-1">
                  {[
                    "/assets/placeholder-01.png",
                    "/assets/placeholder-02.png",
                    "/assets/placeholder-03.png",
                    "/assets/placeholder-04.png",
                  ].map((img, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border border-white overflow-hidden flex-shrink-0"
                    >
                      <Image
                        src={img}
                        alt=""
                        width={20}
                        height={20}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Image - 30% bigger on mobile, 80px below text */}
            <div className="absolute right-0 top-[208px] w-[202px] h-[263px] rounded-xl shadow-[-4px_4px_0px_0px_#ddff6f] overflow-hidden">
              <Image
                src="/assets/hiw02.png"
                alt="Scan QR"
                width={202}
                height={263}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Step 2 - 80px gap to Step 3 on mobile */}
          <div className="relative mb-[80px] h-[472px] w-[254px] mx-auto">
            <div className="text-center mb-[80px]">
              <span className="text-[#9747ff] text-base font-semibold font-clash-grotesk">
                STEP - 2
              </span>
              <h3 className="text-[24px] font-semibold leading-[1.4] mb-1 font-clash-grotesk">
                select the feedback
              </h3>
              <p className="text-[#374151] text-[14px] leading-[1.4] font-clash-grotesk">
                Our AI suggests personalized review options based on their
                experience. Customers pick what resonates, making it easy to
                leave authentic feedback.
              </p>
            </div>

            {/* AI Suggestion Card - 80px below text, 24px up, 40px right on mobile */}
            <div className="absolute right-[-40px] top-[171px] bg-white border-[#3686f7] border p-[5.61px] rounded z-20">
              <div className="flex gap-1 items-center">
                <Image
                  src="/assets/Google-icon.svg"
                  alt="Google"
                  width={42}
                  height={42}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-semibold">
                    <span className="text-[#9747ff]">AI</span> suggested{" "}
                    <span className="text-[#1976d2]">G</span>
                    <span className="text-[#ff3d00]">o</span>
                    <span className="text-[#ffc107]">o</span>
                    <span className="text-[#1976d2]">gl</span>
                    <span className="text-[#ff3d00]">e</span> Reviews
                  </p>
                  <div className="flex gap-1 items-center">
                    <span className="text-[9.35px] font-bold text-[#ffb300]">
                      4.9
                    </span>
                    <Image
                      src="/assets/Review stars.svg"
                      alt="stars"
                      width={50}
                      height={9}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Image - 30% bigger on mobile, 80px below text */}
            <div className="absolute left-[32px] top-[195px] w-[202px] h-[263px] rounded-xl shadow-[-4px_4px_0px_0px_#ddff6f] overflow-hidden">
              <Image
                src="/assets/hiw03.png"
                alt="Select feedback"
                width={202}
                height={263}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative h-[515px] w-[342px] mx-auto">
            <div className="text-center mb-[80px]">
              <span className="text-[#9747ff] text-base font-semibold font-clash-grotesk">
                STEP - 3
              </span>
              <h3 className="text-[24px] font-semibold leading-[1.4] mb-1 font-clash-grotesk">
                Post the feedback
              </h3>
              <p className="text-[#374151] text-[14px] leading-[1.4] font-clash-grotesk">
                With one tap, their review goes live on Google. You get notified
                instantly, and our AI helps you craft the perfect response to
                show you care.
              </p>
            </div>

            {/* Review Card - 80px below text, centered, 40px up & 40px left on mobile */}
            <div className="absolute left-[calc(50%-40px)] top-[155px] -translate-x-1/2 bg-white border-[#3686f7] border p-[9.3px] rounded-md shadow-xl w-[182px] z-20">
              <div className="flex gap-2 items-center mb-2">
                <div className="w-[15.5px] h-[15.5px] rounded-full overflow-hidden">
                  <Image
                    src="/assets/Img 4.png"
                    alt="User"
                    width={15.5}
                    height={15.5}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[6.2px] font-semibold text-[#1a1a1a]">
                    Rahul Krishna
                  </p>
                  <p className="text-[4.65px] text-[rgba(0,0,0,0.5)]">
                    on Dec 26, 2024
                  </p>
                </div>
                <Image
                  src="/assets/Google-icon.svg"
                  alt="Google"
                  width={9.3}
                  height={9.3}
                />
              </div>
              <Image
                src="/assets/Review stars.svg"
                alt="5 stars"
                width={53}
                height={9}
                className="mb-2"
              />
              <p className="text-[6.2px] leading-[7.75px] text-[#333a4b]">
                "I was completely impressed by their professionalism and the
                quality of their work. The final result exceeded my expectations
              </p>
            </div>

            {/* Main Image - 30% bigger on mobile, 80px below text, centered */}
            <div className="absolute left-1/2 top-[208px] -translate-x-1/2 w-[202px] h-[263px] rounded-xl shadow-[-4px_4px_0px_0px_#ddff6f] overflow-hidden">
              <Image
                src="/assets/hiw01.png"
                alt="Post feedback"
                width={202}
                height={263}
                className="object-cover w-full h-full"
              />
            </div>

            {/* Rating Badge - centered */}
            <div className="absolute left-1/2 top-[390px] -translate-x-1/2 flex flex-col items-center gap-px z-20">
              <div className="border border-white rounded-[15px] shadow-lg w-[30px] h-[30px] overflow-hidden -mb-[20.5px] z-10">
                <Image
                  src="/assets/Img 4.png"
                  alt="User"
                  width={30}
                  height={30}
                  className="object-cover"
                />
              </div>
              <div className="bg-white p-3 rounded-md shadow-lg">
                <div className="flex gap-1.5 items-center">
                  <Image
                    src="/assets/Review stars.svg"
                    alt="stars"
                    width={96.5}
                    height={16}
                  />
                  <span className="text-[15px] font-bold text-[#2d2e30]">
                    5.0
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect for All Businesses - scroll end-to-end with section, no extra top/bottom space */}
      <section className="sliding-carousel-section mt-20 py-0 bg-[#f7f1ff] overflow-hidden relative min-h-[473px]">
        <div className="relative w-full min-h-[473px] md:flex md:items-center md:min-h-[72vh]">
          {/* Mobile Container - responsive, same images as desktop */}
          <div className="md:hidden relative bg-[#f7f1ff] min-h-[473px] w-full overflow-hidden px-4 pb-10">
            {/* Heading */}
            <div className="pt-12 pb-4 text-center max-w-[284px] mx-auto">
              <h2 className="font-clash-grotesk font-semibold text-[24px] leading-[1.4] text-black">
                Perfect for all businesses
              </h2>
            </div>

            {/* Description */}
            <div className="pb-6 max-w-[354px] mx-auto text-center">
              <p className="font-clash-grotesk text-[#374151] text-[16px] min-[375px]:text-[18px] leading-[1.5]">
                Whether you run a restaurant, retail store, service business, or
                healthcare practice—growth QR adapts to your industry and helps
                you build the reputation you deserve.
              </p>
            </div>

            {/* Business Cards Row - auto scroll horizontal, infinite loop (duplicated set for seamless loop) */}
            <div className="overflow-hidden -mx-4 px-0 pb-4">
              <div className="flex gap-4 w-max animate-scroll-x">
                {PFB_IMAGES_DUPLICATED.map((img, i) => (
                  <div
                    key={i}
                    className="h-[323px] relative rounded-2xl w-[248px] shrink-0 overflow-hidden border-0 shadow-none"
                  >
                    <Image
                      src={`/assets/${img}`}
                      alt={`Business ${(i % 6) + 1}`}
                      width={248}
                      height={323}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop: title + body — vertically centered in section */}
          <div className="hidden md:block max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full">
            <div className="max-w-md text-center md:text-left">
              <h2 className="text-[24px] md:text-[64px] font-semibold leading-none mb-4 md:mb-8 font-clash-grotesk">
                Perfect for all businesses
              </h2>
              <p className="text-[#374151] text-base md:text-xl leading-6 md:leading-7 font-clash-grotesk">
                Whether you run a restaurant, retail store, service business, or
                healthcare practice—growth QR adapts to your industry and helps
                you build the reputation you deserve.
              </p>
            </div>
          </div>
          {/* Desktop: two columns full height, top-aligned, no extra wrapper */}
          <div className="hidden md:flex absolute right-0 top-0 bottom-0 gap-3 md:gap-4 opacity-50 md:opacity-100 pr-[100px]">
            <div className="overflow-hidden flex flex-col h-full w-[124px] md:w-[248px]">
              <div className="flex flex-col gap-3 md:gap-4 animate-scroll-vertical flex-shrink-0">
                {[...["pfb06.png", "pfb05.png", "pfb04.png"], ...["pfb06.png", "pfb05.png", "pfb04.png"]].map((img, i) => (
                  <div
                    key={i}
                    className="w-[124px] h-[162px] md:w-[248px] md:h-[323px] rounded-2xl md:rounded-3xl overflow-hidden border-0 outline-none ring-0 shadow-none flex-shrink-0 [&_img]:outline-none [&_img]:border-0 [&_img]:ring-0"
                  >
                    <Image
                      src={`/assets/${img}`}
                      alt={`Business ${(i % 3) + 1}`}
                      width={248}
                      height={323}
                      className="w-full h-full object-cover border-0 outline-none ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden flex flex-col h-full w-[124px] md:w-[248px]">
              <div className="flex flex-col gap-3 md:gap-4 animate-scroll-vertical-reverse flex-shrink-0">
                {[...["pfb03.png", "pfb02.png", "pfb01.png"], ...["pfb03.png", "pfb02.png", "pfb01.png"]].map((img, i) => (
                  <div
                    key={i}
                    className="w-[124px] h-[162px] md:w-[248px] md:h-[323px] rounded-2xl md:rounded-3xl overflow-hidden border-0 outline-none ring-0 shadow-none flex-shrink-0 [&_img]:outline-none [&_img]:border-0 [&_img]:ring-0"
                  >
                    <Image
                      src={`/assets/${img}`}
                      alt={`Business ${(i % 3) + 4}`}
                      width={248}
                      height={323}
                      className="w-full h-full object-cover border-0 outline-none ring-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-[200px] px-4 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-[24px] md:text-[36px] leading-normal mb-6 md:mb-8 font-clash-grotesk max-w-[322px] md:max-w-[564px] mx-auto">
            Our team of experts are ready to discuss your needs and tailor a
            solution that works for you.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="flex items-center justify-center px-6 py-3 md:py-4 bg-white border border-[#9747ff] rounded-full text-[#9747ff] font-medium shadow-[0px_3px_0px_0px_#9747ff] md:shadow-[0px_4px_0px_0px_#9747ff] h-16 md:h-24 hover:bg-[#9747ff] hover:text-white transition-colors"
            >
              <span className="text-base md:text-xl leading-5 md:leading-[26px] font-clash-grotesk">
                Quick call with expert
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 bg-[#f7f1ff]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[24px] md:text-[60px] font-bold leading-tight md:leading-[60px] text-center mb-8 md:mb-10 font-clash-grotesk">
            Frequently asked questions
          </h2>
          <div className="space-y-0 max-w-[380px] md:max-w-none mx-auto">
            <FAQAccordion
              faqs={[
                {
                  question: "How does Growth QR help collect Google reviews?",
                  answer:
                    "Growth QR generates unique QR codes for your business that customers can scan to leave Google reviews instantly. The QR codes are linked directly to your Google Business Profile, making it easy for customers to share their feedback without searching for your business manually.",
                },
                {
                  question: "Can I customize the QR code design?",
                  answer:
                    "Yes! Growth QR allows you to customize your QR codes with your brand colors, logo, and messaging. You can create multiple QR codes for different locations, campaigns, or purposes, all while maintaining your brand identity.",
                },
                {
                  question: "How does AI help with review responses?",
                  answer:
                    "Our AI-powered system analyzes each review and suggests personalized, contextually appropriate responses. The AI ensures every response is unique, professional, and tailored to the specific feedback, helping you maintain authentic communication with your customers while saving time.",
                },
                {
                  question:
                    "Will Growth QR work with my existing Google Business Profile?",
                  answer:
                    "Absolutely! Growth QR integrates seamlessly with your existing Google Business Profile. Simply connect your account, and you can start generating QR codes and managing reviews immediately. No need to create a new profile or migrate any data.",
                },
                {
                  question: "How can I track my review performance?",
                  answer:
                    "Growth QR provides a comprehensive dashboard where you can track your review count, average rating, response rate, review trends over time, and engagement metrics. You'll get real-time insights to help you understand how reviews are impacting your business visibility and reputation.",
                },
                {
                  question:
                    "Is there a limit to how many reviews I can collect?",
                  answer:
                    "There's no limit to the number of reviews you can collect with Growth QR. You can generate unlimited QR codes and collect as many reviews as your customers are willing to leave. Our platform scales with your business needs.",
                },
                {
                  question: "What happens if I receive a negative review?",
                  answer:
                    "Growth QR helps you manage negative reviews proactively. You'll receive instant notifications, and our AI will suggest appropriate response strategies. The platform also helps you identify patterns in feedback so you can address issues internally before they become public reviews.",
                },
                {
                  question:
                    "Can I use Growth QR for multiple business locations?",
                  answer:
                    "Yes! Growth QR supports multi-location businesses. You can create separate QR codes for each location, track performance by location, and manage all your Google Business Profiles from a single dashboard. This makes it perfect for franchises, chains, or businesses with multiple branches.",
                },
                {
                  question: "How quickly will reviews appear on Google?",
                  answer:
                    "Reviews submitted through Growth QR appear on Google just like any other review - typically within a few minutes to a few hours, depending on Google's processing time. The QR code directs customers directly to Google's review interface, ensuring authentic, legitimate reviews.",
                },
                {
                  question: "Is there a free trial available?",
                  answer:
                    "Yes! We offer a free trial so you can experience all the features of Growth QR. During the trial, you can generate QR codes, collect reviews, use AI response suggestions, and explore the dashboard. No credit card required to start.",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-[120px] bg-[#f7f1ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 text-center">
          <h2 className="text-[100px] md:text-[235.2px] font-extrabold leading-[1.4] text-[#e1d8ff] mb-6 md:mb-8 font-clash-grotesk">
            growth QR
          </h2>
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="border-t border-[#e1d8ff] pt-6 md:pt-8 space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
                <a href="/terms" className="text-[#9747ff] hover:underline font-medium">
                  Terms & Conditions
                </a>
                <a href="/privacy" className="text-[#9747ff] hover:underline font-medium">
                  Privacy Policy
                </a>
              </div>
              <p className="text-[#9747ff] text-sm leading-5 font-medium">
                © 2025, tribly tech pvt ltd.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact expert modal */}
      {isContactModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={() => setIsContactModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — clean, elegant */}
            <div className="bg-white px-6 md:px-8 pt-6 pb-6 relative border-b border-[#e8ddff]/80 rounded-t-2xl">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-[#6b7280] hover:bg-[#f7f1ff] hover:text-[#9747ff] transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="pr-10">
                <h2
                  id="contact-modal-title"
                  className="text-xl md:text-2xl font-semibold text-[#1a1a1a] font-clash-grotesk tracking-tight"
                >
                  Talk to an expert
                </h2>
                <p className="text-[#6b7280] text-sm mt-1.5 font-clash-grotesk">
                  Free consultation — we’re here to help
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 md:px-8 py-6 md:py-8 bg-[#faf9fc]">
              <p className="text-[#4b5563] text-sm mb-5 font-clash-grotesk">
                Choose how you’d like to reach us
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:growth@tribly.ai"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#e8ddff] hover:border-[#9747ff]/40 hover:shadow-[0_4px_12px_rgba(151,71,255,0.12)] transition-all text-[#1a1a1a] group"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f1ff] text-[#9747ff] group-hover:bg-[#9747ff] group-hover:text-white transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-[#6b7280] font-clash-grotesk uppercase tracking-wide">
                      Email
                    </span>
                    <span className="block font-medium text-[#1a1a1a] truncate">
                      growth@tribly.ai
                    </span>
                  </div>
                  <ChevronIcon className="w-5 h-5 text-[#9747ff] shrink-0 rotate-[-90deg]" />
                </a>
                <a
                  href="tel:+919010640909"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#e8ddff] hover:border-[#9747ff]/40 hover:shadow-[0_4px_12px_rgba(151,71,255,0.12)] transition-all text-[#1a1a1a] group"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7f1ff] text-[#9747ff] group-hover:bg-[#9747ff] group-hover:text-white transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-[#6b7280] font-clash-grotesk uppercase tracking-wide">
                      Phone
                    </span>
                    <span className="block font-medium text-[#1a1a1a]">
                      +91 9010640909
                    </span>
                  </div>
                  <ChevronIcon className="w-5 h-5 text-[#9747ff] shrink-0 rotate-[-90deg]" />
                </a>
                <a
                  href="https://wa.me/919010640909"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#e8ddff] hover:border-[#25D366]/50 hover:shadow-[0_4px_12px_rgba(37,211,102,0.15)] transition-all text-[#1a1a1a] group"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dcf8e8] text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.534 6.056L.057 24l6.305-1.654a11.96 11.96 0 005.688 1.446h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-[#6b7280] font-clash-grotesk uppercase tracking-wide">
                      WhatsApp
                    </span>
                    <span className="block font-medium text-[#1a1a1a]">
                      Chat with us
                    </span>
                  </div>
                  <ChevronIcon className="w-5 h-5 text-[#25D366] shrink-0 rotate-[-90deg]" />
                </a>
              </div>
              <p className="text-[#6b7280] text-xs mt-5 text-center font-clash-grotesk">
                We typically respond within 24 hours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen search overlay */}
      {isSearchOverlayOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search for your business"
          className="fixed inset-0 z-[110] flex flex-col"
        >
          {/* Backdrop: fade + blur */}
          <div
            className={`absolute inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-300 ease-out ${
              searchOverlayExiting
                ? "opacity-0"
                : searchOverlayEntered
                ? "opacity-100"
                : "opacity-0"
            }`}
            onClick={closeSearchOverlay}
            aria-hidden
          />
          {/* Panel: slide up from bottom + fade */}
          <div
            className={`relative flex flex-col flex-1 min-h-0 bg-[#f7f1ff] rounded-none shadow-[0_-8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out ${
              searchOverlayExiting
                ? "translate-y-full opacity-0"
                : searchOverlayEntered
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 md:px-[200px] pt-4 md:pt-6 pb-3 border-b border-[#e8ddff]/60 shrink-0">
              <button
                type="button"
                onClick={
                  reportStep === "contact"
                    ? () => setReportStep("search")
                    : closeSearchOverlay
                }
                className="p-2 -ml-2 rounded-full text-[#9747ff] hover:bg-white/60 transition-colors"
                aria-label={reportStep === "contact" ? "Back" : "Close search"}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-[#1a1a1a] font-clash-grotesk flex-1">
                {reportStep === "contact"
                  ? "Where should we send your report?"
                  : "Find your business Position in the market"}
              </h2>
            </div>
            {reportStep === "contact" ? (
              /* Contact details step: WhatsApp + Email — centered */
              <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-[200px] py-6 flex flex-col items-center justify-center text-center">
                <p className="text-[#6b7280] text-sm mb-4 max-w-md">
                  We&apos;ll send the report for <strong className="text-[#1a1a1a]">{searchValue}</strong>. Enter at least one contact.
                </p>
                <div className="space-y-4 max-w-md w-full">
                  <label className="block text-center">
                    <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
                      WhatsApp / Phone number
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={reportWhatsApp}
                      onChange={(e) => setReportWhatsApp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border bg-white text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:ring-2 focus:ring-[#9747ff]/30 text-center"
                      style={{ borderColor: BRAND_COLORS.primary }}
                    />
                  </label>
                  <label className="block text-center">
                    <span className="text-sm font-medium text-[#1a1a1a] block mb-1.5">
                      Email
                    </span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border bg-white text-[#1a1a1a] placeholder:text-[#9ca3af] outline-none focus:ring-2 focus:ring-[#9747ff]/30 text-center"
                      style={{ borderColor: BRAND_COLORS.primary }}
                    />
                  </label>
                </div>
                <div className="mt-8 md:mt-10 flex justify-center">
                  <button
                    type="button"
                    disabled={!reportWhatsApp.trim() && !reportEmail.trim()}
                    className="w-full md:w-auto md:min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-full font-medium transition-colors font-clash-grotesk border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7f1ff]"
                    style={{
                      color: BRAND_COLORS.primary,
                      borderColor: BRAND_COLORS.primary,
                      boxShadow: `0px 4px 0px 0px ${BRAND_COLORS.primaryDark}`,
                    }}
                    onClick={handleSendReportSubmit}
                  >
                    Send me the report
                    <ChevronIcon className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <>
            {/* Search input + Get Free Report (desktop: side by side; mobile: search only) */}
            <div className="px-4 md:px-[200px] py-4 shrink-0 flex flex-col md:flex-row gap-4 md:items-center">
              <div
                className="flex flex-1 items-center bg-white border rounded-full p-2 gap-2 min-h-[52px] md:min-h-[56px] shadow-sm"
                style={{ borderColor: BRAND_COLORS.primary }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: BRAND_COLORS.primary }}
                >
                  <svg
                    className="w-5 h-5 md:w-5 md:h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  ref={searchOverlayInputRef}
                  type="text"
                  placeholder="Enter your business name"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    setShowRecommendations(true);
                  }}
                  className="flex-1 px-3 py-2 text-base text-[#1a1a1a] font-medium outline-none placeholder:text-[#9ca3af] bg-transparent min-w-0"
                  aria-autocomplete="list"
                  aria-expanded={recommendations.length > 0}
                  aria-controls="search-overlay-results"
                  id="search-overlay-input"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue("")}
                    className="flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#1a1a1a] transition-colors"
                    aria-label="Clear search"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={!searchValue.trim()}
                className="hidden md:flex items-center justify-center gap-2 px-6 py-4 bg-white rounded-full font-medium transition-colors font-clash-grotesk border hover:bg-[#f7f1ff] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: BRAND_COLORS.primary,
                  borderColor: BRAND_COLORS.primary,
                  boxShadow: `0px 4px 0px 0px ${BRAND_COLORS.primaryDark}`,
                }}
                onClick={handleGetReportClick}
              >
                Get Free Report
                <ChevronIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            {/* Results */}
            <div
              id="search-overlay-results"
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-[200px] pb-24 md:pb-8"
            >
              {recommendations.length > 0 ? (
                <ul role="listbox" className="space-y-1">
                  {recommendations.map((item: BusinessRecommendation) => (
                    <li
                      key={item.id}
                      role="option"
                      tabIndex={0}
                      className="px-4 py-3 rounded-2xl cursor-pointer border border-transparent hover:border-[#9747ff]/30 hover:bg-white/80 transition-colors"
                      onClick={() => {
                        setSearchValue(item.title);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSearchValue(item.title);
                        }
                      }}
                    >
                      <p className="font-semibold text-[#1a1a1a] text-sm md:text-base leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[#6b7280] text-xs md:text-sm font-normal leading-snug mt-0.5 line-clamp-2">
                        {item.address}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 md:py-16 text-center">
                  <div className="w-40 h-40 md:w-48 md:h-48 flex items-center justify-center mb-4">
                    <Image
                      src="/assets/search-binoculars.png"
                      alt="Search"
                      width={192}
                      height={192}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[#6b7280] text-sm md:text-base font-clash-grotesk">
                    {searchValue.trim()
                      ? "No businesses found. Try a different name or location."
                      : "Type to search for your business"}
                  </p>
                </div>
              )}
            </div>
            {/* Get Free Report - sticky footer (mobile only; desktop has button next to search) */}
            <div className="md:hidden shrink-0 px-4 md:px-[200px] py-4 md:py-5 border-t border-[#e8ddff]/60 bg-[#f7f1ff]/80 backdrop-blur-sm">
              <button
                type="button"
                disabled={!searchValue.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 md:py-4 bg-white rounded-full font-medium transition-colors font-clash-grotesk border hover:bg-[#f7f1ff] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: BRAND_COLORS.primary,
                  borderColor: BRAND_COLORS.primary,
                  boxShadow: `0px 4px 0px 0px ${BRAND_COLORS.primaryDark}`,
                }}
                onClick={handleGetReportClick}
              >
                Get Free Report
                <ChevronIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
