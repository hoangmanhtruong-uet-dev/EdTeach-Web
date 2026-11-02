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
Bạn là chuyên gia giảng dạy và thủ khoa luyện thi môn ${subject || "Toán"} lớp ${grade || "12"} chuẩn Bộ GD&ĐT 2025.
Dưới đây là một câu hỏi trắc nghiệm cần giải thích chuyên sâu cho giáo viên dùng làm tư liệu trình chiếu trên lớp:

[CÂU HỎI]:
${question}

[CÁC PHƯƠNG ÁN]:
${Array.isArray(options) ? options.join("\n") : "Không có"}

[ĐÁP ÁN ĐÚNG]: ${currentAnswer || "Chưa rõ"}
[LỜI GIẢI GỐC NẾU CÓ]: ${explanation || "Không có"}

NHIỆM VỤ CỦA BẠN (TÍNH NĂNG GIẢI ĐA CÁCH CHUYÊN SÂU):
Hãy cung cấp 3 PHƯƠNG PHÁP GIẢI KHÁC NHAU cho câu hỏi này để giáo viên mở rộng góc nhìn cho học sinh:

1. PHƯƠNG PHÁP 1: "Tự luận Bản chất"
   - Trình bày bài bản, chặt chẽ từng bước theo sách giáo khoa và bản chất khoa học.
   - Giúp học sinh nắm vững lý thuyết, không bị rơi vào bẫy câu hỏi thay đổi dữ kiện.

2. PHƯƠNG PHÁP 2: "Tuyệt kỹ 15s Trắc nghiệm & Loại trừ"
   - Áp dụng các định luật bảo toàn, công thức giải nhanh kinh điển, phương pháp đánh giá biên, chuẩn hóa số liệu hoặc phân tích loại trừ đáp án vô lý chỉ trong 15-30 giây.

3. PHƯƠNG PHÁP 3: "Bấm máy Casio fx-580 / fx-880" (Nếu bài lý thuyết không bấm được máy tính, hãy thay bằng "Mẹo ghi nhớ nhanh & Quy tắc bàn tay/vần thơ")
   - Hướng dẫn cụ thể từng bước phím bấm (ví dụ: MENU 8, SHIFT SOLVE, gán biến A, B...) hoặc mẹo nhớ siêu tốc để tìm ra đáp án.

Công thức toán học/ký hiệu viết bằng LaTeX kẹp giữa dấu $ (ví dụ $\\int f(x)dx$).

TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON với cấu trúc:
{
  "methods": [
    {
      "id": "tu-luan",
      "name": "Cách 1: Tự luận bản chất",
      "badge": "Bản chất GDPT 2018",
      "summary": "Tóm tắt ngắn 1 dòng về ý tưởng...",
      "content": "Nội dung chi tiết lời giải tự luận..."
    },
    {
      "id": "trac-nghiem",
      "name": "Cách 2: Tuyệt kỹ 15s Trắc nghiệm",
      "badge": "Giải nhanh 15 giây",
      "summary": "Công thức giải nhanh hoặc mẹo loại trừ...",
      "content": "Nội dung chi tiết cách giải nhanh..."
    },
    {
      "id": "casio",
      "name": "Cách 3: Thủ thuật Casio fx-580 / Mẹo nhớ",
      "badge": "Thủ thuật máy tính",
      "summary": "Quy trình bấm phím hoặc mẹo nhớ...",
      "content": "Chi tiết thao tác phím bấm..."
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
        p_description: "Giải đa cách chuyên sâu trên Bục Giảng Số",
      });
    } catch {
      if (wallet?.id) {
        await (db.from("wallets") as any)
          .update({ balance: Math.max(0, balance - COST_PER_CALL) })
          .eq("id", wallet.id);
      }
    }

    return NextResponse.json({ success: true, solutions: result });
  } catch (error: any) {
    console.error("Giải đa cách chuyên sâu error:", error);
    const msg = error.name === "AbortError"
      ? "Quá thời gian phản hồi từ máy chủ AI. Vui lòng bấm thử lại."
      : error.message || "Không thể thực hiện yêu cầu AI.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
