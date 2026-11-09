"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Cookie,
  ShieldCheck,
  Settings2,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Info,
} from "lucide-react";

export default function CookiesPage() {
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleResetCookiePreferences = () => {
    if (typeof document !== "undefined") {
      document.cookie =
        "eduteach_cookie_consent=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax";
      localStorage.removeItem("eduteach_cookie_consent");
      setResetStatus("Đã xóa tùy chọn lưu trữ! Banner tùy chọn cookie sẽ hiển thị lại sau khi tải lại trang.");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/20">
              <Cookie className="w-4 h-4" />
              Minh Bạch Công Nghệ Theo Dõi & Cookie
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Chính Sách Cookie Riêng Biệt
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Giải thích chi tiết các loại cookie, bộ nhớ cục bộ (LocalStorage) được sử dụng trên EduTest và quyền chủ động kiểm soát của Quý Thầy/Cô theo Nghị định 13/2023/NĐ-CP và ePrivacy Directive.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Hiệu lực từ: <strong>01/07/2023</strong></span>
              <span>•</span>
              <span>Cập nhật mới nhất: <strong>08/11/2026</strong></span>
              <span>•</span>
              <span className="text-primary font-semibold">Quyền kiểm soát chủ động</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Table of Contents & Reset Action */}
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Mục Lục Chính Sách
                  </h2>
                  <nav className="space-y-1.5 text-xs">
                    {[
                      { id: "dinh-nghia", label: "1. Cookie là gì?" },
                      { id: "phan-loai", label: "2. Phân loại 3 nhóm cookie chính" },
                      { id: "bang-tra-cuu", label: "3. Bảng tra cứu cookie chi tiết" },
                      { id: "kiem-soat", label: "4. Hướng dẫn bật / tắt cookie" },
                      { id: "thay-doi", label: "5. Thay đổi tùy chọn cookie bất kỳ lúc nào" },
                    ].map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition font-medium"
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Reset Cookie Preferences Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-xs text-xs space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-primary" />
                    Quản Lý Tùy Chọn Của Bạn
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bạn muốn thay đổi quyết định đồng ý cookie của mình? Bấm nút dưới đây để đặt lại trạng thái và chọn lại trên Cookie Banner.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetCookiePreferences}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Cài đặt lại Tùy chọn Cookie
                  </button>
                  {resetStatus && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                      {resetStatus}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Content Article */}
            <article className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-sm leading-relaxed text-foreground">
              {/* Định nghĩa */}
              <section id="dinh-nghia" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    1
                  </span>
                  Cookie Là Gì?
                </h2>
                <p>
                  <strong>Cookie</strong> là một tệp văn bản nhỏ được lưu trữ trên trình duyệt của máy tính hoặc điện thoại khi bạn truy cập một trang web. Cookie cho phép trang web nhận diện thiết bị của bạn, ghi nhớ trạng thái đăng nhập, ghi nhớ ngôn ngữ hiển thị và giúp hệ thống vận hành trơn tru hơn giữa các lần tải trang.
                </p>
                <p className="text-muted-foreground text-xs">
                  Ngoài cookie truyền thống, EduTest còn sử dụng công nghệ lưu trữ trình duyệt tương đương như <strong>LocalStorage</strong> và <strong>SessionStorage</strong> để lưu các tùy chọn hiển thị cá nhân (chế độ nền tối Dark Mode, cỡ chữ, trạng thái bộ lọc bài giảng) mà không truyền tải lên máy chủ mỗi khi gửi yêu cầu.
                </p>
              </section>

              {/* Phân loại */}
              <section id="phan-loai" className="space-y-4 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    2
                  </span>
                  Phân Loại Chi Tiết 3 Nhóm Cookie
                </h2>

                <div className="space-y-4">
                  {/* Nhóm 1 */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Nhóm 1: Cookie Thiết Yếu Bắt Buộc (Strictly Necessary Cookies)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                        Bắt buộc
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Đây là những cookie kỹ thuật cốt lõi giúp hệ thống vận hành. Không có các cookie này, các tính năng bảo mật như đăng nhập an toàn, phân quyền giáo viên/học sinh, giỏ hàng credits và chống tấn công CSRF sẽ không thể hoạt động.
                    </p>
                    <p className="text-[11px] text-muted-foreground italic">
                      * Theo luật định, nhóm cookie này không yêu cầu sự đồng ý trước vì là điều kiện tiên quyết để cung cấp dịch vụ được yêu cầu.
                    </p>
                  </div>

                  {/* Nhóm 2 */}
                  <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Nhóm 2: Cookie Chức Năng & Tùy Chọn (Functional Cookies)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                        Cá nhân hóa
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Lưu giữ các lựa chọn cá nhân của Quý Thầy/Cô: Giao diện Sáng/Tối (Light/Dark mode), cỡ chữ hiển thị (Normal/Large), bộ môn mặc định khi soạn đề, và cấu hình font chữ khi xuất bản file Word (.docx).
                    </p>
                  </div>

                  {/* Nhóm 3 */}
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Nhóm 3: Cookie Phân Tích & Hiệu Năng (Analytics & Performance)
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                        Cần người dùng đồng ý
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Sử dụng công cụ đo lường hiệu năng <strong>Vercel Analytics</strong> và <strong>Vercel Speed Insights</strong> để theo dõi tốc độ tải trang (Core Web Vitals), tỷ lệ lỗi mạng và độ ổn định của hệ thống. Dữ liệu được tổng hợp hoàn toàn ẩn danh, không chứa bất kỳ thông tin nhận dạng cá nhân (No PII) nào.
                    </p>
                    <p className="text-[11px] text-muted-foreground italic">
                      * Nhóm cookie này bị <strong>chặn hoàn toàn</strong> mặc định cho đến khi bạn chủ động nhấn "Chấp nhận tất cả" trên Cookie Consent Banner.
                    </p>
                  </div>
                </div>
              </section>

              {/* Bảng tra cứu */}
              <section id="bang-tra-cuu" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    3
                  </span>
                  Bảng Đối Soát Toàn Bộ Cookie & LocalStorage
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
                    <thead className="bg-muted text-foreground text-left">
                      <tr>
                        <th className="p-3 border-b border-border">Tên Cookie / Khóa</th>
                        <th className="p-3 border-b border-border">Phân nhóm</th>
                        <th className="p-3 border-b border-border">Đơn vị cung cấp</th>
                        <th className="p-3 border-b border-border">Mục đích sử dụng</th>
                        <th className="p-3 border-b border-border">Thời hạn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">sb-*-auth-token</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Thiết yếu</td>
                        <td className="p-3 text-muted-foreground">Supabase Auth</td>
                        <td className="p-3 text-muted-foreground">Duy trì phiên đăng nhập và mã hóa xác thực JWT</td>
                        <td className="p-3 text-muted-foreground">1 giờ (tự động làm mới)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">eduteach_cookie_consent</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Thiết yếu</td>
                        <td className="p-3 text-muted-foreground">EduTest</td>
                        <td className="p-3 text-muted-foreground">Lưu trạng thái đồng ý cookie (`accepted` hoặc `essential`)</td>
                        <td className="p-3 text-muted-foreground">1 năm (31536000s)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">eduteach_target_role</td>
                        <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">Chức năng</td>
                        <td className="p-3 text-muted-foreground">EduTest</td>
                        <td className="p-3 text-muted-foreground">Ghi nhớ vai trò người dùng (Giáo viên, Gia sư, Học sinh) khi OAuth</td>
                        <td className="p-3 text-muted-foreground">1 giờ</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">app_theme (LocalStorage)</td>
                        <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">Chức năng</td>
                        <td className="p-3 text-muted-foreground">EduTest</td>
                        <td className="p-3 text-muted-foreground">Ghi nhớ giao diện Sáng / Tối do người dùng chọn</td>
                        <td className="p-3 text-muted-foreground">Vĩnh viễn cho đến khi xóa cache</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">_vercel_analytics / WebVitals</td>
                        <td className="p-3 text-purple-600 dark:text-purple-400 font-bold">Phân tích</td>
                        <td className="p-3 text-muted-foreground">Vercel Inc.</td>
                        <td className="p-3 text-muted-foreground">Đo lường thời gian tải trang và phát hiện lỗi mạng (No PII)</td>
                        <td className="p-3 text-muted-foreground">Phiên / 30 ngày</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono font-semibold text-foreground">edutest_ref_code</td>
                        <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">Giới thiệu</td>
                        <td className="p-3 text-muted-foreground">EduTest</td>
                        <td className="p-3 text-muted-foreground">Ghi nhận mã giới thiệu từ đồng nghiệp để tặng credits</td>
                        <td className="p-3 text-muted-foreground">30 ngày</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Hướng dẫn bật tắt */}
              <section id="kiem-soat" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    4
                  </span>
                  Hướng Dẫn Bật / Tắt Cookie Trên Từng Trình Duyệt
                </h2>
                <p className="text-muted-foreground">
                  Quý Thầy/Cô có toàn quyền kiểm soát và xóa cookie bất cứ lúc nào thông qua phần cài đặt bảo mật của trình duyệt web:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground">Google Chrome</strong>
                    <p className="text-muted-foreground">
                      Cài đặt &gt; Quyền riêng tư và bảo mật &gt; Cookie và dữ liệu trang web &gt; Chọn "Chặn cookie của bên thứ ba".
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground">Apple Safari (macOS / iOS)</strong>
                    <p className="text-muted-foreground">
                      Cài đặt &gt; Safari &gt; Quyền riêng tư & Bảo mật &gt; Bật "Chặn tất cả cookie" hoặc "Ngăn chặn theo dõi qua trang web".
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground">Mozilla Firefox</strong>
                    <p className="text-muted-foreground">
                      Cài đặt &gt; Quyền riêng tư & Bảo mật &gt; Chế độ "Bảo vệ chống theo dõi nâng cao" &gt; Chọn mức Nghiêm ngặt (Strict).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground">Microsoft Edge</strong>
                    <p className="text-muted-foreground">
                      Cài đặt &gt; Cookie và quyền truy cập trang web &gt; Quản lý và xóa cookie và dữ liệu trang web.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  * Xin lưu ý: Nếu bạn chọn tắt toàn bộ cookie thiết yếu trên trình duyệt, bạn sẽ không thể duy trì trạng thái đăng nhập hoặc sử dụng các tính năng tạo đề thi của EduTest.
                </p>
              </section>

              {/* Điều chỉnh tùy chọn */}
              <section id="thay-doi" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    5
                  </span>
                  Thay Đổi Tùy Chọn Bất Kỳ Lúc Nào
                </h2>
                <p>
                  EduTest tôn trọng tuyệt đối quyền tự quyết dữ liệu. Quý Thầy/Cô có thể điều chỉnh lại sự đồng ý của mình bất kỳ lúc nào bằng cách nhấn nút <strong>"Cài đặt lại Tùy chọn Cookie"</strong> ở thanh bên hoặc tại chân trang.
                </p>
                <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">Bạn có thắc mắc kỹ thuật về cookie?</p>
                    <p className="text-xs text-muted-foreground">Liên hệ trực tiếp đội ngũ kỹ thuật và an toàn thông tin của chúng tôi.</p>
                  </div>
                  <Link
                    href="/privacy"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition"
                  >
                    Xem Chính sách Bảo mật
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
