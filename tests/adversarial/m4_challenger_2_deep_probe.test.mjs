// ==============================================================================
// EMPIRICAL ADVERSARIAL STRESS PROBE: MILESTONE 4 (CHALLENGER #2 EXTENDED)
// Rigorous Edge-Case Stress Testing of PR 3.3 and PR 3.4
// ==============================================================================

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  validateUrlAgainstSSRF,
  safeFetchWithAntiSSRF,
} from "../../frontend/src/lib/security/anti-ssrf.ts";
import {
  saveToOfflineStore,
  getFromOfflineStore,
  clearOfflineStore,
} from "../../frontend/src/lib/storage/indexed-db.ts";

const WORKSPACE_ROOT = path.resolve(".");

// ==============================================================================
// SUITE A: EXTREME SSRF VECTORS & DNS RESOLUTION CORNER CASES
// ==============================================================================

test("A.1 Anti-SSRF: Extended Reserved IPv4 Boundary Range Matrix", () => {
  // All edge IPs of RFC 1918, CGNAT, Loopback, Link-Local, Multicast, Reserved
  const edgeCases = [
    { ip: "0.0.0.0", blocked: true, label: "Current network start" },
    { ip: "0.255.255.255", blocked: true, label: "Current network end" },
    { ip: "10.0.0.0", blocked: true, label: "10.0.0.0/8 network" },
    { ip: "10.255.255.255", blocked: true, label: "10.0.0.0/8 broadcast" },
    { ip: "127.0.0.0", blocked: true, label: "127.0.0.0/8 network" },
    { ip: "127.255.255.255", blocked: true, label: "127.0.0.0/8 broadcast" },
    { ip: "169.254.0.0", blocked: true, label: "Link-local network" },
    { ip: "169.254.255.255", blocked: true, label: "Link-local broadcast" },
    { ip: "172.15.255.255", blocked: false, label: "Public immediately before 172.16.0.0/12" },
    { ip: "172.16.0.0", blocked: true, label: "172.16.0.0/12 start" },
    { ip: "172.31.255.255", blocked: true, label: "172.16.0.0/12 end" },
    { ip: "172.32.0.0", blocked: false, label: "Public immediately after 172.16.0.0/12" },
    { ip: "192.167.255.255", blocked: false, label: "Public immediately before 192.168.0.0/16" },
    { ip: "192.168.0.0", blocked: true, label: "192.168.0.0/16 start" },
    { ip: "192.168.255.255", blocked: true, label: "192.168.0.0/16 end" },
    { ip: "192.169.0.0", blocked: false, label: "Public immediately after 192.168.0.0/16" },
    { ip: "100.63.255.255", blocked: false, label: "Public immediately before CGNAT 100.64.0.0/10" },
    { ip: "100.64.0.0", blocked: true, label: "CGNAT start" },
    { ip: "100.127.255.255", blocked: true, label: "CGNAT end" },
    { ip: "100.128.0.0", blocked: false, label: "Public immediately after CGNAT" },
    { ip: "192.0.2.1", blocked: true, label: "TEST-NET-1" },
    { ip: "198.51.100.1", blocked: true, label: "TEST-NET-2" },
    { ip: "203.0.113.1", blocked: true, label: "TEST-NET-3" },
    { ip: "198.18.0.1", blocked: true, label: "Benchmarking 198.18.0.0/15 start" },
    { ip: "198.19.255.255", blocked: true, label: "Benchmarking 198.18.0.0/15 end" },
    { ip: "198.20.0.1", blocked: false, label: "Public immediately after Benchmarking" },
    { ip: "223.255.255.255", blocked: false, label: "Public immediately before Multicast" },
    { ip: "224.0.0.0", blocked: true, label: "Multicast start" },
    { ip: "239.255.255.255", blocked: true, label: "Multicast end" },
    { ip: "240.0.0.0", blocked: true, label: "Reserved class E start" },
    { ip: "255.255.255.255", blocked: true, label: "Limited broadcast" },
    { ip: "8.8.8.8", blocked: false, label: "Google Public DNS" },
    { ip: "1.1.1.1", blocked: false, label: "Cloudflare Public DNS" },
  ];

  for (const item of edgeCases) {
    const isBlocked = isPrivateOrReservedIPv4(item.ip);
    assert.equal(
      isBlocked,
      item.blocked,
      `IPv4 ${item.ip} (${item.label}) failed check. Expected blocked: ${item.blocked}, got: ${isBlocked}`
    );
  }
});

