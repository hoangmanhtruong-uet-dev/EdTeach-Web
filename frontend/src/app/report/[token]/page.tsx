import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStudentReportByToken } from "@/lib/reports/student-report-store";
import { ReportView } from "./report-view";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const report = await getStudentReportByToken(token);

  if (!report) {
    return {
      title: "Không tìm thấy phiếu báo cáo | EduTest AI",
      description: "Đường dẫn báo cáo không tồn tại hoặc đã hết hạn truy cập.",
    };
  }

  const title = `Báo cáo kết quả: ${report.studentName} — Điểm ${report.score}/10 | EduTest AI`;
  const description = `Phiếu phân tích kết quả bài kiểm tra "${report.sessionName}" (Môn ${report.subject}) của em ${report.studentName}. Xếp hạng #${report.rank}/${report.totalStudents}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "EduTest AI — Tutor OS",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function ReportContent({ params }: PageProps) {
  const { token } = await params;
  const report = await getStudentReportByToken(token);

  if (!report) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Không tìm thấy phiếu báo cáo
          </h1>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mb-6 leading-relaxed">
            Đường liên kết xem báo cáo kết quả này không tồn tại, đã bị xóa hoặc mã token <strong>{token}</strong> không chính xác.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ EduTest AI</span>
          </Link>
        </div>
      </div>
    );
  }

  return <ReportView report={report} />;
}

export default function StudentReportPage(props: PageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-500 font-bold">
          Đang tải báo cáo kết quả...
        </div>
      }
    >
      <ReportContent {...props} />
    </React.Suspense>
  );
}
