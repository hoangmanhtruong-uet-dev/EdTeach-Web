// tests/adversarial/m2_r2_refund_and_signup.test.mjs
// Adversarial Empirical Test Suite for Milestone 2 Iteration 2
// Focus: Strict Permission Lockdown on Refund RPCs & 5,000 Credit Signup Bonus
// Author: Challenger #1 (Empirical Challenger)

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

console.log("================================================================================");
console.log("CHALLENGER #1 EMPIRICAL ADVERSARIAL SUITE — MILESTONE 2 ITERATION 2 (NODE.JS)");
console.log("Focus: Strict Refund Lockdown & 5,000 Credit Signup Ledger Verification");
console.log("================================================================================\n");

let passed = 0;
let total = 0;
const failures = [];

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failures.push({ name, error: err });
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
  }
}

const migrationSqlPath = path.join(rootDir, "supabase/migrations/20261110_fix_wallet_ledger_and_rpc.sql");
const migrationSql = fs.readFileSync(migrationSqlPath, "utf-8");

const affiliatePagePath = path.join(rootDir, "frontend/src/app/(dashboard)/affiliate/page.tsx");
const affiliatePageContent = fs.readFileSync(affiliatePagePath, "utf-8");

// =============================================================================
// SUITE 1: STATIC DEDUCTION & REFUND PERMISSION CONSTRAINTS IN MIGRATION SQL
// =============================================================================
console.log("\n--- Suite 1: Migration SQL Security Hardening & Permission Directives ---");

test("1.1 REVOKE EXECUTE on refund functions from PUBLIC, anon, authenticated is present", () => {
  assert.ok(
    migrationSql.includes("REVOKE EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) FROM PUBLIC, anon, authenticated;"),
    "Must explicitly revoke execute on refund_user_credits_atomic from PUBLIC, anon, authenticated"
  );
  assert.ok(
    migrationSql.includes("REVOKE EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) FROM PUBLIC, anon, authenticated;"),
    "Must explicitly revoke execute on refund_user_credits from PUBLIC, anon, authenticated"
  );
});

test("1.2 GRANT EXECUTE on refund functions is STRICTLY granted to service_role only", () => {
  assert.ok(
    migrationSql.includes("GRANT EXECUTE ON FUNCTION public.refund_user_credits_atomic(UUID, INTEGER, TEXT, JSONB) TO service_role;"),
    "Must grant execute on refund_user_credits_atomic to service_role only"
  );
  assert.ok(
    migrationSql.includes("GRANT EXECUTE ON FUNCTION public.refund_user_credits(UUID, INTEGER, TEXT, UUID) TO service_role;"),
    "Must grant execute on refund_user_credits to service_role only"
  );

  // Adversarial check: Ensure no accidental GRANT ... TO authenticated for refund
  const lines = migrationSql.splitlines ? migrationSql.splitlines() : migrationSql.split("\n");
  const badGrants = [];
  for (const l of lines) {
    if (l.toLowerCase().includes("grant execute on function") && l.toLowerCase().includes("refund")) {
      const parts = l.toLowerCase().split(" to ");
      if (parts.length > 1) {
        const grantee = parts[1];
        if (grantee.includes("authenticated") || grantee.includes("anon") || grantee.includes("public")) {
          badGrants.push(l);
        }
      }
    }
  }
  assert.equal(badGrants.length, 0, `Rogue grants detected: ${JSON.stringify(badGrants)}`);
});

