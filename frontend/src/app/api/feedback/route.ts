import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null;
    let userName: string | null = null;
    let userEmail: string | null = null;
    let userRole = "teacher";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        userEmail = user.email || null;
        userName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          null;
        userRole = user.user_metadata?.role || "teacher";
      }
    } catch {
      // fallback
    }

    const body = await req.json();
    const {
      category = "feature_request",
      title = "",
      content,
      pageUrl,
      email,
      metadata = {},
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung góp ý hoặc mô tả lỗi." },
        { status: 400 }
      );
    }

    const feedbackItem = {
      user_id: userId,
      user_name: userName || "Người dùng ẩn danh",
      user_email: email || userEmail || "Chưa cung cấp",
      role: userRole,
      category: category.slice(0, 64),
      title: (title || "").slice(0, 200),
      content: content.trim(),
      page_url: pageUrl || null,
      metadata: metadata,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      await (supabase.from("in_app_feedback") as any).insert(feedbackItem);
    } catch (dbErr) {
      console.warn("[Feedback API] DB insert note:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cảm ơn Thầy/Cô và các bạn đã gửi góp ý! Đội ngũ kỹ thuật EduTest AI sẽ xử lý trong thời gian sớm nhất.",
      feedback: feedbackItem,
    });
  } catch (err: any) {
    console.error("[Feedback API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi gửi phản hồi." },
      { status: 500 }
    );
  }
}
