// Continuous Grading Session Store (Fullstack & Offline-first Hybrid)
// Backed by PostgreSQL/Supabase with robust in-memory fallback for local dev & testing

import { createAdminClient } from "@/lib/supabase/admin";

export interface RosterStudent {
  sbd: string;
  name: string;
  studentId?: string;
}

export interface SubmissionAnswer {
  questionNumber: number;
  selected: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface ContinuousSubmission {
  id: string;
  sessionId: string;
  clientSubmissionId: string;
  imageUrl?: string;
  detectedSbd: string;
  detectedName: string;
  matchedStudentId: string | null;
  answers: SubmissionAnswer[];
  score: number;
  correctCount: number;
  confidence: number;
  status: "processing" | "graded" | "needs_review" | "confirmed";
  reviewNotes?: string;
  createdAt: string;
  annotatedImage?: string;
}

export interface ContinuousGradingSession {
  id: string;
  examId?: string;
  teacherId: string;
  sessionToken: string;
  pin: string;
  name: string;
  subject: string;
  grade: string;
  sheetType: "20" | "40" | "50" | "2025";
  questionCount: number;
  answerKey: Record<number, string>;
  status: "active" | "ended";
  deviceCount: number;
  roster: RosterStudent[];
  createdAt: string;
  endedAt?: string;
  expiresAt: number;
}

// In-memory fallback structures
declare global {
  // eslint-disable-next-line no-var
  var __continuousGradingSessions: Map<string, ContinuousGradingSession> | undefined;
  // eslint-disable-next-line no-var
  var __continuousSubmissions: Map<string, ContinuousSubmission[]> | undefined;
  // eslint-disable-next-line no-var
  var __sessionDevices: Map<string, Map<string, number>> | undefined;
}

const sessionsMap: Map<string, ContinuousGradingSession> =
  globalThis.__continuousGradingSessions ||
  (globalThis.__continuousGradingSessions = new Map());

const submissionsMap: Map<string, ContinuousSubmission[]> =
  globalThis.__continuousSubmissions ||
  (globalThis.__continuousSubmissions = new Map());

// Tracks device heartbeats: sessionId -> Map<deviceId, lastSeenTimestamp>
const devicesMap: Map<string, Map<string, number>> =
  globalThis.__sessionDevices ||
  (globalThis.__sessionDevices = new Map());

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let res = "cscan_";
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

function pruneInactiveDevices(sessionId: string): number {
  const deviceSubMap = devicesMap.get(sessionId);
  if (!deviceSubMap) return 0;
  const now = Date.now();
  const timeoutMs = 45 * 1000; // 45 seconds timeout
  for (const [devId, lastSeen] of deviceSubMap.entries()) {
    if (now - lastSeen > timeoutMs) {
      deviceSubMap.delete(devId);
    }
  }
  return deviceSubMap.size;
}

/**
 * 1. Khởi tạo một phiên chấm liên tục mới
 */
export async function createContinuousSession(params: {
  examId?: string;
  teacherId?: string;
  name?: string;
  subject?: string;
  grade?: string;
  sheetType?: "20" | "40" | "50" | "2025";
  questionCount?: number;
  answerKey?: Record<number, string>;
  roster?: RosterStudent[];
}): Promise<ContinuousGradingSession> {
  const sessionId = "csess_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const token = generateToken();
  const pin = generatePin();
  const now = new Date();
  const expiresAt = Date.now() + 12 * 60 * 60 * 1000; // 12 hours expiry

  const session: ContinuousGradingSession = {
    id: sessionId,
    examId: params.examId,
    teacherId: params.teacherId || "teacher_default",
    sessionToken: token,
    pin,
    name: params.name || "Phiên chấm trắc nghiệm liên tục",
    subject: params.subject || "Toán",
    grade: params.grade || "10",
    sheetType: params.sheetType || "20",
    questionCount: params.questionCount || 20,
    answerKey: params.answerKey || {},
    status: "active",
    deviceCount: 0,
    roster: params.roster || [],
    createdAt: now.toISOString(),
    expiresAt,
  };

  // Cache locally
  sessionsMap.set(session.id, session);
  sessionsMap.set(session.sessionToken, session);
  sessionsMap.set(session.pin, session);
  submissionsMap.set(session.id, []);
  devicesMap.set(session.id, new Map());

  // Cloud DB sync (Supabase)
  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("grading_sessions") as any).upsert({
        id: session.id,
        user_id: session.teacherId !== "teacher_default" ? session.teacherId : null,
        teacher_id: session.teacherId !== "teacher_default" ? session.teacherId : null,
        exam_id: session.examId || null,
        session_token: session.sessionToken,
        pin: session.pin,
        name: session.name,
        subject: session.subject,
        grade: session.grade,
        sheet_type: session.sheetType,
        question_count: session.questionCount,
        answer_key: session.answerKey,
        roster: session.roster,
        device_count: 0,
        status: "active",
        expires_at: new Date(expiresAt).toISOString(),
        created_at: session.createdAt,
      });
    } catch (e: any) {
      console.warn("[createContinuousSession] DB sync warning:", e.message);
    }
  }

  return session;
}

