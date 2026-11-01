import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(url, key);
}

export interface LiveVoteItem {
  studentId: string;
  studentName: string;
  option: string;
  isCorrect?: boolean;
  votedAt: string;
}

export interface LivePollStats {
  totalVotes: number;
  counts: Record<string, number>;
  percentages: Record<string, number>;
}

export interface LivePollSession {
  id: string;
  roomCode: string;
  teacherId: string;
  teacherName?: string;
  examId?: string;
  questionIndex: number;
  questionTitle: string;
  options: string[];
  correctAnswer?: string;
  isOpen: boolean;
  votes: Record<string, LiveVoteItem>;
  stats: LivePollStats;
  createdAt: string;
  closedAt?: string | null;
}

// Global Singleton Store for Realtime Performance (< 100ms response)
declare global {
  // eslint-disable-next-line no-var
  var __livePollSessions: Map<string, LivePollSession> | undefined;
}

const memorySessions: Map<string, LivePollSession> =
  globalThis.__livePollSessions ||
  (globalThis.__livePollSessions = new Map<string, LivePollSession>());

// Helper: Calculate statistics from votes
function calculateStats(
  votes: Record<string, LiveVoteItem>,
  options: string[] = ["A", "B", "C", "D"]
): LivePollStats {
  const counts: Record<string, number> = {};
  const percentages: Record<string, number> = {};

  options.forEach((opt) => {
    counts[opt] = 0;
    percentages[opt] = 0;
  });

  const voteList = Object.values(votes);
  const totalVotes = voteList.length;

  for (const v of voteList) {
    const opt = (v.option || "").toUpperCase();
    if (counts[opt] !== undefined) {
      counts[opt] += 1;
    } else {
      counts[opt] = 1;
    }
  }

  if (totalVotes > 0) {
    options.forEach((opt) => {
      percentages[opt] = Math.round(((counts[opt] || 0) / totalVotes) * 100);
    });
  }

  return { totalVotes, counts, percentages };
}

// Helper: Generate a unique 6-character Room Code (e.g. "GDPT12", "LIVE88")
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create or update a live poll room
export async function createLivePoll(params: {
  teacherId: string;
  examId?: string;
  questionIndex: number;
  questionTitle: string;
  options?: string[];
  correctAnswer?: string;
  teacherName?: string;
  customRoomCode?: string;
}): Promise<LivePollSession> {
  const roomCode = (params.customRoomCode || generateRoomCode()).toUpperCase().trim();
  const options = params.options && params.options.length > 0 ? params.options : ["A", "B", "C", "D"];
  const id = `poll_${roomCode}_${Date.now()}`;

  const session: LivePollSession = {
    id,
    roomCode,
    teacherId: params.teacherId,
    teacherName: params.teacherName || "Thầy Cô EduTest",
    examId: params.examId,
    questionIndex: params.questionIndex,
    questionTitle: params.questionTitle,
    options,
    correctAnswer: params.correctAnswer?.toUpperCase(),
    isOpen: true,
    votes: {},
    stats: calculateStats({}, options),
    createdAt: new Date().toISOString(),
    closedAt: null,
  };

  memorySessions.set(roomCode, session);

  // Sync to Supabase in background
  try {
    const supabase = getServiceSupabase();
    await (supabase.from("live_poll_sessions") as any).upsert({
      room_code: roomCode,
      teacher_id: params.teacherId,
      teacher_name: params.teacherName,
      exam_id: params.examId || null,
      question_index: params.questionIndex,
      question_title: params.questionTitle,
      options: options,
      correct_answer: params.correctAnswer || null,
      is_open: true,
      created_at: session.createdAt,
    });
  } catch (err) {
    console.warn("[LivePollStore] Supabase save note:", err);
  }

  return session;
}

