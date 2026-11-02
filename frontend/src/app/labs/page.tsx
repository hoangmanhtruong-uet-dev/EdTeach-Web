import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { type LabSubject } from "@/data/labs";
import { FlaskConical, ChevronRight, Sparkles } from "lucide-react";
import { LabsCatalog } from "./labs-catalog";

export const metadata: Metadata = {
  title: "Phòng thí nghiệm 3D — EduTest AI",
  description:
    "54 bài thí nghiệm 3D tương tác cho Vật lý, Hóa học, Sinh học và Địa lý — mở trực tiếp trên máy chiếu cho cả lớp.",
};

const SUBJECTS: LabSubject[] = ["phys", "chem", "bio", "geo"];

export default function LabsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-primary/5 dark:from-slate-900/90 dark:to-primary/10 p-6 sm:p-10 shadow-2xs">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-primary dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Phòng thí nghiệm 3D
            </h1>
          </div>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300 leading-relaxed">
            Toàn bộ 54 bài thí nghiệm tương tác 3D cho Vật lý, Hóa học, Sinh học và Địa lý được mở <strong className="font-semibold text-emerald-600 dark:text-emerald-400">hoàn toàn miễn phí 100%</strong> cho mọi Thầy Cô và Học sinh.
            Nâng cấp <strong className="font-semibold text-slate-900 dark:text-white">Gói Giáo Viên PRO</strong> để sử dụng các công cụ giá trị gia tăng độc quyền: Trợ lý AI phân tích hiện tượng, Kính vẽ Bục giảng tương tác và Bộ công cụ tự động sinh đề kiểm tra bám sát mô phỏng.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
              Vật lý · 10 bài
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
              Hóa học · 25 bài
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
              Sinh học · 5 bài
            </span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-3 py-1 font-medium text-slate-700 dark:text-slate-200 shadow-2xs">
              Địa lý · 14 bài
            </span>
          </div>
        </section>

        {/* Giới thiệu tính năng & Thông báo Open Access */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-400" />
            <p>
              <strong className="font-semibold text-amber-950 dark:text-amber-100">Phòng Thí Nghiệm Mở:</strong> 100% miễn phí 54 thí nghiệm 3D. Nâng cấp Gói PRO để sở hữu Trợ lý AI sư phạm, Kính vẽ bục giảng tương tác và Tự động sinh đề kiểm tra từ mô phỏng.
            </p>
          </div>
          <Link
            href="/settings?tab=plan"
            className="shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs hover:from-amber-600 hover:to-amber-700 transition shadow-xs"
          >
            Nâng cấp PRO
          </Link>
        </div>

        {/* Danh sách theo môn (Interactive Catalog with PRO modal) */}
        <LabsCatalog subjects={SUBJECTS} />

        {/* Lời cảm ơn & kế thừa */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          <p>
            Các mô phỏng thí nghiệm tương tác được kế thừa và lấy cảm hứng từ{" "}
            <a
              href="https://phet.colorado.edu"
              target="_blank"
              rel="noreferrer"
              className="text-primary dark:text-blue-400 font-medium hover:underline"
            >
              PhET Interactive Simulations (Đại học Colorado Boulder)
            </a>{" "}
            và{" "}
            <a
              href="https://lab.tongjiang.app"
              target="_blank"
              rel="noreferrer"
              className="text-primary dark:text-blue-400 font-medium hover:underline"
            >
              Tongjiang Lab
            </a>
            .
          </p>
        </section>

        {/* CTA */}
        <section className="mt-8 flex items-center justify-between rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">
              Thầy cô đang cần ra đề & giao bài tập?
            </h2>
            <p className="mt-1 text-sm opacity-90">
              EduTest AI giúp tạo đề thi chuẩn Bộ GD&ĐT và chấm bài viết tay bằng AI — thử miễn phí.
            </p>
          </div>
          <Link
            href="/register"
            className="flex flex-none items-center gap-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary"
          >
            Dùng thử miễn phí <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
