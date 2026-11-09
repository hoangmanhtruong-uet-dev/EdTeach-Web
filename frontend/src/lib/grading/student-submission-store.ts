// PostgreSQL-backed Realtime Store for Student Self-Submissions
// Replaces in-memory globalThis Maps (RC-07, STU-07, GRD-05)

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreStudentAnswers } from "./omr-template-resolver";

export interface StudentSubmissionDetail {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface StudentSubmission {
  id: string;
  linkToken: string;
  sessionId: string;
  studentName: string;
  studentCode: string;
  className: string;
  examCode: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  totalQuestions: number;
  studentAnswers: Record<number, string>;
  details: StudentSubmissionDetail[];
  submittedAt: string;
  source: "student_self";
}

export interface StudentSubmissionLink {
  token: string;
  userId?: string;
  sessionId: string;
  sessionName: string;
  subject: string;
  grade: string;
  className: string;
  durationMinutes: number;
  createdAt: number;
  expiresAt: number;
  questionCount: number;
  sheetType: string;
  answerKey: Record<number, string>;
  isClosed: boolean;
  submissionsCount: number;
}

// In-memory fallback cache for environments without DB connection
declare global {
  // eslint-disable-next-line no-var
  var __studentSubmissionLinksFallback: Map<string, StudentSubmissionLink> | undefined;
  // eslint-disable-next-line no-var
  var __studentSubmissionsFallback: Map<string, StudentSubmission> | undefined;
}

const fallbackLinks: Map<string, StudentSubmissionLink> =
  globalThis.__studentSubmissionLinksFallback ||
  (globalThis.__studentSubmissionLinksFallback = new Map());

const fallbackSubmissions: Map<string, StudentSubmission> =
  globalThis.__studentSubmissionsFallback ||
  (globalThis.__studentSubmissionsFallback = new Map());

function generateSubmissionToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let res = "";
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function createStudentSubmissionLink(params: {
  userId?: string;
  sessionId: string;
  sessionName: string;
  subject?: string;
  grade?: string;
  className?: string;
  durationMinutes: number;
  questionCount: number;
  sheetType?: string;
  answerKey?: Record<number, string>;
}): Promise<StudentSubmissionLink> {
  const now = Date.now();
  const token = generateSubmissionToken();
  const duration = Math.max(5, Math.min(params.durationMinutes, 120));
  const expiresAtMs = now + duration * 60 * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  const newLink: StudentSubmissionLink = {
    token,
    userId: params.userId,
    sessionId: params.sessionId,
    sessionName: params.sessionName || "Kỳ thi trắc nghiệm",
    subject: params.subject || "Toán",
    grade: params.grade || "10",
    className: (params.className || "").trim(),
    durationMinutes: duration,
    createdAt: now,
    expiresAt: expiresAtMs,
    questionCount: params.questionCount || 20,
    sheetType: params.sheetType || "20",
    answerKey: params.answerKey || {},
    isClosed: false,
    submissionsCount: 0,
  };

  // Keep fallback cache
  fallbackLinks.set(token, newLink);

  const admin = createAdminClient();
  if (admin) {
    try {
      const { error } = await (admin.from("student_submission_links") as any).insert({
        user_id: params.userId || null,
        session_id: params.sessionId,
        session_name: newLink.sessionName,
        subject: newLink.subject,
        grade: newLink.grade,
        class_name: newLink.className,
        token,
        duration_minutes: duration,
        question_count: newLink.questionCount,
        sheet_type: newLink.sheetType,
        answer_key: newLink.answerKey,
        is_closed: false,
        submissions_count: 0,
        expires_at: expiresAtIso,
      });
      if (error) {
        console.error("[createStudentSubmissionLink] DB Insert error:", error.message);
      }
    } catch (err: any) {
      console.warn("[createStudentSubmissionLink] DB error, using fallback:", err.message);
    }
  }

  return newLink;
}

export async function registerStudentSubmissionLink(
  link: StudentSubmissionLink
): Promise<StudentSubmissionLink> {
  fallbackLinks.set(link.token, link);
  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("student_submission_links") as any).upsert(
        {
          user_id: link.userId || null,
          session_id: link.sessionId,
          session_name: link.sessionName,
          subject: link.subject,
          grade: link.grade,
          class_name: link.className,
          token: link.token,
          duration_minutes: link.durationMinutes,
          question_count: link.questionCount,
          sheet_type: link.sheetType,
          answer_key: link.answerKey,
          is_closed: link.isClosed,
          submissions_count: link.submissionsCount,
          expires_at: new Date(link.expiresAt).toISOString(),
        },
        { onConflict: "token" }
      );
    } catch (err: any) {
      console.warn("[registerStudentSubmissionLink] DB error:", err.message);
    }
  }
  return link;
}

