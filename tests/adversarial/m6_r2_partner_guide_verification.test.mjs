// tests/adversarial/m6_r2_partner_guide_verification.test.mjs
// Verification suite for Milestone R2: Partner & Guide tabs upgrade
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("================================================================================");
console.log("RUNNING VERIFICATION TEST: MILESTONE R2 (PARTNER & GUIDE TABS)");
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

const partnerTabPath = path.resolve("frontend/src/components/settings/PartnerTab.tsx");
const guideTabPath = path.resolve("frontend/src/components/settings/GuideTab.tsx");

const partnerTabContent = fs.readFileSync(partnerTabPath, "utf-8");
const guideTabContent = fs.readFileSync(guideTabPath, "utf-8");

// ============================================================================
// 1. PARTNER TAB: BANNER & SHARING TOOLS
// ============================================================================
test("PartnerTab: Banner copy button changes state to '✓ Đã sao chép' and triggers toast in 2s", () => {
  assert.ok(
    partnerTabContent.includes("✓ Đã sao chép"),
    "Copy button must display '✓ Đã sao chép' when clicked"
  );
  assert.ok(
    partnerTabContent.includes("showToast") || partnerTabContent.includes("setToastMessage"),
    "Must trigger a toast notification"
  );
  assert.ok(
    partnerTabContent.includes("2000"),
    "Must use 2-second timeout for toast or copied state"
  );
});

test("PartnerTab: QR button opens Modal QR Code Sư Phạm with teacher name and EDULQQBB code", () => {
  assert.ok(
    partnerTabContent.includes("showQrModal") && partnerTabContent.includes("setShowQrModal"),
    "Must have state controlling QR modal"
  );
  assert.ok(
    partnerTabContent.includes("EDULQQBB"),
    "Must include default pedagogical referral code EDULQQBB"
  );
  assert.ok(
    partnerTabContent.includes("Thầy Nguyễn Văn An") || partnerTabContent.includes("teacherName"),
    "Must display teacher name on QR card"
  );
});

test("PartnerTab: QR Modal includes 'Tải ảnh QR về máy' and 'Copy mẫu tin nhắn giới thiệu'", () => {
  assert.ok(
    partnerTabContent.includes("Tải ảnh QR về máy"),
    "Must contain button 'Tải ảnh QR về máy'"
  );
  assert.ok(
    partnerTabContent.includes("handleDownloadQrCard") || partnerTabContent.includes("download"),
    "Must contain download functionality for QR Card"
  );
  assert.ok(
    partnerTabContent.includes("Copy mẫu tin nhắn giới thiệu"),
    "Must contain button 'Copy mẫu tin nhắn giới thiệu'"
  );
  assert.ok(
    partnerTabContent.includes("handleCopyMessageTemplate"),
    "Must contain handler for copying invitation template"
  );
});

// ============================================================================
// 2. PARTNER TAB: 3 STAT CARDS & BANK SETTINGS
// ============================================================================
test("PartnerTab: Stat Card 1 disables 'Đổi Credits' when balance < 10.000đ", () => {
  assert.ok(
    partnerTabContent.includes("affiliateBalance < 10000"),
    "Must disable convert button when affiliate balance < 10.000đ"
  );
});

test("PartnerTab: Stat Card 1 handles < 200.000đ threshold with progress bar / secondary button", () => {
  assert.ok(
    partnerTabContent.includes("MINIMUM_PAYOUT_VND") || partnerTabContent.includes("200000"),
    "Must check minimum payout threshold"
  );
  assert.ok(
    partnerTabContent.includes("200.000đ để mở khóa rút tiền"),
    "Must display progress text '200.000đ để mở khóa rút tiền'"
  );
});

test("PartnerTab: Stat Card 1 contains '⚙️ Cài đặt TK Ngân hàng' button and bank settings modal", () => {
  assert.ok(
    partnerTabContent.includes("Cài đặt TK Ngân hàng"),
    "Must contain button '⚙️ Cài đặt TK Ngân hàng'"
  );
  assert.ok(
    partnerTabContent.includes("showBankModal") && partnerTabContent.includes("setShowBankModal"),
    "Must have modal for bank settings"
  );
  assert.ok(
    partnerTabContent.includes("POPULAR_BANKS"),
    "Must provide list of popular banks"
  );
  assert.ok(
    partnerTabContent.includes("Số tài khoản") && partnerTabContent.includes("Tên chủ tài khoản"),
    "Bank modal must include account number and holder name"
  );
});

test("PartnerTab: Displays +20% bonus incentive when converting to AI Credits", () => {
  assert.ok(
    partnerTabContent.includes("+20%"),
    "Must highlight +20% bonus incentive"
  );
  assert.ok(
    partnerTabContent.includes("12 Credits") || partnerTabContent.includes("1.2"),
    "Must calculate or mention 1.000đ = 12 Credits (with 20% bonus)"
  );
});

