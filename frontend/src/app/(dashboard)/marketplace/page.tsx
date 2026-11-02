"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Store,
  Search,
  Filter,
  Download,
  Star,
  BookOpen,
  Eye,
  Sparkles,
  Award,
  Globe,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  ExternalLink,
  PlusCircle,
  Coins,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Building,
  CreditCard,
  UserCheck,
  Layers,
  FileCheck,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { MarketplaceItem } from "@/types/marketplace";
import { exportMarketplaceExamToDocx } from "@/lib/marketplace/export-docx";
import { getUserExams, Exam } from "@/lib/api/exams";
import { MINIMUM_PAYOUT_VND, MARKETPLACE_CREDIT_RATE_VND } from "@/lib/constants";
import { isProUser, isMaxUser } from "@/lib/payment/plans";

export default function MarketplacePage() {
  const router = useRouter();
  const { user, profile, wallet, refreshWallet } = useAuth();
  const { showToast } = useToast();

  // State danh sách đề
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "free" | "paid" | "purchased" | "my_listings">("all");

  // State Modal Xem Trước (Preview)
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null);
  const [previewTab, setPreviewTab] = useState<"questions" | "matrix">("questions");

  // State Modal Mua Đề / Nhận Đề
  const [buyingItem, setBuyingItem] = useState<MarketplaceItem | null>(null);
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buySuccessItem, setBuySuccessItem] = useState<MarketplaceItem | null>(null);

  // State Modal Đăng Bán / Chia Sẻ Đề
  const [showSellModal, setShowSellModal] = useState(false);
  const [userExams, setUserExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [sellTitle, setSellTitle] = useState("");
  const [sellSubject, setSellSubject] = useState("Toán");
  const [sellGrade, setSellGrade] = useState("12");
  const [sellPricingType, setSellPricingType] = useState<"free" | "paid">("free"); // 'free' = 0 cr, 'paid' = có phí
  const [sellPrice, setSellPrice] = useState(100);
  const [sellDescription, setSellDescription] = useState("");
  const [isSubmittingSell, setIsSubmittingSell] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  // State Modal Quản lý Rút tiền (Payout)
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutStats, setPayoutStats] = useState<any | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(2000);
  const [bankName, setBankName] = useState("MB Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // State Modal Cào Web
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  // State Download Word & Clone Studio
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);

  // Load danh sách items
  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/marketplace/items");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Lỗi tải chợ đề thi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Mở modal đăng đề thi
  const handleOpenSellModal = async () => {
    setShowSellModal(true);
    setSellError(null);
    try {
      const res = await getUserExams(50);
      setUserExams(res.exams || []);
    } catch (err) {
      console.warn("Không thể tải kho đề:", err);
    }
  };

  // Mở modal rút tiền & doanh thu
  const handleOpenPayoutModal = async () => {
    setShowPayoutModal(true);
    setPayoutMessage(null);
    setPayoutError(null);
    try {
      const res = await fetch("/api/marketplace/payout");
      const data = await res.json();
      if (data.success) {
        setPayoutStats(data.stats);
        setPayoutHistory(data.requests || []);
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin payout:", err);
    }
  };

  // Gửi lệnh rút tiền
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutMessage(null);

    const minPayoutCredits = MINIMUM_PAYOUT_VND / MARKETPLACE_CREDIT_RATE_VND;
    if (payoutAmount < minPayoutCredits) {
      setPayoutError(`Hạn mức rút tối thiểu là ${minPayoutCredits.toLocaleString("vi-VN")} credits (tương đương ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")} VNĐ).`);
      return;
    }

    try {
      setIsSubmittingPayout(true);
      const res = await fetch("/api/marketplace/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_credits: payoutAmount,
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayoutError(data.error || "Không thể gửi yêu cầu rút tiền.");
        return;
      }

      setPayoutMessage(data.message);
      refreshWallet();
      const statsRes = await fetch("/api/marketplace/payout");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setPayoutStats(statsData.stats);
        setPayoutHistory(statsData.requests || []);
      }
    } catch (err: any) {
      setPayoutError("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Gửi form đăng bán / chia sẻ đề
  const handleSubmitSell = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);

    if (!sellTitle.trim()) {
      setSellError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    const finalPrice = sellPricingType === "free" ? 0 : Math.max(0, sellPrice);

    try {
      setIsSubmittingSell(true);
      const res = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sellTitle,
          subject: sellSubject,
          grade: sellGrade,
          price_credits: finalPrice,
          description: sellDescription,
          exam_id: selectedExamId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSellError(data.error || "Không thể đăng đề thi.");
        return;
      }

      setShowSellModal(false);
      setSellTitle("");
      setSellDescription("");
      loadItems();
      showToast(
        finalPrice === 0
          ? "🎉 Chúc mừng Thầy/Cô đã chia sẻ thành công bộ đề MIỄN PHÍ lên Chợ!"
          : "🎉 Chúc mừng Thầy/Cô đã đăng bán bộ đề có phí thành công lên Chợ!",
        "success"
      );
    } catch (err: any) {
      setSellError("Lỗi kết nối: " + err.message);
    } finally {
      setIsSubmittingSell(false);
    }
  };

  // Mua đề hoặc nhận đề miễn phí
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
        setBuyError(data.error || "Giao dịch không thành công.");
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

  // 1-Click nhận đề miễn phí trực tiếp
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
        showToast("Đã nhận bộ đề miễn phí thành công!", "success");
      } else {
        showToast(data.error || "Không thể nhận đề miễn phí.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối: " + err.message, "error");
    }
  };

  // Sao chép vào Studio
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

  // Tải file Word docx
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

  // Bóc tách đề từ web
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setImportError("Vui lòng nhập đường link bài viết hoặc đề thi.");
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const res = await fetch("/api/exams/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Không thể bóc tách đề từ liên kết này.");
        return;
      }

      setImportSuccess(data);
    } catch (err: any) {
      setImportError("Lỗi kết nối: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Thống kê số lượng đề
  const freeItemsCount = useMemo(() => items.filter((i) => i.price_credits === 0).length, [items]);
  const paidItemsCount = useMemo(() => items.filter((i) => i.price_credits > 0).length, [items]);
  const purchasedCount = useMemo(() => items.filter((i) => i.is_purchased).length, [items]);
  const myListingsCount = useMemo(() => items.filter((i) => i.is_owner).length, [items]);

  // Lọc danh sách items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSubject = selectedSubject === "all" || item.subject === selectedSubject;
      const matchGrade = selectedGrade === "all" || item.grade.toString() === selectedGrade;
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.seller_name.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      let matchTab = true;
      if (activeTab === "free") matchTab = item.price_credits === 0;
      if (activeTab === "paid") matchTab = item.price_credits > 0;
      if (activeTab === "purchased") matchTab = !!item.is_purchased;
      if (activeTab === "my_listings") matchTab = !!item.is_owner;

      return matchSubject && matchGrade && matchSearch && matchTab;
    });
  }, [items, selectedSubject, selectedGrade, search, activeTab]);

  const userBalance = wallet?.balance ?? 0;
  const isUserPro = isProUser(profile);
  const isUserMax = isMaxUser(profile);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & VÍ DOANH THU & ACTION BUTTONS */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">Chợ Đề Thi Giáo Viên</h1>
            <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Miễn Phí & Bản Quyền
            </span>
          </div>
          <p className="text-xs text-blue-100/80 leading-relaxed">
            Sàn chia sẻ & thương mại đề thi giữa các giáo viên toàn quốc. Thầy/Cô có thể chia sẻ đề thi{" "}
            <strong>Miễn Phí (0 cr)</strong> để lan tỏa hoặc <strong>Đặt giá Credits</strong> để kiếm
            thêm thu nhập bản quyền.
          </p>
        </div>

        {/* Nút hành động chính */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Số dư ví */}
          <Link
            href="/settings?tab=credits"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition text-xs font-semibold backdrop-blur-md"
            title="Nhấp để nạp thêm credits"
          >
            <Coins className="w-4 h-4 text-amber-300" />
            <span>
              Ví: <strong className="text-amber-300">{userBalance.toLocaleString("vi-VN")}</strong> cr
            </span>
            <span className="text-[10px] text-blue-200">
              (~{(userBalance * 100).toLocaleString("vi-VN")}đ)
            </span>
          </Link>

          {/* Nút Rút tiền & Doanh thu */}
          <button
            onClick={handleOpenPayoutModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Ví Bán Đề & Rút Tiền</span>
          </button>

          {/* Nút Đăng đề mới */}
          <button
            onClick={handleOpenSellModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Đăng Đề Thi Mới</span>
          </button>

          {/* Nút Nhập link đề từ web */}
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportError(null);
              setImportSuccess(null);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-blue-100 text-xs font-medium border border-white/10 transition cursor-pointer"
            title="Tự động bóc tách từ VnDoc, VietJack, Thuvienhoclieu..."
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300" />
            <span>Cào link web</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CHÍNH SÁCH CHIA SẺ & BÁN ĐỀ THI */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Chia Sẻ Miễn Phí (0 Credits)</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Hàng trăm đề kiểm tra, đề ôn tập được giáo viên chia sẻ tự do cho cộng đồng.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Bản quyền: Tác giả nhận tới 95%</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                MAX 5% • PRO 10%
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Đặt giá bằng Credits. Thầy/Cô giữ 80% (Free) ➔ 90% (PRO) ➔ 95% (MAX VIP) doanh thu.
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-border flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">Rút tiền về VietQR 24/7</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Quy đổi 1 Credit = 100 VNĐ. Rút tiền nhanh từ 200.000đ về mọi ngân hàng.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABS & FILTER BAR */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-border shadow-2xs space-y-3">
        {/* Hàng Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                activeTab === "all"
                  ? "bg-neutral-900 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Tất cả đề ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("free")}
              className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "free"
                  ? "bg-emerald-600 text-white font-black"
                  : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Đề miễn phí ({freeItemsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "paid"
                  ? "bg-amber-500 text-neutral-950 font-black"
                  : "text-amber-800 bg-amber-50 hover:bg-amber-100"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Đề có phí ({paidItemsCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("purchased")}
              className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "purchased"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã sở hữu ({purchasedCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("my_listings")}
              className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "my_listings"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Đề tôi đã đăng ({myListingsCount})</span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground font-medium">
            Hiển thị <strong>{filteredItems.length}</strong> đề thi
          </div>
        </div>

        {/* Hàng Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên đề, giáo viên, chủ đề..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Môn */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tất cả môn học</option>
              <option value="Toán">Toán học</option>
              <option value="Vật lí">Vật lí</option>
              <option value="Hóa học">Hóa học</option>
              <option value="Sinh học">Sinh học</option>
              <option value="Tiếng Anh">Tiếng Anh</option>
              <option value="Ngữ văn">Ngữ văn</option>
              <option value="Lịch sử">Lịch sử</option>
              <option value="Địa lí">Địa lí</option>
            </select>

            {/* Filter Khối Lớp */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2 bg-white text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Tất cả khối lớp</option>
              <option value="12">Lớp 12</option>
              <option value="11">Lớp 11</option>
              <option value="10">Lớp 10</option>
              <option value="9">Lớp 9</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DANH SÁCH CARD ĐỀ THI */}
      {/* ========================================================= */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-border shadow-xs flex flex-col justify-between h-[230px]"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-24 bg-slate-100 rounded-lg" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-5 w-4/5 bg-slate-100 rounded mb-2" />
                <div className="h-3 w-full bg-slate-100 rounded mb-1" />
                <div className="h-3 w-2/3 bg-slate-100 rounded mb-3" />
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-100 rounded" />
                <div className="h-8 w-20 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isFree = item.price_credits === 0;
            const isOwnedOrPurchased = item.is_purchased || item.is_owner;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Subject, Grade, Price Badge */}
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px]">
                        {item.subject} • Lớp {item.grade}
                      </span>
                      {isFree ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                          <Gift className="w-3 h-3 text-emerald-600" />
                          MIỄN PHÍ
                        </span>
                      ) : (
                        item.seller_tier === "pro" && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Award className="w-3 h-3 text-amber-600" />
                            Tác giả PRO
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      {item.review_count && item.review_count > 0 && item.rating > 0 ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{item.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({item.downloads_count ?? 0} lượt tải)
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {(item.downloads_count ?? 0) > 0 ? `${item.downloads_count} lượt tải` : "Chưa có đánh giá"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3.5">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Author & Exam Meta */}
                  <div className="text-xs text-muted-foreground mb-4 pb-3 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                        <span>{item.seller_name}</span>
                        {item.is_owner && (
                          <span className="text-[10px] text-blue-600 font-bold">(Đề của bạn)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Giáo viên chia sẻ</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground text-xs">
                        {item.question_count} câu hỏi
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium">Có giải chi tiết</div>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Buttons */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <div>
                    {isFree ? (
                      <span className="text-emerald-600 font-black text-sm flex items-center gap-1">
                        <Gift className="w-4 h-4" />
                        <span>Miễn phí (0 cr)</span>
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-primary">
                          {item.price_credits}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          cr (~{(item.price_credits * 100).toLocaleString("vi-VN")}đ)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-1.5">
                    {isOwnedOrPurchased ? (
                      <>
                        <button
                          onClick={() => handleCloneToStudio(item)}
                          disabled={cloningId === item.id}
                          className="px-2.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Sao chép vào Studio của tôi để chỉnh sửa"
                        >
                          {cloningId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>Mở Studio</span>
                        </button>

                        <button
                          onClick={() => handleDownloadDocx(item)}
                          disabled={downloadingId === item.id}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                          title="Tải file Word (.docx) kèm ma trận & lời giải"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Word</span>
                        </button>
                      </>
                    ) : isFree ? (
                      <>
                        <button
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewTab("questions");
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Xem thử</span>
                        </button>

                        <button
                          onClick={() => handleClaimFreeExam(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Lấy đề miễn phí</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewTab("questions");
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Xem thử</span>
                        </button>

                        <button
                          onClick={() => {
                            setBuyingItem(item);
                            setBuyError(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Mua đề</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State sạch sẽ khi chưa có đề thi nào */
        <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center max-w-xl mx-auto shadow-2xs space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Chợ Đề Thi Đang Chờ Đón Bộ Đề Đầu Tiên</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
              Hiện chưa có đề thi nào được chia sẻ công khai. Thầy Cô hãy là người tiên phong chia sẻ đề
              thi chất lượng từ kho cá nhân: có thể chọn <strong>Chia sẻ Miễn Phí (0 cr)</strong> để lan
              tỏa hoặc <strong>Bán có phí (Credits)</strong> để kiếm thêm thu nhập bản quyền!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenSellModal}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs inline-flex items-center gap-2 hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ Đăng Đề Từ Kho Của Tôi</span>
            </button>

            <Link
              href="/exams/create"
              className="px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs inline-flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Soạn đề mới bằng AI</span>
            </Link>

            <button
              onClick={() => {
                setShowImportModal(true);
                setImportError(null);
                setImportSuccess(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs inline-flex items-center gap-2 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Cào link web giáo dục</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL XEM TRƯỚC ĐỀ THI (PREVIEW MODAL) */}
      {/* ========================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px]">
                  {previewItem.subject} - Lớp {previewItem.grade}
                </span>
                {previewItem.price_credits === 0 ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    Miễn phí
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {previewItem.price_credits} credits
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Tác giả: <strong>{previewItem.seller_name}</strong>
                </span>
              </div>
              <h2 className="text-lg font-black text-foreground">{previewItem.title}</h2>
            </div>

            {/* Tabs Preview */}
            <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
              <button
                onClick={() => setPreviewTab("questions")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewTab === "questions"
                    ? "bg-neutral-900 text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Câu hỏi xem trước (3-5 câu)
              </button>
              <button
                onClick={() => setPreviewTab("matrix")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewTab === "matrix"
                    ? "bg-neutral-900 text-white"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Ma trận đề thi chuẩn 2025
              </button>
            </div>

            {/* Nội dung Preview */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
              {previewTab === "questions" ? (
                <div className="space-y-4">
                  {previewItem.preview_data.sample_questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>Câu {q.order || idx + 1}:</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-line">{q.content}</p>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-border text-[11px]"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Banner */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-foreground text-sm">
                      Mở khóa toàn bộ {previewItem.question_count} câu hỏi & lời giải chi tiết
                    </div>
                    <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                      {previewItem.price_credits === 0
                        ? "Đề thi được chia sẻ Miễn Phí. Thầy/Cô có thể nhận ngay về kho Studio để sử dụng!"
                        : "Toàn bộ đáp án chính xác, lời giải chi tiết từng bước và quyền tải file Word chuẩn Bộ GD&ĐT."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab Ma trận */
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-border space-y-3">
                    <h4 className="font-bold text-foreground">Cấu trúc câu hỏi định dạng 2025:</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-primary">
                          {previewItem.preview_data.matrix.multiple_choice_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần I: 4 Lựa chọn
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-amber-600">
                          {previewItem.preview_data.matrix.true_false_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần II: Đúng / Sai
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border">
                        <div className="text-lg font-black text-emerald-600">
                          {previewItem.preview_data.matrix.short_answer_count}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Phần III: Trả lời ngắn
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 border border-border space-y-3">
                    <h4 className="font-bold text-foreground">Phân bổ mức độ nhận thức:</h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Nhận biết</div>
                        <div className="text-sm font-black text-blue-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.easy} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Thông hiểu</div>
                        <div className="text-sm font-black text-indigo-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.medium} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Vận dụng</div>
                        <div className="text-sm font-black text-amber-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.hard} câu
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-border">
                        <div className="font-bold text-foreground">Vận dụng cao</div>
                        <div className="text-sm font-black text-rose-600 mt-1">
                          {previewItem.preview_data.matrix.difficulty_distribution.very_hard} câu
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Giá bộ đề:</span>
                <div className="text-base font-black text-primary">
                  {previewItem.price_credits === 0
                    ? "Miễn phí (0 credits)"
                    : `${previewItem.price_credits} credits (~${(previewItem.price_credits * 100).toLocaleString("vi-VN")}đ)`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
                >
                  Đóng
                </button>
                {previewItem.price_credits === 0 ? (
                  <button
                    onClick={() => {
                      const item = previewItem;
                      setPreviewItem(null);
                      handleClaimFreeExam(item);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Lấy đề miễn phí</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const item = previewItem;
                      setPreviewItem(null);
                      setBuyingItem(item);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Mua đề ngay</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL XÁC NHẬN MUA ĐỀ (PURCHASE MODAL) */}
      {/* ========================================================= */}
      {buyingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border relative">
            <button
              onClick={() => setBuyingItem(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Xác nhận mở khóa đề thi</h3>
                <p className="text-xs text-muted-foreground">Thanh toán bằng Credits ví</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-border mb-4 space-y-2 text-xs">
              <div className="font-bold text-foreground text-sm line-clamp-2">{buyingItem.title}</div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border">
                <span>Tác giả:</span>
                <strong className="text-foreground">{buyingItem.seller_name}</strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Số câu hỏi:</span>
                <strong className="text-foreground">{buyingItem.question_count} câu</strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Giá mở khóa:</span>
                <strong className="text-primary font-bold">
                  {buyingItem.price_credits} credits (~{(buyingItem.price_credits * 100).toLocaleString("vi-VN")}đ)
                </strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Số dư ví hiện tại:</span>
                <strong className="text-foreground">{userBalance.toLocaleString("vi-VN")} credits</strong>
              </div>
            </div>

            {buyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{buyError}</p>
                  <Link
                    href="/settings?tab=credits"
                    className="inline-flex items-center gap-1 font-bold underline mt-1.5 text-rose-800"
                  >
                    <span>Nạp thêm Credits qua VietQR ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuyingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-neutral-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmBuy}
                disabled={isProcessingBuy}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isProcessingBuy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận trừ {buyingItem.price_credits} cr</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL SAU KHI MUA / NHẬN ĐỀ THÀNH CÔNG */}
      {/* ========================================================= */}
      {buySuccessItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-foreground">
                {buySuccessItem.price_credits === 0 ? "Nhận đề thành công!" : "Mở khóa thành công!"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Bộ đề <strong>{buySuccessItem.title}</strong> đã được lưu vào thư viện của Thầy/Cô.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleCloneToStudio(buySuccessItem)}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sao chép & Mở chỉnh sửa trong Studio</span>
              </button>

              <button
                onClick={() => handleDownloadDocx(buySuccessItem)}
                className="w-full py-2.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-foreground font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Tải file Word (.docx) kèm lời giải</span>
              </button>

              <button
                onClick={() => setBuySuccessItem(null)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                Tiếp tục xem các đề khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL ĐĂNG BÁN / CHIA SẺ ĐỀ THI */}
      {/* ========================================================= */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowSellModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Đăng đề thi lên Chợ</h3>
                <p className="text-xs text-muted-foreground">
                  Chia sẻ miễn phí cho cộng đồng hoặc đặt giá bán bằng credits
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitSell} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Chọn đề từ kho */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Chọn đề từ "Kho đề thi của tôi" (hoặc nhập đề mới)
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedExamId(id);
                    const found = userExams.find((ex) => ex.id === id);
                    if (found) {
                      setSellTitle(found.name);
                      setSellSubject(found.subject || "Toán");
                      setSellGrade(found.grade || "12");
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Nhập tiêu đề đề thi mới --</option>
                  {userExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.subject} - Lớp {ex.grade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu đề đề thi */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Tiêu đề đề thi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sellTitle}
                  onChange={(e) => setSellTitle(e.target.value)}
                  placeholder="Ví dụ: Đề kiểm tra 1 tiết Toán 12 - Chương 1 Khảo sát đồ thị"
                  className="w-full text-xs p-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Môn học */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">Môn học</label>
                  <select
                    value={sellSubject}
                    onChange={(e) => setSellSubject(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lí">Địa lí</option>
                  </select>
                </div>

                {/* Khối lớp */}
                <div>
                  <label className="block font-semibold text-foreground mb-1">Khối lớp</label>
                  <select
                    value={sellGrade}
                    onChange={(e) => setSellGrade(e.target.value)}
                    className="w-full text-xs p-2.5 border border-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="12">Lớp 12</option>
                    <option value="11">Lớp 11</option>
                    <option value="10">Lớp 10</option>
                    <option value="9">Lớp 9</option>
                  </select>
                </div>
              </div>

              {/* HÌNH THỨC CHIA SẺ: MIỄN PHÍ HOẶC CÓ PHÍ */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-border space-y-3">
                <label className="block font-bold text-foreground text-xs">
                  Hình thức đăng tải trên Chợ:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSellPricingType("free")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      sellPricingType === "free"
                        ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs"
                        : "border-border bg-white text-muted-foreground hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
                      <Gift className="w-4 h-4" />
                      <span>Miễn Phí (0 cr)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Mọi giáo viên tải & mở Studio tự do
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSellPricingType("paid")}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      sellPricingType === "paid"
                        ? "border-amber-500 bg-amber-50/80 text-amber-950 font-bold shadow-xs"
                        : "border-border bg-white text-muted-foreground hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700">
                      <Coins className="w-4 h-4" />
                      <span>Có phí (Credits)</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Bán bản quyền, kiếm thêm thu nhập
                    </p>
                  </button>
                </div>

                {sellPricingType === "paid" ? (
                  <div className="space-y-2 pt-1 border-t border-border">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Giá bán đề thi (Credits):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        step="10"
                        value={sellPrice}
                        onChange={(e) => setSellPrice(parseInt(e.target.value, 10) || 0)}
                        className="w-36 text-xs p-2 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-bold text-primary bg-white"
                      />
                      <span className="text-xs text-muted-foreground">
                        = {(sellPrice * 100).toLocaleString("vi-VN")} VNĐ
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      👉 Bạn thực nhận:{" "}
                      <strong>
                        {Math.round(sellPrice * (isUserMax ? 0.95 : isUserPro ? 0.9 : 0.8))} credits (~
                        {(
                          Math.round(sellPrice * (isUserMax ? 0.95 : isUserPro ? 0.9 : 0.8)) * 100
                        ).toLocaleString("vi-VN")}đ)
                      </strong>{" "}
                      mỗi lượt bán (Sàn thu {isUserMax ? "5% MAX" : isUserPro ? "10% PRO" : "20% Thường"}).
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
                    ✨ Bộ đề sẽ được gắn nhãn <strong>MIỄN PHÍ</strong>. Đồng nghiệp toàn quốc có thể tải
                    file Word và lấy vào Studio để giảng dạy!
                  </div>
                )}
              </div>

              {/* Mô tả đề thi */}
              <div>
                <label className="block font-semibold text-foreground mb-1">Mô tả tóm tắt bộ đề</label>
                <textarea
                  rows={3}
                  value={sellDescription}
                  onChange={(e) => setSellDescription(e.target.value)}
                  placeholder="Nêu đặc điểm nổi bật, số lượng câu hỏi, mức độ phân hóa kiến thức..."
                  className="w-full text-xs p-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {sellError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {sellError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingSell}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmittingSell ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang đăng đề lên Chợ...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-amber-300" />
                    <span>
                      {sellPricingType === "free" ? "Chia Sẻ Đề Miễn Phí" : `Đăng Bán Với Giá ${sellPrice} cr`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL VÍ BÁN ĐỀ & RÚT TIỀN (PAYOUT MODAL) */}
      {/* ========================================================= */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Doanh Thu Bán Đề & Rút Tiền</h3>
                <p className="text-xs text-muted-foreground">Rút tiền về tài khoản ngân hàng qua VietQR 24/7</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Thống kê doanh thu */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-emerald-600">
                    {(payoutStats?.total_earned_credits ?? 0).toLocaleString("vi-VN")} cr
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Tổng kiếm được</div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-foreground">
                    {payoutStats?.total_sales ?? 0}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Lượt bán thành công</div>
                </div>

                <div className="bg-neutral-50 p-3 rounded-2xl border border-border text-center">
                  <div className="text-base font-black text-primary">
                    {userBalance.toLocaleString("vi-VN")} cr
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Số dư khả dụng</div>
                </div>
              </div>

              {/* Form Yêu Cầu Rút Tiền */}
              <form onSubmit={handleSubmitPayout} className="space-y-3 p-4 rounded-2xl bg-neutral-50 border border-border">
                <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <span>Tạo lệnh rút tiền về ngân hàng</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Số Credits muốn rút (Tối thiểu 2.000 cr = 200.000đ)
                  </label>
                  <input
                    type="number"
                    min="2000"
                    step="500"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs p-2 border border-border rounded-xl bg-white font-bold text-foreground"
                    required
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Quy đổi thực nhận:{" "}
                    <strong className="text-emerald-700 font-bold">
                      {(payoutAmount * 100).toLocaleString("vi-VN")} VNĐ
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Ngân hàng thụ hưởng
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full text-xs p-2 border border-border rounded-xl bg-white"
                    >
                      <option value="MB Bank">MB Bank (Quân Đội)</option>
                      <option value="Techcombank">Techcombank</option>
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="Vietinbank">Vietinbank</option>
                      <option value="BIDV">BIDV</option>
                      <option value="ACB">ACB</option>
                      <option value="TPBank">TPBank</option>
                      <option value="VPBank">VPBank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-foreground mb-1">
                      Số tài khoản ngân hàng
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="0987654321..."
                      className="w-full text-xs p-2 border border-border rounded-xl bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Tên chủ tài khoản (viết hoa không dấu)
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                    className="w-full text-xs p-2 border border-border rounded-xl bg-white uppercase font-bold"
                    required
                  />
                </div>

                {payoutError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                    {payoutError}
                  </div>
                )}

                {payoutMessage && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    {payoutMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayout ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Gửi Yêu Cầu Rút {(payoutAmount * 100).toLocaleString("vi-VN")}đ</span>
                    </>
                  )}
                </button>
              </form>

              {/* Lịch sử rút tiền */}
              <div>
                <h4 className="font-bold text-foreground text-xs mb-2">Lịch sử rút tiền gần đây</h4>
                {payoutHistory.length > 0 ? (
                  <div className="space-y-2">
                    {payoutHistory.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl border border-border bg-white flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <div className="font-bold text-foreground">
                            {req.amount_vnd.toLocaleString("vi-VN")} VNĐ ({req.amount_credits} cr)
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            {req.bank_name} • {req.account_number} ({req.account_holder})
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            req.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {req.status === "completed" ? "Đã chuyển tiền" : "Đang xử lý"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-[11px]">
                    Thầy/Cô chưa có lệnh rút tiền nào.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. MODAL BÓC TÁCH LINK TỪ WEB GIÁO DỤC */}
      {/* ========================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border relative">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Bóc tách đề thi từ trang web giáo dục
              </h3>
            </div>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Dán đường link từ các trang chia sẻ tài liệu (VnDoc, VietJack, Thuvienhoclieu, Hoc247...).
              AI sẽ tự động đọc câu hỏi, đáp án và lưu thẳng vào kho đề của bạn.
            </p>

            {importSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm mb-1 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã bóc tách thành công {importSuccess.questionCount} câu hỏi!</span>
                  </div>
                  <p className="mt-1">
                    Đề thi: <strong>{importSuccess.examName}</strong> ({importSuccess.subject} - Lớp{" "}
                    {importSuccess.grade}) đã được lưu vào danh sách đề thi của bạn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/exams/${importSuccess.examId}`}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở chỉnh sửa trong Studio</span>
                  </Link>

                  <button
                    onClick={() => {
                      setImportSuccess(null);
                      setImportUrl("");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    Nhập link khác
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Đường dẫn bài viết chứa đề thi
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://thuvienhoclieu.com/de-thi-giua-ki-1-toan-12..."
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    />
                  </div>
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {importError}
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                  💡 <strong>Gợi ý:</strong> Bạn có thể copy link bất kỳ bài tập, đề kiểm tra hoặc ngân
                  hàng câu hỏi nào trên internet để AI chuyển đổi tự động sang định dạng EdTeach.
                </div>

                <button
                  type="button"
                  onClick={handleImportFromUrl}
                  disabled={isImporting}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang đọc trang web & bóc tách câu hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Bóc tách & Tải về kho đề của tôi</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
