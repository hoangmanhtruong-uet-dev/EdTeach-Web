"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  FileText,
  Shuffle,
  Camera,
  QrCode,
  CheckCircle2,
  Gift,
  Award,
} from "lucide-react";
import Link from "next/link";

interface WelcomeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeOnboardingModal({ isOpen, onClose }: WelcomeOnboardingModalProps) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem("has_seen_onboarding", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={handleFinish}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s ? "w-8 bg-primary" : "w-2 bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: CHÀO MỪNG & QUÀ TẶNG */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                Chào mừng Thầy/Cô!
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Làm chủ đề thi với EduTest
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
              Nền tảng trợ lý số toàn diện hỗ trợ giáo viên soạn đề chuẩn Bộ GD&ĐT 2025, trộn mã đề thi và tự động hóa khâu chấm thi bằng AI.
            </p>

            <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 p-4 border border-blue-100 text-left space-y-2">
              <div className="flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>
                  Tặng sẵn <strong>100 Credits</strong> tạo đề trong tài khoản của bạn.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>
                  <strong>3 lượt tạo đề miễn phí</strong> được làm mới mỗi ngày.
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Hỗ trợ đầy đủ tất cả môn học phổ thông từ lớp 1 đến 12.</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SOẠN ĐỀ & TRỘN 4 MÃ ĐỀ */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
              <Shuffle className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                Tính năng đột phá
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Soạn chuẩn 2025 & Trộn 4 mã đề
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
              Tạo đề theo cấu trúc 3 phần mới nhất, vẽ biểu đồ, đồ thị hàm số và xuất trọn bộ file Word (.docx) kèm ma trận đáp án.
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50/50">
                <p className="font-bold text-xs text-neutral-900">Chuẩn 3 Phần 2025</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý và Trả lời ngắn.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50/50">
                <p className="font-bold text-xs text-neutral-900">Trộn 4 Mã Đề Tự Động</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Đảo câu hỏi, đảo phương án & xuất ma trận đối chiếu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CHẤM THI AI & NỘP BÀI QR */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <Camera className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                Tự động hóa 100%
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
                Chấm bài Camera & Nộp qua QR
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
              In phiếu tô A4 chuẩn Bộ GD&ĐT cho học sinh. Chấm bài tức thì qua camera điện thoại hoặc để học sinh tự làm bài và nộp qua mã QR.
            </p>

            <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-100 text-left space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chấm xong xuất file Excel bảng điểm lớp chuẩn UTF-8 BOM.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Không cần cài app, kết nối trực tiếp qua trình duyệt web.</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions Button */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-4 py-2.5 text-neutral-400 hover:text-neutral-600 text-xs font-medium transition cursor-pointer"
            >
              Bỏ qua giới thiệu
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition shadow-md shadow-primary/20 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bắt đầu trải nghiệm ngay!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
