// ==============================================================================
// EMPIRICAL UNIT & ADVERSARIAL TEST SUITE: MILESTONE 4 (PR GROUP 3)
// Scope: Anti-SSRF, Student Portal, RAM to Postgres, Marketplace, Autosave
// ==============================================================================

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
} from "../../frontend/src/lib/security/anti-ssrf.ts";

const WORKSPACE_ROOT = path.resolve(".");

test("1. Anti-SSRF Guard — IPv4 Validation Matrix", () => {
  // Loopback (127.0.0.0/8)
  assert.equal(isPrivateOrReservedIPv4("127.0.0.1"), true, "Must block 127.0.0.1");
  assert.equal(isPrivateOrReservedIPv4("127.255.255.254"), true, "Must block 127.255.255.254");

  // Private RFC 1918 (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
  assert.equal(isPrivateOrReservedIPv4("10.0.0.1"), true, "Must block 10.0.0.1");
  assert.equal(isPrivateOrReservedIPv4("10.254.1.99"), true, "Must block 10.254.1.99");
  assert.equal(isPrivateOrReservedIPv4("172.16.0.1"), true, "Must block 172.16.0.1");
  assert.equal(isPrivateOrReservedIPv4("172.31.255.255"), true, "Must block 172.31.255.255");
  assert.equal(isPrivateOrReservedIPv4("192.168.1.1"), true, "Must block 192.168.1.1");
  assert.equal(isPrivateOrReservedIPv4("192.168.0.254"), true, "Must block 192.168.0.254");

  // Cloud Metadata & Link-Local (169.254.0.0/16)
  assert.equal(isPrivateOrReservedIPv4("169.254.169.254"), true, "Must block AWS/GCP metadata IP");
  assert.equal(isPrivateOrReservedIPv4("169.254.1.1"), true, "Must block Link-Local 169.254.1.1");

  // Carrier Grade NAT RFC 6598 (100.64.0.0/10)
  assert.equal(isPrivateOrReservedIPv4("100.64.0.1"), true, "Must block CGNAT 100.64.0.1");
  assert.equal(isPrivateOrReservedIPv4("100.127.255.255"), true, "Must block CGNAT 100.127.255.255");

  // Current network (0.0.0.0/8) & Multicast/Reserved (224.0.0.0/4, 240.0.0.0/4)
  assert.equal(isPrivateOrReservedIPv4("0.0.0.0"), true, "Must block 0.0.0.0");
  assert.equal(isPrivateOrReservedIPv4("224.0.0.1"), true, "Must block multicast 224.0.0.1");
  assert.equal(isPrivateOrReservedIPv4("240.0.0.1"), true, "Must block reserved 240.0.0.1");

  // Public IP Addresses (Must NOT be blocked)
  assert.equal(isPrivateOrReservedIPv4("8.8.8.8"), false, "Must permit Google DNS 8.8.8.8");
  assert.equal(isPrivateOrReservedIPv4("1.1.1.1"), false, "Must permit Cloudflare DNS 1.1.1.1");
  assert.equal(isPrivateOrReservedIPv4("142.250.190.46"), false, "Must permit public Google IP");
});

test("2. Anti-SSRF Guard — IPv6 Validation Matrix", () => {
  // Loopback (::1) & Unspecified (::)
  assert.equal(isPrivateOrReservedIPv6("::1"), true, "Must block IPv6 loopback ::1");
  assert.equal(isPrivateOrReservedIPv6("::"), true, "Must block unspecified IPv6 ::");

  // IPv4-mapped IPv6
  assert.equal(isPrivateOrReservedIPv6("::ffff:127.0.0.1"), true, "Must block mapped loopback ::ffff:127.0.0.1");
  assert.equal(isPrivateOrReservedIPv6("::ffff:169.254.169.254"), true, "Must block mapped metadata");
  assert.equal(isPrivateOrReservedIPv6("::ffff:192.168.1.1"), true, "Must block mapped private IP");

  // Unique Local Addresses RFC 4193 (fc00::/7 -> fc00 to fdff)
  assert.equal(isPrivateOrReservedIPv6("fc00::1"), true, "Must block ULA fc00::1");
  assert.equal(isPrivateOrReservedIPv6("fd12:3456:789a::1"), true, "Must block ULA fd12::1");

  // Link-Local RFC 4291 (fe80::/10)
  assert.equal(isPrivateOrReservedIPv6("fe80::1"), true, "Must block link-local fe80::1");

  // Multicast (ff00::/8)
  assert.equal(isPrivateOrReservedIPv6("ff02::1"), true, "Must block multicast ff02::1");

  // Public IPv6 (Must NOT be blocked)
  assert.equal(isPrivateOrReservedIPv6("2606:4700:4700::1111"), false, "Must permit public Cloudflare IPv6");
});

test("3. Student Portal Core Migration SQL — Schema & RPC Verification", () => {
  const sqlPath = path.join(WORKSPACE_ROOT, "supabase", "migrations", "20261113_student_portal_core.sql");
  assert.ok(fs.existsSync(sqlPath), "Migration 20261113_student_portal_core.sql must exist");

  const sql = fs.readFileSync(sqlPath, "utf-8");

  // STU-11 Deduplication & Unique constraint
  assert.ok(sql.includes("uq_student_exam_enrollment UNIQUE (student_id, exam_id)"), "Must have unique constraint for student_exam_enrollments");

  // B2B2C Classrooms & Assignments tables
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.classrooms"), "Must create classrooms table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.classroom_members"), "Must create classroom_members table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.assignments"), "Must create assignments table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.exam_attempts"), "Must create exam_attempts table");

  // Server-side grading RPC & solution masking (RC-04, STU-06)
  assert.ok(sql.includes("grade_exam_attempt"), "Must define grade_exam_attempt RPC");
  assert.ok(sql.includes("get_student_exam_questions"), "Must define get_student_exam_questions RPC");
  assert.ok(sql.includes("prevent_exam_attempt_tampering"), "Must have anti-tampering trigger for attempts");

  // Student AI Tutor quota & 3-phase deduction (RC-08, STU-08)
  assert.ok(sql.includes("reserve_teacher_ai_credits"), "Must define reserve_teacher_ai_credits RPC");
  assert.ok(sql.includes("commit_teacher_ai_credits"), "Must define commit_teacher_ai_credits RPC");
  assert.ok(sql.includes("refund_teacher_ai_credits"), "Must define refund_teacher_ai_credits RPC");
});

