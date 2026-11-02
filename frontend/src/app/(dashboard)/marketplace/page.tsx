"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { MarketplaceItem } from "@/types/marketplace";
import { exportMarketplaceExamToDocx } from "@/lib/marketplace/export-docx";
import { getUserExams, Exam } from "@/lib/api/exams";
import { isProUser, isMaxUser } from "@/lib/payment/plans";

// Subcomponents
import { MarketplaceBanner } from "./components/marketplace-banner";
import { MarketplaceInfoCards } from "./components/marketplace-info-cards";
import {
  MarketplaceFilterBar,
  MarketplaceTab,
  MarketplaceSort,
} from "./components/marketplace-filter-bar";
import { MarketplaceExamCard } from "./components/marketplace-exam-card";
import { MarketplaceSkeleton } from "./components/marketplace-skeleton";
import { MarketplaceEmptyState } from "./components/marketplace-empty-state";
import { MarketplaceErrorState } from "./components/marketplace-error-state";

// Modals
import { MarketplacePreviewModal } from "./components/marketplace-preview-modal";
import { MarketplaceBuyModal } from "./components/marketplace-buy-modal";
import { MarketplaceSuccessModal } from "./components/marketplace-success-modal";
import { MarketplaceSellModal } from "./components/marketplace-sell-modal";
import { MarketplacePayoutModal } from "./components/marketplace-payout-modal";
import { MarketplaceImportModal } from "./components/marketplace-import-modal";

const ITEMS_PER_PAGE = 12;

function MarketplaceInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, wallet, refreshWallet } = useAuth();
  const { showToast } = useToast();

  // Extract initial filters from URL search params
  const urlTab = (searchParams.get("tab") as MarketplaceTab) || "all";
  const urlSearch = searchParams.get("q") || "";
  const urlSubject = searchParams.get("subject") || "all";
  const urlGrade = searchParams.get("grade") || "all";
  const urlSort = (searchParams.get("sort") as MarketplaceSort) || "newest";

  // Data States
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [activeTab, setActiveTab] = useState<MarketplaceTab>(
    ["all", "free", "paid", "purchased", "my_listings"].includes(urlTab) ? urlTab : "all"
  );
  const [search, setSearch] = useState<string>(urlSearch);
  const [selectedSubject, setSelectedSubject] = useState<string>(urlSubject);
  const [selectedGrade, setSelectedGrade] = useState<string>(urlGrade);
  const [selectedSort, setSelectedSort] = useState<MarketplaceSort>(
    ["newest", "popular", "price_asc", "price_desc"].includes(urlSort) ? urlSort : "newest"
  );

  // Pagination State
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE);

  // Action Loading States
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Modal States
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null);
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccessItem, setBuySuccessItem] = useState<MarketplaceItem | null>(null);

  const [showSellModal, setShowSellModal] = useState(false);
  const [userExams, setUserExams] = useState<Exam[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Sync state to URL Query Parameters without page reload
  const syncUrlParams = useCallback(
    (newFilters: {
      tab?: MarketplaceTab;
      q?: string;
      subject?: string;
      grade?: string;
      sort?: MarketplaceSort;
    }) => {
      const currentTab = newFilters.tab ?? activeTab;
      const currentQ = newFilters.q !== undefined ? newFilters.q : search;
      const currentSubject = newFilters.subject ?? selectedSubject;
      const currentGrade = newFilters.grade ?? selectedGrade;
      const currentSort = newFilters.sort ?? selectedSort;

      const params = new URLSearchParams();
      if (currentTab && currentTab !== "all") params.set("tab", currentTab);
      if (currentQ && currentQ.trim()) params.set("q", currentQ.trim());
      if (currentSubject && currentSubject !== "all") params.set("subject", currentSubject);
      if (currentGrade && currentGrade !== "all") params.set("grade", currentGrade);
      if (currentSort && currentSort !== "newest") params.set("sort", currentSort);

      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;
      window.history.replaceState(null, "", newUrl);
    },
    [activeTab, search, selectedSubject, selectedGrade, selectedSort, pathname]
  );

  // Load Marketplace Items from API
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/marketplace/items");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setError(data.error || "Không thể tải danh sách đề thi từ máy chủ.");
      }
    } catch (err: any) {
      console.error("Lỗi tải chợ đề thi:", err);
      setError("Lỗi kết nối máy chủ: " + (err.message || "Vui lòng kiểm tra lại mạng"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Tab change handler
  const handleTabChange = (tab: MarketplaceTab) => {
    setActiveTab(tab);
    setVisibleCount(ITEMS_PER_PAGE);
    syncUrlParams({ tab });
  };

  // Search change handler
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setVisibleCount(ITEMS_PER_PAGE);
    syncUrlParams({ q: val });
  };

  // Subject change handler
  const handleSubjectChange = (val: string) => {
    setSelectedSubject(val);
    setVisibleCount(ITEMS_PER_PAGE);
    syncUrlParams({ subject: val });
  };

  // Grade change handler
  const handleGradeChange = (val: string) => {
    setSelectedGrade(val);
    setVisibleCount(ITEMS_PER_PAGE);
    syncUrlParams({ grade: val });
  };

  // Sort change handler
  const handleSortChange = (val: MarketplaceSort) => {
    setSelectedSort(val);
    syncUrlParams({ sort: val });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveTab("all");
    setSearch("");
    setSelectedSubject("all");
    setSelectedGrade("all");
    setSelectedSort("newest");
    setVisibleCount(ITEMS_PER_PAGE);
    syncUrlParams({
      tab: "all",
      q: "",
      subject: "all",
      grade: "all",
      sort: "newest",
    });
  };

  // Open sell modal & load user's existing exams
  const handleOpenSellModal = async () => {
    setShowSellModal(true);
    try {
      const res = await getUserExams(50);
      setUserExams(res.exams || []);
    } catch (err) {
      console.warn("Không thể tải kho đề cá nhân:", err);
    }
  };

  // Buy Exam Confirmation
  const handleConfirmBuy = async () => {
    if (!buyingItem) return;
    try {
      setIsProcessingBuy(true);
      setBuyError(null);

      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: buyingItem.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBuyError(data.error || "Giao dịch không thành công. Vui lòng thử lại.");
        return;
      }

      refreshWallet();
      setBuySuccessItem(data.item);
      setBuyingItem(null);
      loadItems();
    } catch (err: any) {
      setBuyError("Lỗi giao dịch: " + err.message);
    } finally {
      setIsProcessingBuy(false);
    }
  };

  // 1-Click Claim Free Exam
  const handleClaimFreeExam = async (item: MarketplaceItem) => {
    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setBuySuccessItem(data.item);
        loadItems();
        showToast("Đã nhận bộ đề miễn phí vào thư viện cá nhân!", "success");
      } else {
        showToast(data.error || "Không thể nhận đề miễn phí.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối: " + err.message, "error");
    }
  };

  // Clone Exam to Personal Studio
  const handleCloneToStudio = async (item: MarketplaceItem) => {
    try {
      setCloningId(item.id);
      const res = await fetch("/api/marketplace/clone-to-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: item.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast("Lỗi sao chép: " + (data.error || "Vui lòng thử lại"), "error");
        return;
      }

      showToast("Đã sao chép đề thi về Studio cá nhân!", "success");
      router.push(`/exams/${data.exam_id}`);
    } catch (err: any) {
      showToast("Lỗi kết nối: " + err.message, "error");
    } finally {
      setCloningId(null);
    }
  };

  // Download Word (.docx)
  const handleDownloadDocx = async (item: MarketplaceItem) => {
    try {
      setDownloadingId(item.id);
      let targetItem = item;
      if (!item.exam_data) {
        const res = await fetch(`/api/marketplace/items/${item.id}`);
        const data = await res.json();
        if (data.success && data.item) {
          targetItem = data.item;
        }
      }
      await exportMarketplaceExamToDocx(targetItem);
      showToast("Đã tải xuống file Word (.docx) thành công!", "success");
    } catch (err: any) {
      showToast("Lỗi tải file Word: " + err.message, "error");
    } finally {
      setDownloadingId(null);
    }
  };

  // Calculate tab counters
  const tabCounts = useMemo(() => {
    return {
      all: items.length,
      free: items.filter((i) => i.price_credits === 0).length,
      paid: items.filter((i) => i.price_credits > 0).length,
      purchased: items.filter((i) => i.is_purchased).length,
      myListings: items.filter((i) => i.is_owner).length,
    };
  }, [items]);

  // Filter and Sort Items
  const filteredAndSortedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchSubject = selectedSubject === "all" || item.subject === selectedSubject;
      const matchGrade = selectedGrade === "all" || item.grade.toString() === selectedGrade;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.seller_name.toLowerCase().includes(q) ||
        (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(q)));

      let matchTab = true;
      if (activeTab === "free") matchTab = item.price_credits === 0;
      if (activeTab === "paid") matchTab = item.price_credits > 0;
      if (activeTab === "purchased") matchTab = !!item.is_purchased;
      if (activeTab === "my_listings") matchTab = !!item.is_owner;

      return matchSubject && matchGrade && matchSearch && matchTab;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (selectedSort === "popular") {
        return (b.downloads_count || 0) - (a.downloads_count || 0);
      }
      if (selectedSort === "price_asc") {
        return a.price_credits - b.price_credits;
      }
      if (selectedSort === "price_desc") {
        return b.price_credits - a.price_credits;
      }
      // Default: newest
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return dateB - dateA;
    });
  }, [items, selectedSubject, selectedGrade, search, activeTab, selectedSort]);

  const userBalance = wallet?.balance ?? 0;
  const isUserPro = isProUser(profile);
  const isUserMax = isMaxUser(profile);
  const currentTier = isUserMax ? "max" : isUserPro ? "pro" : "free";

  // Paginated visible items
  const visibleItems = useMemo(() => {
    return filteredAndSortedItems.slice(0, visibleCount);
  }, [filteredAndSortedItems, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedItems.length;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <MarketplaceBanner
        userBalance={userBalance}
        onOpenSellModal={handleOpenSellModal}
        onOpenPayoutModal={() => setShowPayoutModal(true)}
        onOpenImportModal={() => setShowImportModal(true)}
      />

      {/* 2. Three Info Cards */}
      <MarketplaceInfoCards userTier={currentTier} />

      {/* 3. Filter Bar & Tabs */}
      <MarketplaceFilterBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        search={search}
        onSearchChange={handleSearchChange}
        selectedSubject={selectedSubject}
        onSubjectChange={handleSubjectChange}
        selectedGrade={selectedGrade}
        onGradeChange={handleGradeChange}
        selectedSort={selectedSort}
        onSortChange={handleSortChange}
        tabCounts={tabCounts}
        totalFiltered={filteredAndSortedItems.length}
        loading={loading}
      />

      {/* 4. Main Content Area */}
      {loading ? (
        <MarketplaceSkeleton count={6} />
      ) : error ? (
        <MarketplaceErrorState message={error} onRetry={loadItems} />
      ) : filteredAndSortedItems.length > 0 ? (
        <div className="space-y-8">
          {/* Responsive 3-col Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleItems.map((item) => (
              <MarketplaceExamCard
                key={item.id}
                item={item}
                cloningId={cloningId}
                downloadingId={downloadingId}
                onPreview={(i) => setPreviewItem(i)}
                onClaimFree={handleClaimFreeExam}
                onBuy={(i) => {
                  setBuyingItem(i);
                  setBuyError(null);
                }}
                onCloneToStudio={handleCloneToStudio}
                onDownloadDocx={handleDownloadDocx}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="min-h-[40px] px-6 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground text-xs font-bold transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Xem thêm đề thi (còn {filteredAndSortedItems.length - visibleCount} đề)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty States */
        <MarketplaceEmptyState
          mode={
            activeTab === "purchased"
              ? "tab_purchased_empty"
              : activeTab === "my_listings"
              ? "tab_my_listings_empty"
              : search || selectedSubject !== "all" || selectedGrade !== "all"
              ? "no_search_results"
              : "marketplace_empty"
          }
          onClearFilters={handleClearFilters}
          onOpenSellModal={handleOpenSellModal}
          onSwitchToAllTab={() => handleTabChange("all")}
        />
      )}

      {/* 5. Modals */}
      {previewItem && (
        <MarketplacePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onClaimFree={handleClaimFreeExam}
          onBuy={(i) => {
            setBuyingItem(i);
            setBuyError(null);
          }}
        />
      )}

      {buyingItem && (
        <MarketplaceBuyModal
          item={buyingItem}
          userBalance={userBalance}
          isProcessing={isProcessingBuy}
          buyError={buyError}
          onClose={() => setBuyingItem(null)}
          onConfirmBuy={handleConfirmBuy}
        />
      )}

      {buySuccessItem && (
        <MarketplaceSuccessModal
          item={buySuccessItem}
          onClose={() => setBuySuccessItem(null)}
          onCloneToStudio={handleCloneToStudio}
          onDownloadDocx={handleDownloadDocx}
        />
      )}

      {showSellModal && (
        <MarketplaceSellModal
          userExams={userExams}
          isUserPro={isUserPro}
          isUserMax={isUserMax}
          onClose={() => setShowSellModal(false)}
          onSuccess={(finalPrice) => {
            setShowSellModal(false);
            loadItems();
            showToast(
              finalPrice === 0
                ? "🎉 Chúc mừng Thầy/Cô đã chia sẻ thành công bộ đề MIỄN PHÍ lên Chợ!"
                : "🎉 Chúc mừng Thầy/Cô đã đăng bán bộ đề có phí thành công lên Chợ!",
              "success"
            );
          }}
        />
      )}

      {showPayoutModal && (
        <MarketplacePayoutModal
          userBalance={userBalance}
          onClose={() => setShowPayoutModal(false)}
          onWalletRefresh={refreshWallet}
        />
      )}

      {showImportModal && (
        <MarketplaceImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-16">
          <div className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          <MarketplaceSkeleton count={6} />
        </div>
      }
    >
      <MarketplaceInner />
    </Suspense>
  );
}
