import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Kiểm tra xác thực (hỗ trợ Bearer Token & Session Cookie)
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để cập nhật ảnh đại diện." },
        { status: 401 }
      );
    }

    const adminClient = dbClient;

    // 2. Nhận dữ liệu FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dataUrl = formData.get("dataUrl") as string | null;

    if (!file && !dataUrl) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy tệp ảnh hợp lệ để tải lên." },
        { status: 400 }
      );
    }

    let buffer: Buffer;
    let contentType = "image/jpeg";

    if (file) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { success: false, error: "Định dạng tệp không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP." },
          { status: 400 }
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Dung lượng ảnh vượt quá giới hạn 5MB." },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = file.type || "image/jpeg";
    } else {
      // Parse dataUrl
      const match = dataUrl!.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "Chuỗi ảnh mã hóa Base64 không hợp lệ." },
          { status: 400 }
        );
      }
      contentType = match[1];
      buffer = Buffer.from(match[2], "base64");
    }

    const fileExt = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filePath = `${user.id}/avatar.${fileExt}`;
    let finalAvatarUrl = "";

    // Đảm bảo bucket 'avatars' tồn tại và được cấu hình public: true
    try {
      const { data: bucketData } = await adminClient.storage.getBucket("avatars");
      if (!bucketData) {
        await adminClient.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        });
      } else if (!bucketData.public) {
        await adminClient.storage.updateBucket("avatars", { public: true });
      }
    } catch (bErr) {
      console.warn("Storage bucket check warning:", bErr);
    }

    // 3. Tải ảnh lên Supabase Storage bucket 'avatars'
    const { error: uploadError } = await adminClient.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (!uploadError) {
      const { data: pubData } = adminClient.storage.from("avatars").getPublicUrl(filePath);
      finalAvatarUrl = `${pubData.publicUrl}?t=${Date.now()}`;
    } else {
      console.warn("Storage upload warning, attempting to ensure bucket exists:", uploadError);
      // Thử tạo bucket nếu chưa có
      try {
        await adminClient.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        });
        const retry = await adminClient.storage
          .from("avatars")
          .upload(filePath, buffer, { contentType, upsert: true });

        if (!retry.error) {
          const { data: pubData } = adminClient.storage.from("avatars").getPublicUrl(filePath);
          finalAvatarUrl = `${pubData.publicUrl}?t=${Date.now()}`;
        }
      } catch (e) {
        console.warn("Auto-create bucket error:", e);
      }

      // Dự phòng an toàn nếu bucket storage gặp sự cố
      if (!finalAvatarUrl) {
        if (dataUrl && dataUrl.length < 200 * 1024) {
          finalAvatarUrl = dataUrl;
        } else {
          finalAvatarUrl = `data:${contentType};base64,${buffer.toString("base64")}`;
        }
      }
    }

    // 4. Cập nhật avatar_url vào bảng public.users qua Admin Client (bypassing Client RLS)
    const { error: dbError } = await (adminClient.from("users") as any)
      .update({
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbError) {
      console.error("DB update avatar error:", dbError);
      return NextResponse.json(
        { success: false, error: dbError.message || "Lỗi khi lưu ảnh vào cơ sở dữ liệu." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_url: finalAvatarUrl,
      message: "Cập nhật ảnh đại diện thành công!",
    });
  } catch (error: any) {
    console.error("API /api/user/avatar POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Đã xảy ra lỗi máy chủ khi cập nhật ảnh đại diện." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để thực hiện." },
        { status: 401 }
      );
    }

    const adminClient = dbClient;

    // 1. Cập nhật avatar_url về null trong bảng public.users
    const { error: dbError } = await (adminClient.from("users") as any)
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbError) {
      return NextResponse.json(
        { success: false, error: dbError.message || "Lỗi khi xóa ảnh đại diện trong cơ sở dữ liệu." },
        { status: 500 }
      );
    }

    // 2. Dọn dẹp file trong storage nếu có (không throw nếu không tồn tại)
    try {
      await adminClient.storage.from("avatars").remove([
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`,
      ]);
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Đã xóa ảnh đại diện thành công.",
    });
  } catch (error: any) {
    console.error("API /api/user/avatar DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Đã xảy ra lỗi máy chủ khi xóa ảnh đại diện." },
      { status: 500 }
    );
  }
}
