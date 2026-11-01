import { NextRequest, NextResponse } from "next/server";
import {
  performTeacherCardOCR,
  isNameMatching,
  saveVerificationRecord,
  rewardVerifiedTeacher,
  TeacherVerificationRecord,
} from "@/lib/verification/ocr-engine";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const userName = formData.get("userName") as string | null;
    const documentType = (formData.get("documentType") as any) || "teacher_card";

    if (!file && !formData.get("imageBase64")) {
      return NextResponse.json(
        { error: "Vui lòng chọn hoặc chụp ảnh thẻ ngành / văn bằng giáo viên." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Thiếu thông tin tài khoản người dùng." },
        { status: 400 }
      );
    }

    // Convert file to base64
    let base64Image = "";
    let mimeType = "image/jpeg";

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      mimeType = file.type || "image/jpeg";
      base64Image = buffer.toString("base64");
    } else {
      base64Image = formData.get("imageBase64") as string;
    }

    // 1. Run Gemini Vision OCR
    const ocr = await performTeacherCardOCR(base64Image, mimeType, userName || undefined);

    // 2. Evaluate Auto-Approval criteria (Confidence >= 0.85 & Name Matching)
    const nameMatches = userName ? isNameMatching(ocr.fullName, userName) : true;
    const isAutoApproved = ocr.confidenceScore >= 0.85 && nameMatches;

    const recordId = crypto.randomUUID();
    const recordStatus = isAutoApproved ? "approved" : "pending_review";

    const verificationRecord: TeacherVerificationRecord = {
      id: recordId,
      userId,
      documentType,
      imageUrl: `data:${mimeType};base64,${base64Image.slice(0, 100)}...`, // Preview reference
      status: recordStatus,
      ocrExtractedName: ocr.fullName,
      ocrExtractedSchool: ocr.schoolOrOrganization,
      ocrExtractedCode: ocr.cardNumber,
      ocrConfidence: ocr.confidenceScore,
      roleCategory: ocr.roleCategory,
      reviewedAt: isAutoApproved ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Save to Store
    await saveVerificationRecord(verificationRecord);

    // 4. If auto-approved, trigger perks (Tích Xanh + 10k Credits)
    if (isAutoApproved) {
      await rewardVerifiedTeacher({
        userId,
        schoolName: ocr.schoolOrOrganization || "Đơn vị giáo dục",
        teacherCode: ocr.cardNumber,
        roleCategory: ocr.roleCategory,
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        isAutoApproved: true,
        ocr,
        record: verificationRecord,
        message: `Chúc mừng Thầy/Cô! AI đã xác thực thành công thẻ ngành của ${ocr.fullName} (${ocr.schoolOrOrganization}). Tích Xanh chính chủ và +10.000 credits đã được kích hoạt!`,
      });
    }

    // 5. If pending review
    return NextResponse.json({
      success: true,
      status: "pending_review",
      isAutoApproved: false,
      ocr,
      record: verificationRecord,
      message: `Hệ thống đã tiếp nhận hồ sơ thẻ ngành của Thầy/Cô (${ocr.fullName} - ${ocr.schoolOrOrganization}). Do ảnh chụp hoặc thông tin cần đối soát thêm, Admin sẽ phê duyệt hồ sơ trong vòng 24h.`,
    });
  } catch (error: any) {
    console.error("API /api/verification/upload error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xác thực thẻ ngành: " + error.message },
      { status: 500 }
    );
  }
}
