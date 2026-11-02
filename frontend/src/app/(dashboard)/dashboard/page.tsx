"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  TrendingUp,
  Wallet,
  Clock,
  ArrowRight,
  Sparkles,
  Crown,
  Plus,
  BookOpen,
  Calendar,
  Presentation,
  FlaskConical,
  ScanLine,
  Zap,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getUserExams, Exam } from "@/lib/api/exams";
import { getUserWallet } from "@/lib/api/wallet";
import { isMaxUser, isProUser } from "@/lib/payment/plans";

// Helper định dạng số chuẩn Việt Nam
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("vi-VN").format(num);
};

// Helper chuyển đổi ngày sang định dạng tương đối tiếng Việt thân thiện
function formatRelativeTime(dateString: string): { relative: string; full: string } {
  try {
    const date = new Date(dateString);
    const full =
      date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " • " +
      date.toLocaleDateString("vi-VN");
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return { relative: "Vừa xong", full };
    if (diffMinutes < 60) return { relative: `${diffMinutes} phút trước`, full };
    if (diffHours < 24) return { relative: `${diffHours} giờ trước`, full };
    if (diffDays === 1) return { relative: "Hôm qua", full };
    if (diffDays < 7) return { relative: `${diffDays} ngày trước`, full };
    return { relative: date.toLocaleDateString("vi-VN"), full };
  } catch {
    return { relative: dateString, full: dateString };
  }
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [totalExams, setTotalExams] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [examsRes, walletRes] = await Promise.all([
          getUserExams(5, 0),
          getUserWallet(),
        ]);
        setExams(examsRes.exams);
        setTotalExams(examsRes.totalCount);
        if (walletRes) setCredits(walletRes.balance);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const latestExam = exams.length > 0 ? exams[0] : null;

  // Tính số bài đã chấm OMR (các bài thi trạng thái completed hoặc có dữ liệu chấm)
  const completedExamsCount = exams.filter((e) => e.status === "completed").length;

  // Hạn mức tạo đề hôm nay (Daily Quota)
  const userProfile = profile as Record<string, any> | null;
  const dailyQuota = Number(userProfile?.daily_quota ?? 3);
  const dailyUsed = Number(userProfile?.daily_quota_used ?? 0);
  const dailyRemaining = Math.max(0, dailyQuota - dailyUsed);

  // 4 thẻ chỉ số KPI Sư Phạm tối ưu
  const stats = [
    {
      label: "Đề thi đã tạo",
      value: loading ? "—" : formatNumber(totalExams),
      subtext: "Đề thi lưu trong kho",
      icon: FileText,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40",
      link: "/exams",
      linkText: "Xem kho đề",
    },
    {
      label: "Đã chấm OMR",
      value: loading ? "—" : formatNumber(completedExamsCount > 0 ? completedExamsCount : totalExams > 0 ? 1 : 0),
      subtext: "Bài thi quét OpenCV",
      icon: ScanLine,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40",
      link: "/grading",
      linkText: "Mở máy chấm",
    },
    {
      label: "Lượt tạo đề hôm nay",
      value: loading ? "—" : isPro || isMax ? "Không giới hạn" : `${dailyRemaining}/${dailyQuota}`,
      subtext: isPro || isMax ? "Đặc quyền PRO/MAX" : "Lượt miễn phí trong ngày",
      icon: Zap,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40",
      isQuota: !isPro && !isMax,
      progressPercent: isPro || isMax ? 100 : Math.round((dailyRemaining / dailyQuota) * 100),
      link: isPro || isMax ? "/exams/create" : "/settings?tab=plan",
      linkText: isPro || isMax ? "Tạo đề ngay" : "Mở khóa PRO",
    },
    {
      label: "Số dư Credits",
      value: loading ? "—" : credits !== null ? formatNumber(credits) : "0",
      subtext: "Ví điểm tài khoản",
      icon: Wallet,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40",
      link: "/settings?tab=credits",
      linkText: "Nạp qua PayOS",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ================= 1. HEADER CHÀO MỪNG & LỘ TRÌNH V2.0 ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-balance">
              Xin chào, {profile?.name || user?.email?.split("@")[0] || "Thầy Cô"}! 👋
            </h1>

            {/* Interactive Beta v1.0 -> v2.0 pill */}
            <Link
              href="/updates"
              title="Nhấp để xem lộ trình bản cập nhật v2.0.0 chính thức"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700/80 px-3 py-1 text-xs text-white shadow-xs hover:bg-slate-950 hover:border-blue-400 transition-all hover:scale-[1.02] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
              <span className="font-bold text-amber-300">v1.0 ➔ v2.0</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200 font-medium hidden sm:inline">Bản nâng cấp GDPT</span>
              <span className="text-blue-300 font-bold flex items-center gap-0.5 ml-1">
                Lộ trình v2.0 <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Chào mừng Thầy/Cô đến với <strong>EduTest AI</strong>. Sẵn sàng soạn đề thi chuẩn GDPT 2025 và chiếu Bục Giảng Số 4.0.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {latestExam && (
            <Link
              href={`/teach/${latestExam.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3.5 py-2 text-xs font-bold transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/60 shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Presentation className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>Vào Bục Giảng Số</span>
            </Link>
          )}

          <Link
            href="/exams/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Tạo đề thi mới</span>
          </Link>
        </div>
      </div>

      {/* Verification Re-engagement Banner */}
      {!profile?.is_verified_teacher && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {profile?.role === "tutor"
                    ? "Kích hoạt Huy hiệu Gia Sư Uy Tín & Nhận +10.000 Credits"
                    : "Kích hoạt Tích Xanh Giáo Viên Chính Chủ & Nhận +10.000 Credits"}
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-full">
                  Xác thực eKYC
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-slate-300 mt-0.5">
                {profile?.role === "tutor"
                  ? "Xác thực 2 lớp Thẻ sinh viên và CCCD để AI đối soát danh tính 1:1, mở khóa toàn bộ quyền lợi gia sư chuyên nghiệp."
                  : "Xác thực thẻ ngành giáo viên để bảo chứng uy tín trên đề thi, báo cáo học sinh và nhận ngay +10.000 Credits."}
              </p>
            </div>
          </div>

          <Link
            href={profile?.role === "tutor" ? "/verify/tutor" : "/verify/teacher"}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition shrink-0 self-start sm:self-center"
          >
            <span>Xác thực ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ================= 2. TỐI ƯU 4 THẺ CHỈ SỐ KPI (STATS GRID) ================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-2xs animate-pulse motion-reduce:animate-none space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-24 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded-lg" />
                </div>
                <div className="h-7 w-16 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))
          : stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card p-5 shadow-2xs transition-shadow hover:shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <div className={`rounded-lg p-2 ${stat.color}`}>
                      <stat.icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>

                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground truncate tabular-nums">
                    {stat.value}
                  </p>

                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {stat.subtext}
                  </p>

                  {stat.isQuota && (
                    <div className="mt-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${stat.progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/60">
                  <Link
                    href={stat.link}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded"
                  >
                    <span>{stat.linkText}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
      </div>

      {/* ================= 3. ACTION PILLS SƯ PHẠM (QUICK ACTIONS 2.0) ================= */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-sm sm:text-base text-foreground">
              Bộ Công Cụ Sư Phạm Nổi Bật (Quick Actions)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Truy cập tức thì các tính năng phục vụ tiết dạy
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Action 1: Tạo đề bằng AI */}
          <Link
            href="/exams/create"
            className="flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/60 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 motion-reduce:transform-none transition-transform">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                Tạo Đề Bằng AI
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Chuẩn GDPT 2025 & Ma trận 4 mức
              </p>
            </div>
          </Link>

          {/* Action 2: Bục Giảng Số 4.0 */}
          <Link
            href={latestExam ? `/teach/${latestExam.id}` : "/exams"}
            className="flex items-center gap-3 rounded-xl border border-blue-200/80 bg-blue-50/40 dark:border-blue-800/60 dark:bg-blue-950/30 p-3.5 transition-colors hover:bg-blue-50/80 dark:hover:bg-blue-950/50 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 motion-reduce:transform-none transition-transform shadow-xs">
              <Presentation className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  Bục Giảng Số 4.0
                </p>
                <span className="rounded bg-blue-600 text-white px-1.5 py-0.2 text-[9px] font-black uppercase">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Split-Screen & Kính vẽ chiếu lớp
              </p>
            </div>
          </Link>

          {/* Action 3: Phòng Thí Nghiệm 3D */}
          <Link
            href="/labs"
            className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-800/60 dark:bg-emerald-950/30 p-3.5 transition-colors hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 motion-reduce:transform-none transition-transform shadow-xs">
              <FlaskConical className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  Phòng TN 3D
                </p>
                <span className="rounded bg-emerald-600 text-white px-1.5 py-0.2 text-[9px] font-black uppercase">
                  54+ Bài
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Vật lý, Hóa, Sinh, Địa tương tác
              </p>
            </div>
          </Link>

          {/* Action 4: Chấm Bài OMR */}
          <Link
            href="/grading"
            className="flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:bg-muted/60 group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 motion-reduce:transform-none transition-transform">
              <ScanLine className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground group-hover:text-purple-600 transition-colors truncate">
                Chấm Trắc Nghiệm OMR
              </p>
              <p className="text-xs text-muted-foreground truncate">
                Quét camera & điện thoại 0.3s
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ================= 4. MAIN GRID: ĐỀ THI GẦN ĐÂY & VÍ TÀI KHOẢN ================= */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Recent exams (col-span-2) */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2 shadow-2xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-border p-5 bg-card/60">
            <div>
              <h2 className="font-semibold text-foreground text-sm sm:text-base">
                Đề thi gần đây
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các đề thi bạn vừa tạo hoặc sử dụng trong các tiết học
              </p>
            </div>
            <Link
              href="/exams"
              aria-label="Xem tất cả đề thi trong thư viện"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <span>Xem tất cả ({formatNumber(totalExams)})</span>
              <ArrowRight
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border p-2 animate-pulse motion-reduce:animate-none space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-6 w-20 bg-muted rounded-full shrink-0" />
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="font-medium text-foreground">
                Thầy/Cô chưa có đề thi nào trong tài khoản.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bắt đầu tạo đề thi trắc nghiệm bằng AI chuẩn cấu trúc Bộ Giáo Dục 2025 ngay chỉ với 1 cú click.
              </p>
              <Link
                href="/exams/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Tạo đề thi đầu tiên
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {exams.map((exam) => {
                const timeInfo = formatRelativeTime(exam.created_at);
                return (
                  <div
                    key={exam.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 transition-colors hover:bg-muted/50"
                  >
                    {/* Left details */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary border border-primary/20 group-hover:scale-105 motion-reduce:transform-none transition-transform">
                        {exam.subject.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <Link
                          href={`/exams/${exam.id}`}
                          title={`Mở chỉnh sửa đề thi: ${exam.name}`}
                          className="truncate font-semibold text-sm text-foreground hover:text-primary transition-colors block focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary rounded"
                        >
                          {exam.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          <span className="font-medium text-foreground/80">{exam.subject}</span>{" "}
                          • Lớp {exam.grade} • <span className="tabular-nums">{exam.question_count}</span> câu
                          {" • "}
                          <span title={`Thời gian tạo: ${timeInfo.full}`}>{timeInfo.relative}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right action pills: Bục Giảng Số & Chấm OMR */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Nút Bục Giảng Số 4.0 */}
                      <Link
                        href={`/teach/${exam.id}`}
                        aria-label={`Trình chiếu Bục Giảng Số cho đề thi ${exam.name}`}
                        title="Chiếu lớp học Split-Screen & Kính vẽ"
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-1.5 text-xs font-bold transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Presentation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                        <span className="hidden md:inline">Chiếu Bục Giảng</span>
                      </Link>

                      {/* Nút Chấm OMR */}
                      <Link
                        href={`/grading?examId=${exam.id}`}
                        aria-label={`Chấm thi trắc nghiệm OMR cho đề thi ${exam.name}`}
                        title="Quét camera máy tính / điện thoại chấm bài"
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ScanLine className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden md:inline">Chấm OMR</span>
                      </Link>

                      {/* Trạng thái đề thi */}
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                          exam.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/40"
                            : exam.status === "generating"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300/40"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/40"
                        }`}
                      >
                        {exam.status === "completed"
                          ? "Hoàn thành"
                          : exam.status === "generating"
                          ? "Đang tạo"
                          : "Bản nháp"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Card */}
          {exams.length > 0 && (
            <div className="p-3 bg-muted/20 border-t border-border flex justify-center">
              <Link
                href="/exams"
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 py-1 px-3 rounded hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
              >
                <span>Xem toàn bộ <span className="tabular-nums">{formatNumber(totalExams)}</span> đề thi trong thư viện</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Aside Column: Ví tài khoản & Quản trị gói */}
        <div className="space-y-4">
          {/* Credit balance & Wallet card */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sm sm:text-base text-foreground">
                Ví tài khoản
              </h2>
              {isMax ? (
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" /> Gói MAX
                </span>
              ) : isPro ? (
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" aria-hidden="true" /> Gói PRO
                </span>
              ) : (
                <Link
                  href="/settings?tab=plan"
                  aria-label="Nâng cấp gói tài khoản lên Giáo Viên PRO"
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-amber-500"
                >
                  Nâng cấp PRO
                </Link>
              )}
            </div>

            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-primary tabular-nums">
                  {loading ? "…" : credits !== null ? formatNumber(credits) : "0"}
                </span>
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  credits
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {isMax
                  ? "Tài khoản Giáo viên MAX VIP: Trộn 12 mã đề, AI phân tích câu bẫy, giao bài Magic Link & không giới hạn."
                  : isPro
                  ? "Tài khoản Giáo viên PRO: Mở khóa 54+ phòng thí nghiệm 3D, bục giảng số Split-Screen & chấm OMR không giới hạn."
                  : "Tài khoản Miễn phí: Tạo tối đa 3 đề/ngày, trải nghiệm 1 bài thí nghiệm mẫu cho mỗi môn học. Nâng cấp PRO để mở khóa toàn bộ."}
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/settings?tab=credits"
                  aria-label="Nạp credits tự động qua cổng PayOS VietQR"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  <span>Nạp Credits Qua PayOS VietQR</span>
                </Link>

                <Link
                  href="/settings?tab=guide"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Xem hướng dẫn sử dụng</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
