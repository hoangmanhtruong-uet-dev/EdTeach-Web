import { NextRequest, NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/ai/gemini-client";
import { createClient } from "@/lib/supabase/server";
import { isMaxUser } from "@/lib/payment/plans";

const COST_PER_CALL = 50; // 50 credits mỗi lượt gọi AI

export async function POST(req: NextRequest) {
  try {
    const db = await createClient();
    const { data: { user } } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để sử dụng tính năng AI." }, { status: 401 });
    }

    // 1. Kiểm tra số dư ví credits
    const { data: wallet } = await (db.from("wallets") as any)
      .select("id, balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = wallet?.balance ?? 0;
    if (balance < COST_PER_CALL) {
      return NextResponse.json(
        {
          error: `Số dư credits không đủ để thực hiện tính năng AI này (Cần ${COST_PER_CALL} credits, số dư hiện tại: ${balance.toLocaleString()} credits). Thầy/Cô vui lòng nạp thêm credits tại mục Ví tài khoản.`,
          remaining_credits: balance,
          required_credits: COST_PER_CALL,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { question, options, subject, grade, currentAnswer, explanation } = body;

    if (!question) {
      return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
    }

    // 2. Xác định hạng người dùng để định tuyến API Key Paid hay Free
    const { data: profile } = await (db.from("users") as any)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const isMax = isMaxUser(profile);
    if (!isMax) {
      return NextResponse.json(
        {
          error: "TIER_UPGRADE_REQUIRED",
          message: "Tính năng sư phạm nâng cao này là đặc quyền dành riêng cho Gói Luyện Thi MAX. Vui lòng nâng cấp để sử dụng.",
        },
        { status: 403 }
      );
    }

    const prompt = `
Bạn là chuyên gia ra đề thi THPT Quốc Gia môn ${subject || "Toán"} lớp ${grade || "12"} chuẩn Bộ GD&ĐT 2025.
Dưới đây là một câu hỏi gốc mà giáo viên vừa giảng xong trên lớp:

[CÂU HỎI GỐC]:
${question}

[CÁC PHƯƠNG ÁN GỐC]:
${Array.isArray(options) ? options.join("\n") : "Không có"}

[ĐÁP ÁN ĐÚNG HIỆN TẠI]: ${currentAnswer || "Chưa rõ"}

NHIỆM VỤ CỦA BẠN (TÍNH NĂNG ĐẺ CÂU TƯƠNG TỰ TẠI CHỖ CHO HỌC SINH LUYỆN TẬP 2 PHÚT):
Hãy tạo ra 1 CÂU HỎI MỚI TINH có các đặc tính sau:
1. Giữ nguyên 100% dạng bài toán, hiện tượng vật lý/hóa học/toán học và ma trận độ khó của câu gốc.
2. Thay đổi toàn bộ số liệu, bối cảnh bài toán, công thức hoặc chất hóa học (đảm bảo số liệu đẹp, giải ra kết quả hợp lý không bị lẻ vô lý).
3. Tạo 4 phương án trắc nghiệm A, B, C, D mới với 3 phương án gây nhiễu được tính toán theo các lỗi sai phổ biến của học sinh.
4. Cung cấp đáp án đúng và lời giải tóm tắt 3 dòng để giáo viên chữa nhanh.
5. Công thức toán học/ký hiệu viết bằng LaTeX kẹp giữa dấu $ (ví dụ $x^2 + 2x - 3 = 0$, $V = 22,4$ lít).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON với cấu trúc:
{
  "content": "Nội dung câu hỏi mới...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct_answer": "A",
  "explanation": "Hướng dẫn giải nhanh cho câu mới..."
}
`;

    const result = await callGeminiJson(prompt, ["gemini-flash-lite-latest", "gemini-flash-latest"], "max");

    // 3. Trừ ${COST_PER_CALL} credits sau khi sinh kết quả thành công
    try {
      await (db.rpc as any)("deduct_user_credits", {
        p_user_id: user.id,
        p_amount: COST_PER_CALL,
        p_description: "Đẻ câu tương tự tại chỗ trên Bục Giảng Số",
      });
    } catch {
      if (wallet?.id) {
        await (db.from("wallets") as any)
          .update({ balance: Math.max(0, balance - COST_PER_CALL) })
          .eq("id", wallet.id);
      }
    }

    return NextResponse.json({ success: true, question: result });
  } catch (error: any) {
    console.error("Đẻ câu tương tự tại chỗ error:", error);
    const msg = error.name === "AbortError"
      ? "Quá thời gian phản hồi từ máy chủ AI. Vui lòng bấm thử lại."
      : error.message || "Không thể thực hiện yêu cầu AI.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
