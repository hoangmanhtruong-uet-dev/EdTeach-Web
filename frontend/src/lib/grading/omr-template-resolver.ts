// Shared OMR Template Resolver, GDPT 2025 Subject Classifier & Scoring Engine
// Mirrors Python `ai-service/app/omr/sheet_generator.py` & `template_matcher.py` 1:1.

export type Gdpt2025Variant = "math" | "science" | "social";

export type BackendOmrSheetType =
  | "bgd_2025_math"
  | "bgd_2025_science"
  | "bgd_2025_social"
  | "sheet_20"
  | "sheet_40"
  | "sheet_50"
  | "bgd_2025"
  | "classic_50";

export interface QuestionCounts2025 {
  variant: Gdpt2025Variant;
  part1Count: number;
  part2Count: number;
  part3Count: number;
  part1Point: number;
  part3Point: number;
  totalQuestions: number;
}

export function normalizeSubjectKey(subject?: string | null): string {
  return String(subject || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function get2025Variant(
  subject?: string | null,
  questionCount?: number | null
): Gdpt2025Variant {
  const s = normalizeSubjectKey(subject);

  if (
    s.includes("lich su") ||
    s === "su" ||
    s.includes("gdcd") ||
    s.includes("ktpl") ||
    s.includes("kinh te") ||
    s.includes("phap luat") ||
    s.includes("cong dan") ||
    s.includes("cong nghe") ||
    s.includes("tin hoc") ||
    s.includes("khxh")
  ) {
    return "social";
  }

  if (
    s.includes("vat li") ||
    s.includes("vat ly") ||
    s === "ly" ||
    s === "li" ||
    s.includes("hoa hoc") ||
    s === "hoa" ||
    s.includes("sinh hoc") ||
    s === "sinh" ||
    s.includes("dia li") ||
    s.includes("dia ly") ||
    s === "dia" ||
    s.includes("khtn") ||
    s.includes("khoa hoc tu nhien")
  ) {
    return "science";
  }

  if (s.includes("toan") || s.includes("math")) {
    return "math";
  }

  if (questionCount === 28) {
    return "science";
  }

  return "math";
}

export function get2025QuestionCounts(
  subject?: string | null,
  questionCount?: number | null
): QuestionCounts2025 {
  if (questionCount === 54) {
    return {
      variant: "science",
      part1Count: 40,
      part2Count: 8,
      part3Count: 6,
      part1Point: 0.25,
      part3Point: 0.25,
      totalQuestions: 54,
    };
  }

  const variant = get2025Variant(subject, questionCount);
  if (variant === "social") {
    return {
      variant: "social",
      part1Count: 24,
      part2Count: 4,
      part3Count: 0,
      part1Point: 0.25,
      part3Point: 0,
      totalQuestions: 28,
    };
  }

  if (variant === "science") {
    return {
      variant: "science",
      part1Count: 18,
      part2Count: 4,
      part3Count: 6,
      part1Point: 0.25,
      part3Point: 0.25,
      totalQuestions: 28,
    };
  }

  return {
    variant: "math",
    part1Count: 12,
    part2Count: 4,
    part3Count: 6,
    part1Point: 0.25,
    part3Point: 0.5,
    totalQuestions: 22,
  };
}

export function resolveBackendOmrSheetType(
  sheetType?: string | null,
  subject?: string | null,
  questionCount?: number | null
): BackendOmrSheetType {
  const st = String(sheetType || "").trim().toLowerCase();

  if (
    st === "bgd_2025_math" ||
    st === "bgd_2025_science" ||
    st === "bgd_2025_social" ||
    st === "sheet_20" ||
    st === "sheet_40" ||
    st === "sheet_50" ||
    st === "bgd_2025" ||
    st === "classic_50"
  ) {
    return st;
  }

  if (st === "2025_math") return "bgd_2025_math";
  if (st === "2025_science") return "bgd_2025_science";
  if (st === "2025_social") return "bgd_2025_social";
  if (st === "20") return "sheet_20";
  if (st === "40") return "sheet_40";
  if (st === "50") return "sheet_50";

  if (st === "2025" || st === "gdpt_2025") {
    if (questionCount === 54) return "bgd_2025";
    const variant = get2025Variant(subject, questionCount);
    if (variant === "social") return "bgd_2025_social";
    if (variant === "science") return "bgd_2025_science";
    return "bgd_2025_math";
  }

  const qCount = questionCount ?? 20;
  if (qCount <= 20) return "sheet_20";
  if (qCount <= 40) return "sheet_40";
  return "sheet_50";
}

export function isValidStudentCode(sbd?: string | null): boolean {
  const cleaned = String(sbd || "").trim();
  return cleaned.length > 0 && !/^\?+$/.test(cleaned);
}

export function normalizeTfChar(val: unknown): "Đ" | "S" | "" {
  const v = String(val ?? "").trim().toUpperCase();
  if (v === "D" || v === "Đ" || v === "TRUE" || v === "T" || v === "1") return "Đ";
  if (v === "S" || v === "FALSE" || v === "F" || v === "0") return "S";
  return "";
}

export interface OmrBubbleEntry {
  selected?: unknown;
  is_correct?: boolean;
}

export interface OmrPart2Entry {
  sub_items?: Record<string, OmrBubbleEntry | unknown>;
  correct_subs_count?: number;
}

export interface OmrResponsePayload {
  sheet_type?: string | null;
  student_code?: string | null;
  exam_code?: string | null;
  correct_count?: number;
  total_questions?: number;
  results?: Record<string, OmrBubbleEntry | unknown>;
  part1_results?: Record<string, OmrBubbleEntry | unknown>;
  part2_results?: Record<string, OmrPart2Entry | Record<string, unknown> | unknown>;
  part3_results?: Record<string, OmrBubbleEntry | unknown>;
}

function hasSelectedValue(val: unknown): boolean {
  return val !== undefined && val !== null && String(val).trim() !== "";
}

export function normalizeTfGroupAnswer(val: unknown): string {
  if (!val) return "";
  if (typeof val === "object" && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const rawItems =
      typeof obj.sub_items === "object" && obj.sub_items !== null
        ? (obj.sub_items as Record<string, unknown>)
        : obj;
    const parts = ["a", "b", "c", "d"].map((k) => {
      const entry = rawItems[k];
      const raw =
        typeof entry === "object" && entry !== null
          ? (entry as OmrBubbleEntry).selected
          : entry;
      return normalizeTfChar(raw);
    });
    return parts.some(Boolean) ? parts.join("-") : "";
  }

  const raw = String(val).trim();
  if (!raw) return "";

  let tokens: string[];
  if (/[-,/;|\s]/.test(raw)) {
    tokens = raw.split(/[-,/;|\s]+/);
  } else if (raw.length === 4) {
    tokens = raw.split("");
  } else {
    tokens = [raw];
  }

  const normalized = [0, 1, 2, 3].map((i) => normalizeTfChar(tokens[i]));
  return normalized.some(Boolean) ? normalized.join("-") : "";
}

export function normalizeShortAnswer(val: unknown): string {
  const s = String(val ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/^\+/, "");
  if (!s) return "";
  const num = Number(s);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return num === 0 ? "0" : String(num);
  }
  return s.toUpperCase();
}

export function flattenOmrAnswers(
  omrData: unknown,
  sheetType?: string | null,
  subject?: string | null,
  questionCount?: number | null
): Record<number, string> {
  const flat: Record<number, string> = {};
  if (!omrData || typeof omrData !== "object") return flat;
  const payload = omrData as OmrResponsePayload;

  if (payload.results && typeof payload.results === "object") {
    for (const [k, v] of Object.entries(payload.results)) {
      const qNum = parseInt(k, 10);
      if (!Number.isNaN(qNum)) {
        const raw =
          typeof v === "object" && v !== null
            ? (v as OmrBubbleEntry).selected
            : v;
        if (hasSelectedValue(raw)) {
          flat[qNum] = String(raw).trim().toUpperCase();
        }
      }
    }
    return flat;
  }

  const resolvedType = resolveBackendOmrSheetType(
    payload.sheet_type || sheetType,
    subject,
    questionCount
  );
  const effectiveQCount =
    resolvedType === "bgd_2025"
      ? 54
      : resolvedType === "bgd_2025_math"
      ? 22
      : resolvedType === "bgd_2025_science" || resolvedType === "bgd_2025_social"
      ? 28
      : questionCount;
  const effectiveSubject =
    resolvedType === "bgd_2025_math"
      ? "Toán"
      : resolvedType === "bgd_2025_science"
      ? "Vật lí"
      : resolvedType === "bgd_2025_social"
      ? "Lịch sử"
      : subject;

  const counts = get2025QuestionCounts(effectiveSubject, effectiveQCount);
  const p1Map = (
    payload.part1_results && typeof payload.part1_results === "object"
      ? payload.part1_results
      : {}
  ) as Record<string, unknown>;
  const p2Map = (
    payload.part2_results && typeof payload.part2_results === "object"
      ? payload.part2_results
      : {}
  ) as Record<string, unknown>;
  const p3Map = (
    payload.part3_results && typeof payload.part3_results === "object"
      ? payload.part3_results
      : {}
  ) as Record<string, unknown>;

  const p1Len = Object.keys(p1Map).length;
  const p2Len = Object.keys(p2Map).length;
  const baseP1Count =
    resolvedType.startsWith("bgd_2025")
      ? counts.part1Count
      : p1Len >= counts.part1Count
      ? p1Len
      : counts.part1Count;
  const baseP2Count =
    resolvedType.startsWith("bgd_2025")
      ? counts.part2Count
      : p2Len >= counts.part2Count
      ? p2Len
      : counts.part2Count;

  for (const [k, v] of Object.entries(p1Map)) {
    const qNum = parseInt(k, 10);
    if (!Number.isNaN(qNum)) {
      const raw =
        typeof v === "object" && v !== null
          ? (v as OmrBubbleEntry).selected
          : v;
      if (hasSelectedValue(raw)) {
        flat[qNum] = String(raw).trim().toUpperCase();
      }
    }
  }

  for (const [k, v] of Object.entries(p2Map)) {
    const idx = parseInt(k, 10);
    if (!Number.isNaN(idx)) {
      const qNum = idx > baseP1Count ? idx : baseP1Count + idx;
      const formatted = normalizeTfGroupAnswer(v);
      if (formatted) {
        flat[qNum] = formatted;
      }
    }
  }

  for (const [k, v] of Object.entries(p3Map)) {
    const idx = parseInt(k, 10);
    if (!Number.isNaN(idx)) {
      const baseOffset = baseP1Count + baseP2Count;
      const qNum = idx > baseOffset ? idx : baseOffset + idx;
      const raw =
        typeof v === "object" && v !== null
          ? (v as OmrBubbleEntry).selected
          : v;
      if (hasSelectedValue(raw)) {
        flat[qNum] = String(raw).trim();
      }
    }
  }

  return flat;
}

export function computeOmrCounts(
  omrData: unknown,
  fallbackQuestionCount?: number
): {
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  totalQuestions: number;
} {
  if (!omrData || typeof omrData !== "object") {
    return {
      correctCount: 0,
      incorrectCount: 0,
      emptyCount: fallbackQuestionCount || 0,
      totalQuestions: fallbackQuestionCount || 0,
    };
  }

  const payload = omrData as OmrResponsePayload;

  if (typeof payload.correct_count === "number") {
    const total = payload.total_questions || fallbackQuestionCount || 0;
    const results = (
      payload.results && typeof payload.results === "object"
        ? payload.results
        : {}
    ) as Record<string, OmrBubbleEntry | null | undefined>;
    let empty = 0;
    let incorrect = 0;
    if (Object.keys(results).length > 0) {
      for (const v of Object.values(results)) {
        if (!hasSelectedValue(v?.selected)) empty++;
        else if (!v?.is_correct) incorrect++;
      }
    } else {
      incorrect = Math.max(0, total - payload.correct_count);
    }
    return {
      correctCount: payload.correct_count,
      incorrectCount: incorrect,
      emptyCount: empty,
      totalQuestions: total,
    };
  }

  let correctCount = 0;
  let incorrectCount = 0;
  let emptyCount = 0;

  const p1 = Object.values(
    (payload.part1_results && typeof payload.part1_results === "object"
      ? payload.part1_results
      : {}) as Record<string, OmrBubbleEntry | null | undefined>
  );
  for (const v of p1) {
    if (!hasSelectedValue(v?.selected)) emptyCount++;
    else if (v?.is_correct) correctCount++;
    else incorrectCount++;
  }

  const p2 = Object.values(
    (payload.part2_results && typeof payload.part2_results === "object"
      ? payload.part2_results
      : {}) as Record<string, OmrPart2Entry | null | undefined>
  );
  for (const v of p2) {
    const subs = Object.values(
      (v?.sub_items && typeof v.sub_items === "object"
        ? v.sub_items
        : {}) as Record<string, OmrBubbleEntry | null | undefined>
    );
    const anyPicked = subs.some((s) => hasSelectedValue(s?.selected));
    if (!anyPicked) {
      emptyCount++;
    } else if (v?.correct_subs_count === 4) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }

  const p3 = Object.values(
    (payload.part3_results && typeof payload.part3_results === "object"
      ? payload.part3_results
      : {}) as Record<string, OmrBubbleEntry | null | undefined>
  );
  for (const v of p3) {
    if (!hasSelectedValue(v?.selected)) emptyCount++;
    else if (v?.is_correct) correctCount++;
    else incorrectCount++;
  }

  const totalQuestions = p1.length + p2.length + p3.length || fallbackQuestionCount || 0;
  return { correctCount, incorrectCount, emptyCount, totalQuestions };
}

export interface ScoredQuestionDetail {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isEmpty: boolean;
  score: number;
  section: "MCQ" | "Part I" | "Part II" | "Part III";
}

export interface ScoredExamResult {
  score: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  totalQuestions: number;
  details: ScoredQuestionDetail[];
}

export function scoreStudentAnswers(params: {
  sheetType?: string | null;
  subject?: string | null;
  questionCount?: number | null;
  answerKey: Record<number, string>;
  studentAnswers: Record<number, string>;
}): ScoredExamResult {
  const st = String(params.sheetType || "").trim().toLowerCase();
  const is2025 =
    st === "2025" ||
    st === "gdpt_2025" ||
    st.startsWith("2025_") ||
    st.startsWith("bgd_2025");

  const answerKey = params.answerKey || {};
  const studentAnswers = params.studentAnswers || {};
  const details: ScoredQuestionDetail[] = [];

  if (is2025) {
    const explicitSubject =
      st === "2025_math" || st === "bgd_2025_math"
        ? "Toán"
        : st === "2025_science" || st === "bgd_2025_science"
        ? "Vật lí"
        : st === "2025_social" || st === "bgd_2025_social"
        ? "Lịch sử"
        : params.subject;
    const explicitQCount = st === "bgd_2025" ? 54 : params.questionCount;
    const counts = get2025QuestionCounts(explicitSubject, explicitQCount);
    const totalQ = counts.totalQuestions;
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let emptyCount = 0;

    // Part I: ABCD
    for (let q = 1; q <= counts.part1Count; q++) {
      const studentAns = String(studentAnswers[q] ?? "").trim().toUpperCase();
      const correctAns = String(answerKey[q] ?? "").trim().toUpperCase();
      const isEmpty = !studentAns;
      const isCorrect = !isEmpty && Boolean(correctAns) && studentAns === correctAns;

      let qScore = 0;
      if (isEmpty) {
        emptyCount++;
      } else if (isCorrect) {
        qScore = counts.part1Point;
        totalScore += qScore;
        correctCount++;
      } else {
        incorrectCount++;
      }

      details.push({
        questionNumber: q,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect,
        isEmpty,
        score: qScore,
        section: "Part I",
      });
    }

    // Part II: Progressive True/False (4 sub-items -> 0.1 / 0.25 / 0.5 / 1.0)
    const p2ScoreMap: Record<number, number> = { 0: 0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0 };
    const startP2 = counts.part1Count + 1;
    const endP2 = counts.part1Count + counts.part2Count;
    for (let q = startP2; q <= endP2; q++) {
      const studentAns = normalizeTfGroupAnswer(studentAnswers[q]);
      const correctAns = normalizeTfGroupAnswer(answerKey[q]);
      const sParts = studentAns ? studentAns.split("-") : ["", "", "", ""];
      const kParts = correctAns ? correctAns.split("-") : ["", "", "", ""];

      const isEmpty = !sParts.some(Boolean);
      let rightSubs = 0;
      for (let i = 0; i < 4; i++) {
        if (sParts[i] && kParts[i] && sParts[i] === kParts[i]) {
          rightSubs++;
        }
      }

      const qScore = p2ScoreMap[rightSubs] ?? 0;
      const isCorrect = rightSubs === 4 && Boolean(correctAns);
      totalScore += qScore;

      if (isEmpty) {
        emptyCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      details.push({
        questionNumber: q,
        studentAnswer: studentAns,
        correctAnswer: correctAns,
        isCorrect,
        isEmpty,
        score: qScore,
        section: "Part II",
      });
    }

    // Part III: Short Answer (0.5 math, 0.25 science)
    const startP3 = endP2 + 1;
    for (let q = startP3; q <= totalQ; q++) {
      const rawStudent = String(studentAnswers[q] ?? "").trim();
      const rawKey = String(answerKey[q] ?? "").trim();
      const normStudent = normalizeShortAnswer(rawStudent);
      const normKey = normalizeShortAnswer(rawKey);

      const isEmpty = !normStudent;
      const isCorrect = !isEmpty && Boolean(normKey) && normStudent === normKey;

      let qScore = 0;
      if (isEmpty) {
        emptyCount++;
      } else if (isCorrect) {
        qScore = counts.part3Point;
        totalScore += qScore;
        correctCount++;
      } else {
        incorrectCount++;
      }

      details.push({
        questionNumber: q,
        studentAnswer: rawStudent,
        correctAnswer: rawKey,
        isCorrect,
        isEmpty,
        score: qScore,
        section: "Part III",
      });
    }

    return {
      score: Math.min(10, Math.round(totalScore * 100) / 100),
      correctCount,
      incorrectCount,
      emptyCount,
      totalQuestions: totalQ,
      details,
    };
  }

  // Unified MCQ (20, 40, 50 or custom questionCount)
  const totalQuestions =
    params.questionCount ||
    parseInt(st.replace("sheet_", ""), 10) ||
    Object.keys(answerKey).length ||
    20;
  const ptPerQ = totalQuestions > 0 ? 10 / totalQuestions : 0;

  let correctCount = 0;
  let incorrectCount = 0;
  let emptyCount = 0;

  for (let q = 1; q <= totalQuestions; q++) {
    const studentAns = String(studentAnswers[q] ?? "").trim().toUpperCase();
    const correctAns = String(answerKey[q] ?? "").trim().toUpperCase();
    const isEmpty = !studentAns;
    const isCorrect = !isEmpty && Boolean(correctAns) && studentAns === correctAns;

    if (isEmpty) emptyCount++;
    else if (isCorrect) correctCount++;
    else incorrectCount++;

    details.push({
      questionNumber: q,
      studentAnswer: studentAns,
      correctAnswer: correctAns,
      isCorrect,
      isEmpty,
      score: isCorrect ? Math.round(ptPerQ * 1000) / 1000 : 0,
      section: "MCQ",
    });
  }

  const score =
    totalQuestions > 0 ? Math.round(correctCount * ptPerQ * 100) / 100 : 0;

  return {
    score,
    correctCount,
    incorrectCount,
    emptyCount,
    totalQuestions,
    details,
  };
}