/**
 * 2. Lấy thông tin phiên bằng ID, Token hoặc PIN
 */
export async function getContinuousSession(
  tokenOrIdOrPin: string
): Promise<ContinuousGradingSession | null> {
  const clean = tokenOrIdOrPin.trim();

  // Check local cache first
  let session = sessionsMap.get(clean) || null;

  if (!session) {
    // Check DB
    const admin = createAdminClient();
    if (admin) {
      try {
        const { data, error } = await (admin.from("grading_sessions") as any)
          .select("*")
          .or(`id.eq.${clean},session_token.eq.${clean},pin.eq.${clean}`)
          .maybeSingle();

        if (!error && data) {
          session = {
            id: data.id,
            examId: data.exam_id,
            teacherId: data.teacher_id || data.user_id || "teacher_default",
            sessionToken: data.session_token,
            pin: data.pin,
            name: data.name,
            subject: data.subject,
            grade: data.grade,
            sheetType: data.sheet_type || "20",
            questionCount: data.question_count || 20,
            answerKey: data.answer_key || {},
            status: data.status === "ended" ? "ended" : "active",
            deviceCount: data.device_count || 0,
            roster: data.roster || [],
            createdAt: data.created_at,
            endedAt: data.ended_at,
            expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : Date.now() + 12 * 3600 * 1000,
          };
          sessionsMap.set(session.id, session);
          sessionsMap.set(session.sessionToken, session);
          sessionsMap.set(session.pin, session);
        }
      } catch (err: any) {
        console.warn("[getContinuousSession] DB fetch warning:", err.message);
      }
    }
  }

  if (!session) return null;

  // Check expiry or ended status
  if (session.status !== "ended" && Date.now() > session.expiresAt) {
    session.status = "ended";
  }

  // Update dynamic device count
  session.deviceCount = pruneInactiveDevices(session.id);

  return session;
}

/**
 * 3. Kết thúc phiên chấm liên tục
 */
export async function endContinuousSession(sessionIdOrToken: string): Promise<boolean> {
  const session = await getContinuousSession(sessionIdOrToken);
  if (!session) return false;

  session.status = "ended";
  session.endedAt = new Date().toISOString();
  session.deviceCount = 0;

  devicesMap.delete(session.id);

  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("grading_sessions") as any)
        .update({
          status: "ended",
          ended_at: session.endedAt,
          device_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    } catch (e: any) {
      console.warn("[endContinuousSession] DB update warning:", e.message);
    }
  }

  return true;
}

/**
 * 4. Cập nhật danh sách học sinh (Roster)
 */
export async function updateSessionRoster(
  sessionIdOrToken: string,
  roster: RosterStudent[]
): Promise<boolean> {
  const session = await getContinuousSession(sessionIdOrToken);
  if (!session) return false;

  session.roster = roster;

  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("grading_sessions") as any)
        .update({
          roster: roster,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    } catch (e: any) {
      console.warn("[updateSessionRoster] DB warning:", e.message);
    }
  }

  // Tự động kiểm tra lại các bài nộp 'needs_review' nếu khớp roster vừa nhập
  const subs = submissionsMap.get(session.id) || [];
  for (const sub of subs) {
    if (sub.status === "needs_review" && sub.detectedSbd) {
      const matched = roster.find(
        (r) => r.sbd.trim() === sub.detectedSbd.trim()
      );
      if (matched && sub.confidence >= 0.8) {
        sub.matchedStudentId = matched.studentId || matched.sbd;
        sub.detectedName = matched.name;
        sub.status = "graded";
      }
    }
  }

  return true;
}

/**
 * 5. Thiết bị điện thoại kết nối / Ping nhịp tim
 */
export async function recordDeviceHeartbeat(
  sessionIdOrToken: string,
  deviceId: string,
  action: "connect" | "ping" | "disconnect" = "ping"
): Promise<{ connectedDevices: number; sessionActive: boolean }> {
  const session = await getContinuousSession(sessionIdOrToken);
  if (!session) {
    return { connectedDevices: 0, sessionActive: false };
  }

  if (session.status === "ended") {
    return { connectedDevices: 0, sessionActive: false };
  }

  let deviceSubMap = devicesMap.get(session.id);
  if (!deviceSubMap) {
    deviceSubMap = new Map();
    devicesMap.set(session.id, deviceSubMap);
  }

  if (action === "disconnect") {
    deviceSubMap.delete(deviceId);
  } else {
    deviceSubMap.set(deviceId, Date.now());
  }

  const activeCount = pruneInactiveDevices(session.id);
  session.deviceCount = activeCount;

  return { connectedDevices: activeCount, sessionActive: true };
}

