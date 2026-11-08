"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ShieldAlert,
  RotateCcw,
  Lock,
  Check,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const DOCUMENT_TYPES = [
  {
    id: "teacher_card",
    title: "Thẻ giáo viên trường",
    desc: "Thẻ do trường cấp, có con dấu đơn vị",
  },
  {
    id: "student_card",
    title: "Thẻ sinh viên Sư phạm",
    desc: "Dành cho sinh viên đang theo học",
  },
  {
    id: "degree_certificate",
    title: "Bằng cử nhân Sư phạm",
    desc: "Bản chụp bằng tốt nghiệp",
  },
  {
    id: "center_card",
    title: "Thẻ giảng viên trung tâm",
    desc: "Thẻ do trung tâm đào tạo cấp",
  },
] as const;

export function TeacherVerificationCard() {
  const { profile, refreshProfile, refreshWallet } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState<
    "teacher_card" | "student_card" | "degree_certificate" | "center_card"
  >("teacher_card");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "pending" | "error";
    text: string;
  } | null>(null);

  const [verificationRecord, setVerificationRecord] = useState<any>(null);

  const isVerified = Boolean(profile?.is_verified_teacher);
  const isRejected = !isVerified && verificationRecord?.status === "rejected";
  const isPending = !isVerified && verificationRecord?.status === "pending_review";

  // Fetch current verification status
  const fetchStatus = async () => {
    if (!profile?.id) return;
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
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [profile?.id]);

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setResultMessage({
        type: "error",
        text: "Vui lòng chọn tệp hình ảnh (JPG, PNG hoặc WebP).",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResultMessage({
        type: "error",
        text: "Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.",
      });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
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
    <div className="bg-card text-card-foreground rounded-2xl border border-border p-6 md:p-8 shadow-xs space-y-6">
      {/* 1. Header with Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <h2 className="font-bold text-lg md:text-xl text-foreground tracking-tight">
            Xác thực Thẻ ngành Giáo viên (eKYC)
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Định danh sư phạm chính chủ bằng AI Vision OCR và kích hoạt Tích Xanh bảo chứng.
          </p>
        </div>

        {/* Current Verification Status Badge */}
        <div className="shrink-0">
          {isVerified ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Đã xác thực</span>
            </div>
          ) : isPending ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Đang duyệt</span>
            </div>
          ) : isRejected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Bị từ chối</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-border bg-muted/40 text-muted-foreground text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
      {isVerified && (
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
        </div>
      )}

      {/* 4. MAIN TWO-COLUMN LAYOUT (LOẠI GIẤY TỜ + ẢNH THẺ vs QUYỀN LỢI SAU XÁC THỰC) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        {/* Left Column: Form Section */}
        <div className="lg:col-span-8 space-y-6 lg:border-r lg:border-border lg:pr-8">
          {/* Section 1: Loại giấy tờ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <h3 className="text-sm font-semibold text-foreground">Loại giấy tờ</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Chọn giấy tờ Thầy/Cô sẽ dùng để xác thực.
              </p>
            </div>
            <div className="md:col-span-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map((doc) => {
                  const isSelected = documentType === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setDocumentType(doc.id)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        isSelected
                          ? "border-primary/60 bg-[#121a2d] dark:bg-[#121a2d] ring-1 ring-primary/40 shadow-xs"
                          : "border-border bg-[#0d121f] dark:bg-[#0d121f] hover:bg-muted/40 hover:border-border/80"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground leading-snug">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {doc.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Section 2: Ảnh thẻ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <h3 className="text-sm font-semibold text-foreground">Ảnh thẻ</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                JPG, PNG hoặc WebP, tối đa 5 MB.
              </p>
            </div>
            <div className="md:col-span-8 space-y-3">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                className={`border border-border rounded-2xl bg-[#0b0f1a] dark:bg-[#0b0f1a] p-8 text-center flex flex-col items-center justify-center min-h-[190px] transition ${
                  isDragOver
                    ? "border-primary ring-1 ring-primary/50 bg-primary/5"
                    : "hover:border-primary/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="flex flex-col items-center w-full">
                    <img
                      src={previewUrl}
                      alt="Ảnh thẻ xem trước"
                      className="max-h-44 rounded-xl object-contain border border-border shadow-md mb-3"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                        {selectedFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Thay ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-muted-foreground/70 mb-2 stroke-[1.8]" />
                    <p className="text-xs font-semibold text-foreground">
                      Kéo thả ảnh vào đây
                    </p>
                    <span className="text-xs text-muted-foreground my-1.5">hoặc</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-[#192135] hover:bg-[#202b44] border border-border/80 text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
                    >
                      Chọn tệp từ máy
                    </button>
                  </div>
                )}
              </div>

              {/* 3 Checkmark Requirements */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  <span>Rõ nét họ tên</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  <span>Thấy con dấu đơn vị</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                  <span>Đủ sáng, không cắt góc</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-border" />

          {/* Alert Message if any */}
          {resultMessage && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
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

          {/* Section 3: Bottom Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-start gap-2 max-w-md text-xs text-muted-foreground leading-relaxed">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              <span>
                Dữ liệu ảnh được mã hóa và chỉ dùng để đối soát danh tính. Ảnh gốc tự động hủy sau 30 ngày theo quy định bảo vệ dữ liệu cá nhân.
              </span>
            </div>

            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUploadAndVerify}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Xác thực tự động bằng AI...</span>
                </>
              ) : (
                <span>Xác thực tự động bằng AI</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Quyền lợi sau khi xác thực */}
        <div className="lg:col-span-4 space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Quyền lợi sau khi xác thực
          </h3>

          <div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              +10.000 <span className="text-sm font-medium text-muted-foreground">Credits</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cộng vào ví để dùng toàn bộ tính năng AI.
            </p>
            <div className="border-b border-border pt-4" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">
              Rút hoa hồng đối tác
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Về tài khoản ngân hàng chính chủ.
            </p>
            <div className="border-b border-border pt-4" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">
              Tích Xanh Sư Phạm uy tín
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Hiển thị trên Chợ đề thi và báo cáo kết quả gửi phụ huynh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherVerificationCard;
