import { SEED_EXAMS } from '@/lib/seed/seed-exams';
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

export type Exam = Database["public"]["Tables"]["exams"]["Row"];
export type InsertExam = Database["public"]["Tables"]["exams"]["Insert"];
export type UpdateExam = Database["public"]["Tables"]["exams"]["Update"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type UpdateQuestion = Database["public"]["Tables"]["questions"]["Update"];

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

export interface GetUserExamsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  subject?: string;
  grade?: string;
  status?: string;
  sortBy?: "newest" | "oldest" | "questions_desc" | "questions_asc" | "name_asc" | "name_desc";
}

export async function getUserExams(
  limitOrOptions: number | GetUserExamsOptions = 20,
  offsetParam: number = 0
): Promise<{ exams: Exam[]; totalCount: number }> {
  let limit = 20;
  let offset = 0;
  let search: string | undefined;
  let subject: string | undefined;
  let grade: string | undefined;
  let status: string | undefined;
  let sortBy: string = "newest";

  if (typeof limitOrOptions === "object") {
    limit = limitOrOptions.limit ?? 20;
    offset = limitOrOptions.offset ?? 0;
    search = limitOrOptions.search;
    subject = limitOrOptions.subject;
    grade = limitOrOptions.grade;
    status = limitOrOptions.status;
    sortBy = limitOrOptions.sortBy ?? "newest";
  } else {
    limit = limitOrOptions;
    offset = offsetParam;
  }

  const supabase = createClient();
  const buildQuery = (includeDeletedAt: boolean) => {
    let q = supabase.from("exams").select("*", { count: "exact" });
    if (includeDeletedAt) {
      q = q.is("deleted_at", null);
    }

    // Filter: Subject
    if (subject && subject !== "all") {
      q = q.eq("subject", subject);
    }

    // Filter: Grade
    if (grade && grade !== "all") {
      q = q.eq("grade", grade);
    }

    // Filter: Status
    if (status && status !== "all") {
      q = q.eq("status", status as any);
    }

    // Filter: Search keyword across name and subject
    if (search && search.trim()) {
      const term = search.trim();
      q = q.or(`name.ilike.%${term}%,subject.ilike.%${term}%`);
    }

    // Sorting
    if (sortBy === "oldest") {
      q = q.order("created_at", { ascending: true });
    } else if (sortBy === "questions_desc") {
      q = q.order("question_count", { ascending: false });
    } else if (sortBy === "questions_asc") {
      q = q.order("question_count", { ascending: true });
    } else if (sortBy === "name_asc") {
      q = q.order("name", { ascending: true });
    } else if (sortBy === "name_desc") {
      q = q.order("name", { ascending: false });
    } else {
      // Default newest
      q = q.order("created_at", { ascending: false });
    }
    return q;
  };

  let { data, error, count } = await buildQuery(true).range(offset, offset + limit - 1);

  // Graceful fallback nếu DB Supabase chưa chạy migration thêm cột deleted_at
  if (error && (error.message?.includes("deleted_at") || (error as any).code === "42703")) {
    const fallbackRes = await buildQuery(false).range(offset, offset + limit - 1);
    data = fallbackRes.data;
    error = fallbackRes.error;
    count = fallbackRes.count;
  }

  if (error) {
    console.error("[getUserExams] Query error:", error);
    return { exams: [], totalCount: 0 };
  }

  return { exams: (data as Exam[]) || [], totalCount: count || (data?.length ?? 0) };
}

export async function getExamById(id: string) {
  if (id && id.startsWith("seed-")) {
    const seed = SEED_EXAMS.find((e) => e.id === id);
    if (seed) return seed;
  }

  try {
    const supabase = createClient();
    let { data, error } = await supabase
      .from("exams")
      .select("*, questions(*)")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error && (error.message?.includes("deleted_at") || (error as any).code === "42703")) {
      const retry = await supabase
        .from("exams")
        .select("*, questions(*)")
        .eq("id", id)
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn("[getExamById] DB fetch note:", err);
  }

  // Fallback qua API chia sẻ nếu RLS chặn người dùng khác xem đề thi (CRT-11)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/exams/shared/${id}`);
      if (res.ok) {
        const sharedData = await res.json();
        if (sharedData && (sharedData.name || sharedData.id)) {
          return sharedData;
        }
      }
    } catch (sharedErr) {
      console.warn("[getExamById] Shared fallback fetch note:", sharedErr);
    }
  }

  const fallback = SEED_EXAMS.find((e) => e.id === id);
  if (fallback) return fallback;
  throw new Error("Không tìm thấy đề thi với ID này hoặc đề thi đã bị xóa.");
}

export async function createExam(examData: InsertExam) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("exams") as any)
    .insert(examData)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Exam;
}

export async function updateExam(id: string, updates: UpdateExam) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("exams") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Exam;
}

export async function hardDeleteExam(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}

export async function softDeleteExam(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await (supabase.from("exams") as any)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (error.message?.includes("deleted_at") || (error as any).code === "42703") {
      // Nếu cột deleted_at chưa có trong DB, fallback xóa trực tiếp
      const hardDel = await supabase.from("exams").delete().eq("id", id);
      if (hardDel.error) throw hardDel.error;
      return true;
    }
    throw error;
  }
  return true;
}

/**
 * Xóa đề thi theo phân hạng người dùng:
 * - isPro === false (Tài khoản FREE): Xóa vĩnh viễn trực tiếp trong CSDL (hard delete).
 * - isPro === true (Gói PRO): Xóa mềm (soft delete), lưu trong thùng rác 14 ngày có thể khôi phục.
 */
export async function deleteExam(id: string, isPro: boolean = false): Promise<boolean> {
  if (isPro) {
    return softDeleteExam(id);
  }
  return hardDeleteExam(id);
}

/**
 * Khôi phục đề thi từ thùng rác về danh sách chính (Đặc quyền PRO)
 */
export async function restoreExam(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await (supabase.from("exams") as any)
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}

/**
 * Lấy danh sách đề thi trong thùng rác (Được xóa trong vòng 14 ngày gần nhất)
 */
export async function getTrashExams(): Promise<Exam[]> {
  const supabase = createClient();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .not("deleted_at", "is", null)
    .gte("deleted_at", fourteenDaysAgo)
    .order("deleted_at", { ascending: false });
  if (error) {
    console.error("Failed to fetch trash exams", error);
    return [];
  }
  return (data as any[]) || [];
}

/**
 * Xóa vĩnh viễn đề thi trong thùng rác
 */
export async function permanentDeleteExam(id: string): Promise<boolean> {
  return hardDeleteExam(id);
}

export async function updateQuestion(id: string, updates: UpdateQuestion) {
  const supabase = createClient();
  const { data, error } = await (supabase.from("questions") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data as Question;
}

export async function deleteQuestion(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
}
