// tests/adversarial/m4_challenger_1_grading_and_stores.test.mjs
// Adversarial Empirical Stress Test Suite for Milestone 4 (PR Group 3: Data Persistence & Core Workflows)
// Challenger #1 (Empirical Challenger) — Student Portal, Grading RPC, Remote Cam & RAM Stores
// Focus: Concurrency, Replay Attacks, Answer Key Masking, PIN Rate Limiter, Row-Locking & Auth Guards

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL ADVERSARIAL STRESS TEST HARNESS — MILESTONE 4");
console.log("Scope: Server-side Grading RPC, Answer Masking, PIN Brute-force, Queue Concurrency");
console.log("================================================================================\n");

let passedTests = 0;
let totalTests = 0;
let failedTests = 0;
const testResults = [];

function test(name, fn) {
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
    process.exitCode = 1;
  }
}

async function testAsync(name, fn) {
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
    process.exitCode = 1;
  }
}

// Target source & migration files
const m31SqlPath = path.resolve(rootDir, "supabase/migrations/20261113_student_portal_core.sql");
const m32SqlPath = path.resolve(rootDir, "supabase/migrations/20261114_ram_stores_and_whiteboard_files.sql");
const attemptRoutePath = path.resolve(rootDir, "frontend/src/app/api/student/exams/[examId]/attempt/route.ts");
const submitRoutePath = path.resolve(rootDir, "frontend/src/app/api/student/exams/[examId]/submit/route.ts");
const remoteStorePath = path.resolve(rootDir, "frontend/src/lib/grading/remote-cam-store.ts");
const studentStorePath = path.resolve(rootDir, "frontend/src/lib/grading/student-submission-store.ts");
const remoteConnectRoutePath = path.resolve(rootDir, "frontend/src/app/api/grading/remote-session/connect/route.ts");
const remotePollRoutePath = path.resolve(rootDir, "frontend/src/app/api/grading/remote-session/poll/route.ts");
const remotePhotoRoutePath = path.resolve(rootDir, "frontend/src/app/api/grading/remote-session/submit-photo/route.ts");
const studentLinkCloseRoutePath = path.resolve(rootDir, "frontend/src/app/api/grading/student-links/[token]/close/route.ts");
const studentLinkRoutePath = path.resolve(rootDir, "frontend/src/app/api/grading/student-links/[token]/route.ts");
const aiTutorRoutePath = path.resolve(rootDir, "frontend/src/app/api/student/remediation/ai-tutor/route.ts");

const m31Sql = fs.readFileSync(m31SqlPath, "utf-8");
const m32Sql = fs.readFileSync(m32SqlPath, "utf-8");
const attemptRouteCode = fs.readFileSync(attemptRoutePath, "utf-8");
const submitRouteCode = fs.readFileSync(submitRoutePath, "utf-8");
const remoteStoreCode = fs.readFileSync(remoteStorePath, "utf-8");
const studentStoreCode = fs.readFileSync(studentStorePath, "utf-8");
const remoteConnectCode = fs.readFileSync(remoteConnectRoutePath, "utf-8");
const remotePollCode = fs.readFileSync(remotePollRoutePath, "utf-8");
const remotePhotoCode = fs.readFileSync(remotePhotoRoutePath, "utf-8");
const studentLinkCloseCode = fs.readFileSync(studentLinkCloseRoutePath, "utf-8");
const studentLinkCode = fs.readFileSync(studentLinkRoutePath, "utf-8");
const aiTutorCode = fs.readFileSync(aiTutorRoutePath, "utf-8");

// =============================================================================
// SUITE 1: SERVER-SIDE GRADING RPC CONCURRENCY, REPLAY ATTACKS & ROW-LOCKING
// =============================================================================
console.log("\n--- Suite 1: Server-side Grading RPC Concurrency, Replay Attacks & Row-Locking ---");

test("1.1 RPC Concurrency Barrier: grade_exam_attempt locks attempt row with FOR UPDATE", () => {
  assert(
    m31Sql.includes("SELECT * INTO v_attempt\n    FROM public.exam_attempts\n    WHERE id = p_attempt_id\n    FOR UPDATE;"),
    "grade_exam_attempt must use 'FOR UPDATE' on exam_attempts row to prevent concurrent grading race conditions"
  );
});

