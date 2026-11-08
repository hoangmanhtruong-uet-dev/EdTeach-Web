import { NextRequest, NextResponse } from "next/server";
import {
  generateRemediationToken,
  generateIsomorphicQuestions,
  saveRemediationSheet,
  RemediationSheetData,
} from "@/lib/remediation/remediation-store";
import { getBaseUrl } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isProUser } from "@/lib/payment/plans";

const REMEDIATION_CREDIT_COST = 100;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      sessionId,
      reportToken,
      studentId,
      studentName,
      studentCode,
      className,
      subject = "Toán",
      grade = "12",
      examTitle = "Bài kiểm tra định kỳ",
      wrongQuestions = [],
      customBranding,
    } = body;

    // 1. Phân quyền và Kiểm soát Hạn ngạch AI
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("tier, subscription_expires_at, email")
        .eq("id", user.id)
        .maybeSingle();

      const userProfile = profile || { email: user.email, tier: "free" };

      // Gói PRO / MAX: Được tạo phiếu luyện bù AI miễn phí không giới hạn
      if (!isProUser(userProfile)) {
        // Gói Free: Trừ 100 credits qua atomic RPC
        const { data: deductRes, error: deductErr } = await (supabase.rpc as any)(
          "deduct_user_credits",
          {
            p_amount: REMEDIATION_CREDIT_COST,
            p_description: `Sinh phiếu luyện bù AI cho học sinh ${studentName} (${subject})`,
          }
        );

        if (deductErr || (deductRes && deductRes.success === false)) {
          return NextResponse.json(
            {
              error: "INSUFFICIENT_CREDITS",
              message: `Thầy/Cô cần tối thiểu ${REMEDIATION_CREDIT_COST} credits để sinh bài luyện bù AI. Vui lòng nạp thêm hoặc nâng cấp Gói PRO để dùng không giới hạn!`,
            },
            { status: 402 }
          );
        }
      }
    } else {
      // Người dùng nặc danh: Bắt buộc phải có reportToken hợp lệ
      if (!reportToken) {
        return NextResponse.json(
          {
            error: "UNAUTHORIZED",
            message: "Vui lòng đăng nhập tài khoản Giáo viên hoặc truy cập qua mã phiếu báo điểm hợp lệ để tạo bài luyện bù.",
          },
          { status: 401 }
        );
      }

      // Giới hạn học sinh chỉ được sinh tối đa 2 lần/phiếu báo điểm để tránh spam AI
      const quotaKey = `token_remediation:${reportToken}`;
      const { data: quotaRes } = await (supabase.rpc as any)(
        "check_and_increment_quota",
        {
          p_key: quotaKey,
          p_user_id: null,
          p_action: "token_remediation",
          p_limit: 2,
        }
      );

      if (quotaRes && quotaRes.allowed === false) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message: "Phiếu báo điểm này đã được tạo bài luyện bù tối đa. Vui lòng liên hệ Thầy/Cô để được hỗ trợ.",
          },
          { status: 429 }
        );
      }
    }

    if (!sessionId || !studentId || !studentName) {
      return NextResponse.json(
        { error: "Thiếu thông tin session hoặc học sinh để tạo phiếu luyện bù." },
        { status: 400 }
      );
    }

    if (!Array.isArray(wrongQuestions) || wrongQuestions.length === 0) {
      return NextResponse.json(
        { error: "Học sinh không có câu làm sai nào cần luyện bù." },
        { status: 400 }
      );
    }

    // 2. Sinh câu hỏi đồng dạng bằng AI (Nice numbers, 3-step solution, Casio tips)
    const clonedQuestions = await generateIsomorphicQuestions({
      subject,
      grade,
      studentName,
      examTitle,
      targetQuestions: wrongQuestions,
    });

    // 3. Khởi tạo mã phiếu và lưu trữ
    const token = generateRemediationToken(sessionId, studentId);
    const sheetId = crypto.randomUUID();

    const sheetData: RemediationSheetData = {
      id: sheetId,
      token,
      sessionId,
      reportToken: reportToken || undefined,
      studentId,
      studentName,
      studentCode: studentCode || undefined,
      className: className || undefined,
      subject,
      grade,
      examTitle,
      targetQuestions: wrongQuestions,
      clonedQuestions,
      customBranding: customBranding || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveRemediationSheet(sheetData);

    const baseUrl = getBaseUrl(req);
    const practiceUrl = `${baseUrl}/practice/${token}`;

    return NextResponse.json({
      success: true,
      token,
      practiceUrl,
      totalCloned: clonedQuestions.length,
      sheet: sheetData,
    });
  } catch (error: any) {
    console.error("API /api/remediation/generate error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo phiếu luyện bù AI: " + error.message },
      { status: 500 }
    );
  }
}
