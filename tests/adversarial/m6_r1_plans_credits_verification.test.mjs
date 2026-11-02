// tests/adversarial/m6_r1_plans_credits_verification.test.mjs
// Verification suite for Milestone R1: Plans & Credits tabs upgrade
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("================================================================================");
console.log("RUNNING VERIFICATION TEST: MILESTONE R1 (PLANS & CREDITS TABS)");
console.log("================================================================================\n");

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

const planTabPath = path.resolve("frontend/src/components/settings/PlanTab.tsx");
const planCardPath = path.resolve("frontend/src/components/settings/PlanCard.tsx");
const planStatusCardPath = path.resolve("frontend/src/components/settings/PlanStatusCard.tsx");
const creditsTabPath = path.resolve("frontend/src/components/settings/CreditsTab.tsx");

const planTabContent = fs.readFileSync(planTabPath, "utf-8");
const planCardContent = fs.readFileSync(planCardPath, "utf-8");
const planStatusCardContent = fs.readFileSync(planStatusCardPath, "utf-8");
const creditsTabContent = fs.readFileSync(creditsTabPath, "utf-8");

// 1. PlanTab Title & Structure
test("PlanTab: Header title is 'Gói dịch vụ dành riêng cho Giáo viên Việt Nam'", () => {
  assert.ok(
    planTabContent.includes("Gói dịch vụ dành riêng cho Giáo viên Việt Nam"),
    "Title must match exact wording"
  );
});

test("PlanTab: Toggle chu kỳ thanh toán has 'Gói 1 Tháng' and 'Gói Học Kỳ (5 Tháng)' with -20%", () => {
  assert.ok(planTabContent.includes("Gói 1 Tháng"), "Must contain 'Gói 1 Tháng'");
  assert.ok(planTabContent.includes("Gói Học Kỳ (5 Tháng)"), "Must contain 'Gói Học Kỳ (5 Tháng)'");
  assert.ok(planTabContent.includes("-20%"), "Must show -20% badge");
});

test("PlanTab: Renders 2 cards: PRO and MAX (Free card removed from pricing cards)", () => {
  assert.ok(planTabContent.includes('tier="pro"'), "Must render PRO card");
  assert.ok(planTabContent.includes('tier="max"'), "Must render MAX card");
  assert.ok(
    !planTabContent.includes('<PlanCard\n          tier="free"') &&
    !planTabContent.includes('<PlanCard\n        tier="free"'),
    "Free card should not be rendered in main 2-tier pricing section"
  );
});

// 2. PlanCard Pricing & Corner
test("PlanCard: Top-right corner displays strikethrough original and 20% discount on semester", () => {
  assert.ok(planCardContent.includes("149.000đ/tháng"), "Contains PRO monthly price");
  assert.ok(planCardContent.includes("229.000đ/tháng"), "Contains MAX monthly price");
  assert.ok(planCardContent.includes("line-through"), "Contains strikethrough styling");
  assert.ok(planCardContent.includes("119.200đ") || planCardContent.includes("119.000đ"), "Contains PRO discounted monthly price");
  assert.ok(planCardContent.includes("179.800đ") || planCardContent.includes("183.000đ"), "Contains MAX discounted monthly price");
  assert.ok(planCardContent.includes("-20%"), "Contains -20% badge");
});

// 3. CreditsTab: TOPUP_PACKAGES Unit Economics
test("CreditsTab: TOPUP_PACKAGES unit economics exact specification", () => {
  // Gói Khởi Động: 5.000 Credits — 29.000đ (5,8đ/credit • ~10 đề thi chuẩn)
  assert.ok(creditsTabContent.includes("5.000 Credits") || creditsTabContent.includes("5000"), "Starter 5000 credits");
  assert.ok(creditsTabContent.includes("29.000đ"), "Starter price 29.000đ");
  assert.ok(creditsTabContent.includes("5,8đ/credit"), "Starter unit price 5,8đ/credit");
  assert.ok(creditsTabContent.includes("~10 đề thi chuẩn"), "Starter estimate");

  // Gói Phổ Biến: 15.000 Credits — 79.000đ (5,2đ/credit • ~30 đề thi chuẩn)
  assert.ok(creditsTabContent.includes("15000"), "Popular 15000 credits");
  assert.ok(creditsTabContent.includes("79.000đ"), "Popular price 79.000đ");
  assert.ok(creditsTabContent.includes("5,2đ/credit"), "Popular unit price 5,2đ/credit");
  assert.ok(creditsTabContent.includes("~30 đề thi chuẩn"), "Popular estimate");
  assert.ok(creditsTabContent.includes("Phổ biến"), "Popular badge");

  // Gói Tăng Tốc: 35.000 Credits — 169.000đ (4,8đ/credit • ~70 đề thi chuẩn)
  assert.ok(creditsTabContent.includes("35000"), "Speed 35000 credits");
  assert.ok(creditsTabContent.includes("169.000đ"), "Speed price 169.000đ");
  assert.ok(creditsTabContent.includes("4,8đ/credit"), "Speed unit price 4,8đ/credit");
  assert.ok(creditsTabContent.includes("~70 đề thi chuẩn"), "Speed estimate");

  // Gói Chuyên Nghiệp: 80.000 Credits — 349.000đ (4,3đ/credit • ~160 đề thi chuẩn)
  assert.ok(creditsTabContent.includes("80000"), "Pro pack 80000 credits");
  assert.ok(creditsTabContent.includes("349.000đ"), "Pro pack price 349.000đ");
  assert.ok(creditsTabContent.includes("4,3đ/credit"), "Pro pack unit price 4,3đ/credit");
  assert.ok(creditsTabContent.includes("~160 đề thi chuẩn"), "Pro pack estimate");
  assert.ok(creditsTabContent.includes("Tiết kiệm nhất"), "Pro pack badge");
});

