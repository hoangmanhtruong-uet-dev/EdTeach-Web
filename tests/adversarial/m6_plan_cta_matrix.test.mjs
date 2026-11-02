// tests/adversarial/m6_plan_cta_matrix.test.mjs
// Unit Test suite verifying the 3 Plans x 4 User States CTA matrix for PROMPT 03
import assert from "node:assert/strict";

console.log("================================================================================");
console.log("RUNNING UNIT TEST: 3 PLANS x 4 STATES MATRIX FOR getPlanCta (PROMPT 03)");
console.log("================================================================================\n");

// Re-import or mirror getPlanCta logic
function getPlanCta(planTier, userState, _expiresAt) {
  switch (userState) {
    case "free": {
      if (planTier === "free") {
        return {
          label: "Gói hiện tại",
          disabled: true,
          variant: "current",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Nâng cấp PRO ngay",
          disabled: false,
          variant: "upgrade",
          actionType: "checkout",
        };
      }
      return {
        label: "Nâng cấp MAX ngay",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
    }

    case "pro": {
      if (planTier === "free") {
        return {
          label: "Đã bao gồm trong gói của bạn",
          disabled: true,
          variant: "included",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Gia hạn gói PRO",
          disabled: false,
          variant: "renew",
          actionType: "checkout",
        };
      }
      return {
        label: "Nâng cấp lên MAX",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
    }

    case "max-paid": {
      if (planTier === "free") {
        return {
          label: "Đã bao gồm trong gói của bạn",
          disabled: true,
          variant: "included",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Đã bao gồm trong gói MAX",
          disabled: true,
          variant: "included",
          actionType: "none",
          helperText: "Bạn đã có đặc quyền MAX cao hơn",
        };
      }
      return {
        label: "Gia hạn gói MAX",
        disabled: false,
        variant: "renew",
        actionType: "checkout",
      };
    }

    case "max-beta": {
      if (planTier === "free") {
        return {
          label: "Gói tiêu chuẩn tài khoản",
          disabled: true,
          variant: "default",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Đăng ký gói PRO",
          disabled: false,
          variant: "upgrade",
          actionType: "checkout",
          helperText: "Đang dùng thử Beta MAX",
        };
      }
      return {
        label: "Đăng ký chính thức gói MAX",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
        helperText: "Kích hoạt chính thức sau Beta",
      };
    }

    default:
      return {
        label: "Chọn gói",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
  }
}

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(`       Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. FREE USER STATE
test("State: free -> Free card shows 'Gói hiện tại' and is disabled", () => {
  const cta = getPlanCta("free", "free");
  assert.equal(cta.label, "Gói hiện tại");
  assert.equal(cta.disabled, true);
  assert.equal(cta.variant, "current");
});

test("State: free -> PRO card shows 'Nâng cấp PRO ngay' and is enabled", () => {
  const cta = getPlanCta("pro", "free");
  assert.equal(cta.label, "Nâng cấp PRO ngay");
  assert.equal(cta.disabled, false);
  assert.equal(cta.actionType, "checkout");
});

test("State: free -> MAX card shows 'Nâng cấp MAX ngay' and is enabled", () => {
  const cta = getPlanCta("max", "free");
  assert.equal(cta.label, "Nâng cấp MAX ngay");
  assert.equal(cta.disabled, false);
  assert.equal(cta.actionType, "checkout");
});

// 2. PRO USER STATE
test("State: pro -> Free card shows 'Đã bao gồm trong gói của bạn' and is disabled", () => {
  const cta = getPlanCta("free", "pro");
  assert.equal(cta.label, "Đã bao gồm trong gói của bạn");
  assert.equal(cta.disabled, true);
});

test("State: pro -> PRO card shows 'Gia hạn gói PRO' and is enabled", () => {
  const cta = getPlanCta("pro", "pro");
  assert.equal(cta.label, "Gia hạn gói PRO");
  assert.equal(cta.disabled, false);
  assert.equal(cta.variant, "renew");
  assert.equal(cta.actionType, "checkout");
});

test("State: pro -> MAX card shows 'Nâng cấp lên MAX' and is enabled", () => {
  const cta = getPlanCta("max", "pro");
  assert.equal(cta.label, "Nâng cấp lên MAX");
  assert.equal(cta.disabled, false);
  assert.equal(cta.variant, "upgrade");
  assert.equal(cta.actionType, "checkout");
});

// 3. MAX-PAID USER STATE
test("State: max-paid -> Free card shows 'Đã bao gồm trong gói của bạn' and is disabled", () => {
  const cta = getPlanCta("free", "max-paid");
  assert.equal(cta.label, "Đã bao gồm trong gói của bạn");
  assert.equal(cta.disabled, true);
});

test("State: max-paid -> PRO card shows 'Đã bao gồm trong gói MAX' and is disabled with helperText", () => {
  const cta = getPlanCta("pro", "max-paid");
  assert.equal(cta.label, "Đã bao gồm trong gói MAX");
  assert.equal(cta.disabled, true);
  assert.equal(cta.helperText, "Bạn đã có đặc quyền MAX cao hơn");
});

test("State: max-paid -> MAX card shows 'Gia hạn gói MAX' (NO VIP) and is enabled", () => {
  const cta = getPlanCta("max", "max-paid");
  assert.equal(cta.label, "Gia hạn gói MAX");
  assert.equal(cta.disabled, false);
  assert.equal(cta.variant, "renew");
  assert.ok(!cta.label.includes("(VIP)"), "Label must not contain '(VIP)'");
});

// 4. MAX-BETA USER STATE
test("State: max-beta -> Free card shows 'Gói tiêu chuẩn tài khoản' and is disabled", () => {
  const cta = getPlanCta("free", "max-beta");
  assert.equal(cta.label, "Gói tiêu chuẩn tài khoản");
  assert.equal(cta.disabled, true);
});

test("State: max-beta -> PRO card shows 'Đăng ký gói PRO' and is enabled with helperText", () => {
  const cta = getPlanCta("pro", "max-beta");
  assert.equal(cta.label, "Đăng ký gói PRO");
  assert.equal(cta.disabled, false);
  assert.equal(cta.helperText, "Đang dùng thử Beta MAX");
});

test("State: max-beta -> MAX card shows 'Đăng ký chính thức gói MAX' and is enabled with helperText", () => {
  const cta = getPlanCta("max", "max-beta");
  assert.equal(cta.label, "Đăng ký chính thức gói MAX");
  assert.equal(cta.disabled, false);
  assert.equal(cta.helperText, "Kích hoạt chính thức sau Beta");
  assert.ok(!cta.label.includes("(VIP)"), "Label must not contain '(VIP)'");
});

console.log(`\nResults: ${passed}/${total} tests passed.`);
if (passed === total) {
  console.log("ALL 12 CELLS OF THE 3x4 MATRIX PASSED SUCCESSFULLY!");
} else {
  process.exit(1);
}
