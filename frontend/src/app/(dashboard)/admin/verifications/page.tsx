"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Building2,
  User,
  GraduationCap,
  Calendar,
  Sparkles,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface VerificationItem {
  id: string;
  userId: string;
  documentType: string;
  imageUrl: string;
  status: "pending_review" | "approved" | "rejected";
  ocrExtractedName?: string;
  ocrExtractedSchool?: string;
  ocrExtractedCode?: string;
  ocrConfidence?: number;
  roleCategory: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending_review" | "approved" | "rejected">("pending_review");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
      }
    } catch (err) {
      console.error("Admin fetch verifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const handleReview = async (recordId: string, action: "approved" | "rejected") => {
    let reason = "";
    if (action === "rejected") {
      const promptReason = window.prompt("Nhập lý do từ chối hồ sơ (VD: Ảnh mờ, thông tin không khớp):");
      if (promptReason === null) return;
      reason = promptReason || "Hình ảnh không rõ nét hoặc thông tin không trùng khớp.";
    }

    setActionLoadingId(recordId);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          adminUserId: profile?.id || "admin_master",
          action,
          reason,
        }),
      });

      if (res.ok) {
        // Refresh list
        await fetchVerifications();
      } else {
        const err = await res.json();
        alert(err.error || "Thao tác thất bại.");
      }
    } catch (e: any) {
      alert("Lỗi khi gửi yêu cầu duyệt: " + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredItems = verifications.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (v.ocrExtractedName && v.ocrExtractedName.toLowerCase().includes(q)) ||
      (v.ocrExtractedSchool && v.ocrExtractedSchool.toLowerCase().includes(q)) ||
      (v.ocrExtractedCode && v.ocrExtractedCode.toLowerCase().includes(q))
    );
  });

  const pendingCount = verifications.filter((v) => v.status === "pending_review").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Hệ Thống Thẩm Định Thẻ Ngành Giáo Viên
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Admin eKYC Hub
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
            Phê duyệt hồ sơ sư phạm, cấp huy hiệu Tích Xanh chính chủ và kích hoạt combo quyền lợi VIP.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-neutral-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {[
            { id: "pending_review", label: `Chờ duyệt (${pendingCount})` },
            { id: "approved", label: "Đã phê duyệt" },
            { id: "rejected", label: "Đã từ chối" },
            { id: "all", label: "Tất cả hồ sơ" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filter === tab.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs"
                  : "bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên, trường, mã thẻ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* 3. Verification List */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-neutral-500">Đang tải danh sách hồ sơ thẻ ngành...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-8 space-y-2">
          <ShieldCheck className="w-10 h-10 text-neutral-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-neutral-700 dark:text-slate-300">
            Không có hồ sơ nào trong mục này
          </p>
          <p className="text-xs text-neutral-500">Các hồ sơ giáo viên tải lên sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isApproved = item.status === "approved";
            const isPending = item.status === "pending_review";
            const isRejected = item.status === "rejected";
            const isLoadingAction = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                          {item.ocrExtractedName || "Hồ sơ giáo viên"}
                        </h3>
                        {isApproved && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-black">
                            ✓ Đã cấp Tích Xanh
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            Chờ duyệt
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.2 rounded font-bold">
                            Từ chối
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{item.ocrExtractedSchool || "Chưa nhận diện trường"}</span>
                      </p>
                    </div>

                    {item.ocrConfidence !== undefined && (
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-600">
                          {Math.round(item.ocrConfidence * 100)}%
                        </span>
                        <span className="block text-[10px] text-neutral-400">Độ tin cậy AI</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata recap */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-neutral-500 dark:text-slate-400">
                    <div>
                      <span>Loại thẻ: </span>
                      <strong className="text-neutral-800 dark:text-slate-200">
                        {item.documentType === "teacher_card"
                          ? "Thẻ giáo viên"
                          : item.documentType === "student_card"
                          ? "Thẻ SV sư phạm"
                          : "Bằng cử nhân"}
                      </strong>
                    </div>
                    <div>
                      <span>Mã số thẻ: </span>
                      <strong className="text-neutral-800 dark:text-slate-200 font-mono">
                        {item.ocrExtractedCode || "—"}
                      </strong>
                    </div>
                    <div>
                      <span>Ngày nộp: </span>
                      <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <div>
                      <span>Phân loại: </span>
                      <strong className="text-neutral-800 dark:text-slate-200">
                        {item.roleCategory === "teacher"
                          ? "Giáo viên trường"
                          : item.roleCategory === "tutor"
                          ? "Gia sư Sư phạm"
                          : "Giảng viên trung tâm"}
                      </strong>
                    </div>
                  </div>

                  {/* Rejection reason if rejected */}
                  {item.rejectionReason && (
                    <div className="mt-2.5 p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px]">
                      Lý do từ chối: {item.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-neutral-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-400 font-mono">ID: {item.id.slice(0, 8)}</span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={isLoadingAction}
                          onClick={() => handleReview(item.id, "rejected")}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingAction}
                          onClick={() => handleReview(item.id, "approved")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          {isLoadingAction ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Phê duyệt</span>
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đã hoàn tất cấp Tích Xanh
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
