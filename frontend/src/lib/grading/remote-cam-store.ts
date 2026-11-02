// PostgreSQL-backed Realtime Session Store for Remote Mobile Camera Scanning
// Replaces in-memory globalThis Maps (RC-07, SEC-08, GRD-07)

import { createAdminClient } from "@/lib/supabase/admin";

export interface RemoteSubmission {
  id: string;
  studentName?: string;
  studentCode?: string;
  imageBase64: string;
  timestamp: number;
}

export interface LatestResult {
  studentName: string;
  studentCode: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  timestamp: number;
}

export interface RemoteSession {
  token: string;
  pin: string;
  sessionId: string;
  userId: string;
  sessionName: string;
  subject: string;
  grade: string;
  questionCount: number;
  answerKey: Record<number, string>;
  sheetType: string;
  connected: boolean;
  connectedAt?: number;
  lastActiveAt: number;
  pendingSubmissions: RemoteSubmission[];
  latestResult?: LatestResult;
}

// In-memory fallback cache for environments without DB connection
declare global {
  // eslint-disable-next-line no-var
  var __remoteCamSessionsFallback: Map<string, RemoteSession> | undefined;
}

const fallbackSessions: Map<string, RemoteSession> =
  globalThis.__remoteCamSessionsFallback ||
  (globalThis.__remoteCamSessionsFallback = new Map());

function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let res = "cam_";
  for (let i = 0; i < 8; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function createRemoteSession(params: {
  sessionId: string;
  userId?: string;
  sessionName?: string;
  subject?: string;
  grade?: string;
  questionCount?: number;
  answerKey?: Record<number, string>;
  sheetType?: string;
}): Promise<RemoteSession> {
  const token = generateToken();
  const pin = generatePin();
  const now = Date.now();

  const newSession: RemoteSession = {
    token,
    pin,
    sessionId: params.sessionId,
    userId: params.userId || "guest_teacher",
    sessionName: params.sessionName || "Kỳ thi trắc nghiệm",
    subject: params.subject || "Toán",
    grade: params.grade || "10",
    questionCount: params.questionCount || 20,
    answerKey: params.answerKey || {},
    sheetType: params.sheetType || "20",
    connected: false,
    lastActiveAt: now,
    pendingSubmissions: [],
  };

  fallbackSessions.set(token, newSession);
  fallbackSessions.set(pin, newSession);

  const admin = createAdminClient();
  if (admin) {
    try {
      const { error } = await (admin.from("remote_cam_sessions") as any).insert({
        teacher_id: params.userId && params.userId !== "guest_teacher" ? params.userId : null,
        session_id: params.sessionId,
        session_code: token,
        pin,
        status: "waiting",
        config: {
          sessionName: newSession.sessionName,
          subject: newSession.subject,
          grade: newSession.grade,
          questionCount: newSession.questionCount,
          answerKey: newSession.answerKey,
          sheetType: newSession.sheetType,
        },
        connected: false,
        pending_submissions: [],
        expires_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
      });
      if (error) {
        console.error("[createRemoteSession] DB Insert error:", error.message);
      }
    } catch (err: any) {
      console.warn("[createRemoteSession] DB error, using fallback:", err.message);
    }
  }

  return newSession;
}

export async function getRemoteSession(tokenOrPin: string): Promise<RemoteSession | null> {
  const clean = tokenOrPin.trim();
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.from("remote_cam_sessions") as any)
        .select("*")
        .or(`session_code.eq.${clean},pin.eq.${clean}`)
        .neq("status", "closed")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const config = (data.config as any) || {};
        const session: RemoteSession = {
          token: data.session_code,
          pin: data.pin,
          sessionId: data.session_id,
          userId: data.teacher_id || "guest_teacher",
          sessionName: config.sessionName || "Kỳ thi trắc nghiệm",
          subject: config.subject || "Toán",
          grade: config.grade || "10",
          questionCount: config.questionCount || 20,
          answerKey: config.answerKey || {},
          sheetType: config.sheetType || "20",
          connected: Boolean(data.connected),
          connectedAt: data.connected_at ? new Date(data.connected_at).getTime() : undefined,
          lastActiveAt: new Date(data.last_active_at).getTime(),
          pendingSubmissions: (data.pending_submissions as RemoteSubmission[]) || [],
          latestResult: data.latest_result as LatestResult | undefined,
        };
        fallbackSessions.set(session.token, session);
        fallbackSessions.set(session.pin, session);
        return session;
      }
    } catch (err: any) {
      console.warn("[getRemoteSession] DB error, using fallback:", err.message);
    }
  }

  return fallbackSessions.get(clean) || null;
}

export async function connectRemoteSession(tokenOrPin: string): Promise<RemoteSession | null> {
  const session = await getRemoteSession(tokenOrPin);
  if (!session) return null;

  const admin = createAdminClient();
  if (admin) {
    try {
      const nowIso = new Date().toISOString();
      await (admin.from("remote_cam_sessions") as any)
        .update({
          connected: true,
          connected_at: nowIso,
          last_active_at: nowIso,
          status: "connected",
          updated_at: nowIso,
        })
        .eq("session_code", session.token);
    } catch (err: any) {
      console.warn("[connectRemoteSession] DB error:", err.message);
    }
  }

  session.connected = true;
  session.connectedAt = Date.now();
  session.lastActiveAt = Date.now();
  return session;
}

export async function submitPhotoToSession(
  token: string,
  submission: Omit<RemoteSubmission, "id" | "timestamp">
): Promise<RemoteSubmission | null> {
  const sub: RemoteSubmission = {
    ...submission,
    id: "sub_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    timestamp: Date.now(),
  };

  let rpcSuccess = false;
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.rpc as any)("submit_remote_cam_photo", {
        p_token: token,
        p_submission: sub,
      });
      if (!error && data) {
        rpcSuccess = true;
      }
    } catch (err: any) {
      console.warn("[submitPhotoToSession] RPC error:", err.message);
    }
  }

  const session = fallbackSessions.get(token);
  if (session) {
    session.pendingSubmissions.push(sub);
    session.lastActiveAt = Date.now();
    return sub;
  }

  return rpcSuccess ? sub : null;
}

export async function consumePendingSubmissions(token: string): Promise<RemoteSubmission[]> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const { data, error } = await (admin.rpc as any)("consume_remote_cam_submissions", {
        p_token: token,
      });
      if (!error && data && Array.isArray(data)) {
        return data as RemoteSubmission[];
      }
    } catch (err: any) {
      console.warn("[consumePendingSubmissions] RPC error, using fallback:", err.message);
    }
  }

  const session = fallbackSessions.get(token);
  if (!session) return [];
  const subs = [...session.pendingSubmissions];
  session.pendingSubmissions = [];
  session.lastActiveAt = Date.now();
  return subs;
}

export async function reportSessionResult(
  token: string,
  result: LatestResult
): Promise<boolean> {
  const admin = createAdminClient();
  if (admin) {
    try {
      const nowIso = new Date().toISOString();
      await (admin.from("remote_cam_sessions") as any)
        .update({
          latest_result: result,
          last_active_at: nowIso,
          updated_at: nowIso,
        })
        .eq("session_code", token);
    } catch (err: any) {
      console.warn("[reportSessionResult] DB error:", err.message);
    }
  }

  const session = fallbackSessions.get(token);
  if (session) {
    session.latestResult = result;
    session.lastActiveAt = Date.now();
  }

  return true;
}
