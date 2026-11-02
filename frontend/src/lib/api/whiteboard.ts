import { createClient } from "@/lib/supabase/client";
import { Whiteboard, WhiteboardInsert, WhiteboardUpdate } from "@/types/whiteboard";
import { WHITEBOARD_TEMPLATES } from "@/lib/whiteboard/templates";

export const FREE_TIER_MAX_BOARDS = 5;

/**
 * Lấy danh sách bảng vẽ của user hiện tại
 * Tối ưu hóa: Chỉ select các trường metadata, tránh overfetching mảng elements & files khổng lồ (WBD-05)
 */
export async function getUserWhiteboards(): Promise<Whiteboard[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await (supabase.from as any)("whiteboards")
    .select("id, user_id, title, description, thumbnail_url, is_favorite, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Lỗi khi tải danh sách bảng vẽ:", error);
    return [];
  }

  return ((data as unknown) || []) as Whiteboard[];
}

/**
 * Lấy chi tiết một bảng vẽ theo ID
 */
export async function getWhiteboardById(id: string): Promise<Whiteboard | null> {
  const supabase = createClient();
  const { data, error } = await (supabase.from as any)("whiteboards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(`Lỗi khi tải bảng vẽ ${id}:`, error);
    return null;
  }

  return ((data as unknown) as Whiteboard) || null;
}

/**
 * Tạo bảng vẽ mới (Kiểm tra quota nếu tài khoản Free)
 */
export async function createWhiteboard(
  title = "Bảng vẽ chưa đặt tên",
  isPro = false,
  templateKey?: string
): Promise<{ data: Whiteboard | null; error: string | null }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Bạn cần đăng nhập để tạo bảng vẽ." };
  }

  // Nếu là Free tier, kiểm tra số lượng bảng hiện có
  if (!isPro) {
    const { count, error: countErr } = await (supabase.from as any)("whiteboards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (!countErr && (count ?? 0) >= FREE_TIER_MAX_BOARDS) {
      return {
        data: null,
        error: `Tài khoản Free đã đạt giới hạn tối đa ${FREE_TIER_MAX_BOARDS} bảng vẽ. Vui lòng nâng cấp lên gói Pro để tạo không giới hạn!`
      };
    }
  }

  // Kiểm tra nếu tạo từ template sư phạm
  let initialElements: Record<string, unknown>[] = [];
  let initialAppState: Record<string, unknown> = {
    viewBackgroundColor: "#ffffff",
    currentItemStrokeColor: "#1e1e1e",
    gridSize: 20
  };

  if (templateKey) {
    const tpl = WHITEBOARD_TEMPLATES.find((t) => t.key === templateKey);
    if (tpl) {
      initialElements = tpl.generateElements();
      if (tpl.appState) {
        initialAppState = { ...initialAppState, ...tpl.appState };
      }
      if (title === "Bảng vẽ chưa đặt tên") {
        title = tpl.name;
      }
    }
  }

  const newBoard: WhiteboardInsert = {
    user_id: user.id,
    title,
    description: templateKey ? `template:${templateKey}` : null,
    elements: initialElements,
    app_state: initialAppState,
    thumbnail_url: null,
    is_favorite: false
  };

  const { data, error } = await (supabase.from as any)("whiteboards")
    .insert(newBoard)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as unknown) as Whiteboard, error: null };
}

/**
 * Cập nhật bảng vẽ
 */
export async function updateWhiteboard(
  id: string,
  updates: WhiteboardUpdate
): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();
  const { error } = await (supabase.from as any)("whiteboards")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Xoá bảng vẽ
 */
export async function deleteWhiteboard(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await (supabase.from as any)("whiteboards")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Lỗi khi xoá bảng vẽ ${id}:`, error);
    return false;
  }

  return true;
}

/**
 * Nhân bản bảng vẽ
 */
export async function duplicateWhiteboard(id: string, isPro = false): Promise<Whiteboard | null> {
  const original = await getWhiteboardById(id);
  if (!original) return null;

  const res = await createWhiteboard(`${original.title} (Bản sao)`, isPro);
  if (res.data) {
    await updateWhiteboard(res.data.id, {
      elements: original.elements,
      app_state: original.app_state,
      description: original.description
    });
    return {
      ...res.data,
      elements: original.elements,
      app_state: original.app_state
    };
  }

  return null;
}


/**
 * =====================================================================
 * TEACH MODE WHITEBOARD PERSISTENCE (Bục Giảng Số 4.0)
 * Lưu trữ nét vẽ phân tách theo câu hỏi của từng đề thi (per-exam)
 * Cơ chế Kép: LocalStorage tức thì + Debounce đồng bộ Supabase
 * =====================================================================
 */

const TEACH_WB_LOCAL_PREFIX = "edteach_teach_drawings_";

/**
 * Lấy nét vẽ Bục Giảng Số của một đề thi
 */
export async function getTeachWhiteboard(
  examId: string
): Promise<Record<string, unknown[]>> {
  // 1. Đọc nhanh từ LocalStorage trước
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(`${TEACH_WB_LOCAL_PREFIX}${examId}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Lỗi đọc cache nét vẽ Bục Giảng:", e);
    }
  }

  // 2. Nếu chưa có local, đọc từ Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data } = await (supabase.from as any)("whiteboards")
      .select("elements, app_state")
      .eq("user_id", user.id)
      .eq("description", `teach_mode:${examId}`)
      .maybeSingle();

    if (data && data.app_state && (data.app_state as any).drawingsMap) {
      const map = (data.app_state as any).drawingsMap as Record<string, unknown[]>;
      // Đồng bộ ngược lại LocalStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`${TEACH_WB_LOCAL_PREFIX}${examId}`, JSON.stringify(map));
        } catch {
          // ignore
        }
      }
      return map;
    }
  } catch (err) {
    console.error("Lỗi tải nét vẽ Bục Giảng từ cloud:", err);
  }

  return {};
}

/**
 * Lưu nét vẽ Bục Giảng Số của một đề thi (Cơ chế Kép)
 */
export async function saveTeachWhiteboard(
  examId: string,
  drawingsMap: Record<string, unknown[]>,
  examTitle?: string
): Promise<boolean> {
  // 1. Lưu tức thì vào LocalStorage (chống mất nét vẽ tuyệt đối khi rớt mạng hoặc F5)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${TEACH_WB_LOCAL_PREFIX}${examId}`, JSON.stringify(drawingsMap));
    } catch (e) {
      console.warn("Lỗi lưu cache nét vẽ local:", e);
    }
  }

  // 2. Đồng bộ ngầm lên Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true; // Vẫn thành công ở mức local

    const desc = `teach_mode:${examId}`;
    const { data: existing } = await (supabase.from as any)("whiteboards")
      .select("id")
      .eq("user_id", user.id)
      .eq("description", desc)
      .maybeSingle();

    const title = `Bục giảng: ${examTitle || examId.slice(0, 8)}`;
    const appStatePayload = {
      drawingsMap,
      examId,
      lastSavedAt: new Date().toISOString(),
    };

    if (existing) {
      await (supabase.from as any)("whiteboards")
        .update({
          title,
          app_state: appStatePayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await (supabase.from as any)("whiteboards").insert({
        user_id: user.id,
        title,
        description: desc,
        elements: [],
        app_state: appStatePayload,
        is_favorite: false,
      });
    }
    return true;
  } catch (err) {
    console.error("Lỗi đồng bộ cloud nét vẽ Bục Giảng:", err);
    return false;
  }
}
