import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRemediationSheetByToken } from "@/lib/remediation/remediation-store";
import { PracticeView } from "./practice-view";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const sheet = await getRemediationSheetByToken(token);

  if (!sheet) {
    return {
      title: "Không tìm thấy phiếu luyện bù | EduTest AI",
      description: "Đường dẫn phiếu bài tập không tồn tại hoặc đã hết hạn truy cập.",
    };
  }

  const title = `Luyện bù lỗ hổng: ${sheet.studentName} — ${sheet.examTitle} | EduTest AI`;
  const description = `Phiếu củng cố kiến thức cá nhân hóa theo các câu làm sai môn ${sheet.subject} dành cho em ${sheet.studentName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "EduTest AI — Tutor OS",
    },
  };
}

export default async function PracticePage({ params }: PageProps) {
  const { token } = await params;
  const sheet = await getRemediationSheetByToken(token);

  if (!sheet) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            Không tìm thấy phiếu luyện bù
          </h1>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mb-6 leading-relaxed">
            Đường liên kết bài tập này không tồn tại, đã bị xóa hoặc mã token <strong>{token}</strong> không chính xác.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chủ EduTest AI</span>
          </Link>
        </div>
      </div>
    );
  }

  // If student hasn't completed yet, sanitize answers on server before sending to client
  let sheetToRender = sheet;
  if (sheet.status !== "completed") {
    const sanitized = sheet.clonedQuestions.map((q) => ({
      id: q.id,
      originalQuestionNumber: q.originalQuestionNumber,
      cognitiveLevel: q.cognitiveLevel,
      cognitiveLabel: q.cognitiveLabel,
      content: q.content,
      options: q.options,
      correctAnswer: "" as any,
      explanation: "",
      casioTip: "",
      conceptNote: "",
    }));
    sheetToRender = {
      ...sheet,
      clonedQuestions: sanitized,
    };
  }

  return <PracticeView initialSheet={sheetToRender} />;
}