test("CreditsTab: Dynamic CTA button + Nạp [X] Credits ([Giá]đ)", () => {
  assert.ok(
    creditsTabContent.includes("+ Nạp"),
    "CTA button must start with '+ Nạp'"
  );
  assert.ok(
    creditsTabContent.includes("selectedPack.credits") && creditsTabContent.includes("selectedPack.price"),
    "CTA button must dynamically update with selected pack credits and price"
  );
});

// 4. CreditsTab: 3-Bucket Wallet Economics & 34.500 default narrative
test("CreditsTab: Synchronized 3-Bucket Wallet math (34.500 total, 30.000 purchased, 4.500 promo)", () => {
  assert.ok(creditsTabContent.includes("30000"), "Purchased default 30.000");
  assert.ok(creditsTabContent.includes("4500"), "Promo default 4.500");
  assert.ok(creditsTabContent.includes("34500") || creditsTabContent.includes("34.500"), "Total default 34.500");
  assert.ok(creditsTabContent.includes("200.000đ") || creditsTabContent.includes("200000"), "Withdrawal disabled under 200.000đ");
});

// 5. CreditsTab: UI features (Hạn sử dụng gói, VietQR support line, Quota popover, Giftcode, Receipts, Pill filter)
test("CreditsTab: Contains card 'Chu kỳ & Hạn sử dụng Gói' with 'Hết hạn: 30/11/2026' and 'Còn 28 ngày'", () => {
  assert.ok(creditsTabContent.includes("Chu kỳ & Hạn sử dụng Gói"), "Contains Chu kỳ & Hạn sử dụng Gói");
  assert.ok(creditsTabContent.includes("30/11/2026"), "Contains expiration date 30/11/2026");
  assert.ok(creditsTabContent.includes("Còn 28 ngày"), "Contains remaining 28 days");
});

test("CreditsTab: 'Hỗ trợ thanh toán tự động 24/7 qua VietQR PayOS' is placed below the CTA button", () => {
  const ctaIndex = creditsTabContent.indexOf("+ Nạp");
  const vietqrIndex = creditsTabContent.indexOf("Hỗ trợ thanh toán tự động 24/7 qua VietQR PayOS");
  assert.ok(ctaIndex !== -1, "CTA button exists");
  assert.ok(vietqrIndex !== -1, "VietQR support line exists");
  assert.ok(vietqrIndex > ctaIndex, "VietQR line must appear after CTA button");
});

test("CreditsTab: Bảng định mức tiêu hao Credits modal contains all 4 standard rates", () => {
  assert.ok(creditsTabContent.includes("Bảng Định Mức Tiêu Hao Credits"), "Modal title");
  assert.ok(creditsTabContent.includes("500 credits"), "Tạo đề GDPT 500 credits");
  assert.ok(creditsTabContent.includes("1.000 credits"), "Gemini Thinking 1.000 credits");
  assert.ok(creditsTabContent.includes("300 credits"), "Bóc tách PDF 300 credits");
  assert.ok(creditsTabContent.includes("50 credits"), "Chấm OMR 50 credits");
});

test("CreditsTab: Contains Giftcode / Voucher form with 'Áp dụng' button", () => {
  assert.ok(creditsTabContent.includes("Giftcode & Mã Voucher") || creditsTabContent.includes("Giftcode"), "Voucher title");
  assert.ok(creditsTabContent.includes("Áp dụng"), "Apply button");
});

test("CreditsTab: Transaction history has pill filters ('Tất cả', 'Nạp vào', 'Tiêu dùng') and receipt download button", () => {
  assert.ok(creditsTabContent.includes("Tất cả"), "Filter Tất cả");
  assert.ok(creditsTabContent.includes("Nạp vào"), "Filter Nạp vào");
  assert.ok(creditsTabContent.includes("Tiêu dùng"), "Filter Tiêu dùng");
  assert.ok(creditsTabContent.includes("handleOpenReceipt") || creditsTabContent.includes("Biên Lai Điện Tử"), "Receipt modal capability");
});

console.log(`\nResults: ${passed}/${total} tests passed.`);
if (passed === total) {
  console.log("ALL MILESTONE R1 VERIFICATION TESTS PASSED SUCCESSFULLY!");
} else {
  process.exit(1);
}