/**
 * 6. Lấy danh sách toàn bộ bài nộp trong phiên
 */
export async function getSessionSubmissions(
  sessionIdOrToken: string
): Promise<ContinuousSubmission[]> {
  const session = await getContinuousSession(sessionIdOrToken);
  if (!session) return [];

  // Local cache
  const localList = submissionsMap.get(session.id) || [];

  // Check DB if available
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.from("grading_submissions") as any)
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: ContinuousSubmission[] = data.map((d: any) => ({
          id: d.id,
          sessionId: d.session_id,
          clientSubmissionId: d.client_submission_id || d.id,
          imageUrl: d.image_url,
          detectedSbd: d.detected_sbd || "",
          detectedName: d.detected_name || "",
          matchedStudentId: d.matched_student_id || null,
          answers: d.answers || [],
          score: Number(d.score || 0),
          correctCount: Number(d.correct_count || 0),
          confidence: Number(d.confidence ?? 1),
          status: d.status,
          reviewNotes: d.review_notes,
          createdAt: d.created_at,
          annotatedImage: d.metadata?.annotatedImage,
        }));
        submissionsMap.set(session.id, mapped);
        return mapped;
      }
    } catch (e: any) {
      console.warn("[getSessionSubmissions] DB fetch warning:", e.message);
    }
  }

  return localList;
}

/**
 * 7. Nộp & Chấm bài thi vào phiên liên tục
 * Hỗ trợ Idempotency qua `clientSubmissionId` để chống gửi trùng khi mất mạng nối lại
 */
export async function submitContinuousPaper(params: {
  sessionIdOrToken: string;
  sessionId?: string;
  clientSubmissionId: string;
  imageBase64?: string;
  detectedSbd?: string;
  detectedName?: string;
  answers?: Record<number, string>;
  omrResult?: any;
  confidence?: number;
}): Promise<ContinuousSubmission> {
  const session = await getContinuousSession(params.sessionIdOrToken);
  if (!session) {
    throw new Error("Phiên chấm không tồn tại hoặc đã kết thúc.");
  }

  if (session.status === "ended") {
    throw new Error("Phiên chấm này đã được kết thúc bởi giáo viên.");
  }

  // Idempotency check: if clientSubmissionId already exists, return it immediately
  const existingSubs = submissionsMap.get(session.id) || [];
  const existing = existingSubs.find(
    (s) => s.clientSubmissionId === params.clientSubmissionId
  );
  if (existing) {
    return existing;
  }

  // 1. Phân tích kết quả OMR hoặc trích xuất đáp án
  let studentSbd = (params.detectedSbd || "").trim();
  let studentName = (params.detectedName || "").trim();
  let confidence = params.confidence !== undefined ? params.confidence : 1.0;
  let annotatedImage: string | undefined = undefined;
  const answersList: SubmissionAnswer[] = [];

  const rawAnswers: Record<number, string> = { ...(params.answers || {}) };

  if (params.omrResult) {
    const omr = params.omrResult;
    if (omr.student_code && omr.student_code !== "??????" && !studentSbd) {
      studentSbd = omr.student_code;
    }
    if (omr.annotated_image_base64) {
      annotatedImage = omr.annotated_image_base64;
    }
    if (omr.confidence !== undefined) {
      confidence = Math.min(confidence, omr.confidence);
    }
    // Trích xuất answers từ OMR kết quả
    const resultsObj = omr.results || omr.part1_results || {};
    for (const [qNumStr, val] of Object.entries(resultsObj as Record<string, any>)) {
      const qNum = parseInt(qNumStr, 10);
      if (!isNaN(qNum)) {
        rawAnswers[qNum] = val.selected || "";
      }
    }
  }

  // Chấm điểm đối chiếu với answerKey của phiên
  let correctCount = 0;
  const totalQuestions = session.questionCount || Object.keys(session.answerKey).length || 20;

  for (let q = 1; q <= totalQuestions; q++) {
    const correctVal = (session.answerKey[q] || "A").trim().toUpperCase();
    const studentVal = (rawAnswers[q] || "").trim().toUpperCase();
    const isCorrect = studentVal === correctVal && studentVal.length > 0;
    if (isCorrect) correctCount++;

    answersList.push({
      questionNumber: q,
      selected: studentVal,
      correctAnswer: correctVal,
      isCorrect,
    });
  }

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) / 10 : 0;

  // 2. Nhận diện danh tính & Đối chiếu Roster
  let matchedStudentId: string | null = null;
  let needsReview = false;
  let reviewNotes = "";

  // Check 1: Image blur / low confidence
  if (confidence < 0.8) {
    needsReview = true;
    reviewNotes += "Ảnh mờ hoặc độ tin cậy AI thấp (< 80%). ";
  }

  // Check 2: Trống SBD hoặc SBD không hợp lệ
  if (!studentSbd || studentSbd.includes("?")) {
    needsReview = true;
    reviewNotes += "Không nhận diện rõ SBD. ";
  }

  // Check 3: Đối chiếu với danh sách lớp (Roster) nếu có
  if (session.roster && session.roster.length > 0) {
    const matched = session.roster.find((r) => r.sbd.trim() === studentSbd);
    if (matched) {
      matchedStudentId = matched.studentId || matched.sbd;
      studentName = matched.name;
    } else if (studentSbd) {
      needsReview = true;
      reviewNotes += `SBD ${studentSbd} không khớp danh sách lớp. `;
    }
  }

  // Check 4: Trùng SBD trong cùng phiên
  if (studentSbd && !needsReview) {
    const duplicate = existingSubs.find(
      (s) => s.detectedSbd === studentSbd && s.status !== "confirmed"
    );
    if (duplicate) {
      needsReview = true;
      reviewNotes += `Trùng Số báo danh ${studentSbd} với bài trước. `;
    }
  }

  const status: ContinuousSubmission["status"] = needsReview ? "needs_review" : "graded";

  const newSub: ContinuousSubmission = {
    id: "sub_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    sessionId: session.id,
    clientSubmissionId: params.clientSubmissionId,
    imageUrl: params.imageBase64,
    detectedSbd: studentSbd,
    detectedName: studentName,
    matchedStudentId,
    answers: answersList,
    score,
    correctCount,
    confidence,
    status,
    reviewNotes: reviewNotes.trim() || undefined,
    createdAt: new Date().toISOString(),
    annotatedImage,
  };

  // Add to local array
  existingSubs.unshift(newSub);
  submissionsMap.set(session.id, existingSubs);

  // Sync to Supabase
  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("grading_submissions") as any).insert({
        id: newSub.id,
        session_id: newSub.sessionId,
        client_submission_id: newSub.clientSubmissionId,
        image_url: newSub.imageUrl ? newSub.imageUrl.slice(0, 500) : null,
        detected_sbd: newSub.detectedSbd,
        detected_name: newSub.detectedName,
        matched_student_id: newSub.matchedStudentId,
        answers: newSub.answers,
        score: newSub.score,
        correct_count: newSub.correctCount,
        confidence: newSub.confidence,
        status: newSub.status,
        review_notes: newSub.reviewNotes || null,
        metadata: {
          annotatedImage: newSub.annotatedImage,
        },
        created_at: newSub.createdAt,
      });
    } catch (e: any) {
      console.warn("[submitContinuousPaper] DB insert warning:", e.message);
    }
  }

  return newSub;
}

