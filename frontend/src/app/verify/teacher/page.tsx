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
  ArrowLeft,
  IdCard,
  AlertCircle,
  Clock,
  ScanLine,
  Award,
  Zap,
  Gift,
  Info,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export default function TeacherVerificationPage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    status: "approved" | "pending_review";
    message: string;
    ocr?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage("Kích thước file không được vượt quá 10MB.");
      return;
    }

    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = () => {
      setFile(selected);
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 10 * 1024 * 1024) {
        setErrorMessage("Kích thước file không được vượt quá 10MB.");
        return;
      }
      setErrorMessage("");
      const reader = new FileReader();
      reader.onload = () => {
        setFile(droppedFile);
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitVerification = async () => {
    if (!file) {
      setErrorMessage("Vui lòng tải lên ảnh thẻ ngành hoặc văn bằng giáo viên.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("userId", user?.id || profile?.id || "guest-teacher");
      formData.append("userName", profile?.name || user?.user_metadata?.full_name || "Thầy Cô");
      formData.append("roleCategory", "teacher");
      formData.append("documentType", "teacher_card");
      formData.append("file", file);

      const res = await fetch("/api/verification/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMessage(data.error || "Xác thực không thành công. Vui lòng thử lại với ảnh rõ hơn.");
        setIsAnalyzing(false);
        return;
      }

      setResult({
        status: data.status || "approved",
        message: data.message || "Xác thực thẻ ngành thành công!",
        ocr: data.ocr,
      });
      setIsAnalyzing(false);
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ khi tải ảnh. Vui lòng kiểm tra lại mạng.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ======================================================== */}
      {/* LEFT COLUMN: BRAND HERO & TEACHER PRIVILEGES            */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden border-r border-slate-800">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition duration-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Edu<span className="text-blue-400">Test</span> AI
              </span>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                Xác thực Danh tính Chuyên môn
              </p>
            </div>
          </Link>
        </div>

        {/* Showcase Content */}
        <div className="relative z-10 my-auto py-8 space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-400/20 text-xs font-bold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Đặc quyền Thầy Cô Giáo dục</span>
          </div>

          <div className="space-y-3.5">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Khẳng định uy tín với{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Tích Xanh Giáo Viên
              </span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              Hồ sơ xác thực được chuyển trực tiếp tới Ban Quản Trị qua email để đối soát và phê duyệt thủ công trong vòng 24h, bảo đảm tính chính chủ và uy tín tuyệt đối cho Thầy Cô.
            </p>
          </div>

          {/* Key Perks */}
          <div className="space-y-3 max-w-lg">
            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Huy hiệu Tích Xanh chính chủ</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tự động đóng dấu bản quyền trên tất cả đề thi, bảng điểm và tài liệu xuất bản trên hệ thống.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Tặng ngay +10.000 Credits</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cộng thẳng vào ví tài khoản để Thầy Cô thỏa sức tạo 20+ đề thi ma trận 4 cấp độ tư duy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-white/[0.05] border border-white/10 p-3.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Chấm trắc nghiệm di động tức thì</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mở khóa tính năng camera quét phiếu thi OMR tự động xuất danh sách xếp loại học sinh.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <span>Cam kết bảo mật dữ liệu giáo viên</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mã hóa SSL 256-bit
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: VERIFICATION UPLOAD INTERFACE             */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 overflow-y-auto">
        <div className="w-full max-w-xl space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bước 2/2: Xác thực Thẻ ngành Giáo viên</span>
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
              Tải lên hồ sơ Thẻ ngành
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thầy Cô vui lòng tải ảnh chụp thẻ viên chức, thẻ giáo viên hoặc văn bằng sư phạm rõ con dấu đỏ.
            </p>
          </div>

          {/* Current User Pill */}
          {(user?.email || profile?.name) && (
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Tài khoản: <strong>{profile?.name || user?.user_metadata?.full_name || "Thầy Cô"}</strong> ({user?.email})
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng kích hoạt
              </span>
            </div>
          )}

          {/* Guidelines Box */}
          <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-4 text-xs text-blue-900 dark:text-blue-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Quy trình gửi hồ sơ duyệt thủ công (qua Gmail Ban Quản Trị):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
              <li>Chụp rõ 4 góc của thẻ ngành, không bị lóa đèn flash hay che khuất thông tin.</li>
              <li>Họ tên trên thẻ trùng khớp hoặc viết không dấu với họ tên tài khoản.</li>
              <li>Sau khi gửi, thông tin được chuyển trực tiếp tới Ban Quản Trị qua Gmail để đối soát và phê duyệt thủ công trong vòng 24h.</li>
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
            <div className="rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center space-y-5 shadow-lg shadow-emerald-500/10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-inner">
                {result.status === "approved" ? "🎉" : "📋"}
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {result.status === "approved"
                    ? "Xác thực Thẻ ngành Thành công!"
                    : "Hồ sơ đã được tiếp nhận!"}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {result.message}
                </p>
              </div>

              {result.ocr && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Họ và tên nhận diện:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.ocr.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đơn vị công tác:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{result.ocr.schoolOrOrganization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã số thẻ:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{result.ocr.cardNumber || "Hợp lệ"}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-6 text-sm shadow-md hover:shadow-lg shadow-emerald-500/25 transition cursor-pointer"
              >
                <span>Đi đến Bàn làm việc (Dashboard)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Upload & Preview Interface */
            <div className="space-y-5">
              {!preview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-blue-200 dark:border-blue-800/80 hover:border-blue-400 dark:hover:border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/60 group-hover:scale-110 flex items-center justify-center text-blue-600 dark:text-blue-300 transition duration-200 shadow-md">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-950 dark:text-blue-200">
                      Bấm vào đây để tải ảnh thẻ ngành hoặc kéo thả tệp
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Hỗ trợ định dạng JPG, PNG, WEBP tối đa 10MB
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-xs">
                    Chụp trực tiếp qua Camera điện thoại / Laptop
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative rounded-3xl border border-blue-300 dark:border-blue-800 overflow-hidden bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center">
                    <img
                      src={preview}
                      alt="Xem trước thẻ ngành"
                      className="w-full h-full object-contain"
                    />

                    {/* Scanner Animation Beam */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-primary/30 to-transparent animate-pulse flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold border border-primary/40 shadow-lg">
                          <ScanLine className="w-4 h-4 animate-spin text-primary" />
                          <span>Đang tải lên hồ sơ và thông báo Ban Quản Trị...</span>
                        </div>
                      </div>
                    )}

                    {!isAnalyzing && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md cursor-pointer transition"
                        title="Gỡ ảnh này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[280px]">
                      {file?.name} ({file ? (file.size / (1024 * 1024)).toFixed(2) : 0} MB)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ảnh hợp lệ
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={submitVerification}
                  disabled={isAnalyzing || !file}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold shadow-md transition-all duration-200 cursor-pointer ${
                    file && !isAnalyzing
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 hover:shadow-blue-500/35"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? "Đang gửi hồ sơ..." : "Gửi Hồ Sơ Xác Thực Ngay"}</span>
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