export async function getStudentSubmissionLink(
  token: string
): Promise<StudentSubmissionLink | null> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.from("student_submission_links") as any)
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!error && data) {
        const link: StudentSubmissionLink = {
          token: data.token,
          userId: data.user_id,
          sessionId: data.session_id,
          sessionName: data.session_name,
          subject: data.subject,
          grade: data.grade,
          className: data.class_name || "",
          durationMinutes: data.duration_minutes,
          createdAt: new Date(data.created_at).getTime(),
          expiresAt: new Date(data.expires_at).getTime(),
          questionCount: data.question_count,
          sheetType: data.sheet_type,
          answerKey: (data.answer_key as Record<number, string>) || {},
          isClosed: Boolean(data.is_closed),
          submissionsCount: data.submissions_count || 0,
        };
        fallbackLinks.set(token, link);
        return link;
      }
    } catch (err: any) {
      console.warn("[getStudentSubmissionLink] DB error, using fallback:", err.message);
    }
  }

  return fallbackLinks.get(token) || null;
}

export async function getStudentSubmissionLinksBySession(
  sessionId: string,
  userId?: string
): Promise<StudentSubmissionLink[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      let query = (admin.from("student_submission_links") as any)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          token: row.token,
          userId: row.user_id,
          sessionId: row.session_id,
          sessionName: row.session_name,
          subject: row.subject,
          grade: row.grade,
          className: row.class_name || "",
          durationMinutes: row.duration_minutes,
          createdAt: new Date(row.created_at).getTime(),
          expiresAt: new Date(row.expires_at).getTime(),
          questionCount: row.question_count,
          sheetType: row.sheet_type,
          answerKey: (row.answer_key as Record<number, string>) || {},
          isClosed: Boolean(row.is_closed),
          submissionsCount: row.submissions_count || 0,
        }));
      }
    } catch (err: any) {
      console.warn("[getStudentSubmissionLinksBySession] DB error, using fallback:", err.message);
    }
  }

  const results: StudentSubmissionLink[] = [];
  for (const l of fallbackLinks.values()) {
    if (l.sessionId === sessionId) {
      if (!userId || l.userId === userId) {
        results.push(l);
      }
    }
  }
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

export async function closeStudentSubmissionLink(
  token: string,
  userId?: string
): Promise<boolean> {
  let updatedInDb = false;
  const admin = createAdminClient();
  if (admin) {
    try {
      let query = (admin.from("student_submission_links") as any)
        .update({ is_closed: true, updated_at: new Date().toISOString() })
        .eq("token", token);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { error } = await query;
      if (!error) updatedInDb = true;
    } catch (err: any) {
      console.warn("[closeStudentSubmissionLink] DB error:", err.message);
    }
  }

  const fallback = fallbackLinks.get(token);
  if (fallback) {
    if (!userId || fallback.userId === userId) {
      fallback.isClosed = true;
      return true;
    }
  }

  return updatedInDb;
}

