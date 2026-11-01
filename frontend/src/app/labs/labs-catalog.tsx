"use client";

import React, { useState } from "react";
import Link from "next/link";
import { isProUser as checkIsPro } from "@/lib/payment/plans";
import { useRouter } from "next/navigation";
import {
  LABS,
  SUBJECT_LABEL,
  SUBJECT_COLOR,
  labCoverUrl,
  FREE_TRIAL_LABS,
  isLabFreeTrial,
  type LabSubject,
  type LabLesson,
} from "@/data/labs";
import { useAuth } from "@/context/auth-context";
import {
  Lock,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
} from "lucide-react";

interface LabsCatalogProps {
  subjects: LabSubject[];
}

export function LabsCatalog({ subjects }: LabsCatalogProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const isProUser = checkIsPro(profile);

  const [selectedLockedLab, setSelectedLockedLab] = useState<LabLesson | null>(null);

  const handleLabClick = (e: React.MouseEvent, lab: LabLesson) => {
    const isFree = isLabFreeTrial(lab.slug);
    if (!isProUser && !isFree) {
      e.preventDefault();
      setSelectedLockedLab(lab);
    }
  };

  return (
    <>
      {subjects.map((subject) => {
        const labs = LABS.filter((l) => l.subject === subject);
        const freeLabSlug = FREE_TRIAL_LABS[subject];
        const freeLab = labs.find((l) => l.slug === freeLabSlug);

        return (
          <section key={subject} className="mb-12">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{SUBJECT_LABEL[subject]}</h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {labs.length} bài
                </span>
              </div>

              {!isProUser && freeLab && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Bài dùng thử:{" "}
                  <Link
                    href={`/labs/${freeLab.slug}`}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {freeLab.titleVi} (Miễn phí)
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {labs.map((lab) => {
                const isFree = isLabFreeTrial(lab.slug);
                const isLocked = !isProUser && !isFree;

                return (
                  <div
                    key={lab.slug}
                    onClick={(e) => handleLabClick(e, lab)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs transition hover:border-primary/50 dark:hover:border-blue-500/60 hover:shadow-md cursor-pointer"
                  >
                    <Link href={`/labs/${lab.slug}`} className="flex flex-1 flex-col">
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={labCoverUrl(lab.slug)}
                          alt={lab.titleVi}
                          loading="lazy"
                          className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${
                            isLocked ? "grayscale-[30%] opacity-90" : ""
                          }`}
                        />

                        {/* Subject Badge */}
                        <span
                          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-xs font-medium shadow-xs backdrop-blur-xs ${SUBJECT_COLOR[lab.subject]}`}
                        >
                          {SUBJECT_LABEL[lab.subject]}
                        </span>

                        {/* Lock / Free Trial Badge */}
                        {isLocked ? (
                          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-neutral-900/85 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 shadow-sm backdrop-blur-xs">
                            <Lock className="h-3 w-3 text-amber-400" />
                            Gói PRO
                          </span>
                        ) : isFree && !isProUser ? (
                          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                            <Check className="h-3 w-3 stroke-[3]" />
                            Dùng thử
                          </span>
                        ) : (
                          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-xs">
                            Tiếng Việt
                          </span>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="flex-1 font-semibold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                            {lab.titleVi}
                          </h3>
                          {isLocked && <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                        </div>

                        {lab.questionVi && (
                          <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            &ldquo;{lab.questionVi}&rdquo;
                          </p>
                        )}

                        {lab.gdpt && (
                          <p className="mt-auto text-[11px] font-medium text-primary/90 dark:text-blue-400">{lab.gdpt}</p>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px] text-slate-400 dark:text-slate-500">
                          <span>{lab.steps} bước thí nghiệm</span>
                          {isLocked ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                              Mở khóa PRO
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sẵn sàng mở</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* ========================================================= */}
      {/* MODAL: PAYWALL PHÒNG THÍ NGHIỆM 3D (NÂNG CẤP GÓI PRO) */}
      {/* ========================================================= */}
      {selectedLockedLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative text-left">
            <button
              onClick={() => setSelectedLockedLab(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" /> Đặc Quyền Gói PRO
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">99.000đ / tháng</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1.5 leading-snug">
              Mở khóa Thí Nghiệm 3D: {selectedLockedLab.titleVi}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Tài khoản miễn phí được trải nghiệm thử 1 bài mẫu cho mỗi môn học.
              Bài học này thuộc bộ sưu tập <strong className="font-semibold text-slate-900 dark:text-white">50+ bài học 3D tương tác cao cấp</strong> dành riêng cho Thầy Cô đăng ký <strong className="font-semibold text-slate-900 dark:text-white">Gói Giáo Viên PRO</strong>.
            </p>

            {/* Quyền lợi Gói PRO */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200/70 dark:border-amber-800/40 mb-5 space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Quyền lợi toàn diện khi nâng cấp PRO:</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Mở khóa toàn bộ <strong className="font-semibold text-slate-900 dark:text-white">54+ Phòng Thí Nghiệm 3D</strong> (Lý, Hóa, Sinh, Địa) trình chiếu trực tiếp trên máy chiếu/bảng tương tác.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Tặng ngay <strong className="font-semibold text-slate-900 dark:text-white">+30.000 Credits</strong> tạo đề thi AI bám sát cấu trúc chuẩn GDPT 2025.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Chấm trắc nghiệm tự động không giới hạn (quét qua điện thoại & chấm phiếu A4 OMR).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Xuất file Word (.docx) & bảng điểm Excel UTF-8 BOM chuẩn Bộ GD&ĐT.</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <Link
                href="/wallet?plan=pro"
                className="w-full sm:flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nâng cấp Gói PRO (99.000đ/tháng)</span>
              </Link>

              {FREE_TRIAL_LABS[selectedLockedLab.subject] && (
                <Link
                  href={`/labs/${FREE_TRIAL_LABS[selectedLockedLab.subject]}`}
                  onClick={() => setSelectedLockedLab(null)}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
                >
                  <span>Xem bài dùng thử {SUBJECT_LABEL[selectedLockedLab.subject]}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