test("1.3 Procedural defense-in-depth inside refund_user_credits_atomic enforces service_role", () => {
  assert.ok(
    migrationSql.includes("IF current_user <> 'service_role' AND COALESCE((auth.jwt()->>'role'), '') <> 'service_role' THEN"),
    "Must enforce service_role check within refund_user_credits_atomic body"
  );
  assert.ok(
    migrationSql.includes("'error', 'UNAUTHORIZED_ACCESS'"),
    "Must return UNAUTHORIZED_ACCESS when called without service_role"
  );

  // Extract function body of refund_user_credits_atomic
  const refundFuncStart = migrationSql.indexOf("CREATE OR REPLACE FUNCTION public.refund_user_credits_atomic");
  const refundFuncEnd = migrationSql.indexOf("$$ LANGUAGE plpgsql SECURITY DEFINER", refundFuncStart);
  assert.ok(refundFuncStart > -1 && refundFuncEnd > -1, "refund_user_credits_atomic function boundary found");
  const refundFuncBody = migrationSql.substring(refundFuncStart, refundFuncEnd);

  assert.ok(
    !refundFuncBody.includes("p_user_id IS DISTINCT FROM auth.uid()"),
    "Vulnerable condition 'p_user_id IS DISTINCT FROM auth.uid()' must be purged from refund_user_credits_atomic"
  );
});

test("1.4 handle_new_user() trigger initializes wallet with 5,000 credits", () => {
  assert.ok(
    migrationSql.includes("VALUES (NEW.id, 5000, 3, 0, timezone('utc'::text, now()))"),
    "handle_new_user must insert 5000 balance into public.wallets"
  );
  assert.ok(
    migrationSql.includes("5000,\n            'signup_bonus'") ||
    migrationSql.includes("5000,\r\n            'signup_bonus'"),
    "handle_new_user must record 5000 credits signup_bonus in public.wallet_txns"
  );
  assert.ok(
    !migrationSql.includes("VALUES (NEW.id, 100,"),
    "Residual 100 credits in handle_new_user must not exist"
  );
});

// =============================================================================
// SUITE 2: AFFILIATE PAGE 200K MINIMUM PAYOUT SANITIZATION
// =============================================================================
console.log("\n--- Suite 2: Affiliate Page 200k Minimum Payout Consistency ---");

test("2.1 Zero occurrences of 100000 or 100k in affiliate/page.tsx", () => {
  assert.ok(!affiliatePageContent.includes("100000"), "No 100000 occurrences in affiliate/page.tsx");
  assert.ok(!affiliatePageContent.includes("100k"), "No 100k occurrences in affiliate/page.tsx");
});

test("2.2 Affiliate disabled checks and card badge use MINIMUM_PAYOUT_VND or 200k", () => {
  assert.ok(
    affiliatePageContent.includes("disabled={affiliateBalance < MINIMUM_PAYOUT_VND}"),
    "affiliateBalance button disabled check must reference MINIMUM_PAYOUT_VND"
  );
  assert.ok(
    affiliatePageContent.includes("payoutAmount < MINIMUM_PAYOUT_VND"),
    "payoutAmount submit button disabled check must reference MINIMUM_PAYOUT_VND"
  );
  assert.ok(
    affiliatePageContent.includes("Min 200k tiền mặt"),
    "Header badge must say 'Min 200k tiền mặt'"
  );
});

// =============================================================================
// SUITE 3: DELEGATE TO LIVE POSTGRESQL HARNESS
// =============================================================================
console.log("\n--- Suite 3: Empirical Live PostgreSQL Execution Verification ---");

test("3.1 Run Python Live PostgreSQL 18 Adversarial Suite (14 Tests)", () => {
  const result = execSync("python tests/adversarial/m2_r2_refund_adversarial.py", {
    cwd: rootDir,
    encoding: "utf-8",
  });
  assert.ok(result.includes("ALL ADVERSARIAL STRESS TESTS FOR MILESTONE 2 ITERATION 2 PASSED CLEANLY (100%)!"));
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passed}/${total} passed (${failures.length} failures)`);
console.log("================================================================================");

if (failures.length > 0) {
  console.error("FAILURES DETECTED:");
  for (const f of failures) {
    console.error(`- ${f.name}: ${f.error.message}`);
  }
  process.exit(1);
} else {
  console.log("ALL ADVERSARIAL TESTS IN M2 R2 SUITE PASSED WITH 100% SUCCESS!");
  process.exit(0);
}
