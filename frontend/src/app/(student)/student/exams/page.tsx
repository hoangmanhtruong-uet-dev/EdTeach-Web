"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Filter,
  Check,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { StudentExamItem } from "@/lib/student/student-store";

export default function StudentExamsPage() {
  const [exams, setExams] = useState<StudentExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Join PIN Modal / Input
  const [pinCode, setPinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Poll State (Sprint 6)
  const [activePoll, setActivePoll] = useState<any | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/exams");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.exams) {
          setExams(data.exams);
        }
      }
    } catch (err) {
      console.error("Failed to fetch student exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim()) return;

    try {
      setJoining(true);
      setJoinMsg(null);
      const upperCode = pinCode.trim().toUpperCase();

      // Check if it's a Live Poll Room Code (Sprint 6)
      try {
        const pollCheck = await fetch(`/api/teach/live-poll/poll?roomCode=${upperCode}`);
        if (pollCheck.ok) {
          const pollData = await pollCheck.json();
          if (pollData.success && pollData.session) {
            setActivePoll(pollData.session);
            setShowPollModal(true);
            setPinCode("");
            setJoining(false);
            return;
          }
        }
      } catch {
        // continue to normal exam join
      }

      const res = await fetch("/api/student/exams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examCode: pinCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setJoinMsg({
          type: "error",
          text: data.error || "Mã bài thi không hợp lệ hoặc đã kết thúc.",
        });
        return;
      }

      setJoinMsg({
        type: "success",
        text: data.message || "Gia nhập phòng thi thành công!",
      });
      setPinCode("");
      await fetchExams();
    } catch (err: any) {
      setJoinMsg({
        type: "error",
        text: err.message || "Lỗi kết nối khi tham gia phòng thi.",
      });
    } finally {
      setJoining(false);
    }
  };

  // Filter logic

  // Poll live status when modal is open
  useEffect(() => {
    if (!showPollModal || !activePoll?.roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teach/live-poll/poll?roomCode=${activePoll.roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.session) {
            setActivePoll(data.session);
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showPollModal, activePoll?.roomCode]);

  const handleSendVote = async (opt: string) => {
    if (!activePoll || voting || voteSubmitted) return;
    try {
      setVoting(true);
      setSelectedVote(opt);

      const res = await fetch("/api/teach/live-poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: activePoll.roomCode,
          option: opt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVoteSubmitted(true);
      }
    } catch (err: any) {
      alert("Lỗi gửi bình chọn: " + err.message);
    } finally {
      setVoting(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    // Tab filter
    if (filterTab === "pending" && exam.status === "completed") return false;
    if (filterTab === "completed" && exam.status !== "completed") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exam.examTitle.toLowerCase().includes(q);
      const matchSubject = exam.subject.toLowerCase().includes(q);
      const matchTeacher = (exam.teacherName || "").toLowerCase().includes(q);
      return matchTitle || matchSubject || matchTeacher;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. HEADER & PIN JOIN BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phòng Thi & Khảo Thí Trực Tuyến</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Phòng Thi & Bài Tập Về Nhà
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Xem toàn bộ danh sách bài khảo sát thầy cô giao, nhập mã PIN để vào phòng thi tức thì hoặc xem lại kết quả chi tiết.
            </p>
          </div>

          {/* Quick PIN Input Box */}
          <div className="w-full lg:w-auto bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0">
            <form onSubmit={handleJoinExam} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nhập Mã PIN / Mã Đề Thi:</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: GDPT12, TOAN01..."
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-mono uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52"
                />
                <button
                  type="submit"
                  disabled={joining || !pinCode.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Vào thi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {joinMsg && (
                <div
                  className={`text-xs font-semibold p-2 rounded-lg flex items-center gap-1.5 ${
                    joinMsg.type === "success"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {joinMsg.type === "success" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{joinMsg.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 self-start">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Tất cả ({exams.length})
          </button>
          <button
            onClick={() => setFilterTab("pending")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "pending"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Chưa làm (
            {exams.filter((e) => e.status !== "completed").length})
          </button>
          <button
            onClick={() => setFilterTab("completed")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterTab === "completed"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Đã hoàn thành (
            {exams.filter((e) => e.status === "completed").length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bài thi, môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 3. EXAMS LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Đang tải danh sách bài thi...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Không tìm thấy bài thi phù hợp
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Nếu thầy cô vừa cung cấp mã bài thi, bạn hãy nhập mã vào ô phía trên để tham gia nhé!
              </p>
            </div>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isDone = exam.status === "completed";

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left info */}
                <div className="space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {exam.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Khối {exam.grade || "12"}
                    </span>
                    {exam.teacherName && (
                      <span className="text-xs text-slate-500">
                        • GV: <strong className="text-slate-700 dark:text-slate-300">{exam.teacherName}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {exam.examTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes || 45} phút làm bài</span>
                    </div>
                    <span>•</span>
                    <div>
                      Giao ngày: {new Date(exam.assignedAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>

                {/* Right action */}
                <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {isDone ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500 font-medium">Kết quả</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {exam.score?.toFixed(1) || "10.0"} / 10
                        </div>
                      </div>

                      {exam.reportToken ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/report/${exam.reportToken}`}
                            target="_blank"
                            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <span>Xem báo cáo</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                          <Link
                            href="/student/practice"
                            className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 text-xs font-bold transition flex items-center gap-1"
                            title="Luyện bù câu sai do AI hướng dẫn"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Luyện bù</span>
                          </Link>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        alert(
                          `Bắt đầu làm bài: "${exam.examTitle}"\nThời gian: ${exam.durationMinutes || 45} phút.\nChúc bạn làm bài thật tốt!`
                        );
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                    >
                      <span>Bắt đầu làm bài</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* 4. STUDENT LIVE POLL VOTING SHEET (SPRINT 6) */}
      {showPollModal && activePoll && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Live Classroom Poll
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Mã: {activePoll.roomCode}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activePoll.teacherName || "Thầy Cô"} đang khảo sát trực tiếp
                  </h3>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPollModal(false);
                  setVoteSubmitted(false);
                  setSelectedVote(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Question Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Câu hỏi số {activePoll.questionIndex || 1}:
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-3">
                {activePoll.questionTitle}
              </div>
            </div>

            {/* 4 Voting Option Buttons */}
            {activePoll.isOpen ? (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Chạm vào phương án em chọn:</span>
                  {voteSubmitted && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Đã gửi lựa chọn {selectedVote}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(activePoll.options || ["A", "B", "C", "D"]).map((opt: string) => {
                    const isPicked = selectedVote === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={voting || voteSubmitted}
                        onClick={() => handleSendVote(opt)}
                        className={`h-16 rounded-2xl border-2 font-black text-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          isPicked
                            ? "border-emerald-600 bg-emerald-500 text-white shadow-lg scale-102"
                            : "border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                        }`}
                      >
                        <span>{opt}</span>
                        {isPicked && <Check className="w-5 h-5 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {voteSubmitted && (
                  <p className="text-xs text-center text-slate-500 animate-pulse pt-2">
                    Đã ghi nhận câu trả lời! Đang đợi Thầy/Cô công bố đáp án và nhận xét...
                  </p>
                )}
              </div>
            ) : (
              /* Poll Closed - Results Revealed */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Thầy Cô Đã Công Bố Đáp Án Chuẩn:
                  </div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    Đáp án: {activePoll.correctAnswer || "Chính xác"}
                  </div>
                  {selectedVote && (
                    <div className="text-xs font-semibold pt-1">
                      {selectedVote === activePoll.correctAnswer ? (
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                          🎉 Chúc mừng em! Em đã chọn đúng phương án {selectedVote}.
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          Em đã chọn {selectedVote}. Hãy lắng nghe Thầy/Cô chữa bài để hiểu rõ bản chất nhé!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Class Distribution Bars */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tỷ lệ bình chọn cả lớp ({activePoll.stats?.totalVotes || 0} lượt):
                  </div>
                  {["A", "B", "C", "D"].map((opt) => {
                    const pct = activePoll.stats?.percentages?.[opt] || 0;
                    const isCorrect = opt === activePoll.correctAnswer;
                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className={isCorrect ? "text-emerald-600 font-black" : ""}>
                            {opt} {isCorrect ? "✓ (Đáp án chuẩn)" : ""}
                          </span>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCorrect ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