/**
 * 8. Cập nhật / Xác nhận bài nộp (Click-to-Correct & Enter confirm)
 */
export async function updateSubmission(params: {
  sessionId: string;
  submissionId: string;
  detectedSbd?: string;
  detectedName?: string;
  matchedStudentId?: string;
  answers?: SubmissionAnswer[];
  status?: "processing" | "graded" | "needs_review" | "confirmed";
  reviewNotes?: string;
}): Promise<ContinuousSubmission | null> {
  const subs = submissionsMap.get(params.sessionId) || [];
  const sub = subs.find((s) => s.id === params.submissionId);
  if (!sub) return null;

  if (params.detectedSbd !== undefined) sub.detectedSbd = params.detectedSbd;
  if (params.detectedName !== undefined) sub.detectedName = params.detectedName;
  if (params.matchedStudentId !== undefined) sub.matchedStudentId = params.matchedStudentId;
  if (params.reviewNotes !== undefined) sub.reviewNotes = params.reviewNotes;
  if (params.status !== undefined) sub.status = params.status;

  if (params.answers) {
    sub.answers = params.answers;
    sub.correctCount = params.answers.filter((a) => a.isCorrect).length;
    sub.score =
      params.answers.length > 0
        ? Math.round((sub.correctCount / params.answers.length) * 100) / 10
        : 0;
  }

  // Sync to Supabase
  const admin = createAdminClient();
  if (admin) {
    try {
      await (admin.from("grading_submissions") as any)
        .update({
          detected_sbd: sub.detectedSbd,
          detected_name: sub.detectedName,
          matched_student_id: sub.matchedStudentId,
          answers: sub.answers,
          score: sub.score,
          correct_count: sub.correctCount,
          status: sub.status,
          review_notes: sub.reviewNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);
    } catch (e: any) {
      console.warn("[updateSubmission] DB update warning:", e.message);
    }
  }

  return sub;
}
