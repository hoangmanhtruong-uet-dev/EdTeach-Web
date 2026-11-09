import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

describe("Milestone 3 — Content Authenticity, Corporate Identity & WCAG AA Verification", () => {
  it("Item 1: Footer contains verified corporate identity & all 4 legal links", () => {
    const footerPath = path.join(rootDir, "frontend/src/components/layout/footer.tsx");
    assert.ok(fs.existsSync(footerPath), "footer.tsx must exist");
    const content = fs.readFileSync(footerPath, "utf-8");

    // Corporate info
    assert.ok(content.includes("Công ty TNHH Công nghệ Giáo dục EdTeach Việt Nam"), "Must include corporate business name");
    assert.ok(content.includes("0110826928"), "Must include MST");
    assert.ok(content.includes("Tầng 5, Tòa nhà FPT, Phố Duy Tân, Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội"), "Must include physical address");
    assert.ok(content.includes("1900 6825"), "Must include official hotline");
    assert.ok(content.includes("support@edteach.vn"), "Must include official support email");
    assert.ok(content.includes("dpo@edteach.vn"), "Must include DPO contact email");

    // All 4 legal page links
    assert.ok(content.includes('href="/terms"'), "Must link to /terms");
    assert.ok(content.includes('href="/privacy"'), "Must link to /privacy");
    assert.ok(content.includes('href="/cookies"'), "Must link to /cookies");
    assert.ok(content.includes('href="/refund"'), "Must link to /refund");

    // No personal developer gmail
    assert.ok(!content.includes("developerhoangtruong@gmail.com"), "Must NOT include personal gmail");
  });

  it("Item 2: Purged superlative and unverified claims across codebase", () => {
    const reportViewPath = path.join(rootDir, "frontend/src/app/report/[token]/report-view.tsx");
    const reportContent = fs.readFileSync(reportViewPath, "utf-8");
    assert.ok(!reportContent.includes("số 1 Việt Nam"), "report-view.tsx must not claim 'số 1 Việt Nam'");
    assert.ok(reportContent.includes("Nền tảng chuyên sâu dành cho Giáo viên"), "report-view.tsx has professional positioning");

    const exportDocxPath = path.join(rootDir, "frontend/src/lib/marketplace/export-docx.ts");
    const docxContent = fs.readFileSync(exportDocxPath, "utf-8");
    assert.ok(!docxContent.includes("số 1 cho Giáo viên"), "export-docx.ts must not claim 'số 1 cho Giáo viên'");
    assert.ok(docxContent.includes("Thư viện đề thi chia sẻ uy tín cho Giáo viên"), "export-docx.ts has compliant description");

    const pagePath = path.join(rootDir, "frontend/src/app/page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");
    assert.ok(!pageContent.includes("tối thượng"), "page.tsx must not contain 'tối thượng'");
    assert.ok(!pageContent.includes("tương tác đỉnh cao"), "page.tsx must not contain 'tương tác đỉnh cao'");

    const plansPath = path.join(rootDir, "frontend/src/lib/payment/plans.ts");
    const plansContent = fs.readFileSync(plansPath, "utf-8");
    assert.ok(!plansContent.includes("tối thượng"), "plans.ts must not contain 'tối thượng'");
  });

  it("Item 3: WCAG AA Color contrast hardening", () => {
    const quotaModalPath = path.join(rootDir, "frontend/src/components/modals/quota-exhausted-modal.tsx");
    const quotaContent = fs.readFileSync(quotaModalPath, "utf-8");
    assert.ok(!quotaContent.includes('<span className="text-slate-400">Số tiền:</span>'), "Low contrast text-slate-400 replaced in quota modal");
    assert.ok(!quotaContent.includes('<span className="text-slate-400">Nội dung CK:</span>'), "Low contrast text-slate-400 replaced in quota modal");

    const guideTabPath = path.join(rootDir, "frontend/src/components/settings/GuideTab.tsx");
    const guideContent = fs.readFileSync(guideTabPath, "utf-8");
    assert.ok(!guideContent.includes("text-slate-400 font-bold"), "GuideTab preview headings must not use low-contrast text-slate-400");
  });

  it("Item 4: Descriptive alt text and aria-labels on icon buttons", () => {
    const sidebarPath = path.join(rootDir, "frontend/src/components/navigation/dashboard-sidebar.tsx");
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");
    assert.ok(!sidebarContent.includes('alt="Avatar"'), "dashboard-sidebar.tsx must not use generic alt='Avatar'");
    assert.ok(!sidebarContent.includes('alt="Avatar tài khoản"'), "dashboard-sidebar.tsx must not use generic alt='Avatar tài khoản'");
    assert.ok(sidebarContent.includes("Ảnh đại diện của"), "dashboard-sidebar.tsx uses descriptive alt text");

    const scanPath = path.join(rootDir, "frontend/src/app/scan/[token]/page.tsx");
    const scanContent = fs.readFileSync(scanPath, "utf-8");
    assert.ok(!scanContent.includes('alt="Thumbnail"'), "scan page must not use generic alt='Thumbnail'");

    const exportModalPath = path.join(rootDir, "frontend/src/components/settings/ExportDataModal.tsx");
    const exportContent = fs.readFileSync(exportModalPath, "utf-8");
    assert.ok(exportContent.includes('aria-label="Đóng"'), "ExportDataModal close button has aria-label='Đóng'");

    const avatarModalPath = path.join(rootDir, "frontend/src/components/settings/AvatarCropModal.tsx");
    const avatarContent = fs.readFileSync(avatarModalPath, "utf-8");
    assert.ok(avatarContent.includes('aria-label="Đóng"'), "AvatarCropModal close button has aria-label='Đóng'");
  });

  it("Item 5: Keyboard tab navigation operability on dropzones", () => {
    const teacherVerifyPath = path.join(rootDir, "frontend/src/app/verify/teacher/page.tsx");
    const teacherContent = fs.readFileSync(teacherVerifyPath, "utf-8");
    assert.ok(teacherContent.includes('role="button"'), "Teacher dropzone has role='button'");
    assert.ok(teacherContent.includes("tabIndex={0}"), "Teacher dropzone has tabIndex={0}");
    assert.ok(teacherContent.includes("onKeyDown="), "Teacher dropzone has onKeyDown handler");
    assert.ok(teacherContent.includes("focus-visible:ring-2"), "Teacher dropzone has focus ring");

    const tutorVerifyPath = path.join(rootDir, "frontend/src/app/verify/tutor/page.tsx");
    const tutorContent = fs.readFileSync(tutorVerifyPath, "utf-8");
    assert.ok(tutorContent.includes('aria-label="Tải lên ảnh Thẻ sinh viên hoặc Bằng đại học"'), "Student card dropzone accessible");
    assert.ok(tutorContent.includes('aria-label="Tải lên ảnh CCCD mặt trước"'), "CCCD dropzone accessible");
  });

  it("Item 6: Descriptive button and action labels", () => {
    const marketingPath = path.join(rootDir, "frontend/src/app/marketing/page.tsx");
    const marketingContent = fs.readFileSync(marketingPath, "utf-8");
    assert.ok(!marketingContent.includes("Bấm vào đây để tải file video về máy"), "marketing page must not have vague 'Bấm vào đây'");
    assert.ok(marketingContent.includes("Tải video hướng dẫn thực hành (MP4)"), "marketing page has descriptive download button text");
  });
});
