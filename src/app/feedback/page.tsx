"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";

type FilterType = "product" | "staff" | "customer-experience" | "offers-discounts";

interface FeedbackItem {
  id: string;
  category: FilterType;
  text: string;
  rating: number;
}

// Mock AI recommended feedbacks based on rating
const getFeedbackSuggestions = (rating: number): FeedbackItem[] => {
  const baseFeedbacks: FeedbackItem[] = [
    {
      id: "1",
      category: "product",
      text: "The product quality exceeded my expectations! The attention to detail and craftsmanship is remarkable. I've been using it for a while now and it continues to impress me with its durability and performance. The design is both functional and aesthetically pleasing, making it a great addition to my daily routine.",
      rating: 5,
    },
    {
      id: "2",
      category: "staff",
      text: "The staff was incredibly helpful and knowledgeable. They went above and beyond to assist me with all my questions and concerns. Their friendly demeanor and professional approach made the entire experience enjoyable. I truly appreciated their patience and willingness to ensure I had everything I needed.",
      rating: 5,
    },
    {
      id: "3",
      category: "customer-experience",
      text: "The overall experience was smooth and enjoyable. Everything was well-organized and efficient from the moment I walked in. The process was straightforward, and I never felt rushed or confused. The attention to customer satisfaction was evident throughout, making this one of the best experiences I've had.",
      rating: 5,
    },
    {
      id: "4",
      category: "offers-discounts",
      text: "Great value for money! The offers and discounts made it even more worthwhile. I was pleasantly surprised by the quality I received at such a reasonable price. The promotional deals were clearly communicated and easy to understand. This level of value is hard to find elsewhere, and I'm very satisfied with my purchase.",
      rating: 5,
    },
    {
      id: "5",
      category: "product",
      text: "The product met all my needs and the quality is consistent. Very satisfied with my purchase overall. It performs well for its intended purpose and has proven to be reliable. While there are areas that could be improved, the value proposition is solid and I would consider purchasing again in the future.",
      rating: 4,
    },
    {
      id: "6",
      category: "staff",
      text: "The staff was friendly and professional. They provided good service throughout my visit and were responsive to my needs. The team members I interacted with were courteous and made an effort to be helpful. Overall, it was a positive experience with staff who clearly care about customer satisfaction.",
      rating: 4,
    },
    {
      id: "7",
      category: "customer-experience",
      text: "Had a pleasant experience overall. The process was straightforward and hassle-free, which I really appreciated. The wait times were reasonable and the environment was comfortable. While there's always room for improvement, I left feeling satisfied with the service I received.",
      rating: 4,
    },
    {
      id: "8",
      category: "offers-discounts",
      text: "Appreciated the available discounts. Good deals that add value to the purchase and make it more affordable. The promotional offers were easy to apply and the savings were noticeable. It's always nice to get a good deal, and this definitely enhanced my overall satisfaction with the transaction.",
      rating: 4,
    },
    {
      id: "9",
      category: "product",
      text: "Really impressed with the product features and how well it performs. Would definitely recommend! The functionality exceeds what I initially expected, and the build quality is excellent. It's clear that a lot of thought went into the design and user experience. This is a product I'm proud to own and share with others.",
      rating: 5,
    },
    {
      id: "10",
      category: "staff",
      text: "Outstanding customer service! The team was attentive and made sure I had everything I needed throughout my visit. They anticipated my questions and provided helpful information proactively. The level of care and professionalism shown by the staff truly sets this place apart from others I've visited.",
      rating: 5,
    },
    {
      id: "11",
      category: "customer-experience",
      text: "From start to finish, the experience was exceptional. Everything was handled professionally and with great attention to detail. The seamless process and welcoming atmosphere made me feel valued as a customer. I can confidently say this was one of the best customer experiences I've had in a long time.",
      rating: 5,
    },
    {
      id: "12",
      category: "offers-discounts",
      text: "The promotional offers are fantastic! Great savings without compromising on quality, which is exactly what I was looking for. The discounts were substantial and the terms were fair and transparent. I felt like I got excellent value for my money, and the offers made the purchase even more appealing.",
      rating: 5,
    },
    {
      id: "13",
      category: "product",
      text: "The product is okay, nothing exceptional but it serves its purpose. The quality is decent for the price point. It meets basic expectations without exceeding them. There are some minor areas that could be improved, but overall it's acceptable.",
      rating: 3,
    },
    {
      id: "14",
      category: "staff",
      text: "The staff was adequate and handled my request without issues. Service was standard and they were polite. Nothing particularly memorable, but they did their job competently. The interaction was brief and straightforward.",
      rating: 3,
    },
    {
      id: "15",
      category: "customer-experience",
      text: "The experience was average overall. Everything worked as expected, but nothing stood out as exceptional. The process was functional and I got what I needed. It was a standard experience without any major issues or highlights.",
      rating: 3,
    },
    {
      id: "16",
      category: "offers-discounts",
      text: "The offers were reasonable but not particularly exciting. The discounts were modest and the terms were standard. It provided some value, though not as much as I had hoped. The pricing was fair for what was offered.",
      rating: 3,
    },
  ];

  // Filter feedbacks based on rating
  return baseFeedbacks.filter((feedback) => feedback.rating === rating);
};

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ratingParam = searchParams.get("rating");
  const rating = ratingParam === "excellent" ? 5 : ratingParam === "good" ? 4 : ratingParam === "average" ? 3 : null;

  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Get feedbacks based on rating
  const allFeedbacks = useMemo(() => {
    if (!rating) return [];
    return getFeedbackSuggestions(rating);
  }, [rating]);

  // Filter feedbacks based on selected category
  const filteredFeedbacks = useMemo(() => {
    if (!selectedFilter) return allFeedbacks;
    return allFeedbacks.filter((feedback) => feedback.category === selectedFilter);
  }, [allFeedbacks, selectedFilter]);

  const filters: { id: FilterType; label: string }[] = [
    { id: "product", label: "Product" },
    { id: "staff", label: "Staff" },
    { id: "customer-experience", label: "Customer Experience" },
    { id: "offers-discounts", label: "Offers & Discounts" },
  ];

  const handleCopyAndSubmit = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      
      // Get business code from URL or sessionStorage
      const codeParam = searchParams.get("code");
      const businessCode = codeParam || sessionStorage.getItem("businessCode");
      const businessId = sessionStorage.getItem("businessId");
      
      // Get Google Business review link
      let googleReviewLink = null;
      if (businessId) {
        const { getBusinessById } = await import("@/lib/mock-data");
        const business = getBusinessById(businessId);
        googleReviewLink = business?.googleBusinessReviewLink;
      }
      
      // Navigate to Google Business review if available, otherwise to rating page
      setTimeout(() => {
        if (googleReviewLink) {
          window.location.href = googleReviewLink;
        } else {
          router.push("/rating");
        }
      }, 500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  if (!rating) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/review")} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            AI Recommended Feedbacks
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Based on your {rating === 5 ? "Excellent" : rating === 4 ? "Good" : "Average"} rating
          </p>
        </div>

        {/* Manual feedback option */}
        {allFeedbacks.length > 0 && (
          <div className="py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Select any feedback below to use it, or customize it to match your experience.
            </p>
            <Button
              variant="link"
              onClick={() => {
                const codeParam = searchParams.get("code");
                router.push(`/manual-feedback?rating=${ratingParam}${codeParam ? `&code=${codeParam}` : ""}`);
              }}
              className="text-[#9747FF] hover:text-[#9747FF]/80 underline p-0 h-auto"
            >
              Or write your own feedback instead
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
          <div className="flex gap-2 sm:gap-3 flex-nowrap sm:flex-wrap min-w-max sm:min-w-0">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                onClick={() => setSelectedFilter(selectedFilter === filter.id ? null : filter.id)}
                className={
                  selectedFilter === filter.id
                    ? "bg-[#9747FF] text-white border-[#9747FF] hover:bg-[#9747FF]/90 rounded-full px-4 py-2 whitespace-nowrap flex-shrink-0"
                    : "bg-white border-[#9747FF] text-[#9747FF] hover:bg-white/90 rounded-full px-4 py-2 whitespace-nowrap flex-shrink-0"
                }
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="grid gap-4 sm:gap-6">
          {filteredFeedbacks.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-[#9747FF]/20">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  No feedbacks found for this filter. Try selecting a different category.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                className="bg-white/80 backdrop-blur-sm border-[#9747FF]/20 transition-all duration-300 hover:border-[#9747FF]/40"
              >
                <CardContent className="space-y-3 pt-6">
                  <p className="text-foreground leading-relaxed">{feedback.text}</p>
                  <Button
                    variant="outline"
                    onClick={() => handleCopyAndSubmit(feedback.text)}
                    className="w-full border-[#9747FF] text-[#9747FF] hover:bg-[#9747FF]/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy & Submit
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>

      {/* Toast Notification */}
      <Toast
        message="Copied!"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </main>
  );
}

