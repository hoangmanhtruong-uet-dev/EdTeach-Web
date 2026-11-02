"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User,
  Crown,
  Wallet,
  Gift,
  HelpCircle,
  Loader2,
} from "lucide-react";

function TabLoadingSkeleton() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Lazy load tabs
const GeneralTab = dynamic(() => import("@/components/settings/GeneralTab"), {
  loading: () => <TabLoadingSkeleton />,
});
const PlanTab = dynamic(() => import("@/components/settings/PlanTab"), {
  loading: () => <TabLoadingSkeleton />,
});
const CreditsTab = dynamic(() => import("@/components/settings/CreditsTab"), {
  loading: () => <TabLoadingSkeleton />,
});
const PartnerTab = dynamic(() => import("@/components/settings/PartnerTab"), {
  loading: () => <TabLoadingSkeleton />,
});
const GuideTab = dynamic(() => import("@/components/settings/GuideTab"), {
  loading: () => <TabLoadingSkeleton />,
});

export type SettingsTabId = "general" | "plan" | "credits" | "partner" | "guide";

const SETTINGS_TABS: Array<{
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}> = [
  { id: "general", label: "Tài khoản", icon: User },
  { id: "plan", label: "Gói cước", icon: Crown, badge: "PRO / MAX" },
  { id: "credits", label: "Nạp điểm", icon: Wallet },
  { id: "partner", label: "Đối tác & Hoa hồng", icon: Gift, badge: "20%" },
  { id: "guide", label: "Hướng dẫn", icon: HelpCircle },
];

const VALID_MAIN_TABS = new Set(["general", "plan", "credits", "partner", "guide"]);
const LEGACY_GENERAL_SUBTABS = new Set([
  "profile",
  "verification",
  "teaching",
  "notifications",
  "security",
  "appearance",
]);

function SettingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse tab from URL
  const rawTab = searchParams?.get("tab") || "";
  let initialTab: SettingsTabId = "general";
  let detectedSubTab: string | undefined = undefined;

  if (VALID_MAIN_TABS.has(rawTab)) {
    initialTab = rawTab as SettingsTabId;
  } else if (LEGACY_GENERAL_SUBTABS.has(rawTab)) {
    initialTab = "general";
    detectedSubTab = rawTab;
  }

  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [generalSubTab, setGeneralSubTab] = useState<string | undefined>(detectedSubTab);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollPositions = useRef<Record<string, number>>({});

  // Sync state when URL searchParams change (Back / Forward button, direct navigation)
  useEffect(() => {
    const tabParam = searchParams?.get("tab") || "";
    if (VALID_MAIN_TABS.has(tabParam)) {
      setActiveTab(tabParam as SettingsTabId);
    } else if (LEGACY_GENERAL_SUBTABS.has(tabParam)) {
      setActiveTab("general");
      setGeneralSubTab(tabParam);
    } else if (!tabParam) {
      setActiveTab("general");
    }
  }, [searchParams]);

  // Handle switching tabs
  const handleTabChange = useCallback(
    (newTab: SettingsTabId) => {
      if (newTab === activeTab) return;

      // Save scroll position of current tab
      if (typeof window !== "undefined") {
        scrollPositions.current[activeTab] = window.scrollY;
      }

      setActiveTab(newTab);

      // Preserve existing queries except "tab"
      const currentParams = new URLSearchParams(searchParams?.toString() || "");
      currentParams.set("tab", newTab);
      const newUrl = `${pathname}?${currentParams.toString()}`;

      router.push(newUrl, { scroll: false });

      // Restore scroll position after DOM updates
      requestAnimationFrame(() => {
        const savedScroll = scrollPositions.current[newTab];
        if (typeof savedScroll === "number") {
          window.scrollTo({ top: savedScroll, behavior: "instant" as ScrollBehavior });
        }
      });
    },
    [activeTab, pathname, router, searchParams]
  );

  // Keyboard navigation for accessible tabs (ArrowLeft, ArrowRight, Home, End)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex: number | null = null;
    if (e.key === "ArrowRight") {
      targetIndex = (index + 1) % SETTINGS_TABS.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + SETTINGS_TABS.length) % SETTINGS_TABS.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = SETTINGS_TABS.length - 1;
    }

    if (targetIndex !== null) {
      e.preventDefault();
      const targetTab = SETTINGS_TABS[targetIndex];
      handleTabChange(targetTab.id);
      tabButtonRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt & Dịch vụ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tài khoản, nâng cấp gói cước, nạp điểm ví, chương trình đối tác và hướng dẫn sử dụng.
        </p>
      </div>

      {/* Main Top Navigation Tabs */}
      <div className="border-b border-border bg-card/50 rounded-2xl p-1.5 shadow-2xs">
        <div
          role="tablist"
          aria-label="Cài đặt và dịch vụ"
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap p-1"
        >
          {SETTINGS_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[idx] = el;
                }}
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`settings-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                type="button"
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-black uppercase ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary dark:bg-primary/20"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="mt-4">
        {activeTab === "general" && (
          <div
            role="tabpanel"
            id="settings-panel-general"
            aria-labelledby="settings-tab-general"
            className="animate-in fade-in-50 duration-200"
          >
            <GeneralTab initialSubTab={generalSubTab} />
          </div>
        )}

        {activeTab === "plan" && (
          <div
            role="tabpanel"
            id="settings-panel-plan"
            aria-labelledby="settings-tab-plan"
            className="animate-in fade-in-50 duration-200"
          >
            <PlanTab />
          </div>
        )}

        {activeTab === "credits" && (
          <div
            role="tabpanel"
            id="settings-panel-credits"
            aria-labelledby="settings-tab-credits"
            className="animate-in fade-in-50 duration-200"
          >
            <CreditsTab />
          </div>
        )}

        {activeTab === "partner" && (
          <div
            role="tabpanel"
            id="settings-panel-partner"
            aria-labelledby="settings-tab-partner"
            className="animate-in fade-in-50 duration-200"
          >
            <PartnerTab />
          </div>
        )}

        {activeTab === "guide" && (
          <div
            role="tabpanel"
            id="settings-panel-guide"
            aria-labelledby="settings-tab-guide"
            className="animate-in fade-in-50 duration-200"
          >
            <GuideTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<TabLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
