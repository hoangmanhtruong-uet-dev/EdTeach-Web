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

export type SettingsTabId = "account" | "plan" | "credits" | "partner" | "guide";

// A10: Bỏ các badge tĩnh "PRO / MAX" và "20%" không mang thông tin cho user hiện tại
const SETTINGS_TABS: Array<{
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "account", label: "Tài khoản", icon: User },
  { id: "plan", label: "Gói cước", icon: Crown },
  { id: "credits", label: "Nạp điểm", icon: Wallet },
  { id: "partner", label: "Đối tác & Hoa hồng", icon: Gift },
  { id: "guide", label: "Hướng dẫn", icon: HelpCircle },
];

const VALID_MAIN_TABS = new Set(["account", "general", "plan", "credits", "partner", "guide"]);
const VALID_SECTIONS = new Set([
  "profile",
  "ekyc",
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

  // Parse tab & section from URL
  const rawTab = searchParams?.get("tab") || "";
  const rawSection = searchParams?.get("section") || searchParams?.get("subTab") || "";

  let initialTab: SettingsTabId = "account";
  let initialSection = "profile";

  if (rawTab === "account" || rawTab === "general") {
    initialTab = "account";
    if (VALID_SECTIONS.has(rawSection)) {
      initialSection = rawSection === "verification" ? "ekyc" : rawSection;
    }
  } else if (VALID_MAIN_TABS.has(rawTab)) {
    initialTab = rawTab as SettingsTabId;
  } else if (VALID_SECTIONS.has(rawTab)) {
    // Backward compatibility if someone passed ?tab=teaching
    initialTab = "account";
    initialSection = rawTab === "verification" ? "ekyc" : rawTab;
  }

  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollPositions = useRef<Record<string, number>>({});

  // Sync state when URL searchParams change (Back / Forward button, direct navigation)
  useEffect(() => {
    const tabParam = searchParams?.get("tab") || "";
    const sectionParam = searchParams?.get("section") || searchParams?.get("subTab") || "";

    if (tabParam === "account" || tabParam === "general") {
      setActiveTab("account");
      if (VALID_SECTIONS.has(sectionParam)) {
        setActiveSection(sectionParam === "verification" ? "ekyc" : sectionParam);
      }
    } else if (VALID_MAIN_TABS.has(tabParam)) {
      setActiveTab(tabParam as SettingsTabId);
    } else if (VALID_SECTIONS.has(tabParam)) {
      setActiveTab("account");
      setActiveSection(tabParam === "verification" ? "ekyc" : tabParam);
    } else if (!tabParam) {
      setActiveTab("account");
    }
  }, [searchParams]);

  // Handle switching main tabs
  const handleTabChange = useCallback(
    (newTab: SettingsTabId) => {
      if (newTab === activeTab) return;

      // Save scroll position of current tab
      if (typeof window !== "undefined") {
        scrollPositions.current[activeTab] = window.scrollY;
      }

      setActiveTab(newTab);

      const currentParams = new URLSearchParams(searchParams?.toString() || "");
      currentParams.set("tab", newTab);

      if (newTab === "account") {
        currentParams.set("section", activeSection || "profile");
      } else {
        currentParams.delete("section");
        currentParams.delete("subTab");
      }

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
    [activeTab, activeSection, pathname, router, searchParams]
  );

  // Handle subtab section changes within Account tab
  const handleSectionChange = useCallback(
    (newSection: string) => {
      const canonicalSection = newSection === "verification" ? "ekyc" : newSection;
      setActiveSection(canonicalSection);

      const currentParams = new URLSearchParams(searchParams?.toString() || "");
      currentParams.set("tab", "account");
      currentParams.set("section", canonicalSection);
      currentParams.delete("subTab");

      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header (A1: Duy nhất một H1 trên toàn trang) */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cài đặt & Dịch vụ
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý tài khoản, nâng cấp gói cước, nạp điểm ví, chương trình đối tác và hướng dẫn sử dụng.
        </p>
      </div>

      {/* Main Top Navigation Tabs with edge fade for mobile scrolling (A10) */}
      <div className="relative border-b border-border bg-card/60 backdrop-blur-xs rounded-2xl p-1.5 shadow-2xs overflow-hidden">
        {/* Left/Right scroll indicators on small screens */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-linear-to-r from-card/80 to-transparent z-10 sm:hidden" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-linear-to-l from-card/80 to-transparent z-10 sm:hidden" />

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
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="mt-4">
        {activeTab === "account" && (
          <div
            role="tabpanel"
            id="settings-panel-account"
            aria-labelledby="settings-tab-account"
            className="animate-in fade-in-50 duration-200"
          >
            <GeneralTab
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onNavigateToPlan={() => handleTabChange("plan")}
              onNavigateToPartner={() => handleTabChange("partner")}
            />
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
