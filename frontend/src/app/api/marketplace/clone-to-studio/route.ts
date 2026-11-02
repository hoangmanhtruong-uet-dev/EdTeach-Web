import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json({ error: "Thiếu mã đề thi." }, { status: 400 });
    }

    // 1. Lấy đề thi từ Supabase DB hoặc memory
    let item: any = null;
    try {
      const { data, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("id", item_id)
        .maybeSingle();

      if (!error && data) {
        item = data;
      }
    } catch {
      // Fallback memory
    }

    if (!item) {
      item = marketplaceItemsStore.get(item_id);
    }

    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi trên chợ." }, { status: 404 });
    }

    // 2. Kiểm tra quyền sở hữu hoặc đã mua
    const isOwner = item.seller_id === user.id;
    const isFree = item.price_credits === 0;
    let isPurchased = isOwner || isFree;

    if (!isPurchased) {
      try {
        const { data: purchase } = await supabase
          .from("marketplace_purchases")
          .select("id")
          .eq("buyer_id", user.id)
          .eq("item_id", item_id)
          .maybeSingle();

        if (purchase) isPurchased = true;
      } catch {
        if (marketplacePurchasesStore.some((p) => p.item_id === item_id && p.buyer_id === user.id)) {
          isPurchased = true;
        }
      }
    }

    if (!isPurchased) {
      return NextResponse.json(
        { error: "Thầy/Cô cần mở khóa bộ đề này trước khi sao chép vào Studio." },
        { status: 403 }
      );
    }

    let examData = item.exam_data;
    if (!examData || Object.keys(examData).length === 0 || !examData.questions || examData.questions.length === 0) {
      try {
        const { data: contents } = await (supabase
          .from("marketplace_item_contents") as any)
          .select("exam_data")
          .eq("item_id", item_id)
          .maybeSingle();

        const contentData = contents as { exam_data?: any } | null;
        if (contentData?.exam_data && typeof contentData.exam_data === "object") {
          examData = contentData.exam_data;
        }
      } catch (contentsErr) {
        console.warn("[clone-to-studio] Error fetching marketplace_item_contents:", contentsErr);
      }
    }

    const questions: any[] = examData?.questions || [];

    // 3. Tạo bản ghi THẬT trong bảng exams (Sprint MP-1 Fix U10 & A9)
    const newExamData = {
      user_id: user.id,
      name: `[Chợ Đề Thi] ${item.title}`,
      subject: item.subject,
      grade: item.grade.toString(),
      chapter: `Bản quyền từ: ${item.seller_name}`,
      status: "completed" as const,
      credit_cost: 0,
      question_count: questions.length || item.question_count || 20,
      config: {
        cloned_from_marketplace_id: item.id,
        seller_name: item.seller_name,
        cloned_at: new Date().toISOString(),
      },
    };

    const { data: createdExam, error: examError } = await (supabase.from("exams") as any)
      .insert(newExamData)
      .select()
      .single();

    if (examError || !createdExam) {
      console.error("Lỗi insert exams:", examError);
      return NextResponse.json(
        { error: "Không thể tạo bản ghi đề thi mới: " + (examError?.message || "Lỗi DB") },
        { status: 500 }
      );
    }

    const createdExamId = createdExam.id;

    // 4. Chèn từng câu hỏi thật vào questions table
    if (questions.length > 0) {
      const insertQuestions = questions.map((q: any, idx: number) => ({
        exam_id: createdExamId,
        type: q.type || "multiple_choice",
        content: q.content || "",
        options: q.options || [],
        correct_answer: q.correct_answer || "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        order_index: q.order ?? q.order_index ?? idx + 1,
      }));

      const { error: qError } = await (supabase.from("questions") as any).insert(insertQuestions);
      if (qError) {
        console.warn("Lỗi insert questions:", qError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Đã sao chép đề thi vào kho cá nhân của Thầy/Cô thành công!",
      exam_id: createdExamId,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/clone-to-studio:", err);
    return NextResponse.json({ error: "Lỗi sao chép đề: " + err.message }, { status: 500 });
  }
}
