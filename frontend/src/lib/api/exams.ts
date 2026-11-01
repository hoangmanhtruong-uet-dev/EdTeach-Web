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

export async function getUserExams(limit = 20, offset = 0) {
  const supabase = createClient();
  const { data, error, count } = await supabase
    .from("exams")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data || data.length === 0) {
    return { exams: SEED_EXAMS as any, totalCount: SEED_EXAMS.length };
  }
  return { exams: data, totalCount: count || data.length };
}

export async function getExamById(id: string) {
  if (id && id.startsWith("seed-")) {
    const seed = SEED_EXAMS.find((e) => e.id === id);
    if (seed) return seed;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("exams")
      .select("*, questions(*)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn("[getExamById] DB fetch note:", err);
  }

  const fallback = SEED_EXAMS.find((e) => e.id === id) || SEED_EXAMS[0];
  if (fallback) return fallback;
  throw new Error("Không tìm thấy đề thi với ID này.");
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

export async function deleteExam(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) {
    throw error;
  }
  return true;
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
