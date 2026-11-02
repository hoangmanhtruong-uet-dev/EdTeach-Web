"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Printer,
  Sparkles,
  Info,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { useToast } from "@/context/toast-context";

export interface DownloadOMRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadOMRModal({ isOpen, onClose }: DownloadOMRModalProps) {
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<
    "2025_math" | "2025_science" | "sheet_20" | "sheet_40" | "sheet_50"
  >("2025_math");
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const templates = [
    {
      id: "2025_math",
      title: "Mẫu GDPT 2025: Môn Toán (22 câu)",
      desc: "Gồm 3 phần: 12 trắc nghiệm ABCD + 4 Đúng/Sai + 6 Điền số ngắn. Khổ A4 chuẩn Bộ GD&ĐT.",
      badge: "Mới nhất 2025",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      sheetTypeParam: "2025",
      examTitle: "Phiếu Trả Lời Trắc Nghiệm - Môn Toán (GDPT 2025)",
    },
    {
      id: "2025_science",
      title: "Mẫu GDPT 2025: Lý / Hóa / Sinh / KHXH (28 câu)",
      desc: "Gồm 3 phần: 18 trắc nghiệm ABCD + 4 Đúng/Sai + 6 Điền số ngắn. Khổ A4 chuẩn Bộ GD&ĐT.",
      badge: "Mới nhất 2025",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      sheetTypeParam: "2025",
      examTitle: "Phiếu Trả Lời Trắc Nghiệm - Môn KHTN & KHXH (GDPT 2025)",
    },
    {
      id: "sheet_40",
      title: "Mẫu Phiếu 40 Câu (Kiểm tra 45 phút / 1 tiết)",
      desc: "Trắc nghiệm 4 lựa chọn A, B, C, D. Định dạng 4 cột dọc, dễ tô, tỷ lệ nhận diện 99.8%.",
      badge: "Phổ biến",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      sheetTypeParam: "40",
      examTitle: "Phiếu Trả Lời Trắc Nghiệm 40 Câu",
    },
    {
      id: "sheet_20",
      title: "Mẫu Phiếu 20 Câu (Kiểm tra 15 phút)",
      desc: "Trắc nghiệm 4 lựa chọn A, B, C, D. Kích thước gọn gàng, tiết kiệm giấy in tối đa.",
      badge: "Tiết kiệm",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      sheetTypeParam: "20",
      examTitle: "Phiếu Trả Lời Trắc Nghiệm 20 Câu",
    },
    {
      id: "sheet_50",
      title: "Mẫu Phiếu 50 Câu (Chuẩn thi TN THPT cũ)",
      desc: "Trắc nghiệm 4 lựa chọn A, B, C, D. Phù hợp các kỳ thi thử tổng hợp THPT Quốc gia cũ.",
      badge: "Truyền thống",
      badgeColor: "bg-slate-700 text-slate-300 border-slate-600",
      sheetTypeParam: "50",
      examTitle: "Phiếu Trả Lời Trắc Nghiệm 50 Câu",
    },
  ];

  const currentTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch("/api/grading/omr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download_pdf",
          sheetType: currentTemplate.sheetTypeParam,
          examTitle: currentTemplate.examTitle,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi tải PDF từ AI Service");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phieu_omr_chuan_${selectedTemplate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast(`Đã tải thành công mẫu ${currentTemplate.title}!`, "success");
      onClose();
    } catch (err: any) {
      showToast("Lỗi khi tải file PDF: " + err.message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900/95 text-slate-100 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Tải Mẫu Phiếu Trắc Nghiệm OMR Chuẩn (PDF)
              </h3>
              <p className="text-xs text-slate-400">
                Khổ giấy A4 độ phân giải cao khớp 4 điểm định vị quang học của OpenCV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Thông báo tiêu chuẩn */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Tất cả mẫu phiếu được thiết kế theo tỷ lệ 1:1 chuẩn quốc tế của Bộ Giáo dục và Đào tạo.
              Bảo đảm khả năng nhận diện <strong>100% bằng camera điện thoại hoặc máy scan học đường</strong>, không bị lệch tọa độ.
            </div>
          </div>

          {/* Danh sách lựa chọn mẫu phiếu */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chọn mẫu phiếu cần tải
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {templates.map((t) => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{t.title}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.badgeColor}`}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hướng dẫn in & sử dụng */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Khuyến nghị khi in ấn phiếu tô OMR:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>In trên giấy A4 trắng định lượng từ 70gsm trở lên (khuyên dùng 80gsm).</li>
              <li>Chọn tỷ lệ in <strong>100% (Actual Size / Fit to Printable Area)</strong>, không thu phóng Scale.</li>
              <li>Nhắc nhở học sinh sử dụng bút chì 2B hoặc bút bi mực đậm, tô kín và đều vòng tròn.</li>
              <li>Không làm gấp mép hoặc rách 4 dấu định vị quang học màu đen ở 4 góc phiếu.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Đang tạo PDF..." : "Tải PDF In (Chuẩn OMR)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
