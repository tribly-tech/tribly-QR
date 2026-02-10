"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  MapPin,
  TriangleAlert,
  Unplug,
} from "lucide-react";
import { calculateGBPScore } from "@/components/sales-dashboard";
import type { GBPAnalysisData } from "@/components/sales-dashboard/types";

type TimeRange = "Week" | "Month" | "Quarterly" | "Half-yearly" | "Yearly";
type PlatformStatus = "connected" | "not_connected" | "reconnect" | "syncing";

interface PlatformMetric {
  label: string;
  value: string;
  delta?: string;
}

interface SocialPlatformData {
  key: string;
  name: string;
  icon: ReactElement;
  status: PlatformStatus;
  lastSync: string;
  engagementGrowth: number;
  miniChart: number[];
  commonMetrics: PlatformMetric[];
  platformMetrics: PlatformMetric[];
  highlights: string[];
}

interface GbpData {
  name: string;
  icon: ReactElement;
  status: PlatformStatus;
  lastSync: string;
  engagementGrowth: number;
  miniChart: number[];
  primaryMetrics: PlatformMetric[];
  secondaryMetrics: PlatformMetric[];
  highlights: string[];
}

interface OverviewTabProps {
  businessName?: string | null;
  businessId?: string | null;
  isLoading?: boolean;
  error?: string | null;
  /** Called when user clicks "View full report" in the GBP section; e.g. navigate to Google Business Health tab */
  onViewGbpReport?: () => void;
}

const TIME_RANGES: TimeRange[] = ["Week", "Month", "Quarterly", "Half-yearly", "Yearly"];

/** Multipliers for volume metrics by time range (Month = 1). Chart length and growth variation. */
const TIME_RANGE_CONFIG: Record<
  TimeRange,
  { volumeMultiplier: number; chartPoints: number; growthMultiplier: number; label: string }
> = {
  Week: { volumeMultiplier: 0.25, chartPoints: 7, growthMultiplier: 0.4, label: "Last 7 days" },
  Month: { volumeMultiplier: 1, chartPoints: 8, growthMultiplier: 1, label: "Last 30 days" },
  Quarterly: { volumeMultiplier: 3, chartPoints: 12, growthMultiplier: 1.15, label: "Last 3 months" },
  "Half-yearly": { volumeMultiplier: 6, chartPoints: 24, growthMultiplier: 1.25, label: "Last 6 months" },
  Yearly: { volumeMultiplier: 12, chartPoints: 52, growthMultiplier: 1.4, label: "Last 12 months" },
};

function parseMetricNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim().replace(/^[+\-]/, "");
  const match = cleaned.match(/^([\d.]+)\s*(K|M|k|m|%|hrs?)?$/i);
  if (!match) return null;
  let n = parseFloat(match[1]);
  if (Number.isNaN(n)) return null;
  const suffix = (match[2] || "").toUpperCase();
  if (suffix === "K") n *= 1e3;
  else if (suffix === "M") n *= 1e6;
  if (value.trim().startsWith("-")) n = -n;
  return n;
}

