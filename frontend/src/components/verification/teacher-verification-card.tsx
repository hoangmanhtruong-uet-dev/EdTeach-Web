"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Zap,
  Building2,
  Loader2,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  Lock,
  Wallet,
  Check,
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
  const isRejected = !isVerified && verificationRecord?.status === "rejected";
  const isPending = !isVerified && verificationRecord?.status === "pending_review";

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
      formData.append("userName", profile.full_name || profile.name || "");
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

  const handleResubmit = () => {
    setVerificationRecord(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultMessage(null);
  };

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-5 md:p-6 shadow-xs space-y-6">
      {/* 1. Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-900 shadow-2xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">
              Xác thực Thẻ ngành Giáo viên (eKYC)
            </h2>
            <p className="text-xs text-muted-foreground">
              Định danh sư phạm chính chủ bằng AI Vision OCR & kích hoạt Tích Xanh bảo chứng
            </p>
          </div>
        </div>

        {/* Current Verification Status Badge */}
        <div>
          {isVerified ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Đã xác thực chính chủ</span>
            </div>
          ) : isPending ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Đang duyệt (Chờ phản hồi trong 24h)</span>
            </div>
          ) : isRejected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Hồ sơ bị từ chối</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Chưa xác thực</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. REJECTED STATE VIEW */}
      {isRejected && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Hồ sơ xác thực chưa được chấp thuận
              </h4>
              <p className="text-xs text-rose-800/90 dark:text-rose-300/90 mt-1">
                Lý do:{" "}
                <strong className="text-rose-950 dark:text-rose-100">
                  {verificationRecord?.rejection_reason ||
                    verificationRecord?.admin_notes ||
                    "Ảnh chụp thẻ bị mờ, lóa sáng hoặc thông tin trên thẻ không trùng khớp với họ tên trong hồ sơ."}
                </strong>
              </p>
              <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-1">
                Thầy Cô vui lòng chuẩn bị lại ảnh chụp rõ nét 4 góc thẻ và gửi lại để ban quản trị đối soát lại.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleResubmit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nộp lại hồ sơ xác thực</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. VERIFIED SUCCESS VIEW */}
      {isVerified ? (
        <div className="bg-gradient-to-r from-emerald-50/80 via-card to-teal-50/60 dark:from-slate-900/40 dark:via-card dark:to-slate-900/40 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-foreground">
                  {profile?.full_name || profile?.name || "Thầy/Cô EduTest"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black shadow-2xs">
                  <Check className="w-3 h-3" />
                  <span>Tích Xanh Sư Phạm</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Đơn vị công tác: <strong>{profile?.verified_school || profile?.school || "Trường THPT"}</strong>
                </span>
              </p>
              {profile?.verified_teacher_code && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mã chứng nhận sư phạm: <strong className="font-mono">{profile.verified_teacher_code}</strong>
                </p>
              )}
            </div>

            <div className="text-right text-[11px] text-muted-foreground">
              {profile?.verified_at && (
                <span>Ngày chứng thực: {new Date(profile.verified_at).toLocaleDateString("vi-VN")}</span>
              )}
            </div>
          </div>

          {/* Active Perks Banner */}
          <div className="pt-3 border-t border-emerald-200 dark:border-emerald-900/40 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">✓ Tích Xanh Sư Phạm</span>
              <span className="text-[11px] text-muted-foreground">Bảo chứng uy tín trên Chợ đề & Báo cáo</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">✓ Thưởng +10.000 Credits</span>
              <span className="text-[11px] text-muted-foreground">Đã cộng trực tiếp vào ví để tạo đề AI</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 block">✓ Mở Rút Tiền Hoa Hồng</span>
              <span className="text-[11px] text-muted-foreground">Rút tiền về VietQR không bị giới hạn</span>
            </div>
          </div>
        </div>
      ) : isPending ? (
        /* 4. PENDING REVIEW VIEW */
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Hồ sơ đang trong hàng đợi phê duyệt
              </h4>
              <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5">
                Ban quản trị EduTest AI sẽ hoàn tất đối soát trong vòng 24 giờ làm việc. Thầy Cô sẽ nhận được thông báo qua email và thông báo trong ứng dụng ngay khi hoàn tất.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* 5. UNVERIFIED UPLOAD & VERIFY FORM */
        <div className="space-y-5">
          {/* Perks teaser banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Quyền lợi độc quyền khi hoàn tất xác thực Thẻ ngành:
              </p>
              <ul className="text-xs text-blue-950 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>
                  Nhận ngay <strong className="text-primary font-bold">+10.000 Credits thưởng</strong> vào ví để thoải mái trải nghiệm toàn bộ tính năng AI.
                </li>
                <li>
                  Mở quyền <strong>rút tiền hoa hồng đối tác</strong> về tài khoản ngân hàng chính chủ.
                </li>
                <li>
                  Gắn huy hiệu <strong>Tích Xanh Sư Phạm uy tín</strong> trên Chợ đề thi và báo cáo kết quả gửi phụ huynh.
                </li>
              </ul>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2">
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
                      ? "border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary shadow-2xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
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
            className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition bg-muted/20 hover:bg-muted/40"
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
                  className="max-h-48 rounded-xl object-contain border border-border shadow-xs mb-2"
                />
                <p className="text-xs font-bold text-foreground">
                  {selectedFile?.name} (Bấm để chọn ảnh khác)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Bấm để tải ảnh hoặc kéo thả ảnh chụp thẻ vào đây
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Hỗ trợ JPG, PNG, WebP (tối đa 5MB). Ảnh chụp rõ nét họ tên và con dấu đơn vị.
                </p>
              </div>
            )}
          </div>

          {/* Result Alert if any */}
          {resultMessage && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                resultMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200"
                  : resultMessage.type === "pending"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {resultMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : resultMessage.type === "pending" ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              )}
              <span>{resultMessage.text}</span>
            </div>
          )}

          {/* Privacy Note & Submit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground max-w-md">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
              <span>
                Cam kết bảo mật: Dữ liệu ảnh được mã hóa và chỉ dùng đối soát danh tính. Ảnh gốc được tự động hủy an toàn sau 30 ngày theo quy định bảo vệ dữ liệu cá nhân.
              </span>
            </div>

            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUploadAndVerify}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 shrink-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang thẩm định thẻ…</span>
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

export default TeacherVerificationCard;
