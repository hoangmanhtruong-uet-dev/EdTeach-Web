// tests/adversarial/m4_challenger_1_empirical_stress.test.mjs
// ==============================================================================
// EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 4 (PR GROUP 3)
// Challenger #1: Critic & Specialist (Empirical Challenger)
//
// Target Areas:
// 1. Playwright Suite Audit & Verification of Worker Claims
// 2. Exam Timer Tampering, Expiration Deadlines & Grace Period Bounds
// 3. Solution Key Masking & Explanation Leakage Prevention (Pre vs Post show_solutions_at)
// 4. Student AI Quota (Max 3/day GMT+7), Teacher Wallet Deduction & Strict Air-Gap
// 5. Concurrency, Row Locks (FOR UPDATE) & Idempotency Replay
// 6. RAM Store to Postgres Migration & PIN Rate-Limiting
// ==============================================================================

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 4");
console.log("Scope: Timer Tampering, Solution Masking, AI Quota, and Postgres Persistence");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
let failedTests = 0;
const testResults = [];

function runTest(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

async function runTestAsync(name, fn) {
  totalTests++;
  const start = performance.now();
  try {
    await fn();
    const duration = (performance.now() - start).toFixed(2);
    passedTests++;
    testResults.push({ name, status: "PASS", duration: `${duration}ms` });
    console.log(`[PASS] ${name} (${duration}ms)`);
  } catch (err) {
    failedTests++;
    const duration = (performance.now() - start).toFixed(2);
    testResults.push({ name, status: "FAIL", error: err.message, duration: `${duration}ms` });
    console.error(`[FAIL] ${name} (${duration}ms)`);
    console.error(`       Error: ${err.message}`);
  }
}

const WORKSPACE_ROOT = path.resolve(".");
const migrationCorePath = path.join(WORKSPACE_ROOT, "supabase/migrations/20261113_student_portal_core.sql");
const migrationRamPath = path.join(WORKSPACE_ROOT, "supabase/migrations/20261114_ram_stores_and_whiteboard_files.sql");

const mCoreSql = fs.readFileSync(migrationCorePath, "utf-8");
const mRamSql = fs.readFileSync(migrationRamPath, "utf-8");

// =============================================================================
// SUITE 1: PLAYWRIGHT SUITE EMPIRICAL REPRODUCTION & WORKER HANDOFF DISCREPANCY
// =============================================================================
console.log("\n--- Suite 1: Playwright Suite Empirical Audit & Worker Claim Discrepancy ---");

runTest("1.1 Worker Handoff Claim Discrepancy Check", () => {
  const workerHandoffPath = path.join(WORKSPACE_ROOT, ".agents/teamwork/worker_m4_gen2/handoff.md");
  assert(fs.existsSync(workerHandoffPath), "worker handoff.md must exist");
  const handoffContent = fs.readFileSync(workerHandoffPath, "utf-8");

  // Worker claimed 30 passed, 0 failed
  const claims30Passed = handoffContent.includes("30 passed") && handoffContent.includes("0 failed");
  assert(claims30Passed, "Worker explicitly claimed 30 passed, 0 failed in handoff report");
});

runTest("1.2 Root Cause Analysis of 6 Playwright Failures: Missing Auth on Student APIs", () => {
  // Check student exams join route
  const joinRoutePath = path.join(WORKSPACE_ROOT, "frontend/src/app/api/student/exams/join/route.ts");
  const joinCode = fs.readFileSync(joinRoutePath, "utf-8");

  // Auth check is placed at the top of the handler BEFORE body/parameter validation
  const userCheckPos = joinCode.indexOf("if (!user)");
  const codeValidationPos = joinCode.indexOf("if (!code)");
  assert(userCheckPos !== -1, "Join route must have if (!user) check");
  assert(codeValidationPos !== -1, "Join route must have if (!code) check");
  assert(userCheckPos < codeValidationPos, "if (!user) check is before if (!code), explaining why opaque-box tests get 401 instead of 400");

  // Check student exams list route
  const examsRoutePath = path.join(WORKSPACE_ROOT, "frontend/src/app/api/student/exams/route.ts");
  const examsCode = fs.readFileSync(examsRoutePath, "utf-8");
  assert(examsCode.includes("if (!user)"), "Exams list route rejects unauthenticated requests with 401");
});

// =============================================================================
// SUITE 2: EXAM TIMER TAMPERING, EXPIRATION DEADLINES & GRACE PERIOD
// =============================================================================
console.log("\n--- Suite 2: Exam Timer Tampering, Expiration Deadlines & Grace Period ---");

// Oracle simulating grade_exam_attempt timer evaluation logic
function simulateGradeExamTimer(attempt, assignment, submissionTime) {
  const expiresAt = new Date(attempt.expires_at).getTime();
  const gracePeriodSeconds = assignment.grace_period_seconds ?? 60;
  const deadlineWithGrace = expiresAt + gracePeriodSeconds * 1000;
  const now = new Date(submissionTime).getTime();

  if (now > deadlineWithGrace) {
    return {
      success: false,
      error: "EXAM_TIMED_OUT",
      message: "Đã quá thời hạn nộp bài quy định.",
      statusUpdatedTo: "timed_out",
    };
  }

  return {
    success: true,
    statusUpdatedTo: "graded",
  };
}

runTest("2.1 Timer Oracle: On-time submission within normal duration passes", () => {
  const attempt = {
    id: "att-1",
    started_at: "2026-11-01T10:00:00Z",
    expires_at: "2026-11-01T10:45:00Z",
  };
  const assignment = { grace_period_seconds: 60 };
  const res = simulateGradeExamTimer(attempt, assignment, "2026-11-01T10:40:00Z");
  assert.equal(res.success, true);
  assert.equal(res.statusUpdatedTo, "graded");
});

runTest("2.2 Timer Oracle: Submission within 60s grace period passes", () => {
  const attempt = {
    id: "att-1",
    started_at: "2026-11-01T10:00:00Z",
    expires_at: "2026-11-01T10:45:00Z",
  };
  const assignment = { grace_period_seconds: 60 };
  // 30 seconds into grace period
  const res = simulateGradeExamTimer(attempt, assignment, "2026-11-01T10:45:30Z");
  assert.equal(res.success, true);
  assert.equal(res.statusUpdatedTo, "graded");
});

runTest("2.3 Timer Oracle: Submission at exactly grace period boundary (10:46:00Z) passes", () => {
  const attempt = {
    id: "att-1",
    started_at: "2026-11-01T10:00:00Z",
    expires_at: "2026-11-01T10:45:00Z",
  };
  const assignment = { grace_period_seconds: 60 };
  const res = simulateGradeExamTimer(attempt, assignment, "2026-11-01T10:46:00Z");
  assert.equal(res.success, true);
});

runTest("2.4 Timer Oracle: Submission 1 second past grace period (10:46:01Z) is REJECTED as EXAM_TIMED_OUT", () => {
  const attempt = {
    id: "att-1",
    started_at: "2026-11-01T10:00:00Z",
    expires_at: "2026-11-01T10:45:00Z",
  };
  const assignment = { grace_period_seconds: 60 };
  const res = simulateGradeExamTimer(attempt, assignment, "2026-11-01T10:46:01Z");
  assert.equal(res.success, false);
  assert.equal(res.error, "EXAM_TIMED_OUT");
  assert.equal(res.statusUpdatedTo, "timed_out");
});

runTest("2.5 SQL Trigger prevent_exam_attempt_tampering prevents score & timer forgery", () => {
  assert(mCoreSql.includes("CREATE OR REPLACE FUNCTION public.prevent_exam_attempt_tampering"), "Anti-tampering function must exist");
  assert(mCoreSql.includes("NEW.score := OLD.score;"), "Must revert unauthorized score modifications");
  assert(mCoreSql.includes("NEW.correct_count := OLD.correct_count;"), "Must revert unauthorized correct_count modifications");
  assert(mCoreSql.includes("NEW.expires_at := OLD.expires_at;"), "Must revert unauthorized expires_at extension");
  assert(mCoreSql.includes("NEW.started_at := OLD.started_at;"), "Must revert unauthorized started_at modification");
  assert(mCoreSql.includes("NEW.status := OLD.status;"), "Must revert unauthorized status jumping to graded");
});

runTest("2.6 Route Analysis: /api/student/exams/[examId]/route.ts PUT misses attempt.expires_at check", () => {
  // Vulnerability audit: Examine student exams PUT autosave handler
  const routeFile = path.join(WORKSPACE_ROOT, "frontend/src/app/api/student/exams/[examId]/route.ts");
  const content = fs.readFileSync(routeFile, "utf-8");

  // In /attempt/route.ts, expires_at is checked:
  const attemptRouteFile = path.join(WORKSPACE_ROOT, "frontend/src/app/api/student/exams/[examId]/attempt/route.ts");
  const attemptContent = fs.readFileSync(attemptRouteFile, "utf-8");
  assert(attemptContent.includes("new Date() > new Date(attempt.expires_at)"), "attempt/route.ts correctly validates expires_at");

  // In [examId]/route.ts (the one actually called by OnlineExamRoomPage line 196):
  const checksExpiryInMainRoute = content.includes("new Date() > new Date(attempt.expires_at)") ||
                                  content.includes("expires_at < new Date()");
  assert.equal(checksExpiryInMainRoute, false, "CRITICAL FINDING: [examId]/route.ts PUT fails to check attempt.expires_at before saving draft");
});

// =============================================================================
// SUITE 3: SOLUTION KEY MASKING & EXPLANATION LEAKAGE PREVENTION
// =============================================================================
console.log("\n--- Suite 3: Solution Key Masking & Explanation Leakage Prevention ---");

// Oracle simulating get_student_exam_questions RPC masking logic
function simulateGetStudentQuestionsRPC(attempt, assignment, questions, currentTime) {
  const now = new Date(currentTime).getTime();
  let canViewSolutions = false;

  if (["submitted", "graded"].includes(attempt.status) &&
      assignment.show_solutions_at &&
      now >= new Date(assignment.show_solutions_at).getTime()) {
    canViewSolutions = true;
  }

  const maskedQuestions = questions.map(q => ({
    id: q.id,
    order_index: q.order_index,
    content: q.content,
    options: q.options,
    difficulty: q.difficulty,
    correct_answer: canViewSolutions ? q.correct_answer : null,
    explanation: canViewSolutions ? q.explanation : null,
  }));

  return {
    success: true,
    can_view_solutions: canViewSolutions,
    questions: maskedQuestions,
  };
}

runTest("3.1 Solution Masking: Questions during active exam (in_progress) NEVER leak answers or explanations", () => {
  const attempt = { id: "att-1", status: "in_progress" };
  const assignment = { show_solutions_at: "2026-11-01T12:00:00Z" };
  const questions = [
    { id: "q1", order_index: 1, content: "Câu 1", options: { A: "1", B: "2" }, correct_answer: "A", explanation: "Vì 1 < 2" },
    { id: "q2", order_index: 2, content: "Câu 2", options: { A: "x", B: "y" }, correct_answer: "B", explanation: "Áp dụng định lý" },
  ];

  const res = simulateGetStudentQuestionsRPC(attempt, assignment, questions, "2026-11-01T10:00:00Z");
  assert.equal(res.can_view_solutions, false);
  for (const q of res.questions) {
    assert.equal(q.correct_answer, null, `Question ${q.id} must have correct_answer = null`);
    assert.equal(q.explanation, null, `Question ${q.id} must have explanation = null`);
  }
});

runTest("3.2 Solution Masking: Graded exam BEFORE show_solutions_at NEVER leaks answers", () => {
  const attempt = { id: "att-1", status: "graded" };
  const assignment = { show_solutions_at: "2026-11-01T12:00:00Z" };
  const questions = [
    { id: "q1", order_index: 1, content: "Câu 1", options: { A: "1", B: "2" }, correct_answer: "A", explanation: "Vì 1 < 2" },
  ];

  // Graded at 10:45, show_solutions_at is 12:00
  const res = simulateGetStudentQuestionsRPC(attempt, assignment, questions, "2026-11-01T10:45:00Z");
  assert.equal(res.can_view_solutions, false);
  assert.equal(res.questions[0].correct_answer, null);
  assert.equal(res.questions[0].explanation, null);
});

runTest("3.3 Solution Masking: Graded exam AFTER show_solutions_at reveals answers & explanations", () => {
  const attempt = { id: "att-1", status: "graded" };
  const assignment = { show_solutions_at: "2026-11-01T12:00:00Z" };
  const questions = [
    { id: "q1", order_index: 1, content: "Câu 1", options: { A: "1", B: "2" }, correct_answer: "A", explanation: "Vì 1 < 2" },
  ];

  // At 12:00:01
  const res = simulateGetStudentQuestionsRPC(attempt, assignment, questions, "2026-11-01T12:00:01Z");
  assert.equal(res.can_view_solutions, true);
  assert.equal(res.questions[0].correct_answer, "A");
  assert.equal(res.questions[0].explanation, "Vì 1 < 2");
});

runTest("3.4 Solution Masking: Unsubmitted exam AFTER show_solutions_at does NOT leak answers", () => {
  // If a student hasn't submitted yet (status is in_progress), even if show_solutions_at passed!
  const attempt = { id: "att-1", status: "in_progress" };
  const assignment = { show_solutions_at: "2026-11-01T12:00:00Z" };
  const questions = [
    { id: "q1", order_index: 1, content: "Câu 1", correct_answer: "A", explanation: "Bí mật" },
  ];

  const res = simulateGetStudentQuestionsRPC(attempt, assignment, questions, "2026-11-01T12:05:00Z");
  assert.equal(res.can_view_solutions, false);
  assert.equal(res.questions[0].correct_answer, null);
  assert.equal(res.questions[0].explanation, null);
});

runTest("3.5 SQL RPC Verification: grade_exam_attempt & get_student_exam_questions enforce masking", () => {
  assert(mCoreSql.includes("'correct_answer', CASE WHEN v_show_solutions THEN v_correct_ans ELSE NULL END"),
    "grade_exam_attempt must mask correct_answer in result details");
  assert(mCoreSql.includes("'explanation', CASE WHEN v_show_solutions THEN v_explanation ELSE NULL END"),
    "grade_exam_attempt must mask explanation in result details");
  assert(mCoreSql.includes("'correct_answer', CASE WHEN v_can_view_solutions THEN q.correct_answer ELSE NULL END"),
    "get_student_exam_questions must mask question correct_answer");
  assert(mCoreSql.includes("'explanation', CASE WHEN v_can_view_solutions THEN q.explanation ELSE NULL END"),
    "get_student_exam_questions must mask question explanation");
});

// =============================================================================
// SUITE 4: TEACHER AI QUOTA DEDUCTION & STUDENT DAILY LIMIT (MAX 3/DAY)
// =============================================================================
console.log("\n--- Suite 4: Teacher AI Quota Deduction & Student Daily Limit (Max 3/Day) ---");

// Oracle simulating reserve_teacher_ai_credits
function simulateReserveTeacherAICredits(studentId, classroom, teacherWallet, todayUsageCount, requestAmount = 50) {
  if (todayUsageCount >= 3) {
    return {
      success: false,
      error: "DAILY_QUOTA_EXCEEDED",
      limit: 3,
      used: todayUsageCount,
      message: "Bạn đã sử dụng hết 3 lượt trợ lý AI hôm nay.",
    };
  }

  const totalAvailable = (teacherWallet.promotional_balance || 0) + (teacherWallet.purchased_balance || 0);
  if (totalAvailable < requestAmount) {
    return {
      success: false,
      error: "TEACHER_INSUFFICIENT_CREDITS",
      message: "Hạn mức trợ lý AI của lớp hiện đã tạm hết.",
    };
  }

  // Deduction priority: promotional_balance first, then purchased_balance
  const deductPromo = Math.min(teacherWallet.promotional_balance || 0, requestAmount);
  const deductPurchased = requestAmount - deductPromo;

  const newPromo = (teacherWallet.promotional_balance || 0) - deductPromo;
  const newPurchased = (teacherWallet.purchased_balance || 0) - deductPurchased;

  return {
    success: true,
    reservation_id: "res-" + Math.random().toString(36).substring(2),
    remaining_daily: 3 - (todayUsageCount + 1),
    deducted_promo: deductPromo,
    deducted_purchased: deductPurchased,
    wallet_after: {
      promotional_balance: newPromo,
      purchased_balance: newPurchased,
      balance: newPromo + newPurchased,
    },
  };
}

runTest("4.1 Student Daily AI Limit: 1st, 2nd, 3rd calls succeed; 4th call is REJECTED", () => {
  const teacherWallet = { promotional_balance: 500, purchased_balance: 500 };
  const classroom = { id: "c1", teacher_id: "t1" };

  // Call 1
  const res1 = simulateReserveTeacherAICredits("s1", classroom, teacherWallet, 0);
  assert.equal(res1.success, true);
  assert.equal(res1.remaining_daily, 2);

  // Call 2
  const res2 = simulateReserveTeacherAICredits("s1", classroom, res1.wallet_after, 1);
  assert.equal(res2.success, true);
  assert.equal(res2.remaining_daily, 1);

  // Call 3
  const res3 = simulateReserveTeacherAICredits("s1", classroom, res2.wallet_after, 2);
  assert.equal(res3.success, true);
  assert.equal(res3.remaining_daily, 0);

  // Call 4: Must fail
  const res4 = simulateReserveTeacherAICredits("s1", classroom, res3.wallet_after, 3);
  assert.equal(res4.success, false);
  assert.equal(res4.error, "DAILY_QUOTA_EXCEEDED");
  assert.equal(res4.limit, 3);
  assert.equal(res4.used, 3);
});

runTest("4.2 Deduction Priority: Promotional balance is consumed before purchased balance", () => {
  // Wallet has 70 promo, 100 purchased. Call requests 50.
  const wallet1 = { promotional_balance: 70, purchased_balance: 100 };
  const res1 = simulateReserveTeacherAICredits("s1", {}, wallet1, 0, 50);
  assert.equal(res1.deducted_promo, 50);
  assert.equal(res1.deducted_purchased, 0);
  assert.equal(res1.wallet_after.promotional_balance, 20);
  assert.equal(res1.wallet_after.purchased_balance, 100);

  // Next call requests 50 credits: only 20 promo left, so 20 promo + 30 purchased
  const res2 = simulateReserveTeacherAICredits("s1", {}, res1.wallet_after, 1, 50);
  assert.equal(res2.deducted_promo, 20);
  assert.equal(res2.deducted_purchased, 30);
  assert.equal(res2.wallet_after.promotional_balance, 0);
  assert.equal(res2.wallet_after.purchased_balance, 70);
});

runTest("4.3 Teacher Wallet Depletion: Returns TEACHER_INSUFFICIENT_CREDITS when balance < 50", () => {
  const emptyWallet = { promotional_balance: 20, purchased_balance: 20 }; // Total 40 < 50
  const res = simulateReserveTeacherAICredits("s1", {}, emptyWallet, 0, 50);
  assert.equal(res.success, false);
  assert.equal(res.error, "TEACHER_INSUFFICIENT_CREDITS");
});

runTest("4.4 Strict Air-Gap: AI Tutor route rejects student with active in_progress exam attempt", () => {
  const tutorRoutePath = path.join(WORKSPACE_ROOT, "frontend/src/app/api/student/remediation/ai-tutor/route.ts");
  const code = fs.readFileSync(tutorRoutePath, "utf-8");

  assert(code.includes('eq("status", "in_progress")'), "Route must check for in_progress exam attempt");
  assert(code.includes("403"), "Route must return 403 Forbidden if student is taking an exam");
  assert(code.includes("Không thể sử dụng Trợ lý AI khi đang trong thời gian làm bài"), "Must provide air-gap warning");
});

runTest("4.5 Timezone Discipline: Daily limit resets strictly using Asia/Ho_Chi_Minh", () => {
  assert(mCoreSql.includes("(CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh')"),
    "SQL migration must calculate usage_date in Asia/Ho_Chi_Minh GMT+7 timezone");
});

// =============================================================================
// SUITE 5: CONCURRENCY, ROW LOCKS & IDEMPOTENCY REPLAY
// =============================================================================
console.log("\n--- Suite 5: Concurrency, Row Locks & Idempotency Replay ---");

runTest("5.1 SQL Row Locking: grade_exam_attempt uses FOR UPDATE on exam_attempts", () => {
  assert(mCoreSql.includes("SELECT * INTO v_attempt\n    FROM public.exam_attempts\n    WHERE id = p_attempt_id\n    FOR UPDATE;") ||
         mCoreSql.includes("FROM public.exam_attempts") && mCoreSql.includes("FOR UPDATE;"),
    "grade_exam_attempt must acquire FOR UPDATE row lock to serialize submissions");
});

runTest("5.2 SQL Row Locking: reserve_teacher_ai_credits uses FOR UPDATE on wallets", () => {
  assert(mCoreSql.includes("FROM public.wallets\n    WHERE user_id = v_classroom.teacher_id\n    FOR UPDATE;") ||
         mCoreSql.includes("FROM public.wallets") && mCoreSql.includes("FOR UPDATE;"),
    "reserve_teacher_ai_credits must acquire FOR UPDATE lock on teacher wallet");
});

runTest("5.3 Idempotency Replay Oracle: Same idempotency key replays cached score", () => {
  const attempt = {
    status: "graded",
    score: 8.5,
    correct_count: 34,
    total_questions: 40,
    idempotency_key: "idem-key-123",
  };

  function simulateGradingIdempotency(attempt, requestedIdempotencyKey) {
    if (["submitted", "graded"].includes(attempt.status)) {
      if (attempt.idempotency_key === requestedIdempotencyKey) {
        return {
          success: true,
          idempotent_replay: true,
          score: attempt.score,
          correct_count: attempt.correct_count,
        };
      } else {
        return {
          success: false,
          error: "ALREADY_SUBMITTED",
          message: "Bài thi đã được nộp trước đó.",
        };
      }
    }
    return { success: true, idempotent_replay: false };
  }

  // Same key -> returns cached score
  const replay = simulateGradingIdempotency(attempt, "idem-key-123");
  assert.equal(replay.success, true);
  assert.equal(replay.idempotent_replay, true);
  assert.equal(replay.score, 8.5);

  // Different key on already graded attempt -> returns ALREADY_SUBMITTED error
  const duplicate = simulateGradingIdempotency(attempt, "idem-key-999");
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.error, "ALREADY_SUBMITTED");
});