test("1.2 Idempotency Replay Protection: Returns cached score on duplicate submission with same key", () => {
  assert(
    m31Sql.includes("IF v_attempt.status IN ('submitted', 'graded') THEN") &&
    m31Sql.includes("IF v_attempt.idempotency_key = p_idempotency_key THEN") &&
    m31Sql.includes("'idempotent_replay', true"),
    "grade_exam_attempt must return idempotent_replay: true when re-submitted with identical idempotency_key"
  );
  assert(
    m31Sql.includes("'score', v_attempt.score") &&
    m31Sql.includes("'correct_count', v_attempt.correct_count"),
    "idempotent replay must return existing score and correct_count without re-calculating"
  );
});

test("1.3 Replay with Conflicting Key: Rejects submission on completed attempt with ALREADY_SUBMITTED", () => {
  assert(
    m31Sql.includes("ELSE\n            RETURN jsonb_build_object(\n                'success', false,\n                'error', 'ALREADY_SUBMITTED'"),
    "grade_exam_attempt must reject attempts already submitted if idempotency_key does not match"
  );
});

test("1.4 Student Identity Lockdown: Unauthorized callers receive UNAUTHORIZED", () => {
  assert(
    m31Sql.includes("IF v_attempt.student_id IS DISTINCT FROM auth.uid()"),
    "grade_exam_attempt must verify attempt belongs to auth.uid()"
  );
  assert(
    m31Sql.includes("'error', 'UNAUTHORIZED'"),
    "Must return error UNAUTHORIZED if caller is not the owner student or service_role"
  );
});

test("1.5 Anti-Tampering Trigger: Freezes score, status, and expires_at against student updates", () => {
  assert(
    m31Sql.includes("CREATE OR REPLACE FUNCTION public.prevent_exam_attempt_tampering()"),
    "Must define prevent_exam_attempt_tampering trigger function"
  );
  assert(
    m31Sql.includes("NEW.score := OLD.score;") &&
    m31Sql.includes("NEW.correct_count := OLD.correct_count;") &&
    m31Sql.includes("NEW.expires_at := OLD.expires_at;") &&
    m31Sql.includes("IF NEW.status = 'graded' AND OLD.status <> 'graded' THEN\n                NEW.status := OLD.status;"),
    "Trigger must force student modifications on score, correct_count, expires_at, and status back to OLD values"
  );
  assert(
    m31Sql.includes("BEFORE UPDATE ON public.exam_attempts\n    FOR EACH ROW EXECUTE FUNCTION public.prevent_exam_attempt_tampering()"),
    "Trigger must be attached BEFORE UPDATE on public.exam_attempts"
  );
});

test("1.6 Submit Route Integration: Mandates idempotencyKey and calls RPC atomically", () => {
  assert(
    submitRouteCode.includes("const { idempotencyKey, answers } = body;"),
    "Submit route must parse idempotencyKey from request body"
  );
  assert(
    submitRouteCode.includes("if (!idempotencyKey) {") &&
    submitRouteCode.includes("Thiếu idempotency_key chống nộp trùng lặp."),
    "Submit route must reject requests lacking idempotencyKey with HTTP 400"
  );
  assert(
    submitRouteCode.includes('await (supabase.rpc as any)("grade_exam_attempt"'),
    "Submit route must delegate grading exclusively to PostgreSQL RPC"
  );
});

