"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  AlertTriangle,
  Search,
  ExternalLink,
  DollarSign,
  User,
} from "lucide-react";
import { AffiliatePayoutItem } from "@/lib/affiliate/affiliate-store";
import { useToast } from "@/context/toast-context";

export default function AdminAffiliatePage() {
  const { showToast } = useToast();
  const [payouts, setPayouts] = useState<AffiliatePayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayoutItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/affiliate");
      const data = await res.json();
      if (res.ok && data.success) {
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách payout:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleProcess = async () => {
    if (!selectedPayout || !actionType) return;
    try {
      setActionLoading(selectedPayout.id);
      const res = await fetch("/api/admin/affiliate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: selectedPayout.id,
          action: actionType,
          adminNote: adminNote.trim() || undefined,
          referenceCode: referenceCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Thao tác thất bại.", "error");
        return;
      }
      setMessage(data.message);
      setSelectedPayout(null);
      setActionType(null);
      setAdminNote("");
      setReferenceCode("");
      fetchPayouts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      showToast(err.message || "Lỗi xử lý.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchEmail = (p.userEmail || "").toLowerCase().includes(term);
      const matchName = (p.userName || "").toLowerCase().includes(term);
      const matchBank = (p.bankAccount || "").includes(term) || (p.bankAccountName || "").toLowerCase().includes(term);
      if (!matchEmail && !matchName && !matchBank) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <Link href="/admin/verifications" className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cổng Quản Trị</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200">Đối Soát Affiliate</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span>Duyệt Rút Tiền & Chống Gian Lận</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kiểm tra các yêu cầu rút hoa hồng VietQR, phát hiện self-referral và duyệt chi trả.
          </p>
        </div>

        <button
          onClick={fetchPayouts}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Tổng yêu cầu</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {payouts.length}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <span className="text-xs font-bold text-amber-600 uppercase">Chờ xử lý</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {payouts.filter((p) => p.status === "pending").length}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <span className="text-xs font-bold text-emerald-600 uppercase">Đã chi trả</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {payouts.filter((p) => p.status === "completed").length}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <span className="text-xs font-bold text-rose-600 uppercase">Từ chối / Hoàn tiền</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {payouts.filter((p) => p.status === "rejected").length}
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
          {(["all", "pending", "completed", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition capitalize cursor-pointer ${
                statusFilter === st
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st === "all"
                ? "Tất cả"
                : st === "pending"
                ? "Chờ duyệt"
                : st === "completed"
                ? "Đã chi trả"
                : "Từ chối"}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo email, tên, STK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 4. PAYOUTS TABLE */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3 px-4 font-bold">Người yêu cầu</th>
                <th className="py-3 px-4 font-bold">Hình thức & Số tiền</th>
                <th className="py-3 px-4 font-bold">Thông tin Ngân hàng VietQR</th>
                <th className="py-3 px-4 font-bold">Trạng thái</th>
                <th className="py-3 px-4 font-bold">Thời gian</th>
                <th className="py-3 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayouts.length > 0 ? (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.userName || "Giáo viên"}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.userEmail}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        {p.amountVnd.toLocaleString()}đ
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.payoutType === "credits" ? (
                          <span className="text-indigo-600 font-bold">
                            ⚡ Đổi +{(p.creditsReceived || 0).toLocaleString()} Credits (x1.5)
                          </span>
                        ) : (
                          "Rút tiền mặt VietQR"
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {p.payoutType === "cash" ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{p.bankCode}</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.bankAccount}</span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {p.bankAccountName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Không áp dụng (Ví Credits)</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Hoàn tất
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          Chờ duyệt
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                          <XCircle className="w-3 h-3" />
                          Từ chối
                        </span>
                      )}
                      {p.referenceCode && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Mã GD: {p.referenceCode}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleString("vi-VN")}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.status === "pending" ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayout(p);
                              setActionType("approve");
                              setReferenceCode("FT" + Math.floor(100000 + Math.random() * 900000));
                              setAdminNote("Đã chuyển khoản VietQR thành công");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayout(p);
                              setActionType("reject");
                              setAdminNote("Thông tin tài khoản không khớp hoặc vi phạm tự giới thiệu");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-[11px] cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    {loading ? "Đang tải danh sách..." : "Không tìm thấy yêu cầu rút tiền nào."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL DUYỆT / TỪ CHỐI */}
      {selectedPayout && actionType && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {actionType === "approve" ? "Xác Nhận Chi Trả Hoa Hồng" : "Từ Chối & Hoàn Tiền"}
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Người nhận:</span>
                <strong className="text-slate-900 dark:text-white">{selectedPayout.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                  {selectedPayout.amountVnd.toLocaleString()}đ
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">STK Ngân hàng:</span>
                <span className="font-mono font-bold">
                  {selectedPayout.bankCode} • {selectedPayout.bankAccount}
                </span>
              </div>
            </div>

            {actionType === "approve" && (
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Mã giao dịch ngân hàng (Reference Code):
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ghi chú nội bộ / Phản hồi đối tác:
              </label>
              <textarea
                rows={2}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayout(null);
                  setActionType(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={Boolean(actionLoading)}
                onClick={handleProcess}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {actionLoading ? "Đang lưu..." : actionType === "approve" ? "Xác Nhận Đã Chuyển" : "Xác Nhận Từ Chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
