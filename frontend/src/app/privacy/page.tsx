import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SUPPORT_EMAIL } from "@/lib/constants";
import {
  ShieldCheck,
  Lock,
  FileText,
  UserCheck,
  Clock,
  Share2,
  Server,
  Mail,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Bảo mật — EduTest (MTD Studio)",
  description:
    "Chính sách bảo mật và bảo vệ dữ liệu cá nhân của nền tảng EduTest (phát triển bởi MTD Studio), tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP và tiêu chuẩn quốc tế GDPR/CCPA.",
};

export default function PrivacyPage() {
  const lastUpdated = "08/11/2026";
  const effectiveDate = "01/07/2023";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Banner */}
          <div className="mb-10 text-center sm:text-left border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
              Tuân thủ Nghị định 13/2023/NĐ-CP & Chuẩn GDPR
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Chính Sách Bảo Mật Dữ Liệu Cá Nhân
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Cam kết của Nền tảng EduTest (sản phẩm được phát triển bởi MTD Studio) về việc bảo vệ quyền riêng tư, an toàn dữ liệu và quyền tự quyết dữ liệu cá nhân của Quý Thầy/Cô, Học sinh và Đối tác sư phạm.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Ngày có hiệu lực: <strong>{effectiveDate}</strong></span>
              <span>•</span>
              <span>Cập nhật mới nhất: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span className="text-primary font-semibold">Phiên bản: 2.1.0-GDPT2025</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Table of Contents - Desktop Sticky */}
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Mục Lục Văn Bản
                </h2>
                <nav className="space-y-1.5 text-xs">
                  {[
                    { id: "dieu-1", label: "1. Nguyên tắc & Bên kiểm soát dữ liệu" },
                    { id: "dieu-2", label: "2. Mục đích thu thập & Xử lý dữ liệu" },
                    { id: "dieu-3", label: "3. Các loại dữ liệu cá nhân thu thập" },
                    { id: "dieu-4", label: "4. Cơ sở pháp lý theo Nghị định 13" },
                    { id: "dieu-5", label: "5. Quyền của chủ thể dữ liệu (Quý Thầy/Cô)" },
                    { id: "dieu-6", label: "6. Thời hạn lưu trữ & Xóa dữ liệu" },
                    { id: "dieu-7", label: "7. Bên thứ ba & Chuyển giao dữ liệu" },
                    { id: "dieu-8", label: "8. Biện pháp an ninh & Mã hóa kỹ thuật" },
                    { id: "dieu-9", label: "9. Tuân thủ quốc tế (GDPR & CCPA)" },
                    { id: "dieu-10", label: "10. Đầu mối liên hệ Hỗ trợ & Khiếu nại" },
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

                <div className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">Bạn có quyền yêu cầu xóa dữ liệu?</p>
                  <p>
                    Vào phần Cài đặt &gt; Bảo mật &gt; Yêu cầu xóa tài khoản hoặc liên hệ trực tiếp qua email hỗ trợ.
                  </p>
                  <Link
                    href="/settings?tab=account&section=security"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                  >
                    Đến trang Quản lý Dữ liệu
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Policy Content */}
            <article className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-sm leading-relaxed text-foreground">
              {/* Introduction box */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>Lời Mở Đầu & Tôn Chỉ Hoạt Động</span>
                </div>
                <p className="text-muted-foreground">
                  Nền tảng EduTest tôn trọng tuyệt đối quyền riêng tư và quyền bảo vệ dữ liệu cá nhân theo Hiến pháp nước CHXHCN Việt Nam, <strong>Nghị định số 13/2023/NĐ-CP</strong> ngày 17/04/2023 của Chính phủ về Bảo vệ Dữ liệu Cá nhân, Luật An ninh Mạng 2018 và các chuẩn mực bảo mật toàn cầu (GDPR, ISO/IEC 27001). Văn bản này giải thích minh bạch cách thức chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu của bạn.
                </p>
              </div>

              {/* Điều 1 */}
              <section id="dieu-1" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    1
                  </span>
                  Bên Kiểm Soát & Xử Lý Dữ Liệu Cá Nhân
                </h2>
                <p>
                  Căn cứ theo Điều 2 Nghị định 13/2023/NĐ-CP, đơn vị phát triển và vận hành giữ vai trò <strong>Bên Kiểm soát Dữ liệu</strong> (Data Controller) và <strong>Bên Xử lý Dữ liệu</strong> (Data Processor) đối với sản phẩm EduTest là:
                </p>
                <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                  <p><strong>Đơn vị phát triển sản phẩm:</strong> MTD Studio (Sản phẩm EduTest)</p>
                  <p>
                    <strong>Email hỗ trợ & bảo vệ dữ liệu:</strong>{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-semibold hover:underline">
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </div>
              </section>

              {/* Điều 2 */}
              <section id="dieu-2" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    2
                  </span>
                  Mục Đích Thu Thập & Xử Lý Dữ Liệu
                </h2>
                <p>
                  EduTest chỉ thu thập và xử lý các trường dữ liệu cá nhân theo nguyên tắc <strong>Tối thiểu hóa dữ liệu (Data Minimization)</strong> nhằm phục vụ các mục đích rõ ràng, hợp pháp sau:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Cung cấp và định danh tài khoản:</strong> Đăng ký, đăng nhập, bảo vệ phiên làm việc và phục hồi mật khẩu qua email hoặc xác thực 2 bước (2FA).
                  </li>
                  <li>
                    <strong className="text-foreground">Vận hành chức năng khảo thí & tạo đề thi AI:</strong> Lưu trữ ma trận đề thi, đề kiểm tra, ngân hàng câu hỏi và lịch sử soạn thảo do chính Thầy/Cô khởi tạo.
                  </li>
                  <li>
                    <strong className="text-foreground">Xác thực danh tính sư phạm (Tích Xanh):</strong> Kiểm duyệt thẻ ngành giáo viên hoặc thẻ sinh viên/CCCD gia sư để cấp huy hiệu nhà giáo đã xác thực, ngăn ngừa giả mạo trên chợ đề thi.
                  </li>
                  <li>
                    <strong className="text-foreground">Quản lý giao dịch nạp điểm & thanh toán:</strong> Ghi nhận biến động số dư credits, hóa đơn thanh toán gói PRO/MAX qua cổng thanh toán liên ngân hàng PayOS (VietQR Napas247).
                  </li>
                  <li>
                    <strong className="text-foreground">Hỗ trợ kỹ thuật & khắc phục sự cố:</strong> Tiếp nhận phản hồi, sửa lỗi hiển thị công thức LaTeX, xử lý khiếu nại hoàn tiền và phòng chống gian lận.
                  </li>
                </ul>
              </section>

              {/* Điều 3 */}
              <section id="dieu-3" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    3
                  </span>
                  Các Loại Dữ Liệu Cá Nhân Thu Thập
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <h3 className="font-bold text-primary flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Dữ liệu cá nhân cơ bản
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                      <li>Họ và tên (hiển thị trên phôi đề Word và hồ sơ)</li>
                      <li>Địa chỉ thư điện tử (email dùng để đăng nhập)</li>
                      <li>Số điện thoại liên hệ (tùy chọn khi nạp tiền/xác thực)</li>
                      <li>Trường học, tổ bộ môn, khối lớp giảng dạy</li>
                      <li>Ảnh đại diện (avatar) do người dùng tải lên</li>
                      <li>Địa chỉ IP và thông tin trình duyệt đăng nhập</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <h3 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Dữ liệu nghiệp vụ & xác thực
                    </h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                      <li>Ảnh thẻ giáo viên / Thẻ sinh viên sư phạm (khi eKYC)</li>
                      <li>Ảnh chụp số CCCD (được che mờ và chỉ lưu 4 số cuối + mã băm SHA-256)</li>
                      <li>Mã giao dịch ngân hàng (Mã đơn PayOS, không lưu mã thẻ ngân hàng/CVV)</li>
                      <li>Lịch sử tạo đề thi và kết quả chấm phiếu OMR</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  * EduTest <strong>tuyệt đối không</strong> lưu giữ mật khẩu ngân hàng, mã OTP SMS, số CVV/CVC của thẻ quốc tế. Mọi giao dịch tài chính đều được ủy quyền bảo mật trực tiếp qua cổng thanh toán được Ngân hàng Nhà nước cấp phép.
                </p>
              </section>

              {/* Điều 4 */}
              <section id="dieu-4" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    4
                  </span>
                  Cơ Sở Pháp Lý Xử Lý Dữ Liệu
                </h2>
                <p>
                  Theo Điều 11, 12 và 13 Nghị định 13/2023/NĐ-CP, việc xử lý dữ liệu của EduTest dựa trên các căn cứ pháp lý:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Sự đồng ý rõ ràng và tự nguyện:</strong> Người dùng chủ động tick chọn đồng ý tại biểu mẫu Đăng ký (không bao giờ tích chọn sẵn), hoặc đồng ý thông qua Cookie Consent Banner.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Thực hiện thỏa thuận cung cấp dịch vụ:</strong> Xử lý dữ liệu cần thiết để khởi tạo tài khoản, sinh đề thi theo lệnh của giáo viên và đối soát thanh toán.
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-card border border-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Tuân thủ nghĩa vụ pháp lý:</strong> Lưu trữ hóa đơn điện tử, chứng từ kế toán theo Luật Kế toán và Luật Quản lý Thuế Việt Nam.
                    </div>
                  </div>
                </div>
              </section>

              {/* Điều 5 */}
              <section id="dieu-5" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    5
                  </span>
                  Quyền Của Chủ Thể Dữ Liệu (Quý Thầy/Cô)
                </h2>
                <p>
                  Căn cứ Điều 9 Nghị định 13/2023/NĐ-CP, bạn được bảo đảm toàn bộ 11 quyền của chủ thể dữ liệu, cụ thể:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>1. Quyền được biết:</strong> Được thông báo minh bạch về mục đích và loại dữ liệu thu thập qua chính sách này.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>2. Quyền đồng ý:</strong> Được quyền cho phép hoặc từ chối xử lý dữ liệu qua các nút tùy chọn riêng biệt.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>3. Quyền truy cập & Xem:</strong> Xem toàn bộ hồ sơ cá nhân và lịch sử đề thi trong trang Cá nhân.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>4. Quyền chỉnh sửa:</strong> Tự do cập nhật họ tên, mật khẩu, trường học và ảnh đại diện bất kỳ lúc nào.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>5. Quyền trích xuất dữ liệu:</strong> Xuất toàn bộ dữ liệu cá nhân dạng JSON hoặc bảng tính CSV (tại Cài đặt &gt; Bảo mật).
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>6. Quyền xóa dữ liệu (Erasure):</strong> Yêu cầu hủy vĩnh viễn tài khoản và xóa mọi đề thi kèm thời gian ân hạn 14 ngày.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>7. Quyền rút lại sự đồng ý:</strong> Hủy đăng ký nhận email tin tức hoặc điều chỉnh tùy chọn cookie bất kỳ lúc nào.
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <strong>8. Quyền khiếu nại:</strong> Gửi khiếu nại tới đội ngũ hỗ trợ qua email {SUPPORT_EMAIL} hoặc Cục An ninh Mạng (Bộ Công an) nếu phát hiện hành vi vi phạm.
                  </div>
                </div>
              </section>

              {/* Điều 6 */}
              <section id="dieu-6" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    6
                  </span>
                  Thời Hạn Lưu Trữ & Quy Trình Xóa Dữ Liệu
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Dữ liệu tài khoản và đề thi được lưu trữ trong suốt thời gian tài khoản hoạt động. Khi Quý Thầy/Cô gửi yêu cầu xóa tài khoản tại hệ thống:
                  </p>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground text-xs space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <Clock className="w-4 h-4" /> Thời gian ân hạn phục hồi 14 ngày (Grace Period)
                    </p>
                    <p>
                      Hệ thống sẽ ngay lập tức khóa đăng nhập và ẩn tài khoản khỏi công khai. Trong vòng <strong>14 ngày</strong>, nếu bạn đổi ý, có thể liên hệ bộ phận hỗ trợ để hủy lệnh xóa. Sau 14 ngày, toàn bộ đề thi, câu hỏi và bản ghi cá nhân sẽ bị thanh lọc vĩnh viễn không thể khôi phục khỏi cơ sở dữ liệu.
                    </p>
                  </div>
                </div>
              </section>

              {/* Điều 7 */}
              <section id="dieu-7" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    7
                  </span>
                  Các Bên Thứ Ba Hợp Tác & Chuyển Giao Dữ Liệu
                </h2>
                <p>
                  EduTest <strong>tuyệt đối không bán, trao đổi hoặc cho thuê</strong> dữ liệu cá nhân cho bên thứ ba vì mục đích tiếp thị hoặc thương mại. Chúng tôi chỉ hợp tác với các nhà cung cấp dịch vụ hạ tầng đám mây uy tín có cam kết bảo mật theo hợp đồng DPA (Data Processing Agreement):
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-border rounded-xl overflow-hidden">
                    <thead className="bg-muted text-foreground text-left">
                      <tr>
                        <th className="p-3 border-b border-border">Đơn vị đối tác</th>
                        <th className="p-3 border-b border-border">Trụ sở</th>
                        <th className="p-3 border-b border-border">Dữ liệu chia sẻ</th>
                        <th className="p-3 border-b border-border">Mục đích xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-3 font-bold text-foreground">Google Cloud / Gemini AI</td>
                        <td className="p-3 text-muted-foreground">Hoa Kỳ</td>
                        <td className="p-3 text-muted-foreground">Văn bản yêu cầu đề thi, câu hỏi</td>
                        <td className="p-3 text-muted-foreground">Sinh câu hỏi theo ma trận GDPT 2025 (không dùng dữ liệu người dùng để huấn luyện mô hình public)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">Cổng thanh toán PayOS</td>
                        <td className="p-3 text-muted-foreground">Việt Nam</td>
                        <td className="p-3 text-muted-foreground">Số tiền thanh toán, mã đơn hàng</td>
                        <td className="p-3 text-muted-foreground">Xử lý giao dịch VietQR Napas247 tự động</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">Vercel Inc.</td>
                        <td className="p-3 text-muted-foreground">Hoa Kỳ</td>
                        <td className="p-3 text-muted-foreground">Web Vitals, IP quốc gia ẩn danh</td>
                        <td className="p-3 text-muted-foreground">Lưu trữ máy chủ biên (Edge) & phân tích hiệu năng (chỉ bật khi người dùng chấp thuận cookie)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-foreground">Supabase Inc.</td>
                        <td className="p-3 text-muted-foreground">Singapore / AWS</td>
                        <td className="p-3 text-muted-foreground">Cơ sở dữ liệu mã hóa lưu trữ</td>
                        <td className="p-3 text-muted-foreground">Lưu trữ dữ liệu có áp dụng chính sách phân quyền hàng (RLS)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Điều 8 */}
              <section id="dieu-8" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    8
                  </span>
                  Cơ Chế Bảo Mật & An Ninh Kỹ Thuật
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-primary" /> Băm mật khẩu một chiều
                    </strong>
                    <p className="text-muted-foreground">
                      Mật khẩu người dùng được băm bằng thuật toán <strong>bcrypt / Argon2</strong> có độ phức tạp cao, kèm muối (salt) ngẫu nhiên; không ai, kể cả quản trị viên hệ thống, có thể xem được mật khẩu gốc.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-primary" /> Mã hóa truyền tải SSL/TLS 1.3
                    </strong>
                    <p className="text-muted-foreground">
                      100% kết nối giữa trình duyệt và máy chủ EduTest đều được mã hóa bằng giao thức HTTPS/TLS 1.3 với tiêu chuẩn HSTS bắt buộc.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Row Level Security (RLS)
                    </strong>
                    <p className="text-muted-foreground">
                      Chính sách an ninh cơ sở dữ liệu PostgreSQL cách ly hoàn toàn dữ liệu giữa các người dùng; giáo viên chỉ có quyền truy vấn các đề thi thuộc sở hữu của mình.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-foreground flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-primary" /> Xác thực 2 bước (2FA TOTP)
                    </strong>
                    <p className="text-muted-foreground">
                      Hỗ trợ mã TOTP 6 số qua Google Authenticator / Microsoft Authenticator giúp bảo vệ tài khoản ngay cả khi lộ mật khẩu.
                    </p>
                  </div>
                </div>
              </section>

              {/* Điều 9 */}
              <section id="dieu-9" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    9
                  </span>
                  Thông Cáo Tuân Thủ Quốc Tế (GDPR & CCPA Notice)
                </h2>
                <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-xs text-muted-foreground">
                  <p>
                    Đối với Quý Thầy/Cô, du học sinh hoặc cộng đồng giáo dục sử dụng EduTest từ Liên minh Châu Âu (EU) hoặc bang California (Hoa Kỳ):
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>
                      <strong className="text-foreground">GDPR (EU Regulation 2016/679):</strong> EduTest (phát triển bởi MTD Studio) đóng vai trò Data Controller và tuân thủ các quyền theo Điều 15-22 GDPR, bao gồm quyền hạn chế xử lý (Right to Restriction), quyền phản đối (Right to Object) và chuyển giao dữ liệu (Data Portability).
                    </li>
                    <li>
                      <strong className="text-foreground">CCPA / CPRA Notice:</strong> EduTest long trọng tuyên bố: <em>“We do NOT sell or share your personal information with third parties for cross-context behavioral advertising.”</em> (Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào).
                    </li>
                  </ul>
                </div>
              </section>

              {/* Điều 10 */}
              <section id="dieu-10" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    10
                  </span>
                  Đầu Mối Liên Hệ Hỗ Trợ & Giải Quyết Khiếu Nại
                </h2>
                <p>
                  Mọi thắc mắc, đề nghị thực hiện quyền chủ thể dữ liệu (tra cứu, trích xuất, chỉnh sửa, xóa dữ liệu) hoặc phản ánh về bảo mật, xin vui lòng gửi về:
                </p>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2 text-xs">
                  <p><strong>MTD Studio — Đội ngũ Phát triển & Hỗ trợ EduTest</strong></p>
                  <p>
                    📧 Email tiếp nhận chính thức:{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-bold hover:underline break-all">
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                  <p className="text-muted-foreground pt-1">
                    Thời gian phản hồi cam kết: Tối đa <strong>72 giờ làm việc</strong> kể từ khi tiếp nhận yêu cầu hợp lệ của chủ thể dữ liệu theo luật định.
                  </p>
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