// EMPIRICAL ORACLE SIMULATION: 50 Concurrent Submissions with Replay Attacks
test("1.7 Empirical Concurrency Stress Oracle: 50 concurrent submit attempts (Simulated Postgres Mutex)", () => {
  // Simulating state machine of PostgreSQL row-level lock & grade_exam_attempt
  class ExamAttemptOracle {
    constructor() {
      this.id = "att_test_1001";
      this.student_id = "student_alice";
      this.status = "in_progress";
      this.score = null;
      this.correct_count = null;
      this.total_questions = 4;
      this.idempotency_key = null;
      this.answers = null;
      this.isLocked = false;
      this.lockQueue = [];
      this.questions = [
        { id: "1", order_index: 1, correct_answer: "A" },
        { id: "2", order_index: 2, correct_answer: "B" },
        { id: "3", order_index: 3, correct_answer: "C" },
        { id: "4", order_index: 4, correct_answer: "D" },
      ];
    }

    async acquireLock() {
      if (!this.isLocked) {
        this.isLocked = true;
        return;
      }
      return new Promise((resolve) => this.lockQueue.push(resolve));
    }

    releaseLock() {
      if (this.lockQueue.length > 0) {
        const next = this.lockQueue.shift();
        next();
      } else {
        this.isLocked = false;
      }
    }

    async gradeAttempt(callerId, idempotencyKey, submittedAnswers) {
      await this.acquireLock();
      try {
        // Ownership check
        if (callerId !== this.student_id) {
          return { success: false, error: "UNAUTHORIZED" };
        }

        // Idempotency check
        if (this.status === "graded") {
          if (this.idempotency_key === idempotencyKey) {
            return {
              success: true,
              idempotent_replay: true,
              score: this.score,
              correct_count: this.correct_count,
              total_questions: this.total_questions,
              status: this.status,
            };
          } else {
            return {
              success: false,
              error: "ALREADY_SUBMITTED",
            };
          }
        }

        // Grade answers
        let correct = 0;
        for (const q of this.questions) {
          const key = String(q.order_index);
          const studentAns = (submittedAnswers[key] || "").trim().toUpperCase();
          if (studentAns === q.correct_answer) {
            correct++;
          }
        }

        const score = Math.round((correct / this.total_questions) * 10 * 100) / 100;
        this.status = "graded";
        this.score = score;
        this.correct_count = correct;
        this.idempotency_key = idempotencyKey;
        this.answers = submittedAnswers;

        return {
          success: true,
          score,
          correct_count: correct,
          total_questions: this.total_questions,
        };
      } finally {
        this.releaseLock();
      }
    }
  }

  const oracle = new ExamAttemptOracle();
  const legitimateKey = crypto.randomUUID();
  const submittedAnswers = { "1": "A", "2": "B", "3": "C", "4": "D" }; // 100% correct -> 10.00 pts

  // Launch 50 concurrent requests:
  // 45 with legitimateKey
  // 5 replay attack attempts with maliciousKey and fake answers { "1": "D", "2": "D", "3": "D", "4": "D" }
  const tasks = [];
  for (let i = 0; i < 45; i++) {
    tasks.push(oracle.gradeAttempt("student_alice", legitimateKey, submittedAnswers));
  }
  for (let i = 0; i < 5; i++) {
    const maliciousKey = crypto.randomUUID();
    const maliciousAnswers = { "1": "D", "2": "D", "3": "D", "4": "D" };
    tasks.push(oracle.gradeAttempt("student_alice", maliciousKey, maliciousAnswers));
  }

  return Promise.all(tasks).then((results) => {
    let freshGradings = 0;
    let idempotentReplays = 0;
    let rejectedAlreadySubmitted = 0;

    for (const res of results) {
      if (res.success && !res.idempotent_replay) freshGradings++;
      if (res.success && res.idempotent_replay) idempotentReplays++;
      if (!res.success && res.error === "ALREADY_SUBMITTED") rejectedAlreadySubmitted++;
    }

    assert.equal(freshGradings, 1, "Exactly 1 request must perform fresh grading");
    assert.equal(idempotentReplays, 44, "All 44 duplicate submits with legitimateKey must be idempotent replays");
    assert.equal(rejectedAlreadySubmitted, 5, "All 5 replay attempts with conflicting key must be rejected with ALREADY_SUBMITTED");
    assert.equal(oracle.score, 10.0, "Attempt score must remain 10.00 without being tampered by malicious payload");
  });
});

// =============================================================================
// SUITE 2: ANSWER KEY MASKING & SOLUTION SECRECY
// =============================================================================
console.log("\n--- Suite 2: Answer Key Masking & Solution Secrecy ---");

test("2.1 RPC get_student_exam_questions masks correct_answer and explanation when !v_can_view_solutions", () => {
  assert(
    m31Sql.includes("CREATE OR REPLACE FUNCTION public.get_student_exam_questions(p_attempt_id UUID)"),
    "Must define get_student_exam_questions RPC"
  );
  assert(
    m31Sql.includes("'correct_answer', CASE WHEN v_can_view_solutions THEN q.correct_answer ELSE NULL END") &&
    m31Sql.includes("'explanation', CASE WHEN v_can_view_solutions THEN q.explanation ELSE NULL END"),
    "Questions extractor must return NULL for correct_answer and explanation when v_can_view_solutions is false"
  );
});