test("4. RAM Stores to PostgreSQL Migration SQL — Schema & RPC Verification", () => {
  const sqlPath = path.join(WORKSPACE_ROOT, "supabase", "migrations", "20261114_ram_stores_and_whiteboard_files.sql");
  assert.ok(fs.existsSync(sqlPath), "Migration 20261114_ram_stores_and_whiteboard_files.sql must exist");

  const sql = fs.readFileSync(sqlPath, "utf-8");

  // RAM Stores migration tables (RC-07, STU-07)
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.student_submission_links"), "Must create student_submission_links table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.student_submissions"), "Must create student_submissions table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.remote_cam_sessions"), "Must create remote_cam_sessions table");
  assert.ok(sql.includes("CREATE TABLE IF NOT EXISTS public.remote_cam_pin_attempts"), "Must create remote_cam_pin_attempts table");

  // Atomic queue procedures (GRD-07)
  assert.ok(sql.includes("submit_remote_cam_photo"), "Must define submit_remote_cam_photo RPC");
  assert.ok(sql.includes("consume_remote_cam_submissions"), "Must define consume_remote_cam_submissions RPC");
  assert.ok(sql.includes("check_and_record_remote_pin_attempt"), "Must define check_and_record_remote_pin_attempt RPC");

  // Whiteboard files JSONB column (WBD-02, WBD-05)
  assert.ok(sql.includes("ALTER TABLE public.whiteboards"), "Must alter whiteboards table");
  assert.ok(sql.includes("files JSONB"), "Must add files JSONB column to whiteboards");
});

test("5. Student APIs Authentication Enforcement — No Demo Student ID Leakage", () => {
  const studentApiFiles = [
    "frontend/src/app/api/student/dashboard/route.ts",
    "frontend/src/app/api/student/exams/route.ts",
    "frontend/src/app/api/student/exams/join/route.ts",
    "frontend/src/app/api/student/progress/route.ts",
    "frontend/src/app/api/student/practice/route.ts",
    "frontend/src/app/api/student/claim/route.ts",
    "frontend/src/app/api/student/ai-tutor/route.ts",
  ];

  for (const relPath of studentApiFiles) {
    const fullPath = path.join(WORKSPACE_ROOT, relPath);
    assert.ok(fs.existsSync(fullPath), `File ${relPath} must exist`);
    const content = fs.readFileSync(fullPath, "utf-8");
    assert.ok(
      !content.includes('"demo-student-id"'),
      `File ${relPath} must not contain hardcoded demo-student-id fallback`
    );
    assert.ok(
      content.includes("401"),
      `File ${relPath} must return 401 Unauthorized for unauthenticated requests`
    );
  }
});

test("6. Student Exam Room Navigation & Join Code Integrity", () => {
  // Exam list button links to real room page
  const examPage = fs.readFileSync(
    path.join(WORKSPACE_ROOT, "frontend/src/app/(student)/student/exams/page.tsx"),
    "utf-8"
  );
  assert.ok(
    examPage.includes("/student/exams/${exam.examId || exam.id}"),
    "Student exams page must link to real exam room page"
  );
  assert.ok(
    !examPage.includes('Bắt đầu làm bài: "'),
    "Student exams page must not use alert() backdoor for starting exam"
  );

  // Student store join code rejects fake substring matches
  const studentStore = fs.readFileSync(
    path.join(WORKSPACE_ROOT, "frontend/src/lib/student/student-store.ts"),
    "utf-8"
  );
  assert.ok(
    !studentStore.includes('cleanCode.includes("LY")'),
    "student-store.ts must not fabricate exams based on cleanCode.includes('LY')"
  );
});

test("7. IndexedDB & Autosave Infrastructure Verification", () => {
  const indexedDbPath = path.join(WORKSPACE_ROOT, "frontend/src/lib/storage/indexed-db.ts");
  const useAutosavePath = path.join(WORKSPACE_ROOT, "frontend/src/hooks/use-autosave.ts");

  assert.ok(fs.existsSync(indexedDbPath), "indexed-db.ts must exist");
  assert.ok(fs.existsSync(useAutosavePath), "use-autosave.ts must exist");

  const indexedDbContent = fs.readFileSync(indexedDbPath, "utf-8");
  assert.ok(indexedDbContent.includes("saveToOfflineStore"), "indexed-db.ts must export saveToOfflineStore");
  assert.ok(indexedDbContent.includes("getFromOfflineStore"), "indexed-db.ts must export getFromOfflineStore");
  assert.ok(indexedDbContent.includes("clearOfflineStore"), "indexed-db.ts must export clearOfflineStore");

  const useAutosaveContent = fs.readFileSync(useAutosavePath, "utf-8");
  assert.ok(useAutosaveContent.includes("useAutosave"), "use-autosave.ts must export useAutosave");
  assert.ok(useAutosaveContent.includes("saveNow"), "use-autosave.ts must provide saveNow manual flush");
});