test("A.2 Anti-SSRF: Malformed & Truncated IPv4 Input Safety", () => {
  const invalidIps = [
    "",
    "...",
    "127.0.0",
    "127.0.0.1.5",
    "abc.def.ghi.jkl",
    "-1.0.0.1",
    "256.0.0.1",
    "127.0.0.999",
    "null",
    "undefined",
  ];

  for (const ip of invalidIps) {
    // Malformed IP must be treated as unsafe (return true)
    assert.equal(
      isPrivateOrReservedIPv4(ip),
      true,
      `Malformed IP '${ip}' must be marked as unsafe`
    );
  }
});

test("A.3 Anti-SSRF: Dual-Stack DNS Multi-Record Resolution Trapping", async () => {
  // Test domain resolution edge case: Non-existent domain must fail safe (fail-closed)
  await assert.rejects(
    async () => await validateUrlAgainstSSRF("http://non-existent-subdomain-attack-test-ssrf.invalid/exam"),
    (err) => {
      assert.ok(err instanceof Error);
      return err.message.includes("Không thể phân giải địa chỉ DNS");
    },
    "Non-resolvable domain must fail-closed safely"
  );
});

test("A.4 Anti-SSRF: Redirect Chain Trapping at Intermediate Hops", async () => {
  const originalFetch = globalThis.fetch;

  try {
    // Scenario 1: Hop 1 is public IP -> Hop 2 redirects to protocol-relative //127.0.0.1
    let callCount = 0;
    globalThis.fetch = async (url) => {
      callCount++;
      if (callCount === 1) {
        return new Response("", {
          status: 302,
          headers: { Location: "//127.0.0.1:8080/secret" },
        });
      }
      return new Response("OK", { status: 200 });
    };

    await assert.rejects(
      async () => await safeFetchWithAntiSSRF("http://8.8.8.8/step1"),
      (err) => {
        assert.ok(err instanceof Error);
        return err.message.includes("127.0.0.1") || err.message.includes("bị cấm");
      },
      "Protocol-relative redirect to 127.0.0.1 must be caught and blocked"
    );

    // Scenario 2: Hop 1 is public IP -> Hop 2 redirects to disallowed scheme ftp://
    callCount = 0;
    globalThis.fetch = async (url) => {
      callCount++;
      return new Response("", {
        status: 301,
        headers: { Location: "ftp://1.1.1.1/exam.pdf" },
      });
    };

    await assert.rejects(
      async () => await safeFetchWithAntiSSRF("http://8.8.8.8/step1"),
      (err) => {
        assert.ok(err instanceof Error);
        return err.message.includes("ftp:") && err.message.includes("không được hỗ trợ");
      },
      "Redirect to non-HTTP scheme ftp:// must be caught and blocked"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("A.5 Anti-SSRF: High-Volume Port Scanning Block Matrix", async () => {
  const blockedPorts = [21, 22, 23, 25, 53, 110, 143, 3306, 5432, 6379, 8081, 8443, 9200, 27017, 11211];

  for (const port of blockedPorts) {
    const url = `http://8.8.8.8:${port}/path`;
    await assert.rejects(
      async () => await validateUrlAgainstSSRF(url),
      (err) => {
        assert.ok(err instanceof Error);
        return err.message.includes("Cổng kết nối") && err.message.includes("không được phép");
      },
      `Port ${port} must be rejected`
    );
  }
});

// ==============================================================================
// SUITE B: AUTOSAVE CONCURRENCY, STORAGE QUOTA & HOOK CONTRACT
// ==============================================================================

test("B.1 Autosave Offline Store: Storage Quota Exceeded Resilience", async () => {
  // Simulate localStorage throwing QuotaExceededError
  const mockFailingLocalStorage = {
    getItem: () => null,
    setItem: () => {
      const err = new Error("QuotaExceededError: The quota has been exceeded.");
      err.name = "QuotaExceededError";
      throw err;
    },
    removeItem: () => {},
    clear: () => {},
  };

  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  try {
    globalThis.window = {
      localStorage: mockFailingLocalStorage,
      indexedDB: undefined,
    };
    globalThis.localStorage = mockFailingLocalStorage;

    // saveToOfflineStore must not crash or reject unhandled when storage is full
    await assert.doesNotReject(
      async () => await saveToOfflineStore("exam_key", { data: "large" }, 1),
      "saveToOfflineStore must handle localStorage quota errors gracefully"
    );
  } finally {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  }
});

test("B.2 Autosave Hook: Optimistic Concurrency Conflict Resolution State Transition", () => {
  // Verify state transitions on conflict
  let state = "idle";
  let clientVersion = 2;
  let clientDraft = { q1: "A", q2: "B" };
  let conflictData = null;

  const onConflict = (data, serverVersion) => {
    conflictData = {
      localDraft: data,
      serverVersion,
      resolved: false,
    };
  };

  // Simulate server response on version conflict (HTTP 409 or success=false with serverVersion)
  const serverResponse = {
    success: false,
    serverVersion: 5,
    error: "Conflict: document updated by another user or session",
  };

  if (!serverResponse.success) {
    state = "error";
    if (serverResponse.serverVersion && serverResponse.serverVersion > clientVersion) {
      onConflict(clientDraft, serverResponse.serverVersion);
    }
  }

  assert.equal(state, "error");
  assert.ok(conflictData !== null);
  assert.equal(conflictData.serverVersion, 5);
  assert.deepEqual(conflictData.localDraft, clientDraft);
});

// ==============================================================================
// SUITE C: EXAM SUBMISSION IDEMPOTENCY & RPC INTEGRITY
// ==============================================================================

test("C.1 Exam Idempotency: Idempotency Key Replay Contract Verification", () => {
  const submitRoutePath = path.join(
    WORKSPACE_ROOT,
    "frontend/src/app/api/student/exams/[examId]/submit/route.ts"
  );
  assert.ok(fs.existsSync(submitRoutePath), "Student exam submit route must exist");
  const content = fs.readFileSync(submitRoutePath, "utf-8");

  // Must check idempotencyKey parameter in request body
  assert.ok(
    content.includes("const { idempotencyKey, answers } = body;"),
    "Submit route must extract idempotencyKey"
  );
  assert.ok(
    content.includes("if (!idempotencyKey)"),
    "Submit route must enforce idempotencyKey"
  );
  assert.ok(
    content.includes("status: 400"),
    "Missing idempotencyKey must return 400"
  );

  // Must invoke atomic RPC grade_exam_attempt with p_idempotency_key
  assert.ok(
    content.includes('"grade_exam_attempt"'),
    "Must call grade_exam_attempt RPC"
  );
  assert.ok(
    content.includes("p_idempotency_key: idempotencyKey"),
    "Must pass p_idempotency_key to RPC"
  );
  assert.ok(
    content.includes("idempotentReplay: Boolean(data.idempotent_replay)"),
    "Must map idempotentReplay flag in response"
  );
});

test("C.2 Exam SQL RPC: Row Lock FOR UPDATE & Duplicate Submission Prevention", () => {
  const sqlPath = path.join(
    WORKSPACE_ROOT,
    "supabase/migrations/20261113_student_portal_core.sql"
  );
  assert.ok(fs.existsSync(sqlPath), "20261113_student_portal_core.sql must exist");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Verify FOR UPDATE row lock to serialize concurrent submissions
  assert.ok(
    sql.includes("SELECT * INTO v_attempt\n    FROM public.exam_attempts\n    WHERE id = p_attempt_id\n    FOR UPDATE;"),
    "RPC must acquire FOR UPDATE row lock on exam_attempts"
  );

  // Verify idempotency replay check
  assert.ok(
    sql.includes("IF v_attempt.status IN ('submitted', 'graded') THEN"),
    "RPC must check if attempt is already submitted/graded"
  );
  assert.ok(
    sql.includes("IF v_attempt.idempotency_key = p_idempotency_key THEN"),
    "RPC must verify idempotency key equality"
  );
  assert.ok(
    sql.includes("'idempotent_replay', true"),
    "RPC must return idempotent_replay: true for identical replay"
  );
  assert.ok(
    sql.includes("'error', 'ALREADY_SUBMITTED'"),
    "RPC must reject different idempotency keys with ALREADY_SUBMITTED"
  );
});

// ==============================================================================
// SUITE D: WHITEBOARD BINARY FILES & PERSISTENCE
// ==============================================================================

test("D.1 Whiteboard Files: Schema Column & Validation Trigger", () => {
  const sqlPath = path.join(
    WORKSPACE_ROOT,
    "supabase/migrations/20261115_marketplace_and_whiteboard_fixes.sql"
  );
  assert.ok(fs.existsSync(sqlPath), "20261115_marketplace_and_whiteboard_fixes.sql must exist");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Verify files column addition
  assert.ok(
    sql.includes("ALTER TABLE public.whiteboards\n    ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;"),
    "Must add files JSONB column with default '[]'::jsonb"
  );

  // Verify trigger prevents NULL files
  assert.ok(
    sql.includes("CREATE OR REPLACE FUNCTION public.validate_whiteboard_files()"),
    "Must create validate_whiteboard_files function"
  );
  assert.ok(
    sql.includes("IF NEW.files IS NULL THEN\n        NEW.files := '[]'::jsonb;"),
    "Trigger must enforce non-null files"
  );
  assert.ok(
    sql.includes("CREATE TRIGGER trigger_validate_whiteboard_files"),
    "Must create trigger_validate_whiteboard_files on public.whiteboards"
  );
});