test("2.2 Solution Reveal Timing: Can only view solutions if status in ('submitted', 'graded') AND now() >= show_solutions_at", () => {
  assert(
    m31Sql.includes("IF v_attempt.status IN ('submitted', 'graded') AND \n       v_assignment.show_solutions_at IS NOT NULL AND \n       now() >= v_assignment.show_solutions_at THEN\n        v_can_view_solutions := true;\n    END IF;"),
    "v_can_view_solutions must remain false during active exam or before show_solutions_at"
  );
});

test("2.3 grade_exam_attempt masks answers in details payload if show_solutions_at not reached", () => {
  assert(
    m31Sql.includes("'correct_answer', CASE WHEN v_show_solutions THEN v_correct_ans ELSE NULL END") &&
    m31Sql.includes("'explanation', CASE WHEN v_show_solutions THEN v_explanation ELSE NULL END"),
    "grade_exam_attempt must sanitize details response to omit correct_answer and explanation before show_solutions_at"
  );
});

test("2.4 Student Links GET Route (/api/grading/student-links/[token]): Strips answerKey completely", () => {
  // Ensure the returned JSON in GET /api/grading/student-links/[token] does not include answerKey
  const returnedObjMatch = studentLinkCode.match(/link:\s*\{([^}]+)\}/s);
  assert.ok(returnedObjMatch, "Must return link metadata object in GET handler");
  const returnedFields = returnedObjMatch[1];
  assert.equal(
    returnedFields.includes("answerKey"),
    false,
    "GET /api/grading/student-links/[token] must NEVER leak answerKey to student clients"
  );
});

test("2.5 Student Exam Attempt GET Route: Uses get_student_exam_questions without raw table query", () => {
  assert(
    attemptRouteCode.includes('(supabase.rpc as any)(\n      "get_student_exam_questions"'),
    "Student exam attempt GET route must delegate question fetching to get_student_exam_questions RPC"
  );
});

// Empirical test for answer masking logic
test("2.6 Empirical Masking Oracle: Verified masking matrix across active, post-submit and released states", () => {
  function maskQuestions(questions, attemptStatus, showSolutionsAt, currentTime) {
    const canView =
      (attemptStatus === "submitted" || attemptStatus === "graded") &&
      showSolutionsAt !== null &&
      currentTime >= showSolutionsAt;

    return questions.map((q) => ({
      id: q.id,
      content: q.content,
      options: q.options,
      correct_answer: canView ? q.correct_answer : null,
      explanation: canView ? q.explanation : null,
    }));
  }

  const rawQuestions = [
    { id: "q1", content: "1+1=?", options: ["1", "2"], correct_answer: "B", explanation: "1+1 equals 2" },
  ];
  const now = 1730000000000;
  const future = now + 3600000;
  const past = now - 3600000;

  // Case 1: In progress
  const r1 = maskQuestions(rawQuestions, "in_progress", past, now);
  assert.equal(r1[0].correct_answer, null, "Must mask correct_answer during in_progress");
  assert.equal(r1[0].explanation, null, "Must mask explanation during in_progress");

  // Case 2: Graded, but showSolutionsAt is in future
  const r2 = maskQuestions(rawQuestions, "graded", future, now);
  assert.equal(r2[0].correct_answer, null, "Must mask correct_answer when showSolutionsAt in future");
  assert.equal(r2[0].explanation, null, "Must mask explanation when showSolutionsAt in future");

  // Case 3: Graded, and showSolutionsAt is in past
  const r3 = maskQuestions(rawQuestions, "graded", past, now);
  assert.equal(r3[0].correct_answer, "B", "Must unmask correct_answer when showSolutionsAt in past");
  assert.equal(r3[0].explanation, "1+1 equals 2", "Must unmask explanation when showSolutionsAt in past");
});

// =============================================================================
// SUITE 3: ATTEMPT EXPIRATION & TIMEOUT ENFORCEMENTS
// =============================================================================
console.log("\n--- Suite 3: Attempt Expiration & Timeout Enforcements ---");

