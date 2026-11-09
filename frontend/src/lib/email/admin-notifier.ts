import { MASTER_ADMIN_EMAIL, APP_URL } from "@/lib/constants";

interface TeacherVerificationNotificationParams {
  userId: string;
  userName: string;
  userEmail?: string;
  schoolName?: string;
  documentType: string;
  verificationId: string;
  imageUrl?: string;
}

/**
 * Gửi email thông báo trực tiếp đến Quản trị viên (qua biến môi trường ADMIN_NOTIFY_EMAIL)
 * khi có giáo viên nộp hồ sơ thẻ ngành để phê duyệt thủ công.
 */
export async function notifyAdminNewVerification(params: TeacherVerificationNotificationParams): Promise<{ success: boolean; message: string }> {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || MASTER_ADMIN_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  const reviewUrl = `${APP_URL}/admin/verifications`;

  const emailSubject = `[EdTeach] Hồ sơ xác thực Thẻ ngành mới cần phê duyệt: ${params.userName}`;
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; color: #1e293b; margin: 0; }
          .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 6px; margin-top: 8px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-table td.label { font-weight: 600; color: #64748b; width: 140px; }
          .button { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 8px; margin-top: 16px; }
          .footer { font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title">📋 Yêu Cầu Phê Duyệt Thẻ Ngành Giáo Viên</h2>
            <span class="badge">Chờ Duyệt Thủ Công (Pending Review)</span>
          </div>
          <p>Kính gửi Ban Quản Trị EdTeach,</p>
          <p>Hệ thống vừa tiếp nhận một hồ sơ xác thực chuyên môn từ Giáo viên với thông tin chi tiết dưới đây:</p>
          <table class="info-table">
            <tr>
              <td class="label">Họ và tên:</td>
              <td><strong>${params.userName}</strong></td>
            </tr>
            <tr>
              <td class="label">Email giáo viên:</td>
              <td>${params.userEmail || "Chưa cập nhật"}</td>
            </tr>
            <tr>
              <td class="label">Đơn vị / Trường:</td>
              <td>${params.schoolName || "Đơn vị giáo dục"}</td>
            </tr>
            <tr>
              <td class="label">Loại giấy tờ:</td>
              <td>${params.documentType === "teacher_card" ? "Thẻ Giáo Viên / Quyết định công tác" : "Văn bằng Sư phạm"}</td>
            </tr>
            <tr>
              <td class="label">Mã hồ sơ:</td>
              <td><code>${params.verificationId}</code></td>
            </tr>
            <tr>
              <td class="label">Thời gian gửi:</td>
              <td>${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
            </tr>
          </table>
          <p>Vui lòng đăng nhập vào trang quản trị để kiểm tra ảnh thẻ ngành và bấm <strong>Phê duyệt (Duyệt Tích Xanh & +10.000 credits)</strong> hoặc <strong>Từ chối</strong>:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${reviewUrl}" class="button">Vào Trang Quản Trị Phê Duyệt Ngay &rarr;</a>
          </div>
          <div class="footer">
            <p>Hệ thống thông báo tự động từ Nền tảng Giáo dục EduTest v2.0 (MTD Studio).</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Nếu có cấu hình RESEND_API_KEY, gửi trực tiếp qua Resend API
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "EdTeach Notifications <onboarding@resend.dev>",
          to: [adminEmail],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (res.ok) {
        return { success: true, message: `Đã gửi email thông báo phê duyệt tới ${adminEmail}.` };
      }
      const errData = await res.json().catch(() => ({}));
      console.warn("[notifyAdminNewVerification] Resend API response:", errData);
    } catch (err) {
      console.warn("[notifyAdminNewVerification] Resend fetch error:", err);
    }
  }

  // 2. Ghi nhận log console chuẩn để Admin kiểm tra trên Vercel Runtime Logs / Terminal
  console.info(`[ADMIN NOTIFICATION QUEUE] To: ${adminEmail} | Subject: ${emailSubject} | Verification ID: ${params.verificationId}`);

  return {
    success: true,
    message: `Đã chuyển tiếp hồ sơ tới Ban Quản Trị (${adminEmail}) để phê duyệt thủ công.`,
  };
}
