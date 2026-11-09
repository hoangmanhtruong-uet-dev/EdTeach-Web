"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Upload,
  X,
  ArrowRight,
  GraduationCap,
  IdCard,
  AlertCircle,
  Clock,
  ScanLine,
  Award,
  Zap,
  Gift,
  Info,
} from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/context/auth-context";

export default function TutorVerificationPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Dual card state
  const [studentCardFile, setStudentCardFile] = useState<File | null>(null);
  const [studentCardPreview, setStudentCardPreview] = useState<string | null>(null);

  const [cccdFile, setCccdFile] = useState<File | null>(null);
  const [cccdPreview, setCccdPreview] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    status: "approved" | "pending_review";
    message: string;
    ocr?: any;
  } | null>(null);

  const studentInputRef = useRef<HTMLInputElement>(null);
  const cccdInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "student" | "cccd"
  ) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage("Kích thước file không được vượt quá 10MB.");
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "student") {
        setStudentCardFile(selected);
        setStudentCardPreview(reader.result as string);
      } else {
        setCccdFile(selected);
        setCccdPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(selected);
  };

  const removeFile = (type: "student" | "cccd") => {
    if (type === "student") {
      setStudentCardFile(null);
      setStudentCardPreview(null);
      if (studentInputRef.current) studentInputRef.current.value = "";
    } else {
      setCccdFile(null);
      setCccdPreview(null);
      if (cccdInputRef.current) cccdInputRef.current.value = "";
    }
  };

  const submitVerification = async () => {
    if (!studentCardFile || !cccdFile) {
      setErrorMessage("Xác thực gia sư yêu cầu tải lên đủ cả 2 ảnh: Thẻ sinh viên và Mặt trước CCCD.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("userId", user?.id || profile?.id || "guest-tutor");
      formData.append("userName", profile?.name || user?.user_metadata?.full_name || "Gia sư");
      formData.append("roleCategory", "tutor");
      formData.append("documentType", "student_card");
      formData.append("studentCardFile", studentCardFile);
      formData.append("cccdFile", cccdFile);

      const res = await fetch("/api/verification/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Xác thực không thành công. Vui lòng kiểm tra ảnh rõ nét và chụp lại.");
        setIsAnalyzing(false);
        return;
      }

      setResult({
        status: data.status || "approved",
        message: data.message || "Xác thực hồ sơ gia sư thành công!",
        ocr: data.ocr,
      });
      setIsAnalyzing(false);
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ khi tải ảnh. Vui lòng thử lại.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ======================================================== */}
      {/* LEFT COLUMN: BRAND HERO & TUTOR PRIVILEGES              */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden border-r border-slate-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition duration-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Edu<span className="text-violet-400">Test</span>
              </span>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                Xác thực Danh tính Gia Sư
              </p>
            </div>
          </Link>
        </div>

        {/* Showcase Content */}
        <div className="relative z-10 my-auto py-8 space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 backdrop-blur-md border border-violet-400/20 text-xs font-bold text-violet-300">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span>Đối soát 2 Lớp (Thẻ SV + CCCD)</span>
          </div>

          <div className="space-y-3.5">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Mở khóa{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-300">
                Huy hiệu Gia Sư Uy Tín
              </span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              AI Vision tự động so khớp họ tên giữa Thẻ sinh viên và CCCD để chứng thực danh tính chính chủ 100%, bảo đảm uy tín giảng dạy với phụ huynh và học sinh.
            </p>
          </div>

          {/* Key Perks */}
          <div className="space-y-3 max-w-lg">
            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Huy hiệu Gia Sư Sư Phạm Xác Thực</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hiển thị biểu tượng bảo chứng trên trang cá nhân và các bộ đề thi gửi cho học sinh.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 shrink-0 mt-0.5">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Tặng ngay +10.000 Credits</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thỏa sức tạo đề ôn tập cá nhân hóa, bài kiểm tra định kỳ và phiếu giải bài tập chi tiết.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Bảo mật thông tin cá nhân tuyệt đối</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AI chỉ đối soát tính trùng khớp họ tên và số thẻ, không chia sẻ hay sử dụng dữ liệu CCCD cho mục đích khác.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <span>Cam kết đối soát bảo mật 100%</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mã hóa SSL 256-bit
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: DUAL UPLOAD INTERFACE                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-900/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bước 2/2: Xác thực eKYC Gia sư (2 Ảnh)</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <span>Để sau, vào Dashboard trước</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tải lên hồ sơ Thẻ SV & CCCD
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Hệ thống yêu cầu 2 loại giấy tờ để AI tiến hành đối soát chéo họ tên trùng khớp.
            </p>
          </div>

          {/* Current User Pill */}
          {(user?.email || profile?.name) && (
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Tài khoản: <strong>{profile?.name || user?.user_metadata?.full_name || "Gia sư"}</strong> ({user?.email})
              </span>
              <span className="text-violet-600 dark:text-violet-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng thẩm định
              </span>
            </div>
          )}

          {/* Guidelines Box */}
          <div className="rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 p-4 text-xs text-violet-900 dark:text-violet-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Yêu cầu đối soát họ tên 1:1:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <li><strong>Ảnh 1:</strong> Thẻ sinh viên hoặc Bằng tốt nghiệp đại học / Chứng chỉ nghiệp vụ sư phạm.</li>
              <li><strong>Ảnh 2:</strong> Mặt trước Thẻ Căn cước công dân (CCCD) rõ ảnh và số CCCD.</li>
              <li>Họ tên trên Thẻ sinh viên và CCCD phải thuộc cùng một người để được AI tự động duyệt tức thì.</li>
            </ul>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success / Result Screen */}
          {result ? (
            <div className="rounded-3xl border border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center space-y-5 shadow-lg shadow-violet-500/10">
              <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
                {result.status === "approved" ? "🎓" : "📋"}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {result.status === "approved"
                    ? "Đối Soát & Xác Thực Thành Công!"
                    : "Hồ sơ đã được tiếp nhận!"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {result.message}
                </p>
              </div>

              {result.ocr && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Thẻ sinh viên:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {result.ocr.studentCard?.fullName} ({result.ocr.studentCard?.university})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mặt trước CCCD:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {result.ocr.cccdCard?.fullName} (Số: {result.ocr.cccdCard?.cccdNumber})
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Kết quả đối soát:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Họ tên trùng khớp 100%
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 text-sm shadow-md hover:shadow-lg shadow-violet-500/25 transition cursor-pointer"
              >
                <span>Đi đến Bàn làm việc (Dashboard)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Dual Upload Dropzones */
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Document 1: Thẻ sinh viên */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-violet-600" />
                      <span>1. Thẻ sinh viên / Bằng ĐH</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        studentCardPreview
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {studentCardPreview ? "Đã chọn" : "Bắt buộc"}
                    </span>
                  </div>

                  {!studentCardPreview ? (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Tải lên ảnh Thẻ sinh viên hoặc Bằng đại học"
                      onClick={() => studentInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          studentInputRef.current?.click();
                        }
                      }}
                      className="border-2 border-dashed border-violet-200 dark:border-violet-800/80 hover:border-violet-400 bg-violet-50/30 dark:bg-violet-950/20 hover:bg-violet-50/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 min-h-[140px] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                    >
                      <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-bold text-violet-950 dark:text-violet-200">
                        Tải ảnh Thẻ sinh viên
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">JPG, PNG tối đa 10MB</span>
                      <input
                        ref={studentInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "student")}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-violet-300 dark:border-violet-800 bg-slate-950">
                      <img
                        src={studentCardPreview}
                        alt="Thẻ sinh viên"
                        className="w-full h-36 object-contain"
                      />
                      {!isAnalyzing && (
                        <button
                          type="button"
                          onClick={() => removeFile("student")}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md cursor-pointer transition"
                          title="Gỡ ảnh này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Document 2: Mặt trước CCCD */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <IdCard className="w-4 h-4 text-violet-600" />
                      <span>2. Mặt trước CCCD</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cccdPreview
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {cccdPreview ? "Đã chọn" : "Bắt buộc"}
                    </span>
                  </div>

                  {!cccdPreview ? (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Tải lên ảnh CCCD mặt trước"
                      onClick={() => cccdInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          cccdInputRef.current?.click();
                        }
                      }}
                      className="border-2 border-dashed border-violet-200 dark:border-violet-800/80 hover:border-violet-400 bg-violet-50/30 dark:bg-violet-950/20 hover:bg-violet-50/60 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 min-h-[140px] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
                    >
                      <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-bold text-violet-950 dark:text-violet-200">
                        Tải ảnh CCCD mặt trước
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">JPG, PNG tối đa 10MB</span>
                      <input
                        ref={cccdInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, "cccd")}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-violet-300 dark:border-violet-800 bg-slate-950">
                      <img
                        src={cccdPreview}
                        alt="Mặt trước CCCD"
                        className="w-full h-36 object-contain"
                      />
                      {!isAnalyzing && (
                        <button
                          type="button"
                          onClick={() => removeFile("cccd")}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md cursor-pointer transition"
                          title="Gỡ ảnh này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Analyzing indicator */}
              {isAnalyzing && (
                <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4 text-xs text-violet-900 dark:text-violet-200 flex items-center justify-center gap-2.5 animate-pulse">
                  <ScanLine className="w-5 h-5 animate-spin text-violet-600" />
                  <span className="font-bold">AI Vision đang quét đối soát chéo họ tên giữa Thẻ SV và CCCD...</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={submitVerification}
                  disabled={isAnalyzing || !studentCardFile || !cccdFile}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold shadow-md transition-all duration-200 cursor-pointer ${
                    studentCardFile && cccdFile && !isAnalyzing
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25 hover:shadow-violet-500/35"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isAnalyzing
                      ? "AI đang tiến hành đối soát..."
                      : "Xác thực Thẻ SV + CCCD ngay"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 px-4 text-xs font-bold transition cursor-pointer"
                >
                  <span>Để sau, vào Dashboard trước (chỉ dùng tính năng cơ bản)</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
