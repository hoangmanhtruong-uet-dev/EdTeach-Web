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
Bạn là chuyên gia sư phạm dạy học sinh giỏi và luyện thi THPT Quốc Gia môn ${subject || "Toán"} lớp ${grade || "12"} chuẩn Bộ GD&ĐT 2025.
Dưới đây là một bài toán/câu hỏi khó vận dụng/vận dụng cao mà học sinh trên lớp đang bị "ngợp" hoặc chưa tìm ra hướng tư duy:

[CÂU HỎI]:
${question}

[CÁC PHƯƠNG ÁN]:
${Array.isArray(options) ? options.join("\n") : "Không có"}

[ĐÁP ÁN ĐÚNG NẾU CÓ]: ${currentAnswer || "Chưa rõ"}

NHIỆM VỤ CỦA BẠN (TÍNH NĂNG BẺ NHỎ BÀI TOÁN - SCAFFOLDING GỢI MỞ 3 BƯỚC):
Hãy bẻ nhỏ bài toán phức tạp này thành đúng 3 BƯỚC DẪN DẮT SƯ PHẠM liên hoàn để giáo viên chiếu dần lên bảng, giúp học sinh tự tư duy từ gốc tới ngọn:

- Bước 1 (Nhận diện & Khai thác giả thiết): Đặt 1 câu hỏi phụ hoặc gợi mở then chốt về việc tóm tắt, đổi đơn vị, nhận diện định lý/hiện tượng hoặc tìm đại lượng trung gian đầu tiên. Kèm câu trả lời ngắn cho Bước 1.
- Bước 2 (Thiết lập mô hình / Phương trình then chốt): Hướng dẫn kết nối dữ liệu ở Bước 1 vào công thức, phương trình, hệ thức hoặc định luật bảo toàn chủ chốt. Kèm hướng dẫn ngắn.
- Bước 3 (Biện luận & Chốt kết quả): Dẫn dắt thế số, triệt tiêu nghiệm ngoại lai hoặc kết luận phương án đúng cuối cùng. Kèm đáp số.

Mọi công thức LaTeX kẹp trong $ (ví dụ $x_1 + x_2 = -b/a$).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON với cấu trúc:
{
  "steps": [
    {
      "step_number": 1,
      "title": "Bước 1: Khai thác giả thiết & Dữ kiện ẩn",
      "question": "Câu hỏi phụ dẫn dắt cho học sinh suy nghĩ...",
      "hint": "Gợi ý hoặc đáp án cho bước 1..."
    },
    {
      "step_number": 2,
      "title": "Bước 2: Thiết lập phương trình / Hệ thức cốt lõi",
      "question": "Câu hỏi phụ bước 2...",
      "hint": "Gợi ý hoặc công thức liên hệ bước 2..."
    },
    {
      "step_number": 3,
      "title": "Bước 3: Giải toán & Chốt đáp số",
      "question": "Câu hỏi chốt hạ kết quả...",
      "hint": "Kết luận và phương án đúng..."
    }
  ]
}
`;

    const result = await callGeminiJson(prompt, ["gemini-flash-lite-latest", "gemini-flash-latest"], "max");

    // 3. Trừ ${COST_PER_CALL} credits sau khi sinh kết quả thành công
    try {
      await (db.rpc as any)("deduct_user_credits", {
        p_user_id: user.id,
        p_amount: COST_PER_CALL,
        p_description: "Bẻ nhỏ bài toán 3 bước trên Bục Giảng Số",
      });
    } catch {
      if (wallet?.id) {
        await (db.from("wallets") as any)
          .update({ balance: Math.max(0, balance - COST_PER_CALL) })
          .eq("id", wallet.id);
      }
    }

    return NextResponse.json({ success: true, scaffolding: result });
  } catch (error: any) {
    console.error("Bẻ nhỏ bài toán 3 bước error:", error);
    const msg = error.name === "AbortError"
      ? "Quá thời gian phản hồi từ máy chủ AI. Vui lòng bấm thử lại."
      : error.message || "Không thể thực hiện yêu cầu AI.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
