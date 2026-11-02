"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Download,
  Users,
  Copy,
  CheckCircle2,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
} from "lucide-react";
import { ExamSession } from "./create-exam-modal";
import { useToast } from "@/context/toast-context";

export interface PrintSheetModalProps {
  session: ExamSession | null;
  onClose: () => void;
}

export function PrintSheetModal({ session, onClose }: PrintSheetModalProps) {
  const { showToast } = useToast();
  const [printMode, setPrintMode] = useState<"blank" | "prefilled">("blank");
  const [blankCount, setBlankCount] = useState<number>(35);
  const [targetClass, setTargetClass] = useState<string>("12A1");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Mẫu danh sách học sinh demo nếu in sẵn SBD & Mã đề
  const [mockStudentCount, setMockStudentCount] = useState<number>(30);

  if (!session) return null;

  // Danh sách các mã đề có sẵn trong session hoặc mặc định 101, 102, 103, 104
  const availableExamCodes = session.examCodes
    ? Object.keys(session.examCodes)
    : ["101", "102", "103", "104"];

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const res = await fetch("/api/grading/omr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download_pdf",
          sheetType: session.sheetType,
          examTitle: session.name,
        }),
      });

      if (!res.ok) throw new Error("Lỗi tải PDF từ AI Service");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phieu_omr_${session.sheetType}_${session.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      showToast("Đã xuất phiếu trả lời trắc nghiệm PDF thành công!", "success");
    } catch (err: any) {
      showToast("Lỗi tải file PDF: " + err.message, "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  // Xác định số câu Phần 1, 2, 3 cho Form 2025
  const is2025 = session.sheetType === "2025";
  const isScience = ["Vật lí", "Hóa học", "Sinh học"].includes(session.subject);
  const part1Count = is2025 ? (isScience ? 18 : 12) : session.questionCount;
  const part2Count = is2025 ? 4 : 0;
  const part3Count = is2025 ? 6 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white text-slate-900 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base sm:text-lg">
                In Phiếu Trả Lời Trắc Nghiệm Chuẩn A4
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                {is2025 ? "Form 2025 (3 Phần)" : `Phiếu ${session.questionCount} câu`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kỳ thi: <strong>{session.name}</strong> • Môn {session.subject} Khối {session.grade}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? "Đang tạo..." : "Tải PDF In (Chuẩn OMR)"}</span>
            </button>

            <button
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In ngay ra giấy A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTROLS BAR: CHỌN CHẾ ĐỘ IN */}
        {/* ========================================================= */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Chế độ in ấn:</span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setPrintMode("blank")}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  printMode === "blank"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                In phiếu trắng hàng loạt
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("prefilled")}
                className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                  printMode === "prefilled"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Phiếu in sẵn SBD & Mã đề
              </button>
            </div>
          </div>

          {printMode === "blank" ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Số lượng bản in:</span>
              <div className="flex items-center gap-1.5">
                {[30, 35, 40, 45].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setBlankCount(cnt)}
                    className={`px-2.5 py-1 rounded border font-semibold cursor-pointer ${
                      blankCount === cnt
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {cnt} bản
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={blankCount}
                  onChange={(e) => setBlankCount(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded bg-white text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium">Lớp áp dụng:</span>
              <input
                type="text"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-20 px-2 py-1 font-bold border border-slate-300 rounded bg-white text-slate-800"
              />
              <span className="text-slate-600 font-medium ml-2">Số học sinh:</span>
              <input
                type="number"
                min={1}
                max={60}
                value={mockStudentCount}
                onChange={(e) => setMockStudentCount(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded bg-white text-slate-800"
              />
              <span className="text-[11px] text-emerald-600 font-medium">
                (Tự động xoay vòng mã: {availableExamCodes.join(", ")})
              </span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* PAPER PREVIEW AREA (CHUẨN TỈ LỆ KHỔ A4 210mm x 297mm) */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200/60 flex justify-center custom-scrollbar">
          <div
            id="printable-sheet"
            className="bg-white shadow-xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] p-8 text-black font-sans relative"
          >
            {/* 4 ĐIỂM CĂN CHỈNH QUANG HỌC OMR (GÓC) */}
            <div className="absolute top-4 left-4 w-5 h-5 bg-black" />
            <div className="absolute top-4 right-4 w-5 h-5 bg-black" />
            <div className="absolute bottom-4 left-4 w-5 h-5 bg-black" />
            <div className="absolute bottom-4 right-4 w-5 h-5 bg-black" />

            {/* HEADER PHIẾU */}
            <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
              <div className="text-center w-5/12">
                <div className="text-xs uppercase font-bold tracking-wider">
                  BỘ GIÁO DỤC VÀ ĐÀO TẠO
                </div>
                <div className="text-xs uppercase font-semibold">TRƯỜNG THPT / THCS</div>
                <div className="text-[10px] italic text-slate-600 mt-1">
                  Kỳ thi: {session.name}
                </div>
              </div>

              <div className="text-center w-7/12">
                <h2 className="text-base font-black uppercase tracking-tight text-black">
                  PHIẾU TRẢ LỜI TRẮC NGHIỆM
                </h2>
                <div className="text-xs font-bold text-slate-800">
                  Môn thi: {session.subject} — Khối lớp: {session.grade}
                </div>
                <div className="text-[10px] text-slate-600 italic mt-0.5">
                  (Dùng bút chì 2B tô kín và đậm các vòng tròn tương ứng với đáp án đúng)
                </div>
              </div>
            </div>

            {/* KHUNG THÔNG TIN HỌC SINH + SỐ BÁO DANH + MÃ ĐỀ */}
            <div className="grid grid-cols-12 gap-3 border border-black p-3 rounded mb-5 text-xs">
              {/* Thông tin học sinh */}
              <div className="col-span-6 space-y-2 border-r border-slate-300 pr-3">
                <div>
                  <span className="font-bold">Họ và tên thí sinh:</span>
                  <div className="border-b border-dotted border-black h-5 mt-1 font-semibold text-slate-800">
                    {printMode === "prefilled" ? "Nguyễn Văn An" : ""}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold">Lớp:</span>
                    <div className="border-b border-dotted border-black h-5 mt-1 font-semibold text-slate-800">
                      {printMode === "prefilled" ? targetClass : ""}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold">Phòng thi:</span>
                    <div className="border-b border-dotted border-black h-5 mt-1">
                      {printMode === "prefilled" ? "P.04" : ""}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-bold">Chữ ký giám thị 1:</span>
                  <div className="border-b border-dotted border-black h-5 mt-1" />
                </div>
              </div>

              {/* Ô tô Số Báo Danh (SBD) */}
              <div className="col-span-3 text-center border-r border-slate-300 pr-2">
                <div className="font-bold uppercase text-[11px] mb-1">Số Báo Danh</div>
                <div className="grid grid-cols-4 gap-1 mb-1">
                  {[0, 1, 2, 3].map((col) => (
                    <div
                      key={col}
                      className="h-6 border border-black rounded text-center text-xs font-black leading-6"
                    >
                      {printMode === "prefilled" ? ["1", "0", "0", "1"][col] : ""}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((col) => {
                    const filledRow = printMode === "prefilled" ? [1, 0, 0, 1][col] : -1;
                    return (
                      <div key={col} className="space-y-0.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                          <div
                            key={row}
                            className={`w-3.5 h-3.5 mx-auto border border-slate-700 rounded-full text-[8px] flex items-center justify-center font-mono font-bold ${
                              filledRow === row ? "bg-black text-white" : ""
                            }`}
                          >
                            {row}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ô tô Mã Đề */}
              <div className="col-span-3 text-center">
                <div className="font-bold uppercase text-[11px] mb-1">Mã Đề Thi</div>
                <div className="grid grid-cols-3 gap-1 mb-1">
                  {[0, 1, 2].map((col) => (
                    <div
                      key={col}
                      className="h-6 border border-black rounded text-center text-xs font-black leading-6"
                    >
                      {printMode === "prefilled" ? ["1", "0", "1"][col] : ""}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 1, 2].map((col) => {
                    const filledRow = printMode === "prefilled" ? [1, 0, 1][col] : -1;
                    return (
                      <div key={col} className="space-y-0.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                          <div
                            key={row}
                            className={`w-3.5 h-3.5 mx-auto border border-slate-700 rounded-full text-[8px] flex items-center justify-center font-mono font-bold ${
                              filledRow === row ? "bg-black text-white" : ""
                            }`}
                          >
                            {row}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PHẦN LÀM BÀI TRẮC NGHIỆM */}
            {is2025 ? (
              <div className="space-y-4">
                {/* PHẦN I: ABCD */}
                <div>
                  <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-black pb-0.5 flex justify-between items-center">
                    <span>PHẦN I: CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN ({part1Count} CÂU)</span>
                    <span className="text-[10px] font-normal normal-case text-slate-600">
                      Mỗi câu chỉ chọn một đáp án
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: part1Count }).map((_, idx) => {
                      const qNum = idx + 1;
                      return (
                        <div
                          key={qNum}
                          className="flex items-center justify-between text-xs py-0.5 px-1.5 border border-slate-300 rounded"
                        >
                          <span className="font-bold w-5">{qNum}.</span>
                          <div className="flex gap-1">
                            {["A", "B", "C", "D"].map((opt) => (
                              <div
                                key={opt}
                                className="w-4 h-4 rounded-full border border-black text-[9px] font-bold flex items-center justify-center"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PHẦN II: ĐÚNG / SAI (4 CÂU X 4 Ý) */}
                <div>
                  <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-black pb-0.5 flex justify-between items-center">
                    <span>PHẦN II: CÂU HỎI ĐÚNG / SAI (4 CÂU)</span>
                    <span className="text-[10px] font-normal normal-case text-slate-600">
                      Thí sinh chọn Đúng (Đ) hoặc Sai (S) cho từng ý
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((c) => {
                      const realNum = part1Count + c;
                      return (
                        <div key={c} className="border border-black p-1.5 rounded space-y-1">
                          <div className="font-bold text-[11px] border-b border-slate-300 pb-0.5 text-center">
                            Câu {realNum}
                          </div>
                          {["a", "b", "c", "d"].map((sub) => (
                            <div key={sub} className="flex items-center justify-between text-[11px]">
                              <span className="font-medium uppercase">{sub})</span>
                              <div className="flex gap-1">
                                <span className="w-4 h-4 rounded-full border border-black text-[8px] font-bold flex items-center justify-center">
                                  Đ
                                </span>
                                <span className="w-4 h-4 rounded-full border border-black text-[8px] font-bold flex items-center justify-center">
                                  S
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PHẦN III: TRẢ LỜI NGẮN / ĐIỀN SỐ (6 CÂU) */}
                <div>
                  <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-black pb-0.5 flex justify-between items-center">
                    <span>PHẦN III: CÂU HỎI TRẢ LỜI NGẮN (6 CÂU)</span>
                    <span className="text-[10px] font-normal normal-case text-slate-600">
                      Thí sinh tô các chữ số, dấu âm (-) hoặc dấu phẩy (,)
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((c) => {
                      const realNum = part1Count + part2Count + c;
                      return (
                        <div key={c} className="border border-black p-1.5 rounded text-center">
                          <div className="font-bold text-[10px] border-b border-slate-300 pb-0.5 mb-1">
                            Câu {realNum}
                          </div>
                          {/* 4 ô vuông để điền số */}
                          <div className="grid grid-cols-4 gap-0.5 mb-1">
                            {[0, 1, 2, 3].map((box) => (
                              <div
                                key={box}
                                className="h-4 border border-black text-[9px] font-mono font-bold leading-4"
                              />
                            ))}
                          </div>
                          {/* Bong bóng OMR mini */}
                          <div className="grid grid-cols-4 gap-0.5">
                            {[0, 1, 2, 3].map((col) => (
                              <div key={col} className="space-y-0.5">
                                {["-", ",", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
                                  (char) => (
                                    <div
                                      key={char}
                                      className="w-2.5 h-2.5 mx-auto border border-slate-600 rounded-full text-[6px] font-mono flex items-center justify-center"
                                    >
                                      {char}
                                    </div>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* MẪU TRUYỀN THỐNG 20, 40, 50 CÂU */
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: session.questionCount }).map((_, idx) => {
                  const qNum = idx + 1;
                  return (
                    <div
                      key={qNum}
                      className="flex items-center justify-between text-xs py-1 px-2 border border-slate-300 rounded"
                    >
                      <span className="font-bold w-6">{qNum}.</span>
                      <div className="flex gap-1.5">
                        {["A", "B", "C", "D"].map((opt) => (
                          <div
                            key={opt}
                            className="w-4 h-4 rounded-full border border-black text-[9px] font-bold flex items-center justify-center"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CHÂN TRANG */}
            <div className="mt-8 pt-3 border-t border-slate-300 flex justify-between items-center text-[10px] text-slate-500">
              <span>Hệ thống chấm OMR EdTeach AI — Chuẩn Bộ GD&ĐT 2025</span>
              <span>Trang 1/1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
