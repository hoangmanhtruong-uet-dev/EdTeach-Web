"use client";

import React from "react";
import Link from "next/link";
import {
  LABS,
  SUBJECT_LABEL,
  SUBJECT_COLOR,
  labCoverUrl,
  type LabSubject,
} from "@/data/labs";
import {
  Check,
} from "lucide-react";

interface LabsCatalogProps {
  subjects: LabSubject[];
}

export function LabsCatalog({ subjects }: LabsCatalogProps) {
  return (
    <>
      {subjects.map((subject) => {
        const labs = LABS.filter((l) => l.subject === subject);

        return (
          <section key={subject} className="mb-12">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{SUBJECT_LABEL[subject]}</h2>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {labs.length} bài
                </span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  100% Miễn Phí (CC BY-NC 4.0)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {labs.map((lab) => {
                return (
                  <div
                    key={lab.slug}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs transition hover:border-primary/50 dark:hover:border-blue-500/60 hover:shadow-md cursor-pointer"
                  >
                    <Link href={`/labs/${lab.slug}`} className="flex flex-1 flex-col">
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={labCoverUrl(lab.slug)}
                          alt={lab.titleVi}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />

                        {/* Subject Badge */}
                        <span
                          className={`absolute left-2 top-2 rounded-full border px-2 py-0.5 text-xs font-medium shadow-xs backdrop-blur-xs ${SUBJECT_COLOR[lab.subject]}`}
                        >
                          {SUBJECT_LABEL[lab.subject]}
                        </span>

                        {/* Free Open Access Badge */}
                        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                          Mở tự do
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="flex-1 font-semibold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                            {lab.titleVi}
                          </h3>
                        </div>

                        {lab.questionVi && (
                          <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            &ldquo;{lab.questionVi}&rdquo;
                          </p>
                        )}

                        {lab.gdpt && (
                          <p className="mt-auto text-[11px] font-medium text-primary/90 dark:text-blue-400">{lab.gdpt}</p>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500">{lab.steps} bước</span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span title="Kính vẽ sư phạm (PRO)">🖌️</span>
                            <span title="Trợ lý AI phân tích (PRO)">🤖</span>
                            <span title="Sinh đề thi từ 3D (PRO)">📝</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">Mở 3D</span>
                          </div>
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
    </>
  );
}
