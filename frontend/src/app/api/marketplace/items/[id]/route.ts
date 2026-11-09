import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  marketplaceItemsStore,
  marketplacePurchasesStore,
} from "@/lib/marketplace/marketplace-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Thử lấy từ Supabase DB
    let item: any = null;
    try {
      const { data, error } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        item = data;
      }
    } catch {
      // Fallback memory
    }

    if (!item) {
      item = marketplaceItemsStore.get(id);
    }

    if (!item) {
      return NextResponse.json({ error: "Không tìm thấy đề thi này trên chợ." }, { status: 404 });
    }

    // 2. Xác định user hiện tại
    let currentUserId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) currentUserId = user.id;
    } catch {
      // Bỏ qua
    }

    // 3. Kiểm tra quyền sở hữu
    const isOwner = !!currentUserId && item.seller_id === currentUserId;
    let isPurchased = isOwner || item.price_credits === 0;

    if (!isPurchased && currentUserId) {
      try {
        const { data: purchase } = await supabase
          .from("marketplace_purchases")
          .select("id")
          .eq("buyer_id", currentUserId)
          .eq("item_id", id)
          .maybeSingle();

        if (purchase) isPurchased = true;
      } catch {
        // Fallback memory
        if (marketplacePurchasesStore.some((p) => p.item_id === id && p.buyer_id === currentUserId)) {
          isPurchased = true;
        }
      }
    }

    if (isPurchased) {
      // Người mua hoặc tác giả: nhận full 100% câu hỏi + đáp án + giải thích từ marketplace_item_contents
      let fullExamData = item.exam_data;
      if (!fullExamData || Object.keys(fullExamData).length === 0 || !fullExamData.questions || fullExamData.questions.length === 0) {
        try {
          const { data: contents } = await (supabase
            .from("marketplace_item_contents") as any)
            .select("exam_data")
            .eq("item_id", id)
            .maybeSingle();

          const contentData = contents as { exam_data?: any } | null;
          if (contentData?.exam_data && typeof contentData.exam_data === "object") {
            fullExamData = contentData.exam_data;
          }
        } catch (contentsErr) {
          console.warn("[marketplace items id] Error fetching marketplace_item_contents:", contentsErr);
        }
      }

      return NextResponse.json({
        success: true,
        item: {
          ...item,
          exam_data: fullExamData,
          is_owner: isOwner,
          is_purchased: true,
        },
      });
    }

    // Chưa mua: chỉ trả preview_data (đã ẩn đáp án)
    const { exam_data, ...publicItem } = item;
    return NextResponse.json({
      success: true,
      item: {
        ...publicItem,
        is_owner: false,
        is_purchased: false,
      },
    });
  } catch (err: any) {
    console.error("Lỗi tải thông tin đề thi:", err);
    // Sanitize error: do not return error: err.message
    return NextResponse.json(
      { error: "Không thể tải thông tin đề thi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
