import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  performTeacherCardOCR,
  performTutorDualCardOCR,
  isNameMatching,
  saveVerificationRecord,
  rewardVerifiedTeacher,
  TeacherVerificationRecord,
} from "@/lib/verification/ocr-engine";
import { notifyAdminNewVerification } from "@/lib/email/admin-notifier";

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra session đăng nhập bắt buộc
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để gửi hồ sơ xác thực danh tính." },
        { status: 401 }
      );
    }

    const userId = user.id; // Luôn sử dụng ID từ session có xác thực
    const adminClient = createAdminClient() || supabase;

    // 2. Chống gửi lặp: Kiểm tra nếu tài khoản đã có Tích Xanh hoặc đã nhận thưởng eKYC
    const { data: userProfile } = await (adminClient.from("users") as any)
      .select("is_verified_teacher, ekyc_rewarded_at, name")
      .eq("id", userId)
      .maybeSingle();

    if (userProfile?.is_verified_teacher || userProfile?.ekyc_rewarded_at) {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã được xác thực giáo viên chính chủ thành công trước đó." },
        { status: 400 }
      );
    }

    // 3. Chống spam: Kiểm tra xem tài khoản có hồ sơ đang chờ xét duyệt hay không
    const { data: pendingRecord } = await (adminClient.from("teacher_verifications") as any)
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("status", "pending_review")
      .maybeSingle();

    if (pendingRecord) {
      return NextResponse.json(
        { error: "Hồ sơ của bạn đang được ban quản trị xét duyệt (tối đa 24h). Vui lòng không nộp lại liên tục." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const userName = (formData.get("userName") as string | null) || userProfile?.name || user.email?.split("@")[0] || "Thầy Cô";
    const roleCategory = ((formData.get("roleCategory") as string) || "teacher").toLowerCase();
    const documentType = (formData.get("documentType") as any) || (roleCategory === "tutor" ? "student_card" : "teacher_card");

    // Helper to extract base64 and mime from file or base64 string
    const extractImage = async (fileObj: File | null, base64Field: string | null) => {
      if (fileObj) {
        const bytes = await fileObj.arrayBuffer();
        const buffer = Buffer.from(bytes);
        return {
          base64: buffer.toString("base64"),
          mimeType: fileObj.type || "image/jpeg",
        };
      }
      if (base64Field) {
        let mime = "image/jpeg";
        const match = base64Field.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
        if (match) mime = match[1];
        return {
          base64: base64Field.replace(/^data:image\/[a-z]+;base64,/, ""),
          mimeType: mime,
        };
      }
      return null;
    };

    // ==========================================
    // CASE A: TUTOR VERIFICATION (Thẻ SV + CCCD)
    // ==========================================
    if (roleCategory === "tutor") {
      const studentCardFile = (formData.get("studentCardFile") || formData.get("file")) as File | null;
      const studentCardBase64Field = (formData.get("studentCardBase64") || formData.get("imageBase64")) as string | null;
      const cccdFile = formData.get("cccdFile") as File | null;
      const cccdBase64Field = formData.get("cccdBase64") as string | null;

      const studentCardImg = await extractImage(studentCardFile, studentCardBase64Field);
      const cccdImg = await extractImage(cccdFile, cccdBase64Field);

      if (!studentCardImg || !cccdImg) {
        return NextResponse.json(
          { error: "Xác thực gia sư yêu cầu tải lên đủ cả 2 ảnh: Thẻ sinh viên (hoặc bằng cấp ĐH) và Mặt trước CCCD." },
          { status: 400 }
        );
      }

      // Run Dual OCR
      const ocr = await performTutorDualCardOCR(
        studentCardImg.base64,
        studentCardImg.mimeType,
        cccdImg.base64,
        cccdImg.mimeType,
        userName || undefined
      );

      // Chỉ tự động duyệt khi tài liệu hợp lệ, độ tin cậy >= 0.85 và đối soát chéo họ tên khớp
      const isAutoApproved = ocr.isValidDocument && ocr.finalConfidence >= 0.85 && ocr.isNameCrossMatched && ocr.isAccountNameMatched;
      const recordId = crypto.randomUUID();
      const recordStatus = isAutoApproved ? "approved" : "pending_review";

      const verificationRecord: TeacherVerificationRecord = {
        id: recordId,
        userId,
        documentType: "student_card",
        imageUrl: `data:${studentCardImg.mimeType};base64,${studentCardImg.base64.slice(0, 100)}...`,
        status: recordStatus,
        ocrExtractedName: ocr.studentCard.fullName || ocr.cccdCard.fullName,
        ocrExtractedSchool: ocr.studentCard.university,
        ocrExtractedCode: ocr.studentCard.studentCode,
        ocrConfidence: ocr.finalConfidence,
        roleCategory: "tutor",
        cccdImageUrl: `data:${cccdImg.mimeType};base64,${cccdImg.base64.slice(0, 100)}...`,
        cccdNumber: ocr.cccdCard.cccdNumber,
        isCrossMatched: ocr.isNameCrossMatched,
        reviewedAt: isAutoApproved ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveVerificationRecord(verificationRecord);

      if (isAutoApproved) {
        await rewardVerifiedTeacher({
          userId,
          schoolName: ocr.studentCard.university || "Đại học Sư phạm / Cử nhân",
          teacherCode: ocr.studentCard.studentCode || ocr.cccdCard.cccdNumber,
          roleCategory: "tutor",
          verificationId: recordId,
        });

        return NextResponse.json({
          success: true,
          status: "approved",
          isAutoApproved: true,
          ocr,
          record: verificationRecord,
          message: `Chúc mừng Gia sư! AI đã đối soát & xác thực thành công Thẻ sinh viên và CCCD của ${ocr.studentCard.fullName} (${ocr.studentCard.university}). Tích Xanh Gia sư và +10.000 credits đã được kích hoạt!`,
        });
      }

      return NextResponse.json({
        success: true,
        status: "pending_review",
        isAutoApproved: false,
        ocr,
        record: verificationRecord,
        message: `Hệ thống đã tiếp nhận hồ sơ gia sư của bạn (${ocr.studentCard.fullName || userName} - ${ocr.studentCard.university}). Do thông tin cần kiểm chứng thêm, Admin sẽ phê duyệt hồ sơ trong vòng 24h.`,
      });
    }

    // ==========================================
    // CASE B: TEACHER VERIFICATION (Thẻ ngành GV)
    // ==========================================
    const teacherFile = formData.get("file") as File | null;
    const teacherBase64Field = formData.get("imageBase64") as string | null;

    const teacherImg = await extractImage(teacherFile, teacherBase64Field);
    if (!teacherImg) {
      return NextResponse.json(
        { error: "Vui lòng chọn hoặc chụp ảnh thẻ ngành / văn bằng giáo viên." },
        { status: 400 }
      );
    }

    // 1. Phân tích OCR trợ giúp đối soát (chỉ trích xuất thông tin, KHÔNG tự động duyệt)
    let ocr: any = null;
    try {
      ocr = await performTeacherCardOCR(teacherImg.base64, teacherImg.mimeType, userName || undefined);
    } catch (ocrErr) {
      console.warn("OCR metadata extraction warning:", ocrErr);
    }

    const recordId = crypto.randomUUID();
    // Bỏ agent tự động duyệt - Mọi hồ sơ thẻ ngành đều chuyển sang 'pending_review' để Admin phê duyệt thủ công
    const recordStatus = "pending_review";

    const verificationRecord: TeacherVerificationRecord = {
      id: recordId,
      userId,
      documentType,
      imageUrl: `data:${teacherImg.mimeType};base64,${teacherImg.base64.slice(0, 100)}...`,
      status: recordStatus,
      ocrExtractedName: ocr?.fullName || userName,
      ocrExtractedSchool: ocr?.schoolOrOrganization || "Đơn vị giáo dục",
      ocrExtractedCode: ocr?.cardNumber || "",
      ocrConfidence: ocr?.confidenceScore || 0,
      roleCategory: "teacher",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Lưu hồ sơ vào cơ sở dữ liệu
    await saveVerificationRecord(verificationRecord);

    // 3. Gửi email thông báo tới Ban Quản Trị để phê duyệt thủ công
    try {
      await notifyAdminNewVerification({
        userId,
        userName: ocr?.fullName || userName || "Thầy Cô",
        userEmail: user.email,
        schoolName: ocr?.schoolOrOrganization || "Đơn vị giáo dục",
        documentType,
        verificationId: recordId,
      });
    } catch (mailErr) {
      console.warn("Admin notification warning:", mailErr);
    }

    // 4. Trả về thông báo tiếp nhận thành công
    return NextResponse.json({
      success: true,
      status: "pending_review",
      isAutoApproved: false,
      ocr,
      record: verificationRecord,
      message: `Hệ thống đã tiếp nhận hồ sơ thẻ ngành của Thầy/Cô thành công! Ban Quản Trị đã nhận được thông báo qua email và sẽ tiến hành đối soát, phê duyệt thủ công cho Thầy/Cô trong vòng 24 giờ.`,
    });
  } catch (error: any) {
    console.error("API /api/verification/upload error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xác thực hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}
