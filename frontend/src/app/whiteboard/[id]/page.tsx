"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getWhiteboardById } from "@/lib/api/whiteboard";
import { Whiteboard } from "@/types/whiteboard";
import { isProUser } from "@/lib/payment/plans";
import WhiteboardEditor from "@/components/whiteboard/whiteboard-editor";

function WhiteboardStudioContent() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [board, setBoard] = useState<Whiteboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const boardId = params.id as string;
  const isPro = isProUser(profile) || isProUser(user);

  useEffect(() => {
    async function loadBoard() {
      if (authLoading) return;

      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent(`/whiteboard/${boardId}`)}`);
        return;
      }

      setIsLoading(true);
      try {
        const data = await getWhiteboardById(boardId);
        if (data) {
          setBoard(data);
        } else {
          setError("Không tìm thấy bảng vẽ hoặc bạn không có quyền truy cập.");
        }
      } catch (err: any) {
        setError(err.message || "Lỗi tải bảng vẽ.");
      } finally {
        setIsLoading(false);
      }
    }

    if (boardId) {
      loadBoard();
    }
  }, [boardId, user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Đang khởi tạo không gian vẽ...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
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

  return <WhiteboardEditor initialBoard={board} isPro={isPro} />;
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