// Get poll session by roomCode
export async function getLivePoll(roomCode: string): Promise<LivePollSession | null> {
  const code = (roomCode || "").toUpperCase().trim();

  // 1. Check memory store
  if (memorySessions.has(code)) {
    return memorySessions.get(code)!;
  }

  // 2. Fallback to Supabase
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("live_poll_sessions")
      .select("*")
      .eq("room_code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const pollData = data as any;
      const session: LivePollSession = {
        id: pollData.id,
        roomCode: pollData.room_code,
        teacherId: pollData.teacher_id,
        teacherName: pollData.teacher_name,
        examId: pollData.exam_id,
        questionIndex: pollData.question_index,
        questionTitle: pollData.question_title,
        options: pollData.options || ["A", "B", "C", "D"],
        correctAnswer: pollData.correct_answer,
        isOpen: pollData.is_open,
        votes: {},
        stats: calculateStats({}, pollData.options || ["A", "B", "C", "D"]),
        createdAt: pollData.created_at,
        closedAt: pollData.closed_at,
      };

      memorySessions.set(code, session);
      return session;
    }
  } catch (err) {
    console.warn("[LivePollStore] Supabase get error:", err);
  }

  return null;
}

// Submit a student's vote
export async function submitLiveVote(params: {
  roomCode: string;
  studentId: string;
  studentName: string;
  option: string;
}): Promise<{ success: boolean; session?: LivePollSession; error?: string }> {
  const code = (params.roomCode || "").toUpperCase().trim();
  const session = await getLivePoll(code);

  if (!session) {
    return { success: false, error: "Không tìm thấy phòng khảo sát với mã này." };
  }

  if (!session.isOpen) {
    return { success: false, error: "Phiên bình chọn cho câu hỏi này đã kết thúc." };
  }

  const opt = (params.option || "").toUpperCase().trim();
  const isCorrect = session.correctAnswer ? opt === session.correctAnswer : undefined;

  session.votes[params.studentId] = {
    studentId: params.studentId,
    studentName: params.studentName || "Học sinh",
    option: opt,
    isCorrect,
    votedAt: new Date().toISOString(),
  };

  session.stats = calculateStats(session.votes, session.options);
  memorySessions.set(code, session);

  // Sync vote to Supabase in background
  try {
    const supabase = getServiceSupabase();
    await (supabase.from("live_poll_votes") as any).upsert({
      poll_id: session.id,
      room_code: code,
      student_id: params.studentId,
      student_name: params.studentName,
      selected_option: opt,
      is_correct: isCorrect ?? null,
    });
  } catch {
    // ignore
  }

  return { success: true, session };
}

// Close the poll (Teacher reveals answer & final stats)
export async function closeLivePoll(
  roomCode: string,
  teacherId?: string
): Promise<{ success: boolean; session?: LivePollSession; error?: string }> {
  const code = (roomCode || "").toUpperCase().trim();
  const session = await getLivePoll(code);

  if (!session) {
    return { success: false, error: "Không tìm thấy phiên bình chọn." };
  }

  session.isOpen = false;
  session.closedAt = new Date().toISOString();
  memorySessions.set(code, session);

  try {
    const supabase = getServiceSupabase();
    await (supabase.from("live_poll_sessions") as any)
      .update({ is_open: false, closed_at: session.closedAt })
      .eq("room_code", code);
  } catch {
    // ignore
  }

  return { success: true, session };
}

// Reset or change question in existing room
export async function updatePollQuestion(params: {
  roomCode: string;
  questionIndex: number;
  questionTitle: string;
  correctAnswer?: string;
  options?: string[];
}): Promise<LivePollSession | null> {
  const code = (params.roomCode || "").toUpperCase().trim();
  const session = await getLivePoll(code);

  if (!session) return null;

  session.questionIndex = params.questionIndex;
  session.questionTitle = params.questionTitle;
  session.correctAnswer = params.correctAnswer?.toUpperCase();
  if (params.options) session.options = params.options;
  session.isOpen = true;
  session.votes = {};
  session.stats = calculateStats({}, session.options);
  session.closedAt = null;

  memorySessions.set(code, session);
  return session;
}
