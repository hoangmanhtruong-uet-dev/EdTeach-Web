"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Award,
  Zap,
  Building2,
  GraduationCap,
  FileCheck2,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function TeacherVerificationCard() {
  const { profile, refreshProfile, refreshWallet } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState<
    "teacher_card" | "student_card" | "degree_certificate" | "center_card"
  >("teacher_card");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "pending" | "error";
    text: string;
  } | null>(null);

  const [statusLoading, setStatusLoading] = useState(false);
  const [verificationRecord, setVerificationRecord] = useState<any>(null);

  const isVerified = Boolean(profile?.is_verified_teacher);

  // Fetch current verification status
  const fetchStatus = async () => {
    if (!profile?.id) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/verification/status?userId=${profile.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          setVerificationRecord(data.record);
        }
      }
    } catch {
      // silent
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [profile?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultMessage(null);
    }
  };

  const handleUploadAndVerify = async () => {
    if (!selectedFile || !profile?.id) return;

    setUploading(true);
    setResultMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", profile.id);
      formData.append("userName", profile.full_name || "");
      formData.append("documentType", documentType);

      const res = await fetch("/api/verification/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể tải lên ảnh thẻ.");
      }

      if (data.status === "approved") {
        setResultMessage({
          type: "success",
          text: data.message || "Xác thực thành công! Tích Xanh chính chủ đã được kích hoạt.",
        });
        await refreshProfile();
        await refreshWallet();
        await fetchStatus();
      } else {
        setResultMessage({
          type: "pending",
          text: data.message || "Hồ sơ đã được gửi đến ban quản trị để xét duyệt trong 24h.",
        });
        await fetchStatus();
      }
    } catch (err: any) {
      console.error("Verification upload error:", err);
      setResultMessage({
        type: "error",
        text: err.message || "Đã xảy ra lỗi khi gửi hồ sơ.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 md:p-6 shadow-xs space-y-5">
      {/* 1. Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                Xác Thực Danh Tính Giáo Viên (Teacher eKYC)
              </h3>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Sprint 3
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              Định danh sư phạm chính chủ bằng AI Vision OCR & kích hoạt Tích Xanh bảo chứng
            </p>
          </div>
        </div>

        {isVerified ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Đã xác thực chính chủ</span>
          </div>
        ) : verificationRecord?.status === "pending_review" ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Chờ Admin duyệt (24h)</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-400 text-xs font-semibold">
            <span>Chưa xác thực</span>
          </div>
        )}
      </div>

      {/* 2. VERIFIED SUCCESS VIEW */}
      {isVerified ? (
        <div className="bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-emerald-950 dark:text-emerald-200">
                  {profile?.full_name || "Thầy/Cô EduTest"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[11px] font-black">
                  ✓ Tích Xanh
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-slate-300 font-medium mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Đơn vị công tác: <strong>{profile?.verified_school || profile?.organization_name || "Trường THPT Chu Văn An"}</strong>
                </span>
              </p>
              {profile?.verified_teacher_code && (
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">
                  Mã chứng nhận sư phạm: <strong className="font-mono">{profile.verified_teacher_code}</strong>
                </p>
              )}
            </div>

            <div className="text-right text-[11px] text-neutral-500 dark:text-slate-400">
              {profile?.verified_at && (
                <span>Ngày cấp: {new Date(profile.verified_at).toLocaleDateString("vi-VN")}</span>
              )}
            </div>
          </div>

          {/* Active Perks Banner */}
          <div className="pt-3 border-t border-emerald-100 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">✓ Tích Xanh Báo Cáo</span>
              <span className="text-[11px] text-neutral-500">Tự động gắn trên link Zalo phụ huynh</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">✓ +10.000 Credits Khởi Nghiệp</span>
              <span className="text-[11px] text-neutral-500">Đã cộng trực tiếp vào ví người dùng</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">✓ Hạn Mức 10 Đề / Ngày</span>
              <span className="text-[11px] text-neutral-500">Tạo đề thi thoải mái không giới hạn</span>
            </div>
          </div>
        </div>
      ) : (
        /* 3. UNVERIFIED UPLOAD & VERIFY VIEW */
        <div className="space-y-4">
          {/* Perks teaser banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/60 dark:to-slate-800/60 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                Combo Đặc quyền 3-in-1 khi xác thực danh tính Giáo viên / Gia sư:
              </p>
              <ul className="text-xs text-blue-950 dark:text-blue-200 mt-1 space-y-0.5 list-disc list-inside">
                <li>Huy hiệu <strong>Tích Xanh Chính Chủ</strong> hiển thị trên toàn bộ báo cáo Zalo Phụ huynh.</li>
                <li>Tặng ngay <strong>10.000 credits</strong> vào tài khoản để tạo ~10 đề thi AI miễn phí.</li>
                <li>Nâng hạn mức tạo đề lên <strong>10 đề / ngày</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 mb-1.5">
              Chọn loại giấy tờ xác thực của Thầy/Cô:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "teacher_card", label: "Thẻ giáo viên trường" },
                { id: "student_card", label: "Thẻ sinh viên Sư phạm" },
                { id: "degree_certificate", label: "Bằng cử nhân Sư phạm" },
                { id: "center_card", label: "Thẻ giảng viên trung tâm" },
              ].map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setDocumentType(doc.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                    documentType === doc.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-bold shadow-2xs"
                      : "border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-neutral-100"
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-neutral-50/50 dark:bg-slate-800/30 hover:bg-emerald-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Ảnh thẻ xem trước"
                  className="max-h-48 rounded-xl object-contain border border-neutral-200 dark:border-slate-700 shadow-xs mb-2"
                />
                <p className="text-xs font-bold text-neutral-700 dark:text-slate-300">
                  {selectedFile?.name} (Bấm để chọn ảnh khác)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-neutral-800 dark:text-slate-200">
                  Bấm để tải ảnh hoặc kéo thả ảnh chụp thẻ vào đây
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
                  Hỗ trợ JPG, PNG, WebP (Tối đa 10MB). Ảnh chụp rõ nét họ tên và con dấu đơn vị.
                </p>
              </div>
            )}
          </div>

          {/* Result Alert if any */}
          {resultMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                resultMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                  : resultMessage.type === "pending"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
              }`}
            >
              {resultMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : resultMessage.type === "pending" ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-neutral-500 dark:text-slate-400">
              🔒 Dữ liệu ảnh được bảo mật theo quy định bảo vệ dữ liệu cá nhân Nghị định 13/2023/NĐ-CP.
            </p>

            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUploadAndVerify}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang thẩm định thẻ...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Xác thực tự động bằng AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