// =============================================================================
// SUITE 6: POSTGRES PERSISTENCE & RAM STORE MIGRATION (PR 3.2)
// =============================================================================
console.log("\n--- Suite 6: RAM Store to PostgreSQL Migration & Remote PIN Rate-Limiting ---");

runTest("6.1 Remote PIN Rate-Limiting: Max 5 failed attempts locks out IP", () => {
  assert(mRamSql.includes("check_and_record_remote_pin_attempt"), "RPC check_and_record_remote_pin_attempt must exist");
  assert(mRamSql.includes("v_rec.attempts + 1 >= 5"), "Must lock PIN attempts after 5 consecutive failures");
  assert(mRamSql.includes("interval '10 minutes'"), "Lockout window must be 10 minutes in migration");
  assert(mRamSql.includes("'wait_seconds', 600"), "Must return 600 seconds wait time on lockout");
});

runTest("6.2 Atomic Photo Ingestion & FIFO Queue in PostgreSQL", () => {
  assert(mRamSql.includes("submit_remote_cam_photo"), "submit_remote_cam_photo RPC must exist");
  assert(mRamSql.includes("consume_remote_cam_submissions"), "consume_remote_cam_submissions RPC must exist");
  assert(mRamSql.includes("FOR UPDATE"), "Queue consumer must lock rows for update");
});

runTest("6.3 Whiteboard Files JSONB Persistence", () => {
  assert(mRamSql.includes("ALTER TABLE public.whiteboards"), "Must alter public.whiteboards");
  assert(mRamSql.includes("ADD COLUMN IF NOT EXISTS files JSONB"), "Must add files JSONB column to public.whiteboards");
});

// =============================================================================
// SUMMARY OF TEST RESULTS
// =============================================================================
console.log("\n================================================================================");
console.log(`TOTAL ADVERSARIAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("================================================================================\n");

if (failedTests > 0) {
  process.exit(1);
}