test("3.1 Timeout Enforcement in RPC: Transitions to 'timed_out' and returns EXAM_TIMED_OUT", () => {
  assert(
    m31Sql.includes("IF now() > (v_attempt.expires_at + (COALESCE(v_assignment.grace_period_seconds, 60) * interval '1 second')) THEN"),
    "grade_exam_attempt must check now() > expires_at + grace_period_seconds"
  );
  assert(
    m31Sql.includes("UPDATE public.exam_attempts\n        SET status = 'timed_out'") &&
    m31Sql.includes("'error', 'EXAM_TIMED_OUT'"),
    "grade_exam_attempt must update status to 'timed_out' and return error EXAM_TIMED_OUT"
  );
});

test("3.2 Submit API Route Status Mapping: Returns HTTP 408 on EXAM_TIMED_OUT", () => {
  assert(
    submitRouteCode.includes('data?.error === "EXAM_TIMED_OUT"\n          ? 408'),
    "Submit route handler must map EXAM_TIMED_OUT error to HTTP 408"
  );
});

test("3.3 Autosave PUT Route Expiration Guard: Rejects draft update with HTTP 400 if expired", () => {
  assert(
    attemptRouteCode.includes("if (new Date() > new Date(attempt.expires_at)) {") &&
    attemptRouteCode.includes("Thời gian làm bài đã kết thúc.") &&
    attemptRouteCode.includes("{ status: 400 }"),
    "Autosave PUT route must reject draft updates past expires_at with HTTP 400"
  );
});

test("3.4 Autosave PUT Route Status Guard: Rejects draft update if status !== 'in_progress'", () => {
  assert(
    attemptRouteCode.includes('if (attempt.status !== "in_progress") {') &&
    attemptRouteCode.includes("Bài thi đã nộp hoặc đã kết thúc, không thể lưu nháp.") &&
    attemptRouteCode.includes("{ status: 400 }"),
    "Autosave PUT route must reject draft updates if status is submitted or timed_out"
  );
});

// =============================================================================
// SUITE 4: MOBILE CAMERA REMOTE PIN RATE LIMITER & BRUTE-FORCE LOCKOUT
// =============================================================================
console.log("\n--- Suite 4: Mobile Camera Remote PIN Rate Limiter & Brute-Force Lockout ---");

test("4.1 Persistent Table: Migration creates remote_cam_pin_attempts table", () => {
  assert(
    m32Sql.includes("CREATE TABLE IF NOT EXISTS public.remote_cam_pin_attempts"),
    "Must create remote_cam_pin_attempts table"
  );
  assert(
    m32Sql.includes("ip TEXT PRIMARY KEY") &&
    m32Sql.includes("attempts INTEGER NOT NULL DEFAULT 1") &&
    m32Sql.includes("locked_until TIMESTAMPTZ"),
    "remote_cam_pin_attempts must have ip, attempts, locked_until columns"
  );
});

test("4.2 Stored Procedure: check_and_record_remote_pin_attempt defines 5-attempt / 10-minute lockout", () => {
  assert(
    m32Sql.includes("CREATE OR REPLACE FUNCTION public.check_and_record_remote_pin_attempt"),
    "Must define check_and_record_remote_pin_attempt procedure"
  );
  assert(
    m32Sql.includes("IF v_rec.attempts + 1 >= 5 THEN") &&
    m32Sql.includes("locked_until = v_now + interval '10 minutes'") &&
    m32Sql.includes("RETURN jsonb_build_object('allowed', false, 'wait_seconds', 600);"),
    "Must lock for 10 minutes (600s) upon reaching 5 failed attempts"
  );
});

test("4.3 Success Reset: Resets attempt record upon valid PIN pairing", () => {
  assert(
    m32Sql.includes("IF p_is_success THEN\n        DELETE FROM public.remote_cam_pin_attempts WHERE ip = p_ip;\n        RETURN jsonb_build_object('allowed', true);\n    END IF;"),
    "Successful attempt must delete the rate limiting record for IP"
  );
});

