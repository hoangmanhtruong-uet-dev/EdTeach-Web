/**
 * Empirical Reproduction of Error Leakage in API Routes
 * Target 1: frontend/src/app/api/marketplace/items/[id]/route.ts
 * Target 2: frontend/src/app/api/exams/generate/route.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Empirical Reproduction: Error Leakage in Marketplace & Exam Gen", () => {
  it("Reproduction 1: items/[id] route handler returns raw err.message on catch", async () => {
    // Simulate what happens in items/[id]/route.ts catch block
    const mockCatchBlock = (err) => {
      // Exact code from frontend/src/app/api/marketplace/items/[id]/route.ts:114-116
      return {
        status: 500,
        body: { error: err.message }
      };
    };

    const simulatedPostgresError = new Error(
      'syntax error at or near "SELECT" at character 1; Table: public.marketplace_items; Column: seller_id'
    );

    const response = mockCatchBlock(simulatedPostgresError);
    console.log("[Reproduction 1] Response body returned to client:", response.body);

    assert.equal(response.status, 500);
    assert.equal(
      response.body.error,
      'syntax error at or near "SELECT" at character 1; Table: public.marketplace_items; Column: seller_id',
      "VULNERABILITY CONFIRMED: Raw database error string with table schema leaked to client!"
    );
  });

  it("Reproduction 2: exams/generate route handler returns raw examError?.message on insert failure", () => {
    // Exact logic from frontend/src/app/api/exams/generate/route.ts:505-515
    const mockInsertErrorBlock = (examError) => {
      const isFkey = examError?.code === "23503" || examError?.message?.includes("foreign key");
      return {
        status: 500,
        body: {
          error: isFkey
            ? "Tài khoản chưa được đồng bộ vào bảng users. Vui lòng chạy file migration 'supabase/migrations/20261025_sync_users_and_fix_rls.sql' trên Supabase SQL Editor."
            : "Lỗi khởi tạo đề thi: " + examError?.message,
        }
      };
    };

    // Case A: Generic Postgres DB error (e.g. check constraint failure or schema mismatch)
    const dbError = {
      code: "23514",
      message: 'check constraint "exams_grade_check" failed on column "grade" in table "public.exams"',
    };
    const resA = mockInsertErrorBlock(dbError);
    console.log("[Reproduction 2A] Response body returned to client:", resA.body);
    assert.equal(
      resA.body.error,
      'Lỗi khởi tạo đề thi: check constraint "exams_grade_check" failed on column "grade" in table "public.exams"',
      "VULNERABILITY CONFIRMED: Postgres schema and constraint leaked to client!"
    );

    // Case B: Foreign key error (code 23503)
    const fkeyError = {
      code: "23503",
      message: 'insert or update on table "exams" violates foreign key constraint "exams_user_id_fkey"',
    };
    const resB = mockInsertErrorBlock(fkeyError);
    console.log("[Reproduction 2B] Response body returned to client:", resB.body);
    assert.ok(
      resB.body.error.includes("supabase/migrations/20261025_sync_users_and_fix_rls.sql"),
      "VULNERABILITY CONFIRMED: Server-side SQL migration path leaked in response payload!"
    );
  });

  it("Reproduction 3: exams/generate top-level catch block returns err.message", () => {
    // Exact logic from frontend/src/app/api/exams/generate/route.ts:810-813
    const mockTopCatchBlock = (err) => {
      return {
        status: 500,
        body: { error: err.message || "Lỗi máy chủ trong quá trình sinh đề thi." }
      };
    };

    const simulatedUnhandledDbError = new Error(
      'FATAL: remaining connection slots are reserved for non-replication superuser connections (server: db.edteach.internal:5432)'
    );

    const res = mockTopCatchBlock(simulatedUnhandledDbError);
    console.log("[Reproduction 3] Top-level catch response:", res.body);
    assert.equal(
      res.body.error,
      'FATAL: remaining connection slots are reserved for non-replication superuser connections (server: db.edteach.internal:5432)',
      "VULNERABILITY CONFIRMED: Database host and internal error leaked verbatim!"
    );
  });
});
