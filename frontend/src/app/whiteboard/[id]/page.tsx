"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getWhiteboardById, updateWhiteboard } from "@/lib/api/whiteboard";
import { Whiteboard } from "@/types/whiteboard";
import { isProUser } from "@/lib/payment/plans";
import WhiteboardEditor from "@/components/whiteboard/whiteboard-editor";

function WhiteboardStudioContent() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const boardId = params.id as string;
  const isPro = isProUser(profile) || isProUser(user);

  // Khôi phục tức thì từ cache cục bộ (localStorage) nếu có
  const localCacheKey = `edteach_wb_${boardId}`;
  const [board, setBoard] = useState<Whiteboard | null>(() => {
    if (typeof window !== "undefined" && boardId) {
      try {
        const cached = localStorage.getItem(`edteach_wb_${boardId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.elements)) {
            return {
              id: boardId,
              user_id: "",
              title: parsed.title || "Bảng vẽ",
              elements: parsed.elements || [],
              app_state: parsed.appState || {},
              files: parsed.files || {},
              pages: parsed.pages || [],
              created_at: new Date().toISOString(),
              updated_at: new Date(parsed.savedAt || Date.now()).toISOString(),
            } as Whiteboard;
          }
        }
      } catch (e) {
        console.warn("Lỗi đọc cache cục bộ bảng vẽ:", e);
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!board);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const userId = user?.id;

  useEffect(() => {
    async function loadBoard() {
      if (authLoading) return;

      if (!userId) {
        router.push(`/login?redirectTo=${encodeURIComponent(`/whiteboard/${boardId}`)}`);
        return;
      }

      // Chỉ hiện spinner khi CHƯA có dữ liệu (kể cả cache)
      if (!board) {
        setIsLoading(true);
      }

      try {
        const cloudData = await getWhiteboardById(boardId);
        if (cloudData) {
          // Kiểm tra so sánh phiên bản cache vs cloud
          let shouldUseCloud = true;
          if (typeof window !== "undefined") {
            try {
              const cached = localStorage.getItem(localCacheKey);
              if (cached) {
                const parsed = JSON.parse(cached);
                const localSavedAt = Number(parsed.savedAt) || 0;
                const cloudUpdatedAt = cloudData.updated_at ? new Date(cloudData.updated_at).getTime() : 0;
                // Nếu bản local mới hơn bản cloud (do autosave flush khi rời tab chưa kịp sync), giữ bản local và sync lên cloud
                if (localSavedAt > cloudUpdatedAt && parsed.elements?.length > 0) {
                  shouldUseCloud = false;
                  updateWhiteboard(boardId, {
                    elements: parsed.elements,
                    app_state: parsed.appState,
                    pages: parsed.pages,
                    title: parsed.title || cloudData.title,
                  }).catch((err) => console.warn("Lỗi đồng bộ cache cục bộ lên cloud:", err));
                }
              }
            } catch (e) {
              console.warn("Lỗi so sánh cache và cloud:", e);
            }
          }

          if (shouldUseCloud) {
            setBoard(cloudData);
          }
        } else if (!board) {
          setError("Không tìm thấy bảng vẽ hoặc bạn không có quyền truy cập.");
        }
      } catch (err: unknown) {
        if (!board) {
          setError(err instanceof Error ? err.message : "Lỗi tải bảng vẽ.");
        }
      } finally {
        setIsLoading(false);
        hasLoadedRef.current = true;
      }
    }

    if (boardId) {
      loadBoard();
    }
  }, [boardId, userId, authLoading, router]);

  // Chỉ hiển thị spinner khởi tạo khi auth đang nạp HOẶC board thực sự chưa có dữ liệu
  if ((authLoading || isLoading) && !board) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Đang khởi tạo không gian vẽ...</p>
        </div>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-xl font-bold text-destructive">Không thể mở bảng vẽ</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push("/whiteboard")}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Quay lại danh sách bảng vẽ
        </button>
      </div>
    );
  }

  if (!board) return null;

  return <WhiteboardEditor key={board.id} initialBoard={board} isPro={isPro} />;
}

export default function WhiteboardStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <WhiteboardStudioContent />
    </Suspense>
  );
}