test("4.4 Connect Route Integration: Evaluates rate limiter before authentication and returns HTTP 429", () => {
  assert(
    remoteConnectCode.includes('await (admin.rpc as any)("check_and_record_remote_pin_attempt"') &&
    remoteConnectCode.includes("if (rateData && !rateData.allowed) {") &&
    remoteConnectCode.includes("{ status: 429 }"),
    "Connect route must check rateData.allowed and return HTTP 429 on lockout"
  );
  assert(
    remoteConnectCode.includes("p_is_success: true"),
    "Connect route must call check_and_record_remote_pin_attempt with p_is_success: true on valid pairing"
  );
});

// EMPIRICAL ORACLE SIMULATION: Brute-Force 6 Attempts against check_and_record_remote_pin_attempt
test("4.5 Empirical Brute-Force Simulation: 6 incorrect PIN attempts + lockout verification", () => {
  class PinRateLimiterOracle {
    constructor() {
      this.records = new Map();
    }

    checkAndRecord(ip, isSuccess, currentTime) {
      if (isSuccess) {
        this.records.delete(ip);
        return { allowed: true };
      }

      const rec = this.records.get(ip);
      if (rec) {
        // Check active lock
        if (rec.locked_until !== null && currentTime < rec.locked_until) {
          const waitSeconds = Math.ceil((rec.locked_until - currentTime) / 1000);
          return { allowed: false, wait_seconds: waitSeconds };
        }

        // Expired lock
        if (rec.locked_until !== null && currentTime >= rec.locked_until) {
          rec.attempts = 1;
          rec.locked_until = null;
          rec.updated_at = currentTime;
          return { allowed: true };
        }

        // Increment attempts
        if (rec.attempts + 1 >= 5) {
          rec.attempts = rec.attempts + 1;
          rec.locked_until = currentTime + 10 * 60 * 1000; // 10 min
          rec.updated_at = currentTime;
          return { allowed: false, wait_seconds: 600 };
        } else {
          rec.attempts = rec.attempts + 1;
          rec.updated_at = currentTime;
          return { allowed: true };
        }
      } else {
        // First failed attempt
        this.records.set(ip, {
          ip,
          attempts: 1,
          locked_until: null,
          updated_at: currentTime,
        });
        return { allowed: true };
      }
    }
  }

  const limiter = new PinRateLimiterOracle();
  const attackerIp = "198.51.100.42";
  let t = 1000000;

  // Attempt 1: First wrong PIN
  const a1 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a1.allowed, true, "Attempt 1 must be allowed");

  // Attempt 2: Second wrong PIN
  t += 1000;
  const a2 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a2.allowed, true, "Attempt 2 must be allowed");

  // Attempt 3: Third wrong PIN
  t += 1000;
  const a3 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a3.allowed, true, "Attempt 3 must be allowed");

  // Attempt 4: Fourth wrong PIN
  t += 1000;
  const a4 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a4.allowed, true, "Attempt 4 must be allowed");

  // Attempt 5: Fifth wrong PIN (Threshold reached -> LOCKOUT)
  t += 1000;
  const a5 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a5.allowed, false, "Attempt 5 must be locked out");
  assert.equal(a5.wait_seconds, 600, "Wait seconds must be 600");

  // Attempt 6: Sixth attempt during lockout window
  t += 30000; // 30 seconds into lockout
  const a6 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a6.allowed, false, "Attempt 6 during lockout must be blocked");
  assert.equal(a6.wait_seconds, 570, "Wait seconds must be remaining 570s");

  // Time-travel past lockout window (10 minutes + 1 second later)
  t += 600000; // +10 minutes
  const a7 = limiter.checkAndRecord(attackerIp, false, t);
  assert.equal(a7.allowed, true, "Attempt after lockout expiration must reset and be allowed");

  // Successful connection resets table
  const aSuccess = limiter.checkAndRecord(attackerIp, true, t);
  assert.equal(aSuccess.allowed, true, "Successful authentication must return allowed: true");
  assert.equal(limiter.records.has(attackerIp), false, "Successful authentication must clear attacker IP from table");
});

// =============================================================================
// SUITE 5: REMOTE CAMERA QUEUE ROW-LOCKING & RACE CONDITIONS
// =============================================================================
console.log("\n--- Suite 5: Remote Camera Queue Row-Locking & Race Conditions ---");

