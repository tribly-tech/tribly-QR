"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Crown, Shield, Star, Check } from "lucide-react";
import { NewBusinessState } from "../types";

interface PlansCardProps {
  newBusiness: NewBusinessState;
  setNewBusiness: React.Dispatch<React.SetStateAction<NewBusinessState>>;
}

export function PlansCard({ newBusiness, setNewBusiness }: PlansCardProps) {
  return (
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
                className={`relative cursor-pointer transition-all ${
                  newBusiness.paymentPlan === "qr-plus"
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() =>
                  setNewBusiness({ ...newBusiness, paymentPlan: "qr-plus" })
                }
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
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        </div>
                        <CardDescription>
                          Advanced features for growth
                        </CardDescription>
                        <div className="mt-1">
                          <span className="text-2xl font-bold">₹6,999</span>
                          <span className="text-sm text-muted-foreground">
                            /year
                          </span>
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
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      All QR-Basic Features, Plus:
                    </h4>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Negative Feedback Control & Care",
                          desc: "Proactive management of negative reviews",
                        },
                        {
                          title: "Positive Feedback Growth",
                          desc: "Strategies to boost positive reviews",
                        },
                        {
                          title: "SEO Boost",
                          desc: "Enhanced search engine visibility",
                        },
                        {
                          title: "AI Auto Reply",
                          desc: "Intelligent automated responses",
                        },
                        {
                          title: "Advanced Analytics",
                          desc: "Deep insights and trend analysis",
                        },
                        {
                          title: "Priority Support",
                          desc: "24/7 dedicated customer support",
                        },
                        {
                          title: "Free AI QR Stand",
                          desc: "Free AI QR stand to boost your google reviews",
                        },
                        {
                          title: "GBP Score Analysis & Insights",
                          desc: "Track your Google Business Profile performance score",
                        },
                        {
                          title: "SEO Keyword Suggestions",
                          desc: "Location-based keyword recommendations for better rankings",
                        },
                        {
                          title: "Review Collection Automation",
                          desc: "Fully automated review collection workflows",
                        },
                        {
                          title: "Direct Review Links",
                          desc: "Generate direct links to your Google review page",
                        },
                      ].map((feature) => (
                        <div
                          key={feature.title}
                          className="flex items-start gap-3"
                        >
                          <Star className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              {feature.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR-Basic Plan */}
              <Card
                className={`relative cursor-pointer transition-all ${
                  newBusiness.paymentPlan === "qr-basic"
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() =>
                  setNewBusiness({ ...newBusiness, paymentPlan: "qr-basic" })
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-muted">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">QR-Basic</CardTitle>
                        <CardDescription>
                          Essential features for your business
                        </CardDescription>
                        <div className="mt-1">
                          <span className="text-2xl font-bold">₹2,999</span>
                          <span className="text-sm text-muted-foreground">
                            /year
                          </span>
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
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Features
                    </h4>
                    <div className="space-y-2">
                      {[
                        {
                          title: "AI Suggested Feedbacks",
                          desc: "Get intelligent feedback suggestions",
                        },
                        {
                          title: "Hassle-free Review Collection",
                          desc: "Collect reviews in under 30 seconds",
                        },
                        {
                          title: "Dynamic Dashboard",
                          desc: "Real-time insights and analytics",
                        },
                        {
                          title: "No Repetition",
                          desc: "Smart duplicate detection",
                        },
                        {
                          title: "Free AI QR Stand",
                          desc: "Free AI QR stand to boost your google reviews",
                        },
                        {
                          title: "GBP Score Analysis & Insights",
                          desc: "Track your Google Business Profile performance score",
                        },
                        {
                          title: "Direct Review Links",
                          desc: "Generate direct links to your Google review page",
                        },
                      ].map((feature) => (
                        <div
                          key={feature.title}
                          className="flex items-start gap-3"
                        >
                          <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">
                              {feature.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground">
              Click on a plan card to select it. QR-Plus includes advanced
              features.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
