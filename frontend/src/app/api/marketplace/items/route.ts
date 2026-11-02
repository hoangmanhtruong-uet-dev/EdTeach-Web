import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";
import { MarketplaceItem } from "@/types/marketplace";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") || "all";
    const grade = searchParams.get("grade") || "all";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const tab = searchParams.get("tab") || "browse";

    let currentUserId: string | null = null;
    let supabase: any = null;
    try {
      supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        currentUserId = user.id;
      }
    } catch {
      // Bỏ qua nếu chưa login
    }

    // 1. Lấy trực tiếp từ Supabase DB (Single source of truth)
    let itemsFromDb: MarketplaceItem[] | null = null;
    if (supabase) {
      try {
        let query = supabase.from("marketplace_items").select("*").eq("status", "published");
        if (subject !== "all") query = query.eq("subject", subject);
        if (grade !== "all") query = query.eq("grade", parseInt(grade, 10));

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          itemsFromDb = data as MarketplaceItem[];
        }
      } catch (dbErr) {
        console.warn("Lỗi đọc Supabase marketplace_items, dùng memory fallback:", dbErr);
      }
    }

    // 2. Nguồn dữ liệu kết hợp (Ưu tiên DB, fallback sang memory nếu DB trống)
    const allItems: MarketplaceItem[] =
      itemsFromDb && itemsFromDb.length > 0
        ? itemsFromDb
        : Array.from(marketplaceItemsStore.values());

    // 3. Lọc theo search, subject, grade
    let filtered = allItems.filter((item) => {
      const matchSubject = subject === "all" || item.subject === subject;
      const matchGrade = grade === "all" || item.grade.toString() === grade;
      const matchSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.seller_name.toLowerCase().includes(search) ||
        (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(search)));

      return matchSubject && matchGrade && matchSearch;
    });

    // 4. Kiểm tra quyền sở hữu và đã mua qua Supabase DB
    const purchasedIds = new Set<string>();
    if (currentUserId && supabase) {
      try {
        const { data: dbPurchases } = await supabase
          .from("marketplace_purchases")
          .select("item_id")
          .eq("buyer_id", currentUserId);

        if (Array.isArray(dbPurchases)) {
          dbPurchases.forEach((p: any) => purchasedIds.add(p.item_id));
        }
      } catch {
        // Fallback RAM
        marketplacePurchasesStore.forEach((p) => {
          if (p.buyer_id === currentUserId) purchasedIds.add(p.item_id);
        });
      }
    }

    filtered = filtered.map((item) => {
      const isOwner = !!currentUserId && item.seller_id === currentUserId;
      const isPurchased = isOwner || (!!currentUserId && purchasedIds.has(item.id)) || item.price_credits === 0;

      // Không trả exam_data đầy đủ ở danh sách để bảo mật bản quyền (Audit S2)
      const { exam_data, ...publicItem } = item;
      return {
        ...publicItem,
        is_owner: isOwner,
        is_purchased: isPurchased,
      };
    });

    // 5. Lọc theo Tab
    if (tab === "purchased") {
      filtered = filtered.filter((i) => i.is_purchased);
    } else if (tab === "my_listings") {
      filtered = filtered.filter((i) => i.is_owner);
    }

    return NextResponse.json({
      success: true,
      items: filtered,
      total: filtered.length,
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/marketplace/items:", err);
    return NextResponse.json({ error: "Lỗi tải danh sách đề thi: " + err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để đăng bán đề thi." }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      subject,
      grade,
      description,
      price_credits,
      tags,
      questions,
      exam_id,
      examId,
    } = body;

    if (!title || !subject || !grade || price_credits === undefined) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ tiêu đề, môn học, khối lớp và giá bán." },
        { status: 400 }
      );
    }

    // Xác định thông tin người bán
    let sellerName = user.user_metadata?.name || user.email?.split("@")[0] || "Giáo viên EduTest";
    let sellerTier: "free" | "pro" | "max" = "free";

    try {
      const { data: profile } = await (supabase
        .from("users") as any)
        .select("name, tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if ((profile as any).name) sellerName = (profile as any).name;
        if ((profile as any).tier === "max") sellerTier = "max";
        else if ((profile as any).tier === "pro") sellerTier = "pro";
      }
    } catch {
      // Dùng fallback
    }

    let fullQuestions: any[] = Array.isArray(questions) ? questions : [];

    // MKT-06 / MKT-04: Trích xuất câu hỏi thật từ CSDL nếu người dùng đăng bán từ đề có sẵn
    const sourceExamId = exam_id || examId;
    if (fullQuestions.length === 0 && sourceExamId) {
      try {
        const { data: dbQuestions } = await (supabase
          .from("questions") as any)
          .select("*")
          .eq("exam_id", sourceExamId)
          .order("order_index", { ascending: true });

        if (dbQuestions && dbQuestions.length > 0) {
          fullQuestions = dbQuestions.map((q: any, idx: number) => ({
            id: q.id,
            order: q.order_index ?? idx + 1,
            type: q.type || "multiple_choice",
            content: q.content,
            options: q.options || [],
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty || "medium",
          }));
        } else {
          // Thử trích xuất từ config của đề thi
          const { data: dbExam } = await (supabase
            .from("exams") as any)
            .select("config")
            .eq("id", sourceExamId)
            .maybeSingle();

          if (dbExam?.config?.questions && Array.isArray(dbExam.config.questions)) {
            fullQuestions = dbExam.config.questions;
          }
        }
      } catch (qErr) {
        console.warn("[marketplace items POST] Failed to fetch questions for exam_id:", qErr);
      }
    }
    const sampleQuestions = fullQuestions.slice(0, 3).map((q: any, idx: number) => ({
      id: q.id || `sample-${idx + 1}`,
      order: q.order || idx + 1,
      type: q.type || "multiple_choice",
      content: q.content,
      options: q.options || [],
      difficulty: q.difficulty || "medium",
    }));

    // Chuẩn hóa UUID chuẩn Postgres (Sprint MP-1 Fix U1 & A2)
    const newId = crypto.randomUUID();

    const newItem: MarketplaceItem = {
      id: newId,
      seller_id: user.id,
      seller_name: sellerName,
      seller_tier: sellerTier,
      title: title.trim(),
      subject: subject.trim(),
      grade: parseInt(grade, 10) || 12,
      description: description?.trim() || `Bộ đề thi môn ${subject} lớp ${grade} chất lượng cao chuẩn GDPT 2025.`,
      price_credits: Math.max(0, parseInt(price_credits, 10)),
      question_count: fullQuestions.length || 20,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [`${subject}`, `Lop${grade}`, "ChuanGDPT2025"],
      downloads_count: 0,
      rating: 5.0,
      review_count: 0,
      status: "published",
      created_at: new Date().toISOString(),
      preview_data: {
        matrix: {
          total_questions: fullQuestions.length || 20,
          multiple_choice_count: fullQuestions.filter((q: any) => q.type === "multiple_choice").length || 15,
          true_false_count: fullQuestions.filter((q: any) => q.type === "true_false").length || 3,
          short_answer_count: fullQuestions.filter((q: any) => q.type === "short_answer").length || 2,
          difficulty_distribution: {
            easy: Math.ceil(fullQuestions.length * 0.4) || 8,
            medium: Math.ceil(fullQuestions.length * 0.4) || 8,
            hard: Math.floor(fullQuestions.length * 0.15) || 3,
            very_hard: Math.floor(fullQuestions.length * 0.05) || 1,
          },
          duration_minutes: 50,
        },
        sample_questions: sampleQuestions,
      },
      exam_data: {
        questions: fullQuestions,
      },
    };

    // 1. Lưu trực tiếp vào Supabase database (UUID chuẩn)
    try {
      const { error: insertError } = await (supabase.from("marketplace_items") as any).insert({
        id: newItem.id,
        seller_id: newItem.seller_id,
        seller_name: newItem.seller_name,
        seller_tier: newItem.seller_tier,
        title: newItem.title,
        subject: newItem.subject,
        grade: newItem.grade,
        description: newItem.description,
        price_credits: newItem.price_credits,
        question_count: newItem.question_count,
        tags: newItem.tags,
        preview_data: newItem.preview_data,
        exam_data: newItem.exam_data,
        downloads_count: 0,
        rating: 5.0,
        status: "published",
      });

      if (insertError) {
        console.warn("Lưu Supabase marketplace_items có lỗi, dùng memory fallback:", insertError.message);
      }

      // Đảm bảo nội dung câu hỏi được lưu vào marketplace_item_contents (SEC-01 & MKT-06)
      await (supabase.from("marketplace_item_contents") as any).upsert({
        item_id: newItem.id,
        exam_data: newItem.exam_data,
        updated_at: new Date().toISOString(),
      });
    } catch (e: any) {
      console.warn("Lỗi kết nối Supabase khi insert:", e.message);
    }

    // 2. Lưu vào memory store làm bộ đệm
    marketplaceItemsStore.set(newItem.id, newItem);

    return NextResponse.json({
      success: true,
      message: "Đăng tải đề thi lên Chợ thành công!",
      item: newItem,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/items:", err);
    return NextResponse.json({ error: "Lỗi đăng bán đề thi: " + err.message }, { status: 500 });
  }
}