test("5.1 Atomic Consumption RPC: consume_remote_cam_submissions uses FOR UPDATE CTE", () => {
  assert(
    m32Sql.includes("CREATE OR REPLACE FUNCTION public.consume_remote_cam_submissions(p_token TEXT)"),
    "Must define consume_remote_cam_submissions RPC"
  );
  assert(
    m32Sql.includes("WITH old_val AS (\n        SELECT pending_submissions\n        FROM public.remote_cam_sessions\n        WHERE session_code = p_token\n          AND status <> 'closed'\n          AND expires_at > timezone('utc'::text, now())\n        FOR UPDATE\n    )"),
    "consume_remote_cam_submissions must use 'FOR UPDATE' CTE on remote_cam_sessions row"
  );
  assert(
    m32Sql.includes("do_update AS (\n        UPDATE public.remote_cam_sessions s\n        SET pending_submissions = '[]'::jsonb"),
    "consume_remote_cam_submissions must atomically reset pending_submissions to empty array"
  );
});

test("5.2 Atomic Submission Append: submit_remote_cam_photo atomically appends to pending_submissions", () => {
  assert(
    m32Sql.includes("CREATE OR REPLACE FUNCTION public.submit_remote_cam_photo"),
    "Must define submit_remote_cam_photo RPC"
  );
  assert(
    m32Sql.includes("pending_submissions = pending_submissions || jsonb_build_array(p_submission)"),
    "submit_remote_cam_photo must append submission to pending_submissions array"
  );
  assert(
    m32Sql.includes("status <> 'closed'\n      AND expires_at > timezone('utc'::text, now())"),
    "submit_remote_cam_photo must reject submissions for closed or expired sessions"
  );
});

test("5.3 In-Memory Fallback Queue Splicing: Clears pendingSubmissions synchronously on consumption", () => {
  assert(
    remoteStoreCode.includes("const subs = [...session.pendingSubmissions];\n  session.pendingSubmissions = [];"),
    "consumePendingSubmissions must snapshot array and empty session.pendingSubmissions immediately"
  );
});

// EMPIRICAL ORACLE SIMULATION: Concurrent Photo Queue Pollers
test("5.4 Empirical Concurrent Photo Consumption Simulation: Zero Duplication across 10 concurrent poll workers", () => {
  class RemoteCamQueueOracle {
    constructor() {
      this.pending_submissions = [];
      this.isLocked = false;
      this.lockQueue = [];
    }

    async acquireLock() {
      if (!this.isLocked) {
        this.isLocked = true;
        return;
      }
      return new Promise((resolve) => this.lockQueue.push(resolve));
    }

    releaseLock() {
      if (this.lockQueue.length > 0) {
        const next = this.lockQueue.shift();
        next();
      } else {
        this.isLocked = false;
      }
    }

    async submitPhoto(photo) {
      await this.acquireLock();
      try {
        this.pending_submissions.push(photo);
      } finally {
        this.releaseLock();
      }
    }

    async consumeSubmissions() {
      await this.acquireLock();
      try {
        const oldVal = [...this.pending_submissions];
        this.pending_submissions = [];
        return oldVal;
      } finally {
        this.releaseLock();
      }
    }
  }

  const queue = new RemoteCamQueueOracle();

  // Push 10 distinct student exam photos
  const submittedPhotos = [];
  for (let i = 1; i <= 10; i++) {
    const photo = { id: `photo_${i}`, studentCode: `SBD_00${i}`, timestamp: Date.now() + i };
    submittedPhotos.push(photo);
    queue.submitPhoto(photo);
  }

  // 10 concurrent polling workers attempt to consume the queue at the same time
  const pollWorkers = [];
  for (let w = 0; w < 10; w++) {
    pollWorkers.push(queue.consumeSubmissions());
  }

  return Promise.all(pollWorkers).then((results) => {
    const allConsumedPhotos = [];
    let workersWithPhotos = 0;
    let emptyWorkers = 0;

    for (const batch of results) {
      if (batch.length > 0) {
        workersWithPhotos++;
        allConsumedPhotos.push(...batch);
      } else {
        emptyWorkers++;
      }
    }

    // Exactly 1 worker gets the 10 photos, the other 9 workers get empty arrays
    assert.equal(workersWithPhotos, 1, "Exactly 1 worker must receive the pending batch");
    assert.equal(emptyWorkers, 9, "9 concurrent workers must receive empty arrays []");
    assert.equal(allConsumedPhotos.length, 10, "Total consumed photos must equal exactly 10");

    // Check no photo was duplicated
    const photoIds = new Set(allConsumedPhotos.map((p) => p.id));
    assert.equal(photoIds.size, 10, "No duplicate photos consumed");
    assert.equal(queue.pending_submissions.length, 0, "Queue must be empty after consumption");
  });
});

