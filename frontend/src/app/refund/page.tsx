import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  RefreshCw,
  CreditCard,
  Coins,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Mail,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chính sách Hoàn tiền & Đảm bảo Giao dịch — EdTeach & EduTest AI",
  description:
    "Chính sách hoàn tiền minh bạch cho gói cước PRO/MAX, hoàn trả AI Credits, cơ chế bảo vệ giao dịch chợ đề thi 14-ngày Escrow và quy trình hoàn trả qua VietQR.",
};

export default function RefundPage() {
  const lastUpdated = "08/11/2026";
  const effectiveDate = "01/07/2023";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/20">
              <RefreshCw className="w-4 h-4" />
              Bảo Vệ Quyền Lợi Người Tiêu Dùng
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Chính Sách Hoàn Tiền Minh Bạch
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Cam kết công bằng, minh bạch của EdTeach đối với mọi giao dịch nạp điểm AI Credits, đăng ký gói cước bản quyền PRO/MAX và mua bán tài liệu trên Chợ đề thi số.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Hiệu lực từ: <strong>{effectiveDate}</strong></span>
              <span>•</span>
              <span>Cập nhật mới nhất: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span className="text-primary font-semibold">Hoàn tiền qua VietQR Napas247</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Table of Contents */}
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Mục Lục Chính Sách
                </h2>
                <nav className="space-y-1.5 text-xs">
                  {[
                    { id: "tong-quan", label: "1. Nguyên tắc hoàn tiền chung" },
                    { id: "goi-cuoc", label: "2. Hoàn tiền gói cước PRO & MAX" },
                    { id: "ai-credits", label: "3. Hoàn tiền nạp điểm AI Credits" },
                    { id: "cho-de-thi", label: "4. Cơ chế Ký quỹ Chợ đề thi (Escrow)" },
                    { id: "tu-choi", label: "5. Các trường hợp từ chối hoàn tiền" },
                    { id: "quy-trinh", label: "6. Quy trình & Thời gian xử lý" },
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
                  <p className="font-semibold text-foreground">Cần hỗ trợ tra soát giao dịch?</p>
                  <p>Chuẩn bị sẵn Mã giao dịch PayOS và liên hệ đội ngũ tài chính:</p>
                  <a
                    href="mailto:support@edteach.vn"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    support@edteach.vn
                  </a>
                </div>
              </div>
            </aside>

            {/* Content Article */}
            <article className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-sm leading-relaxed text-foreground">
              {/* Tổng quan */}
              <section id="tong-quan" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    1
                  </span>
                  Nguyên Tắc Hoàn Tiền Chung
                </h2>
                <p>
                  Nền tảng EdTeach / EduTest AI hoạt động theo nguyên tắc <strong>bảo vệ tối đa quyền lợi chính đáng của Quý Thầy/Cô và Khách hàng</strong>, tuân thủ Luật Bảo vệ Quyền lợi Người tiêu dùng và Nghị định 52/2013/NĐ-CP về Thương mại Điện tử.
                </p>
                <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Cam kết chất lượng 100% minh bạch</span>
                  </div>
                  <p className="text-muted-foreground">
                    Nếu dịch vụ phát sinh lỗi kỹ thuật hệ thống từ phía EdTeach khiến Quý Thầy/Cô không thể sử dụng gói cước hoặc tạo đề thi, chúng tôi cam kết hoàn lại 100% số tiền đã thanh toán hoặc gia hạn thời gian tương đương theo yêu cầu của Thầy/Cô.
                  </p>
                </div>
              </section>

              {/* Gói cước */}
              <section id="goi-cuoc" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    2
                  </span>
                  Quy Định Hoàn Tiền Cho Gói Cước Bản Quyền (PRO & MAX)
                </h2>
                <div className="space-y-3 text-xs">
                  <p className="text-sm">
                    Đối với các gói cước đăng ký định kỳ hoặc theo năm (Gói Giáo Viên PRO - 149.000đ/tháng và Gói Tổ Bộ Môn MAX - 899.000đ/năm):
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                      <strong className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Được chấp thuận hoàn tiền
                      </strong>
                      <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                        <li>Thanh toán trùng lặp (Double billing): Do lỗi mạng dẫn tới trừ tiền 2 lần cho cùng một gói cước.</li>
                        <li>Sự cố nền tảng gián đoạn liên tục quá <strong>48 giờ</strong> không thể khắc phục.</li>
                        <li>Yêu cầu hủy gói gửi trong vòng <strong>07 ngày</strong> kể từ ngày kích hoạt nếu số lượng đề thi tạo mới chưa vượt quá 03 đề.</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                      <strong className="text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Không áp dụng hoàn tiền
                      </strong>
                      <ul className="text-muted-foreground space-y-1.5 list-disc pl-4">
                        <li>Yêu cầu gửi sau thời hạn 07 ngày kể từ ngày thanh toán thành công.</li>
                        <li>Tài khoản đã sử dụng quá 30% hạn mức tạo đề của chu kỳ gói cước.</li>
                        <li>Tài khoản vi phạm Điều khoản Dịch vụ bị hệ thống khóa hoặc tạm dừng.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Credits */}
              <section id="ai-credits" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    3
                  </span>
                  Quy Định Hoàn Tiền Nạp Điểm AI Credits
                </h2>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p className="text-sm text-foreground">
                    Điểm AI Credits được dùng để tạo câu hỏi nâng cao, xuất phôi Word chất lượng cao và chấm trắc nghiệm OMR.
                  </p>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <p className="font-bold text-foreground flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Coins className="w-4 h-4" /> Điều kiện hoàn trả số dư Credits
                    </p>
                    <p>
                      Khách hàng được yêu cầu hoàn tiền 100% giá trị gói nạp Credits trong vòng <strong>07 ngày</strong> kể từ thời điểm giao dịch nạp thành công qua PayOS / VietQR, <strong>với điều kiện số Credits trong gói nạp đó chưa được sử dụng lần nào</strong>.
                    </p>
                    <p>
                      Trường hợp đã sử dụng một phần số Credits trong gói, EdTeach không hỗ trợ hoàn tiền lẻ cho phần Credits còn lại nhưng số Credits này có giá trị sử dụng vĩnh viễn không bao giờ hết hạn.
                    </p>
                  </div>
                </div>
              </section>

              {/* Chợ đề thi Escrow */}
              <section id="cho-de-thi" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    4
                  </span>
                  Cơ Chế Bảo Vệ Giao Dịch Chợ Đề Thi (14-Ngày Escrow)
                </h2>
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-primary">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Cơ chế Ký quỹ Tạm giữ Bảo vệ Người mua & Người bán</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Để đảm bảo chất lượng tài liệu sư phạm trên Marketplace, EdTeach áp dụng cơ chế <strong>Escrow tạm giữ 14 ngày</strong> cho mọi giao dịch mua tài liệu:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Tạm giữ tiền bán đề thi:</strong> Khi người mua thanh toán mua đề thi của giáo viên khác, số tiền sẽ được giữ an toàn tại tài khoản Escrow của hệ thống trong <strong>14 ngày</strong>. Người bán chưa được rút số tiền này về ngân hàng trong thời gian ân hạn.
                    </li>
                    <li>
                      <strong className="text-foreground">Quyền khiếu nại trong 72 giờ:</strong> Người mua có thời gian <strong>72 giờ</strong> kể từ thời điểm tải tệp về để kiểm tra. Nếu phát hiện tệp tài liệu bị hỏng, rỗng nội dung, sai lệch ma trận công bố quá 30% hoặc đạo văn vi phạm bản quyền, người mua có quyền nhấn nút “Yêu cầu khiếu nại & Hoàn tiền”.
                    </li>
                    <li>
                      <strong className="text-foreground">Đối soát chuyên môn:</strong> Đội ngũ thẩm định sư phạm của EdTeach sẽ kiểm tra trong 24 giờ. Nếu khiếu nại đúng, hệ thống sẽ tự động hoàn trả 100% số tiền vào ví của người mua và gửi cảnh cáo tới người bán.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Từ chối */}
              <section id="tu-choi" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    5
                  </span>
                  Các Trường Hợp Từ Chối Hoàn Tiền
                </h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Hệ thống sẽ từ chối giải quyết yêu cầu hoàn tiền trong các trường hợp sau:</p>
                  <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Đổi ý chủ quan:</strong> Khách hàng thay đổi ý định sau khi đã tải trọn vẹn đề thi và file Word về máy tính.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Hết thời hạn quy định:</strong> Yêu cầu gửi sau thời hạn 07 ngày (đối với gói cước/credits) hoặc sau 72 giờ (đối với đề thi Marketplace).
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border flex items-start gap-2.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Tài khoản gian lận:</strong> Phát hiện tài khoản sử dụng thẻ tín dụng đánh cắp, lạm dụng mã giảm giá hoặc cố tình chia sẻ tài khoản cho nhiều người.
                    </div>
                  </div>
                </div>
              </section>

              {/* Quy trình */}
              <section id="quy-trinh" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    6
                  </span>
                  Quy Trình Gửi Yêu Cầu & Thời Gian Hoàn Tiền
                </h2>
                <div className="space-y-3 text-xs">
                  <p className="text-muted-foreground">
                    Quy trình xử lý hoàn trả tiền được thực hiện theo 3 bước chuẩn hóa:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">Bước 1</span>
                      <p className="font-bold text-foreground">Gửi yêu cầu hoàn tiền</p>
                      <p className="text-muted-foreground text-[11px]">
                        Gửi email tới <a href="mailto:support@edteach.vn" className="text-primary hover:underline">support@edteach.vn</a> ghi rõ: Email tài khoản, Mã đơn hàng PayOS, Lý do yêu cầu kèm ảnh chụp lỗi (nếu có).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">Bước 2</span>
                      <p className="font-bold text-foreground">Xác minh & Phê duyệt</p>
                      <p className="text-muted-foreground text-[11px]">
                        Bộ phận CSKH kiểm tra dữ liệu nhật ký giao dịch trong vòng <strong>24 giờ làm việc</strong> và phản hồi kết quả chấp thuận qua email.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-black text-primary px-2 py-0.5 rounded-full bg-primary/10">Bước 3</span>
                      <p className="font-bold text-foreground">Chuyển tiền hoàn trả</p>
                      <p className="text-muted-foreground text-[11px]">
                        Tiền được hoàn trực tiếp về đúng số tài khoản ngân hàng / VietQR của Quý Thầy/Cô trong vòng <strong>3 đến 5 ngày làm việc</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" /> Cam kết thời gian hoàn tiền
                    </p>
                    <p>
                      Thời gian hoàn tiền: Từ <strong>3 - 5 ngày làm việc</strong> (không tính Thứ Bảy, Chủ Nhật và các ngày nghỉ Lễ, Tết theo quy định của Nhà nước). Khách hàng không phải chịu bất kỳ khoản phí hoàn tiền nào.
                    </p>
                  </div>
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