function formatMetricDisplay(num: number, original: string): string {
  const suffix = original.replace(/[\d.,\s]/g, "").trim() || "";
  if (suffix.toUpperCase() === "K" || (num >= 1000 && num < 1e6))
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : String(Math.round(num));
  if (suffix.toUpperCase() === "M" || num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (suffix === "%") return `${num.toFixed(1)}%`;
  if (/hrs?/i.test(original)) return `${Math.round(num)} hrs`;
  if (num % 1 !== 0) return num.toFixed(1);
  return String(Math.round(num));
}

function scaleMetrics(metrics: PlatformMetric[], volumeMultiplier: number, growthMultiplier: number): PlatformMetric[] {
  return metrics.map((m) => {
    const parsed = parseMetricNumber(m.value);
    const isRating = /rating|avg/i.test(m.label) || (parsed !== null && parsed <= 5 && !m.value.includes("K"));
    if (parsed === null || isRating) return m;
    const scaled = parsed * volumeMultiplier;
    const newValue = formatMetricDisplay(scaled, m.value);
    let newDelta = m.delta;
    if (m.delta && growthMultiplier !== 1) {
      const d = parseMetricNumber(m.delta);
      if (d !== null) {
        const scaled = d * growthMultiplier;
        const sign = scaled >= 0 ? "+" : "";
        newDelta = `${sign}${Number(scaled.toFixed(1))}%`;
      }
    }
    return { ...m, value: newValue, delta: newDelta };
  });
}

function scaleChart(data: number[], timeRange: TimeRange): number[] {
  const { chartPoints, volumeMultiplier } = TIME_RANGE_CONFIG[timeRange];
  if (data.length === 0) return data;
  const base = [...data];
  if (base.length >= chartPoints) {
    const out = base.slice(-chartPoints).map((v) => Math.round(v * volumeMultiplier));
    return out.length ? out : base.map((v) => Math.round(v * volumeMultiplier));
  }
  const out: number[] = [];
  for (let i = 0; i < chartPoints; i++) {
    const idx = (i / (chartPoints - 1)) * (base.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, base.length - 1);
    const v = base[lo] + (base[hi] - base[lo]) * (idx - lo);
    out.push(Math.max(0, Math.round(v * volumeMultiplier)));
  }
  return out;
}

function applyTimeRangeToGbp(gbp: GbpData | null, timeRange: TimeRange): GbpData | null {
  if (!gbp) return null;
  const cfg = TIME_RANGE_CONFIG[timeRange];
  return {
    ...gbp,
    engagementGrowth: Math.max(0, Number((gbp.engagementGrowth * cfg.growthMultiplier).toFixed(1))),
    primaryMetrics: scaleMetrics(gbp.primaryMetrics, cfg.volumeMultiplier, cfg.growthMultiplier),
    secondaryMetrics: scaleMetrics(gbp.secondaryMetrics, cfg.volumeMultiplier, cfg.growthMultiplier),
    miniChart: scaleChart(Array.isArray(gbp.miniChart) ? gbp.miniChart : [], timeRange),
  };
}

function applyTimeRangeToPlatform(platform: SocialPlatformData, timeRange: TimeRange): SocialPlatformData {
  const cfg = TIME_RANGE_CONFIG[timeRange];
  return {
    ...platform,
    engagementGrowth: Math.max(0, Number((platform.engagementGrowth * cfg.growthMultiplier).toFixed(1))),
    commonMetrics: scaleMetrics(platform.commonMetrics ?? [], cfg.volumeMultiplier, cfg.growthMultiplier),
    platformMetrics: scaleMetrics(platform.platformMetrics ?? [], cfg.volumeMultiplier, cfg.growthMultiplier),
    miniChart: scaleChart(Array.isArray(platform.miniChart) ? platform.miniChart : [], timeRange),
  };
}

/** Platform brand colors for Login buttons */
const PLATFORM_BUTTON_STYLES: Record<string, string> = {
  instagram:
    "bg-white text-[#E4405F] border border-[#E4405F]/40 hover:bg-white hover:border-[#E4405F] focus-visible:ring-[#E4405F]",
  youtube:
    "bg-white text-[#FF0000] border border-[#FF0000]/40 hover:bg-white hover:border-[#FF0000] focus-visible:ring-[#FF0000]",
  facebook:
    "bg-white text-[#1877F2] border border-[#1877F2]/40 hover:bg-white hover:border-[#1877F2] focus-visible:ring-[#1877F2]",
  linkedin:
    "bg-white text-[#0A66C2] border border-[#0A66C2]/40 hover:bg-white hover:border-[#0A66C2] focus-visible:ring-[#0A66C2]",
};

const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const getStatusBadge = (status: PlatformStatus) => {
  switch (status) {
    case "connected":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Connected</Badge>;
    case "syncing":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Syncing</Badge>;
    case "reconnect":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Reconnect</Badge>;
    default:
      return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Not connected</Badge>;
  }
};

const performanceChartConfig = {
  value: {
    label: "Performance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function PerformanceTrendChart({ data, className }: { data: number[]; className?: string }) {
  const chartData = useMemo(
    () => (Array.isArray(data) ? data : []).map((value, i) => ({ period: `${i + 1}`, value: Number(value) || 0 })),
    [data]
  );
  if (chartData.length === 0) {
    return (
      <div className={className} style={{ minHeight: 160 }}>
        <div className="flex h-full min-h-[140px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
          No trend data for this period
        </div>
      </div>
    );
  }
  return (
    <ChartContainer config={performanceChartConfig} className={className}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `P${v}`}
        />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const Sparkline = ({ data }: { data: number[] }) => {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [0];
  const max = Math.max(...safeData, 1);
  return (
    <div className="flex items-end gap-1 h-12" aria-hidden>
      {safeData.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-full bg-gradient-to-t from-primary/40 to-primary"
          style={{ height: `${Math.max(15, (Number(value) / max) * 100)}%` }}
        />
      ))}
    </div>
  );
};

/** GBP metrics grouped for intuitive scanning (no new fields; same as before) */
const GBP_DISCOVERY = ["Searches", "Search views", "Maps views"] as const;
const GBP_ACTIONS = ["Calls", "Directions", "Website clicks"] as const;
const GBP_ENGAGEMENT = ["Reviews", "Avg rating", "Photo views"] as const;

const BLANK = "—";

/** GbpData with all values blank — used when no data or error (matches health tab: no data). */
function emptyGbpData(): GbpData {
  return {
    name: "Google Business Profile",
    icon: <MapPin className="h-5 w-5 text-primary" />,
    status: "not_connected",
    lastSync: BLANK,
    engagementGrowth: 0,
    miniChart: [],
    primaryMetrics: [
      { label: "Searches", value: BLANK },
      { label: "Calls", value: BLANK },
      { label: "Directions", value: BLANK },
      { label: "Website clicks", value: BLANK },
    ],
    secondaryMetrics: [
      { label: "Search views", value: BLANK },
      { label: "Maps views", value: BLANK },
      { label: "Reviews", value: BLANK },
      { label: "Avg rating", value: BLANK },
      { label: "Photo views", value: BLANK },
    ],
    highlights: [],
  };
}

/**
 * Map Google Business Health tab data (GBPAnalysisData) to Overview GBP section shape.
 * Only existing section fields are filled; no new fields. Missing data → blank.
 */
function mapGBPAnalysisToGbpData(analysis: GBPAnalysisData): GbpData {
  const formatNum = (n: number | undefined | null): string =>
    n != null && Number.isFinite(n) ? String(n) : BLANK;
  const rating =
    analysis.rating != null && Number.isFinite(analysis.rating)
      ? analysis.rating.toFixed(1)
      : BLANK;

  return {
    name: "Google Business Profile",
    icon: <MapPin className="h-5 w-5 text-primary" />,
    status: "connected",
    lastSync: BLANK,
    engagementGrowth: 0,
    miniChart: [],
    primaryMetrics: [
      { label: "Searches", value: BLANK },
      { label: "Calls", value: BLANK },
      { label: "Directions", value: BLANK },
      { label: "Website clicks", value: BLANK },
    ],
    secondaryMetrics: [
      { label: "Search views", value: BLANK },
      { label: "Maps views", value: BLANK },
      { label: "Reviews", value: formatNum(analysis.reviewCount) },
      { label: "Avg rating", value: rating },
      { label: "Photo views", value: formatNum(analysis.photoCount) },
    ],
    highlights: (analysis.insights ?? [])
      .slice(0, 5)
      .map((i) => (i.issue ? `${i.issue} ${i.action ?? ""}`.trim() : ""))
      .filter(Boolean),
  };
}

const buildInitialGbp = (businessName: string): GbpData => emptyGbpData();

const buildInitialSocialPlatforms = (businessName: string): SocialPlatformData[] => [
  {
    key: "instagram",
    name: "Instagram",
    icon: <img src="/assets/instagram-logo.png" alt="Instagram" className="h-5 w-5 object-contain" />,
    status: "connected",
    lastSync: "2 min ago",
    engagementGrowth: 19.7,
    miniChart: [10, 12, 15, 14, 18, 21, 24, 26],
    commonMetrics: [
      { label: "Posts published", value: "22", delta: "+9%" },
      { label: "Engagement", value: "5.4K", delta: "+18%" },
      { label: "Impressions", value: "62.1K", delta: "+14%" },
      { label: "Reach", value: "31.4K", delta: "+16%" },
      { label: "Followers", value: "12.7K", delta: "+5%" },
    ],
    platformMetrics: [
      { label: "Profile visits", value: "3.4K", delta: "+12%" },
      { label: "Reels reach", value: "18.2K", delta: "+22%" },
      { label: "Saves", value: "640", delta: "+7%" },
    ],
    highlights: [
      "Reels featuring product demos drive the highest reach.",
      "Stories with polls increase profile visits by 2x.",
    ],
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: <img src="/assets/youtube-logo.png" alt="YouTube" className="h-5 w-5 object-contain" />,
    status: "reconnect",
    lastSync: "2 days ago",
    engagementGrowth: 6.1,
    miniChart: [6, 8, 7, 10, 12, 9, 11, 13],
    commonMetrics: [
      { label: "Posts published", value: "6", delta: "+4%" },
      { label: "Engagement", value: "1.2K", delta: "+6%" },
      { label: "Impressions", value: "18.9K", delta: "+3%" },
      { label: "Reach", value: "12.4K", delta: "+2%" },
      { label: "Subscribers", value: "4.9K", delta: "+2%" },
    ],
    platformMetrics: [
      { label: "Views", value: "14.1K", delta: "+5%" },
      { label: "Watch time", value: "118 hrs", delta: "+8%" },
      { label: "CTR", value: "4.6%", delta: "+0.4%" },
    ],
    highlights: [
      "Short-form videos are trending with 2.4x engagement.",
      "Reconnect to refresh watch time and CTR insights.",
    ],
  },
  {
    key: "facebook",
    name: "Facebook",
    icon: <img src="/assets/facebook-logo.png" alt="Facebook" className="h-5 w-5 object-contain" />,
    status: "connected",
    lastSync: "8 min ago",
    engagementGrowth: 8.9,
    miniChart: [9, 10, 12, 11, 13, 15, 17, 16],
    commonMetrics: [
      { label: "Posts published", value: "18", delta: "+6%" },
      { label: "Engagement", value: "3.1K", delta: "+9%" },
      { label: "Impressions", value: "38.4K", delta: "+8%" },
      { label: "Reach", value: "22.6K", delta: "+6%" },
      { label: "Followers", value: "9.8K", delta: "+4%" },
    ],
    platformMetrics: [
      { label: "Page visits", value: "2.1K", delta: "+7%" },
      { label: "Post clicks", value: "1.4K", delta: "+5%" },
      { label: "Shares", value: "286", delta: "+3%" },
    ],
    highlights: [
      "Local posts outperform by 22% engagement rate.",
      "Carousel posts drive the highest click-through.",
    ],
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: <img src="/assets/linkedin-logo.png" alt="LinkedIn" className="h-5 w-5 object-contain" />,
    status: "not_connected",
    lastSync: "Not synced yet",
    engagementGrowth: 0,
    miniChart: [2, 3, 2, 4, 3, 3, 2, 4],
    commonMetrics: [
      { label: "Posts published", value: "0", delta: "0%" },
      { label: "Engagement", value: "0", delta: "0%" },
      { label: "Impressions", value: "0", delta: "0%" },
      { label: "Reach", value: "0", delta: "0%" },
      { label: "Followers", value: "0", delta: "0%" },
    ],
    platformMetrics: [
      { label: "Company views", value: "-", delta: "" },
      { label: "Job clicks", value: "-", delta: "" },
      { label: "Lead clicks", value: "-", delta: "" },
    ],
    highlights: [
      "Connect to unlock B2B visibility and lead intent.",
      "LinkedIn helps your team showcase credibility.",
    ],
  },
];

const DEFAULT_BUSINESS_NAME = "Your business";

const DISCONNECT_SIMULATE_MS = 800;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tribly.ai";

export function OverviewTab({ businessName, businessId, isLoading = false, error = null, onViewGbpReport }: OverviewTabProps) {
  const name = businessName?.trim() || DEFAULT_BUSINESS_NAME;
  const [timeRange, setTimeRange] = useState<TimeRange>("Month");
  const [gbp, setGbp] = useState<GbpData>(() => emptyGbpData());
  const [gbpLoading, setGbpLoading] = useState(true);
  const [gbpError, setGbpError] = useState<string | null>(null);
  const gbpFromApiRef = useRef(false);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatformData[]>(() =>
    buildInitialSocialPlatforms(name)
  );
  const [lastSynced, setLastSynced] = useState<Date>(() => new Date());
  const [platformActionLoading, setPlatformActionLoading] = useState<Record<string, boolean>>({});
  const [platformActionError, setPlatformActionError] = useState<Record<string, string | null>>({});
  const [disconnectConfirmKey, setDisconnectConfirmKey] = useState<string | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // Fetch GBP data from same source as Google Business Health tab
  useEffect(() => {
    if (!businessName?.trim()) {
      setGbp(emptyGbpData());
      setGbpLoading(false);
      setGbpError("Business name is required");
      gbpFromApiRef.current = false;
      return;
    }
    let cancelled = false;
    setGbpLoading(true);
    setGbpError(null);
    gbpFromApiRef.current = false;
    calculateGBPScore(businessName.trim(), null)
      .then((result) => {
        if (cancelled) return;
        setGbp(mapGBPAnalysisToGbpData(result.analysisData));
        setGbpError(null);
        gbpFromApiRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        setGbp(emptyGbpData());
        setGbpError(err instanceof Error ? err.message : "Failed to load GBP data");
        gbpFromApiRef.current = false;
      })
      .finally(() => {
        if (!cancelled) setGbpLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessName]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSocialPlatforms((prev) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((platform) => {
          if (platform?.status !== "connected") return platform;
          const chart = Array.isArray(platform.miniChart) ? platform.miniChart : [];
          const lastVal = chart.length > 0 ? chart[chart.length - 1] : 0;
          const jitter = (Math.random() - 0.45) * 2;
          const nextGrowth = Math.max(0, Number(platform.engagementGrowth) + jitter);
          return {
            ...platform,
            engagementGrowth: Number(nextGrowth.toFixed(1)),
            lastSync: "Just now",
            miniChart: chart.length > 0 ? [...chart.slice(1), Math.max(4, lastVal + jitter * 2)] : chart,
          };
        });
      });
      if (!gbpFromApiRef.current) {
        setGbp((prev) => {
          if (!prev || prev.status !== "connected") return prev;
          const chart = Array.isArray(prev.miniChart) ? prev.miniChart : [];
          const lastVal = chart.length > 0 ? chart[chart.length - 1] : 0;
          const jitter = (Math.random() - 0.45) * 2;
          const nextGrowth = Math.max(0, Number(prev.engagementGrowth) + jitter);
          return {
            ...prev,
            engagementGrowth: Number(nextGrowth.toFixed(1)),
            lastSync: "Just now",
            miniChart: chart.length > 0 ? [...chart.slice(1), Math.max(6, lastVal + jitter * 2)] : chart,
          };
        });
      }
      setLastSynced(new Date());
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const filteredGbp = useMemo(() => applyTimeRangeToGbp(gbp, timeRange), [gbp, timeRange]);
  const filteredSocialPlatforms = useMemo(
    () => (Array.isArray(socialPlatforms) ? socialPlatforms : []).map((p) => applyTimeRangeToPlatform(p, timeRange)),
    [socialPlatforms, timeRange]
  );

  const summary = useMemo(() => {
    const connectedSocial = filteredSocialPlatforms.filter((p) => p.status === "connected");
    const connectedEntities = [
      ...(filteredGbp?.status === "connected" ? [{ name: filteredGbp.name, engagementGrowth: filteredGbp.engagementGrowth }] : []),
      ...connectedSocial.map((p) => ({ name: p.name, engagementGrowth: p.engagementGrowth })),
    ];
    const connected = connectedSocial.length + (filteredGbp?.status === "connected" ? 1 : 0);
    const growthValues = connectedEntities.map((e) => e.engagementGrowth);
    const averageGrowth =
      growthValues.length > 0
        ? growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length
        : 0;
    const best =
      connectedEntities.length > 0
        ? connectedEntities.reduce((prev, cur) =>
            cur.engagementGrowth > prev.engagementGrowth ? cur : prev
          )
        : null;
    return {
      connected,
      totalPlatforms: filteredSocialPlatforms.length + 1,
      averageGrowth: Number.isFinite(averageGrowth) ? averageGrowth : 0,
      bestPlatform: best?.name ?? "—",
    };
  }, [filteredGbp, filteredSocialPlatforms]);

  const connectedSocialPlatforms = useMemo(
    () => filteredSocialPlatforms.filter((platform) => platform.status === "connected"),
    [filteredSocialPlatforms]
  );

  const disconnectedSocialPlatforms = useMemo(
    () => filteredSocialPlatforms.filter((platform) => platform.status !== "connected"),
    [filteredSocialPlatforms]
  );

  const isPlatformLoading = (key: string) => !!platformActionLoading[key];
  const getPlatformError = (key: string) => platformActionError[key] ?? null;
  const clearPlatformError = (key: string) => setPlatformActionError((prev) => ({ ...prev, [key]: null }));

  const getPlatformAuthUrl = (platformKey: string): string => {
    const base = `${API_BASE}/dashboard/v1/connect/${platformKey}`;
    const params = new URLSearchParams();
    if (businessId) params.set("business_id", businessId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const handleConnect = (platformKey: string) => {
    if (isPlatformLoading(platformKey)) return;
    setPlatformActionLoading((prev) => ({ ...prev, [platformKey]: true }));
    setPlatformActionError((prev) => ({ ...prev, [platformKey]: null }));
    const authUrl = getPlatformAuthUrl(platformKey);
    window.location.href = authUrl;
  };

  const handleDisconnectConfirm = async () => {
    const key = disconnectConfirmKey;
    if (!key) return;
    setDisconnectLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, DISCONNECT_SIMULATE_MS));
      setSocialPlatforms((prev) =>
        prev.map((p) =>
          p.key === key
            ? {
                ...p,
                status: "not_connected" as const,
                lastSync: "Not synced yet",
                engagementGrowth: 0,
                commonMetrics: (p.commonMetrics ?? []).map((m) => ({ ...m, value: "0", delta: "0%" })),
                platformMetrics: (p.platformMetrics ?? []).map((m) => ({ ...m, value: "-", delta: "" })),
                miniChart: [2, 3, 2, 4, 3, 3, 2, 4],
              }
            : p
        )
      );
      setLastSynced(new Date());
      setDisconnectConfirmKey(null);
    } finally {
      setDisconnectLoading(false);
    }
  };

  const disconnectPlatform = socialPlatforms.find((p) => p.key === disconnectConfirmKey);

  const lastSyncedLabel =
    lastSynced && !Number.isNaN(lastSynced.getTime())
      ? lastSynced.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "—";

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <TriangleAlert className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 mt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="h-16 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-full md:w-80 rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 rounded bg-muted animate-pulse" />
                <div className="h-3 w-40 rounded bg-muted animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="h-48 rounded-lg bg-muted animate-pulse w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-0">
      <div className="rounded-2xl border border-purple-100/70 bg-white/95 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[1.75rem] leading-tight font-semibold text-foreground">Digital Health Report</h2>
              <Badge className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700 hover:bg-emerald-100">
                Live sync
              </Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Unified snapshot of your Google Business Profile and social performance.
            </p>
          </div>
          <p className="text-xs text-muted-foreground md:pt-1">Updated {lastSyncedLabel}</p>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-1.5 rounded-xl border border-border/70 bg-muted/20 p-1.5">
            {TIME_RANGES.map((range) => (
              <Button
                key={range}
                variant="ghost"
                size="sm"
                className={`h-9 rounded-lg px-3 text-sm ${
                  timeRange === range
                    ? "bg-white text-primary ring-1 ring-primary/40 shadow-sm hover:bg-white hover:text-primary"
                    : "text-foreground/85 hover:bg-white/70"
                }`}
                onClick={() => setTimeRange(range)}
                aria-pressed={timeRange === range}
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards: horizontal scroll on mobile, grid on desktop */}
      <div>
        {/* Mobile: horizontal scroll, card width adapts to content */}
        <div className="flex gap-3 overflow-x-auto pb-1 md:hidden">
          <Card className="flex-shrink-0 rounded-2xl border border-purple-100/70 bg-white px-3 py-4 shadow-sm min-w-[260px]">
            <CardHeader className="px-0 pt-0 pb-2.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total connected platforms
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold">{summary.connected}</span>
                <span className="text-sm text-muted-foreground">of {summary.totalPlatforms}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sync status updated {lastSyncedLabel}
              </p>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 rounded-2xl border border-purple-100/70 bg-white px-3 py-4 shadow-sm min-w-[260px]">
            <CardHeader className="px-0 pt-0 pb-2.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall engagement growth
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold">
                  {summary.averageGrowth.toFixed(1)}%
                </span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  +{timeRange}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Across connected platforms
              </p>
            </CardContent>
          </Card>

          <Card className="flex-shrink-0 rounded-2xl border border-purple-100/70 bg-white px-3 py-4 shadow-sm min-w-[260px]">
            <CardHeader className="px-0 pt-0 pb-2.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best performing platform
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="text-2xl font-semibold">{summary.bestPlatform}</div>
              {summary.connected > 0 ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  {formatDelta(summary.averageGrowth)} avg engagement lift
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Connect a platform to see performance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desktop: keep 3-column grid */}
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total connected platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold">{summary.connected}</span>
                <span className="text-sm text-muted-foreground">
                  of {summary.totalPlatforms}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Sync status updated {lastSyncedLabel}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall engagement growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold">
                  {summary.averageGrowth.toFixed(1)}%
                </span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  +{timeRange}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Across connected platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Best performing platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{summary.bestPlatform}</div>
              {summary.connected > 0 ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  {formatDelta(summary.averageGrowth)} avg engagement lift
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Connect a platform to see performance.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        {/* Google Business Profile — data from same source as Google Business Health tab */}
        {gbpLoading ? (
          <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading Google Business Profile…</p>
              <p className="text-xs text-muted-foreground mt-1">Same data as Google Business Health tab</p>
            </CardContent>
          </Card>
        ) : (
        <Card className="overflow-hidden border-0 bg-white shadow-sm ring-1 ring-border/60">
          {gbpError && (
            <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-2.5 text-xs text-amber-800">
              Unable to load GBP data.{" "}
              <button type="button" className="underline font-medium hover:no-underline" onClick={() => onViewGbpReport?.()}>
                Open Google Business Health
              </button>{" "}
              for details.
            </div>
          )}
          <div className="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 px-6 pt-5 pb-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
                  {gbp.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">Google Business Profile</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Local discovery and customer actions
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Synced {gbp?.lastSync ?? BLANK} · {TIME_RANGE_CONFIG[timeRange].label}</span>
                    <span className="text-border">·</span>
                    <span>{lastSyncedLabel}</span>
                  </div>
                </div>
            </div>
                <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(gbp.status)}
                {gbp.status === "connected" && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700">
                  {Number(filteredGbp?.engagementGrowth ?? gbp?.engagementGrowth ?? 0).toFixed(1)}% growth
                </span>
                )}
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90" onClick={() => onViewGbpReport?.()}>
                  View full report →
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="px-6 pt-5 pb-6">
            {gbp?.status === "connected" ? (
              <>
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-6">
                  {(() => {
                    const all = [...(filteredGbp?.primaryMetrics ?? []), ...(filteredGbp?.secondaryMetrics ?? [])];
                    const byLabel = Object.fromEntries(all.map((m) => [m.label, m]));
                    const discovery = GBP_DISCOVERY.map((l) => byLabel[l]).filter(Boolean);
                    const actions = GBP_ACTIONS.map((l) => byLabel[l]).filter(Boolean);
                    const engagement = GBP_ENGAGEMENT.map((l) => byLabel[l]).filter(Boolean);
                    const renderGroup = (title: string, metrics: PlatformMetric[]) => (
                      <div key={title}>
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {title}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {metrics.map((m) => (
                            <div
                              key={m.label}
                              className="flex flex-col justify-center rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5"
                            >
                              <span className="text-xs text-muted-foreground">{m.label}</span>
                              <div className="mt-0.5 flex items-baseline gap-2">
                                <span className="text-base font-semibold tabular-nums">{m.value}</span>
                                {m.delta && (
                                  <span className="text-xs font-medium text-emerald-600">{m.delta}</span>
                                )}
                          </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    );
                    return (
                      <>
                        {renderGroup("Discovery", discovery)}
                        {renderGroup("Customer actions", actions)}
                        {renderGroup("Engagement", engagement)}
                      </>
                    );
                  })()}
                </div>
                <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4 lg:border-l lg:bg-transparent">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Performance trend
                    </p>
                    <p className="mt-1 text-sm font-medium">Last 8 periods</p>
                  </div>
                  <PerformanceTrendChart data={filteredGbp?.miniChart ?? []} className="min-h-[160px] w-full" />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Insights
                </p>
                <ul className="space-y-3 max-w-prose">
                  {(gbp.highlights ?? []).length === 0 ? (
                    <li className="text-sm text-muted-foreground leading-relaxed">
                      No insights yet. Open Google Business Health for full analysis.
                    </li>
                  ) : (
                    (gbp.highlights ?? []).map((h) => (
                          <li
                            key={h}
                            className="flex gap-3 text-sm text-muted-foreground leading-relaxed"
                          >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span>{h}</span>
                          </li>
                        ))
                  )}
                </ul>
              </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {gbp.icon}
                </div>
                <p className="mt-3 font-medium">
                  {gbpError ? "Unable to load Google Business Profile data" : "Google Business Profile is not connected"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gbpError
                    ? "Data comes from the same source as the Google Business Health tab. Try opening the full report."
                    : "Connect to see discovery, actions, and engagement metrics."}
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                        variant="outline"
                  onClick={() => onViewGbpReport?.()}
                >
                  View full report →
                </Button>
                </div>
              )}
          </CardContent>
        </Card>
        )}

        <div className="mt-[120px] border-t border-dashed border-border/60 pt-4 md:mt-8 md:border-none md:pt-0">
          <h3 className="text-lg font-semibold">Social media platforms</h3>
          <p className="text-sm text-muted-foreground">
            Performance across connected social channels.
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Data synced {lastSyncedLabel}</span>
          </div>
        </div>

        <Card className="border-emerald-200/60 bg-emerald-50/40">
          <CardHeader className="flex flex-col items-start gap-2 px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Connected platforms</CardTitle>
              <CardDescription>Live performance data streaming in real time.</CardDescription>
            </div>
            <Badge className="bg-emerald-100 px-3 py-1 text-emerald-700 hover:bg-emerald-100">
              {connectedSocialPlatforms.length} Connected
            </Badge>
          </CardHeader>
          <CardContent className="flex gap-3 overflow-x-auto px-3 pb-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible">
            {connectedSocialPlatforms.length === 0 ? (
              <div className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-white/60 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No social platforms connected yet</p>
                <p className="text-xs text-muted-foreground mt-1">Connect platforms below to see performance here.</p>
              </div>
            ) : (
              connectedSocialPlatforms.map((platform) => (
              <Card
                key={platform.key}
                className="flex-shrink-0 min-w-[260px] bg-white transition-shadow hover:shadow-md lg:min-w-0"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{platform.name}</CardTitle>
                        <CardDescription>Last sync: {platform.lastSync}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(platform.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisconnectConfirmKey(platform.key);
                        }}
                        title={`Disconnect ${platform.name}`}
                      >
                        <Unplug className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement growth</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold">{platform.engagementGrowth.toFixed(1)}%</span>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          {formatDelta(platform.engagementGrowth)}
                      </Badge>
                      </div>
                    </div>
                    <Sparkline data={platform.miniChart} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {(platform.commonMetrics ?? []).map((metric) => (
                      <div key={metric.label} className="rounded-lg border border-border/70 p-3">
                        <p className="text-xs text-muted-foreground">{metric.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{metric.value}</span>
                          {metric.delta && (
                            <span className="text-xs text-emerald-600">{metric.delta}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Platform-specific highlights
                    </p>
                    <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                      {(platform.platformMetrics ?? []).map((metric) => (
                        <div key={metric.label} className="text-xs">
                          <p className="text-muted-foreground">{metric.label}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold">{metric.value}</span>
                            {metric.delta && <span className="text-emerald-600">{metric.delta}</span>}
            </div>
          </div>
                      ))}
            </div>
          </div>
        </CardContent>
      </Card>
              ))
            )}
        </CardContent>
      </Card>

        <Card className="border-slate-200/70 bg-slate-50/60">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Needs connection</CardTitle>
              <CardDescription>Link platforms to unlock real-time metrics.</CardDescription>
            </div>
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">
              {disconnectedSocialPlatforms.length} Pending
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {disconnectedSocialPlatforms.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-white/60 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/70 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">All social platforms connected</p>
                <p className="text-xs text-muted-foreground mt-1">No pending connections.</p>
              </div>
            ) : (
              disconnectedSocialPlatforms.map((platform) => (
              <Card
                key={platform.key}
                className="hover:shadow-md transition-shadow border-dashed bg-white/70"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{platform.name}</CardTitle>
                        <CardDescription>Last sync: {platform.lastSync}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(platform.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-dashed border-border/70 p-3">
                    <div className="flex items-start gap-2">
                      <TriangleAlert className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">
                          {platform.status === "reconnect" ? "Reconnect to refresh data" : "Connect this platform"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enable real-time syncing for accurate reporting.
                        </p>
              </div>
            </div>
          </div>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {(platform.platformMetrics ?? []).map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-lg border border-border/70 bg-white p-3 shadow-sm"
                      >
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {metric.label}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-lg font-semibold text-foreground">{metric.value}</span>
                          {metric.delta && (
                            <span className="text-xs font-medium text-emerald-600">{metric.delta}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {getPlatformError(platform.key) && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      <span>{getPlatformError(platform.key)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 shrink-0 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearPlatformError(platform.key);
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-full ${PLATFORM_BUTTON_STYLES[platform.key] ?? ""}`}
                    disabled={isPlatformLoading(platform.key)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(platform.key);
                    }}
                  >
                    {isPlatformLoading(platform.key) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in with {platform.name}…
                      </>
                    ) : (
                      <>
                        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center overflow-hidden rounded-sm bg-white/10">
                          {platform.icon}
                        </span>
                        <span>Login with {platform.name}</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
            )}
        </CardContent>
      </Card>
      </div>

      <Dialog
        open={disconnectConfirmKey !== null}
        onOpenChange={(open) => !disconnectLoading && !open && setDisconnectConfirmKey(null)}
      >
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Disconnect platform</DialogTitle>
            <DialogDescription>
              {disconnectPlatform
                ? `Disconnect ${disconnectPlatform.name}? You can reconnect anytime. Real-time metrics will stop until you reconnect.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              disabled={disconnectLoading}
              onClick={() => setDisconnectConfirmKey(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={disconnectLoading}
              onClick={handleDisconnectConfirm}
            >
              {disconnectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Disconnecting…
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