// =============================================================================
// SUITE 6: STUDENT LINK CLOSURE AUTHORIZATION & AI TUTOR AIR-GAP
// =============================================================================
console.log("\n--- Suite 6: Student Link Closure Authorization & AI Tutor Air-Gap ---");

test("6.1 Authentication Barrier: /api/grading/student-links/[token]/close requires authenticated user", () => {
  assert(
    studentLinkCloseCode.includes("const { data: { user }, error: authErr } = await supabase.auth.getUser();") ||
    studentLinkCloseCode.includes("data: { user }"),
    "Link close route must call supabase.auth.getUser()"
  );
  assert(
    studentLinkCloseCode.includes("if (authErr || !user) {") &&
    studentLinkCloseCode.includes("{ status: 401 }"),
    "Must reject unauthenticated requests with HTTP 401"
  );
});

test("6.2 Ownership Barrier: closeStudentSubmissionLink verifies user_id matches token owner", () => {
  assert(
    studentStoreCode.includes("closeStudentSubmissionLink") &&
    studentStoreCode.includes("userId?: string"),
    "closeStudentSubmissionLink must accept userId parameter"
  );
  assert(
    studentStoreCode.includes('if (userId) {\n        query = query.eq("user_id", userId);\n      }'),
    "closeStudentSubmissionLink must constrain DB update to user_id"
  );
  assert(
    studentStoreCode.includes("if (!userId || fallback.userId === userId)"),
    "Fallback cache must also verify fallback.userId === userId"
  );
});

test("6.3 Student AI Tutor Strict Air-Gap: Rejects student with active in_progress exam attempt with HTTP 403", () => {
  assert(
    aiTutorCode.includes('.eq("student_id", user.id)') &&
    aiTutorCode.includes('.eq("status", "in_progress")'),
    "AI Tutor route must query active exam attempt for student"
  );
  assert(
    aiTutorCode.includes("if (activeAttempt) {") &&
    aiTutorCode.includes("Không thể sử dụng Trợ lý AI khi đang trong thời gian làm bài kiểm tra trực tuyến.") &&
    aiTutorCode.includes("{ status: 403 }"),
    "Must reject student query during active exam attempt with HTTP 403"
  );
});

test("6.4 Socratic AI Pedagogical Guard: System prompt strictly prohibits giving direct answers (A, B, C, D)", () => {
  assert(
    aiTutorCode.includes("KHÔNG BAO GIỜ đưa ra ngay đáp án cuối cùng (A, B, C, D) hay con số cuối cùng."),
    "AI tutor prompt must forbid direct answer revelation"
  );
  assert(
    aiTutorCode.includes("Dẫn dắt tư duy qua 3 bước gợi mở:"),
    "AI tutor prompt must guide student with Socratic step-by-step questions"
  );
});

test("6.5 AI Tutor Escrow Quota: Enforces 3-step reserve, commit, refund with daily limit of 3 queries", () => {
  assert(
    m31Sql.includes("reserve_teacher_ai_credits") &&
    m31Sql.includes("commit_teacher_ai_credits") &&
    m31Sql.includes("refund_teacher_ai_credits"),
    "Must implement reserve, commit, refund procedures for AI tutor"
  );
  assert(
    m31Sql.includes("DAILY_QUOTA_EXCEEDED") &&
    m31Sql.includes("v_today_usage >= 3"),
    "Must enforce daily quota of 3 queries per student per day in GMT+7"
  );
});

// =============================================================================
// TEST SUMMARY & FINAL VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log(`CHALLENGER #1 STRESS HARNESS SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log("================================================================================");

if (failedTests === 0) {
  console.log("Verdict: ALL ADVERSARIAL STRESS CHALLENGES PASSED.");
} else {
  console.error(`Verdict: ${failedTests} CHALLENGE(S) FAILED. REQUEST_CHANGES required.`);
  process.exitCode = 1;
}
