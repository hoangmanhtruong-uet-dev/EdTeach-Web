"use client";
import { useToast } from "@/context/toast-context";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Shuffle,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  Crown,
} from "lucide-react";
import { exportShuffledExamsToDocx } from "@/lib/export/docx-exporter";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { PricingPlan } from "@/lib/payment/plans";

interface ShuffleExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examName: string;
  subject: string;
  grade: string;
  durationMinutes?: number;
  originalQuestions: any[];
  isPro?: boolean;
  isMax?: boolean;
}

export function ShuffleExamModal({
  isOpen,
  onClose,
  examName,
  subject,
  grade,
  durationMinutes = 45,
  originalQuestions,
  isPro = false,
  isMax = false,
}: ShuffleExamModalProps) {
  const { showToast } = useToast();
  const [variantCount, setVariantCount] = useState<number>(4);
  const [startCode, setStartCode] = useState<number>(101);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("matrix"); // "matrix" | code
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedMatrix, setCopiedMatrix] = useState<boolean>(false);
  const [upgradeTier, setUpgradeTier] = useState<"pro" | "max" | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Thuật toán xáo trộn Fisher-Yates
  function shuffleArray<T>(array: T[], seed: number): T[] {
    const arr = [...array];
    let m = arr.length;
    let s = seed;
    while (m) {
      s = (s * 9301 + 49297) % 233280;
      const i = Math.floor((s / 233280) * m--);
      [arr[m], arr[i]] = [arr[i], arr[m]];
    }
    return arr;
  }

  // Tạo các mã đề hoán vị
  const { variants, matrixRows } = useMemo(() => {
    if (!originalQuestions || originalQuestions.length === 0) {
      return { variants: [], matrixRows: [] };
    }

    // Tách câu hỏi theo block/nhóm (giữ nguyên cấu trúc 3 phần chuẩn Bộ GD&ĐT)
    const mcqQuestions = originalQuestions.filter(
      (q) => q.type === "multiple_choice" || (!q.type && q.options)
    );
    const tfQuestions = originalQuestions.filter((q) => q.type === "true_false");
    const saQuestions = originalQuestions.filter(
      (q) => q.type === "short_answer" || q.type === "essay"
    );
    const otherQuestions = originalQuestions.filter(
      (q) =>
        q.type !== "multiple_choice" &&
        q.type !== "true_false" &&
        q.type !== "short_answer" &&
        q.type !== "essay" &&
        q.type
    );

    const generatedVariants: Array<{
      code: string;
      questions: any[];
    }> = [];

    for (let v = 0; v < variantCount; v++) {
      const codeStr = (startCode + v).toString();
      const variantSeed = shuffleSeed * 100 + v * 17 + 13;

      // 1. Hoán vị câu hỏi Phần I & đảo phương án A, B, C, D
      const shuffledMcq = shuffleArray(mcqQuestions, variantSeed + 1).map((q, qIdx) => {
        let newOptions = q.options;
        let newCorrect = q.correct_answer;

        const isOptionsObject = q.options && typeof q.options === "object" && !Array.isArray(q.options);
        let rawEntries: Array<{ originalKey: string; text: string }> = [];

        if (isOptionsObject) {
          rawEntries = Object.entries(q.options).map(([k, v]) => ({
            originalKey: k.trim().toUpperCase(),
            text: typeof v === "string" ? v : String(v ?? ""),
          }));
        } else if (Array.isArray(q.options)) {
          rawEntries = q.options.map((opt: any, i: number) => {
            const fallbackKey = String.fromCharCode(65 + i);
            if (typeof opt === "string") {
              const match = opt.match(/^([A-D])\s*[\.:]\s*(.*)$/i);
              return {
                originalKey: match ? match[1].toUpperCase() : fallbackKey,
                text: match ? match[2].trim() : opt.trim(),
              };
            }
            return {
              originalKey: (opt.key || fallbackKey).toString().trim().toUpperCase(),
              text: (opt.text || "").toString().trim(),
            };
          });
        }

        if (rawEntries.length === 4) {
          const oldCorrectKey = (q.correct_answer || "").toString().trim().toUpperCase();
          let targetEntry = rawEntries.find((e) => e.originalKey === oldCorrectKey);
          if (!targetEntry && rawEntries.length > 0) {
            targetEntry =
              rawEntries.find((e) => e.text.toLowerCase() === oldCorrectKey.toLowerCase()) ||
              rawEntries[0];
          }

          const optSeed = variantSeed + qIdx * 7;
          const shuffledEntries = shuffleArray(rawEntries, optSeed);
          const keys = ["A", "B", "C", "D"];
          let foundCorrectKey = "A";

          if (isOptionsObject) {
            const nextOptionsObj: Record<string, string> = {};
            shuffledEntries.forEach((entry, i) => {
              const k = keys[i];
              nextOptionsObj[k] = entry.text;
              if (entry === targetEntry) {
                foundCorrectKey = k;
              }
            });
            newOptions = nextOptionsObj;
            newCorrect = foundCorrectKey;
          } else {
            newOptions = shuffledEntries.map((entry, i) => {
              const k = keys[i];
              if (entry === targetEntry) {
                foundCorrectKey = k;
              }
              return {
                key: k,
                text: entry.text,
              };
            });
            newCorrect = foundCorrectKey;
          }
        }

        return {
          ...q,
          options: newOptions,
          correct_answer: newCorrect,
          originalId: q.id || qIdx,
        };
      });

      // 2. Hoán vị câu hỏi Phần II (Đúng/Sai)
      const shuffledTf = shuffleArray(tfQuestions, variantSeed + 2).map((q) => ({
        ...q,
        originalId: q.id,
      }));

      // 3. Hoán vị câu hỏi Phần III (Trả lời ngắn)
      const shuffledSa = shuffleArray(saQuestions, variantSeed + 3).map((q) => ({
        ...q,
        originalId: q.id,
      }));

      // Gộp lại toàn bộ đề thi
      const finalQuestions = [...shuffledMcq, ...shuffledTf, ...shuffledSa, ...otherQuestions];

      generatedVariants.push({
        code: codeStr,
        questions: finalQuestions,
      });
    }

    // Xây dựng ma trận đáp án đối chiếu
    // Hàng = từng câu (theo thứ tự câu hỏi từ 1 đến N của đề gốc hoặc mã 101)
    const baseVariant = generatedVariants[0];
    const totalQ = baseVariant ? baseVariant.questions.length : 0;

    const rows: Array<{
      questionNum: number;
      answers: Record<string, string>;
    }> = [];

    for (let i = 0; i < totalQ; i++) {
      const answersRecord: Record<string, string> = {};
      generatedVariants.forEach((v) => {
        const qAt = v.questions[i];
        answersRecord[v.code] = qAt?.correct_answer || "-";
      });
      rows.push({
        questionNum: i + 1,
        answers: answersRecord,
      });
    }

    return { variants: generatedVariants, matrixRows: rows };
  }, [originalQuestions, variantCount, startCode, shuffleSeed]);

  if (!isOpen) return null;

  async function handleExportDocx() {
    setIsExporting(true);
    try {
      await exportShuffledExamsToDocx(
        examName,
        subject,
        grade,
        durationMinutes,
        variants,
        matrixRows,
        isPro
      );
    } catch (err) {
      console.error("Export shuffled docx failed:", err);
      showToast("Đã xảy ra lỗi khi tạo file Word. Vui lòng thử lại.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  function handleCopyMatrix() {
    if (matrixRows.length === 0) return;
    const headerLine = ["Câu hỏi", ...variants.map((v) => `Mã ${v.code}`)].join("\t");
    const bodyLines = matrixRows.map((r) =>
      [`Câu ${r.questionNum}`, ...variants.map((v) => r.answers[v.code] || "-")].join("\t")
    );
    const fullText = [headerLine, ...bodyLines].join("\n");
    navigator.clipboard.writeText(fullText);
    setCopiedMatrix(true);
    setTimeout(() => setCopiedMatrix(false), 2000);
  }

  const activeVariant = variants.find((v) => v.code === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overscroll-contain">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shuffle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-lg flex items-center gap-2">
                Trộn Đề Thi & Tạo Ma Trận Đáp Án
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 uppercase">
                  Chuẩn Bộ GD&ĐT
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                Tự động hoán vị thứ tự câu hỏi và phương án A, B, C, D để chống gian lận thi cử.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ trộn đề"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="p-4 border-b border-neutral-200 bg-white flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Số lượng mã đề */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">Số lượng mã đề:</span>
            <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-neutral-50">
              {[2, 4, 6, 8, 12].map((num) => {
                const isSelected = variantCount === num;
                const requiresMax = num > 4;
                const requiresPro = num === 4;

                return (
                  <button
                    key={num}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`Trộn ${num} mã đề`}
                    onClick={() => {
                      if (requiresMax && !isMax) {
                        setUpgradeTier("max");
                        return;
                      }
                      if (requiresPro && !isPro) {
                        setUpgradeTier("pro");
                        return;
                      }
                      setVariantCount(num);
                    }}
                    className={`px-3 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-white text-primary shadow-xs border border-neutral-200"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <span>{num} Mã</span>
                    {requiresMax && !isMax && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1 rounded">
                        MAX
                      </span>
                    )}
                    {requiresPro && !isPro && (
                      <span className="text-[9px] bg-primary/10 text-primary font-bold px-1 rounded">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mã bắt đầu */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">Mã bắt đầu:</span>
            <select
              value={startCode}
              onChange={(e) => setStartCode(parseInt(e.target.value, 10))}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold focus:border-primary focus:outline-none"
            >
              <option value={101}>101, 102, ...</option>
              <option value={201}>201, 202, ...</option>
              <option value={301}>301, 302, ...</option>
              <option value={401}>401, 402, ...</option>
            </select>
          </div>

          {/* Nút trộn lại */}
          <button
            type="button"
            onClick={() => setShuffleSeed((prev) => prev + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            Trộn lại ngẫu nhiên
          </button>

          {/* Nút xuất file Word */}
          <button
            type="button"
            onClick={handleExportDocx}
            disabled={isExporting || variants.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50 ml-auto"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Đang xuất file..." : `Tải trọn bộ ${variantCount} mã đề (.docx)`}
          </button>
        </div>

        {/* Tab switcher: [Ma trận đáp án] [Mã 101] [Mã 102] ... */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-neutral-200 bg-neutral-50 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`px-3.5 py-2 font-bold rounded-t-lg transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "matrix"
                ? "border-primary text-primary bg-white shadow-2xs"
                : "border-transparent text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Bảng ma trận đối chiếu ({matrixRows.length} câu)
          </button>

          {variants.map((v) => (
            <button
              key={v.code}
              type="button"
              onClick={() => setActiveTab(v.code)}
              className={`px-3 py-2 font-bold rounded-t-lg transition border-b-2 flex items-center gap-1 cursor-pointer ${
                activeTab === v.code
                  ? "border-primary text-primary bg-white shadow-2xs"
                  : "border-transparent text-neutral-600 hover:text-neutral-900"
              }`}
            >
              <span>Mã {v.code}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          {activeTab === "matrix" ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-neutral-500 font-medium">
                  Bảng đối chiếu đáp án tương ứng của từng mã đề thi. Thầy/Cô có thể copy vào Excel hoặc tải file Word.
                </p>
                <button
                  type="button"
                  onClick={handleCopyMatrix}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold cursor-pointer"
                >
                  {copiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedMatrix ? "Đã copy bảng" : "Copy bảng đáp án"}
                </button>
              </div>

              {matrixRows.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  Chưa có câu hỏi nào trong đề thi.
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100/80 border-b border-neutral-200 font-bold text-neutral-700">
                      <tr>
                        <th className="py-2.5 px-4 w-28 text-center">Câu hỏi</th>
                        {variants.map((v) => (
                          <th key={v.code} className="py-2.5 px-4 text-center text-primary font-black">
                            Mã {v.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {matrixRows.map((r) => (
                        <tr key={r.questionNum} className="hover:bg-neutral-50/70 transition">
                          <td className="py-2 px-4 text-center font-bold text-neutral-700 bg-neutral-50/40">
                            Câu {r.questionNum}
                          </td>
                          {variants.map((v) => {
                            const ans = r.answers[v.code] || "-";
                            const isSingleLetter = ans.length === 1 && ["A", "B", "C", "D"].includes(ans);
                            return (
                              <td key={v.code} className="py-2 px-4 text-center">
                                {isSingleLetter ? (
                                  <span className="inline-block w-6 h-6 leading-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                                    {ans}
                                  </span>
                                ) : (
                                  <span className="font-semibold text-neutral-800">{ans}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Xem trước từng mã đề */}
              <div className="mb-4 flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Xem trước Đề thi: Mã đề {activeVariant?.code}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Thứ tự câu hỏi và phương án A, B, C, D đã được hoán vị độc lập.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700 font-bold text-xs">
                  {activeVariant?.questions.length || 0} câu hỏi
                </span>
              </div>

              <div className="space-y-4">
                {activeVariant?.questions.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/30 text-xs">
                    <p className="font-semibold text-neutral-900 mb-2 leading-relaxed">
                      <span className="text-primary font-bold">Câu {idx + 1}: </span>
                      {q.content}
                    </p>

                    {q.options && Array.isArray(q.options) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {q.options.map((opt: any, oIdx: number) => {
                          const key = opt.key || String.fromCharCode(65 + oIdx);
                          const isCorrect = q.correct_answer === key;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium"
                                  : "border-neutral-200 bg-white text-neutral-700"
                              }`}
                            >
                              <span className="font-bold shrink-0">{key}.</span>
                              <span>{opt.text || opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs">
          <p className="text-neutral-500">
            Mẹo: File Word tải về đã bao gồm các trang riêng biệt cho từng mã đề và trang ma trận đáp án ở cuối.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 font-semibold text-neutral-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={!!upgradeTier}
        onClose={() => setUpgradeTier(null)}
        requiredTier={upgradeTier || "pro"}
        featureTitle={
          upgradeTier === "max"
            ? "Mở khóa Trộn 6 - 12 Mã Đề Công Nghiệp"
            : "Mở khóa Trộn 4 Mã Đề Chuẩn Bộ GD&ĐT"
        }
        featureDesc={
          upgradeTier === "max"
            ? "Gói Luyện Thi MAX cho phép trộn công nghiệp tới 12 mã đề thi độc lập, chống gian lận tuyệt đối cho các kỳ thi thử và lớp học đông."
            : "Gói PRO cho phép hoán vị tự động 4 mã đề thi kèm ma trận đáp án và bảng barem điểm chi tiết."
        }
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* PayOS Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setUpgradeTier(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