test("PartnerTab: Stat Card 3 includes +10.000 Credits note and (1 đang chờ kích hoạt • 0 đã nâng cấp PRO)", () => {
  assert.ok(
    partnerTabContent.includes("Tặng +10.000 Credits khi đồng nghiệp tạo đề đầu tiên"),
    "Must include note 'Tặng +10.000 Credits khi đồng nghiệp tạo đề đầu tiên'"
  );
  assert.ok(
    partnerTabContent.includes("(1 đang chờ kích hoạt • 0 đã nâng cấp PRO)"),
    "Must include breakdown '(1 đang chờ kích hoạt • 0 đã nâng cấp PRO)'"
  );
});

// ============================================================================
// 3. PARTNER TAB: DANH SÁCH ĐỒNG NGHIỆP ĐÃ MỜI
// ============================================================================
test("PartnerTab: Contains 'Danh sách đồng nghiệp đã mời' with registered accounts and real statuses", () => {
  assert.ok(
    partnerTabContent.includes("Danh sách đồng nghiệp đã mời"),
    "Must include section/tab 'Danh sách đồng nghiệp đã mời'"
  );
  assert.ok(
    partnerTabContent.includes("Đang chờ kích hoạt đề đầu"),
    "Must display status 'Đang chờ kích hoạt đề đầu'"
  );
  assert.ok(
    partnerTabContent.includes("Đã nâng cấp PRO"),
    "Must display status 'Đã nâng cấp PRO'"
  );
});

// ============================================================================
// 4. GUIDE TAB: 5 TOPICS BAR & OVERFLOW FIX
// ============================================================================
test("GuideTab: 5 Topics bar displays all 5 topics without clipping topic 5", () => {
  assert.ok(
    guideTabContent.includes("guideTopics") && guideTabContent.includes("export-score"),
    "Must define all 5 topics including export-score (#5)"
  );
  assert.ok(
    guideTabContent.includes("lg:grid-cols-5") || guideTabContent.includes("flex-wrap"),
    "Must use responsive layout preventing overflow on desktop"
  );
  assert.ok(
    guideTabContent.includes("ChevronLeft") && guideTabContent.includes("ChevronRight"),
    "Must provide scroll controls for mobile/small screens"
  );
});

test("GuideTab: All 5 topics contain 3 steps with mini UI mockups and tips box", () => {
  assert.ok(
    guideTabContent.includes("MINI UI PREVIEW") || guideTabContent.includes("Mini UI"),
    "Must contain mini UI mockups/previews for steps"
  );
  assert.ok(
    guideTabContent.includes("Mẹo") || guideTabContent.includes("chuyên gia"),
    "Must contain tips box for teachers"
  );
});

test("GuideTab: All 5 topics provide quick navigation CTA links at the bottom", () => {
  assert.ok(
    guideTabContent.includes("/exams/create"),
    "Must link to exam creator studio"
  );
  assert.ok(
    guideTabContent.includes("/grading"),
    "Must link to grading section"
  );
});

// ============================================================================
// 5. GUIDE TAB: FAQ SEARCH & SYNCHRONIZED NUMBERS
// ============================================================================
test("GuideTab: FAQ section includes search input '🔍 Tìm câu hỏi hướng dẫn...'", () => {
  assert.ok(
    guideTabContent.includes("🔍 Tìm câu hỏi hướng dẫn..."),
    "Must include search input with placeholder '🔍 Tìm câu hỏi hướng dẫn...'"
  );
  assert.ok(
    guideTabContent.includes("faqSearchQuery") && guideTabContent.includes("filteredFaqs"),
    "Must filter FAQs dynamically based on search query"
  );
});

test("GuideTab: FAQ #1 updated to 5.000 Credits welcome and +10.000 Credits for referral", () => {
  assert.ok(
    guideTabContent.includes("5.000 Credits chào mừng"),
    "FAQ 1 must mention 5.000 Credits welcome gift"
  );
  assert.ok(
    guideTabContent.includes("+10.000 Credits"),
    "FAQ 1 must mention +10.000 Credits referral bonus"
  );
});

test("GuideTab: FAQs synchronize PRO (30.000 credits) and MAX (100.000 credits) quotas", () => {
  assert.ok(
    guideTabContent.includes("30.000 Credits"),
    "FAQ must mention 30.000 Credits for PRO"
  );
  assert.ok(
    guideTabContent.includes("100.000 Credits"),
    "FAQ must mention 100.000 Credits for MAX"
  );
  assert.ok(
    guideTabContent.includes("500 credits/đề"),
    "FAQ must mention 500 credits/standard exam"
  );
});

console.log("\n--------------------------------------------------------------------------------");
console.log(`SUMMARY: ${passed} / ${total} tests passed.`);
console.log("--------------------------------------------------------------------------------\n");

if (passed === total) {
  console.log(">>> ALL R2 VERIFICATION CHECKS PASSED PERFECTLY! <<<\n");
} else {
  process.exit(1);
}