export async function submitStudentExam(params: {
  linkToken: string;
  studentName: string;
  studentCode: string;
  className?: string;
  examCode?: string;
  studentAnswers: Record<number, string>;
  images?: string[];
}): Promise<{ success: boolean; submission?: StudentSubmission; error?: string }> {
  const link = await getStudentSubmissionLink(params.linkToken);
  if (!link) {
    return { success: false, error: "Liên kết nộp bài không tồn tại." };
  }

  const now = Date.now();
  if (link.isClosed || now > link.expiresAt) {
    return { success: false, error: "Thời hạn nhận bài của liên kết này đã kết thúc." };
  }

  const scored = scoreStudentAnswers({
    sheetType: link.sheetType,
    subject: link.subject,
    questionCount: link.questionCount,
    answerKey: link.answerKey,
    studentAnswers: params.studentAnswers || {},
  });

  const questionCount = scored.totalQuestions;
  const correctCount = scored.correctCount;
  const incorrectCount = scored.incorrectCount;
  const emptyCount = scored.emptyCount;
  const score = scored.score;
  const details: StudentSubmissionDetail[] = scored.details.map((d) => ({
    questionNumber: d.questionNumber,
    studentAnswer: d.studentAnswer,
    correctAnswer: d.correctAnswer,
    isCorrect: d.isCorrect,
  }));

  let insertedId = "sub_" + Date.now();
  const admin = createAdminClient();

  if (admin) {
    try {
      const { data: linkRow } = await (admin.from("student_submission_links") as any)
        .select("id")
        .eq("token", params.linkToken)
        .maybeSingle();

      const linkId = linkRow?.id || null;

      const { data: subRow } = await (admin.from("student_submissions") as any)
        .insert({
          link_id: linkId,
          link_token: params.linkToken,
          session_id: link.sessionId,
          student_name: params.studentName.trim() || "Học sinh",
          student_code: params.studentCode.trim() || `${1000 + link.submissionsCount + 1}`,
          class_name: params.className?.trim() || link.className || "",
          exam_code: params.examCode?.trim() || "101",
          score,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          empty_count: emptyCount,
          total_questions: questionCount,
          answers: params.studentAnswers,
          images: params.images || [],
          details,
          status: "graded",
          source: "student_self",
          submitted_at: new Date().toISOString(),
        })
        .select("id, submitted_at")
        .single();

      if (subRow) {
        insertedId = subRow.id;
      }

      await (admin.from("student_submission_links") as any)
        .update({
          submissions_count: link.submissionsCount + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("token", params.linkToken);
    } catch (err: any) {
      console.warn("[submitStudentExam] DB error, using fallback:", err.message);
    }
  }

  link.submissionsCount++;

  const newSubmission: StudentSubmission = {
    id: insertedId,
    linkToken: params.linkToken,
    sessionId: link.sessionId,
    studentName: params.studentName.trim() || "Học sinh",
    studentCode: params.studentCode.trim() || `${1000 + link.submissionsCount}`,
    className: params.className?.trim() || link.className || "",
    examCode: params.examCode?.trim() || "101",
    score,
    correctCount,
    incorrectCount,
    emptyCount,
    totalQuestions: questionCount,
    studentAnswers: params.studentAnswers,
    details,
    submittedAt:
      new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
      " " +
      new Date().toLocaleDateString("vi-VN"),
    source: "student_self",
  };

  fallbackSubmissions.set(newSubmission.id, newSubmission);

  return { success: true, submission: newSubmission };
}

export async function getStudentSubmissionsBySession(
  sessionId: string
): Promise<StudentSubmission[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.from("student_submissions") as any)
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          linkToken: row.link_token,
          sessionId: row.session_id,
          studentName: row.student_name,
          studentCode: row.student_code || "",
          className: row.class_name || "",
          examCode: row.exam_code || "101",
          score: Number(row.score),
          correctCount: row.correct_count,
          incorrectCount: row.incorrect_count,
          emptyCount: row.empty_count,
          totalQuestions: row.total_questions,
          studentAnswers: row.answers || {},
          details: row.details || [],
          submittedAt:
            new Date(row.submitted_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }) +
            " " +
            new Date(row.submitted_at).toLocaleDateString("vi-VN"),
          source: "student_self",
        }));
      }
    } catch (err: any) {
      console.warn("[getStudentSubmissionsBySession] DB error, using fallback:", err.message);
    }
  }

  const results: StudentSubmission[] = [];
  for (const s of fallbackSubmissions.values()) {
    if (s.sessionId === sessionId) {
      results.push(s);
    }
  }
  return results;
}
