import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  FileText,
  Scale,
  ShieldAlert,
  Sparkles,
  BookOpen,
  DollarSign,
  UserX,
  Gavel,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Điều khoản Sử dụng Dịch vụ — EdTeach & EduTest AI",
  description:
    "Điều khoản dịch vụ của nền tảng EdTeach. Quy định về tài khoản, quyền sở hữu trí tuệ, trách nhiệm sư phạm đối với đề thi AI, quy chế chợ đề thi và giải quyết tranh chấp.",
};

export default function TermsPage() {
  const lastUpdated = "08/11/2026";
  const effectiveDate = "01/07/2023";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      <Navbar />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center sm:text-left border-b border-border pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
              <Scale className="w-4 h-4" />
              Quy Chế Hoạt Động & Thỏa Thuận Sử Dụng
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
              Điều Khoản Dịch Vụ EdTeach
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Thỏa thuận pháp lý ràng buộc giữa Quý Thầy/Cô, Học sinh, Đối tác sư phạm và Công ty TNHH Công nghệ Giáo dục EdTeach Việt Nam khi truy cập và khai thác hệ sinh thái EduTest AI.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Hiệu lực từ: <strong>{effectiveDate}</strong></span>
              <span>•</span>
              <span>Cập nhật mới nhất: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span className="text-primary font-semibold">Chuẩn GDPT 2025</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Table of Contents */}
            <aside className="lg:col-span-4 order-2 lg:order-1">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-5 shadow-xs">
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Mục Lục Điều Khoản
                </h2>
                <nav className="space-y-1.5 text-xs">
                  {[
                    { id: "dieu-1", label: "1. Chấp thuận & Phạm vi áp dụng" },
                    { id: "dieu-2", label: "2. Tài khoản & Trách nhiệm bảo mật" },
                    { id: "dieu-3", label: "3. Quyền sở hữu trí tuệ & Bản quyền đề thi" },
                    { id: "dieu-4", label: "4. Giới hạn trách nhiệm đối với AI (AI Disclaimer)" },
                    { id: "dieu-5", label: "5. Quy chế Chợ đề thi (Marketplace & Escrow)" },
                    { id: "dieu-6", label: "6. Quy tắc ứng xử & Hành vi bị nghiêm cấm" },
                    { id: "dieu-7", label: "7. Tạm dừng & Chấm dứt tài khoản" },
                    { id: "dieu-8", label: "8. Luật áp dụng & Giải quyết tranh chấp" },
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
                  <p className="font-semibold text-foreground">Bạn có thắc mắc về điều khoản?</p>
                  <p>Bộ phận Pháp chế & CSKH sẵn sàng giải đáp mọi câu hỏi của Quý Thầy/Cô.</p>
                  <a
                    href="mailto:support@edteach.vn"
                    className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                  >
                    Gửi thư cho Pháp chế EdTeach
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <article className="lg:col-span-8 order-1 lg:order-2 space-y-10 text-sm leading-relaxed text-foreground">
              {/* Notice */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-2 text-xs text-muted-foreground">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> Lưu ý quan trọng trước khi đăng ký
                </p>
                <p>
                  Bằng việc tạo tài khoản, đăng nhập hoặc sử dụng bất kỳ tính năng nào của EdTeach (EduTest AI), bạn xác nhận đã đọc, hiểu rõ và đồng ý bị ràng buộc vô điều kiện bởi các Điều khoản Dịch vụ này cùng Chính sách Bảo mật của chúng tôi. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng nền tảng.
                </p>
              </div>

              {/* Điều 1 */}
              <section id="dieu-1" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    1
                  </span>
                  Chấp Thuận & Phạm Vi Áp Dụng
                </h2>
                <p>
                  Điều khoản Dịch vụ này điều chỉnh việc sử dụng toàn bộ hệ sinh thái phần mềm giáo dục EdTeach, bao gồm ứng dụng web tại tên miền <code>edteach.vn</code>, các công cụ tạo ma trận đề thi tự động theo chuẩn GDPT 2025, hệ thống chấm trắc nghiệm bằng camera (EduScan OMR), Bục Giảng Số tương tác, phòng thí nghiệm ảo 3D và Chợ đề thi số (Marketplace).
                </p>
                <p className="text-muted-foreground">
                  Dịch vụ phục vụ ba nhóm đối tượng chính: <strong>Giáo viên (Teacher)</strong>, <strong>Gia sư / Sinh viên sư phạm (Tutor)</strong> và <strong>Học sinh (Student)</strong>. Từng nhóm người dùng phải tuân thủ đúng chức năng và thẩm quyền được phân quyền trên hệ thống.
                </p>
              </section>

              {/* Điều 2 */}
              <section id="dieu-2" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    2
                  </span>
                  Đăng Ký Tài Khoản & Trách Nhiệm Bảo Mật
                </h2>
                <div className="space-y-3">
                  <p>
                    Để sử dụng các tính năng nâng cao, người dùng cần khởi tạo tài khoản thông qua email hoặc liên kết Google OAuth. Bạn cam kết:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                    <li>Cung cấp thông tin chính xác, cập nhật về họ tên, chức danh và đơn vị công tác.</li>
                    <li>Chịu trách nhiệm bảo mật tuyệt đối mật khẩu đăng nhập, mã xác thực 2 bước (TOTP 2FA) và các mã khôi phục dự phòng.</li>
                    <li>Không chia sẻ tài khoản cho người khác hoặc sử dụng chung một tài khoản giữa nhiều cá nhân nhằm lách hạn mức gói cước (sharing account).</li>
                    <li>Thông báo ngay lập tức cho EdTeach khi phát hiện bất kỳ dấu hiệu truy cập trái phép nào vào tài khoản của mình.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
                    <strong>Độ tuổi áp dụng:</strong> Học sinh dưới 15 tuổi khi sử dụng tài khoản học tập cần có sự đồng ý hoặc giám sát của phụ huynh/giáo viên phụ trách theo đúng quy định pháp luật trẻ em.
                  </div>
                </div>
              </section>

              {/* Điều 3 */}
              <section id="dieu-3" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    3
                  </span>
                  Quyền Sở Hữu Trí Tuệ & Bản Quyền Đề Thi
                </h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Bản quyền học liệu thuộc về Quý Thầy/Cô
                    </p>
                    <p className="text-muted-foreground">
                      Thầy/Cô giữ trọn vẹn quyền tác giả và quyền sở hữu đối với các câu hỏi, ma trận đặc tả, đề kiểm tra do chính Thầy/Cô tự biên soạn hoặc tùy biến trên nền tảng. EdTeach <strong>không</strong> đòi hỏi quyền sở hữu đối với các tài liệu mà Thầy/Cô xuất bản sang tệp Word (.docx) hay PDF để phục vụ công tác giảng dạy tại trường lớp.
                    </p>
                  </div>

                  <p className="text-xs">
                    <strong>Quyền sở hữu của EdTeach:</strong> Toàn bộ mã nguồn, giao diện đồ họa, thuật toán chấm thi OMR, thuật toán bố cục ma trận đề thi và nhãn hiệu "EdTeach / EduTest AI" là tài sản trí tuệ độc quyền của Công ty TNHH Công nghệ Giáo dục EdTeach Việt Nam, được bảo hộ theo Luật Sở hữu Trí tuệ Việt Nam.
                  </p>

                  <div className="p-4 rounded-xl bg-card border border-border text-xs text-muted-foreground space-y-1.5">
                    <p className="font-bold text-foreground">Giấy phép Phòng Thí Nghiệm 3D (PhET Simulations):</p>
                    <p>
                      Các mô phỏng tương tác 3D trong phân hệ Phòng thí nghiệm số sử dụng học liệu mở của <em>PhET Interactive Simulations</em> (Đại học Colorado Boulder), được cấp phép theo tiêu chuẩn <strong>Creative Commons Ghi nhận công của tác giả - Phi thương mại 4.0 Quốc tế (CC BY-NC 4.0)</strong>. Nền tảng mở quyền truy cập miễn phí cho toàn bộ giáo viên và học sinh nhằm phục vụ đổi mới giáo dục, không thu phí bản quyền đối với các mô phỏng này.
                    </p>
                  </div>
                </div>
              </section>

              {/* Điều 4 */}
              <section id="dieu-4" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    4
                  </span>
                  Giới Hạn Trách Nhiệm Đối Với Nội Dung AI (AI Disclaimer)
                </h2>
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Tuyên Bố Miễn Trừ Trách Nhiệm Sư Phạm (AI Assistant Disclaimer)</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Tính năng sinh đề thi và gợi ý lời giải trên nền tảng sử dụng công nghệ Trí tuệ Nhân tạo tạo sinh (Generative AI). AI đóng vai trò là <strong>trợ lý công nghệ hỗ trợ tham khảo</strong>, không thay thế cho hội đồng sư phạm hoặc chuyên môn của giáo viên:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">Trách nhiệm thẩm định chuyên môn:</strong> Quý Thầy/Cô có trách nhiệm tối cao trong việc rà soát, kiểm chứng tính chính xác của câu hỏi, đồ thị, đáp án và lời giải chi tiết trước khi in ấn, phát đề hoặc tổ chức thi cho học sinh.
                    </li>
                    <li>
                      <strong className="text-foreground">Hiện tượng suy diễn (AI Hallucination):</strong> Mặc dù hệ thống áp dụng các quy tắc kiểm tra nghiêm ngặt, mô hình AI vẫn có khả năng đưa ra thông số chưa tối ưu hoặc sai sót toán học trong các câu hỏi vận dụng cao.
                    </li>
                    <li>
                      <strong className="text-foreground">Miễn trừ bồi thường:</strong> EdTeach không chịu trách nhiệm pháp lý đối với bất kỳ khiếu nại, điểm số sai lệch hay thiệt hại phát sinh từ việc sử dụng đề thi chưa qua kiểm duyệt chuyên môn của giáo viên.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Điều 5 */}
              <section id="dieu-5" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    5
                  </span>
                  Quy Chế Chợ Đề Thi (Marketplace & Cơ Chế Ký Quỹ Escrow)
                </h2>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    Chợ đề thi sư phạm EdTeach kết nối các giáo viên chia sẻ đề thi chuẩn cấu trúc. Để bảo vệ quyền lợi cả người mua lẫn người bán:
                  </p>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-foreground">
                    <p className="font-bold flex items-center gap-1.5 text-primary">
                      <DollarSign className="w-4 h-4" /> Cơ chế Ký quỹ Tạm giữ 14 ngày (14-Day Escrow Protection)
                    </p>
                    <p className="text-muted-foreground">
                      Khi một giáo viên mua đề thi trên Marketplace, số tiền thanh toán sẽ được hệ thống tạm giữ trong ví ký quỹ trung gian trong vòng <strong>14 ngày</strong>. Người bán chỉ được rút tiền sau khi hết thời hạn 14 ngày nếu không có khiếu nại về chất lượng.
                    </p>
                    <p className="text-muted-foreground">
                      Người mua có quyền gửi yêu cầu khiếu nại trong vòng <strong>72 giờ</strong> kể từ lúc mua nếu phát hiện đề thi sai lệch ma trận nghiêm trọng, tài liệu trắng, hoặc vi phạm bản quyền đề thi của tác giả khác.
                    </p>
                  </div>
                  <p>
                    Nghiêm cấm người bán tải lên đề thi có chứa nội dung kích động, đề thi vi phạm bảo mật kỳ thi quốc gia trước giờ thi, hoặc sao chép trái phép tài liệu của các nhà xuất bản đã đăng ký quyền tác giả.
                  </p>
                </div>
              </section>

              {/* Điều 6 */}
              <section id="dieu-6" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    6
                  </span>
                  Quy Tắc Ứng Xử & Các Hành Vi Bị Nghiêm Cấm
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-destructive flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Gian lận & Phá hoại hệ thống
                    </strong>
                    <p className="text-muted-foreground">
                      Nghiêm cấm hành vi tấn công DDoS, quét lỗ hổng trái phép, khai thác IDOR, đảo ngược mã nguồn (reverse engineering) hoặc tự động hóa cào dữ liệu (scraping).
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-destructive flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Gian lận thi cử trực tuyến
                    </strong>
                    <p className="text-muted-foreground">
                      Nghiêm cấm hành vi phát tán công cụ hack phòng thi ảo, can thiệp kết quả chấm điểm OMR hoặc gian lận danh tính trong các kỳ thi kiểm tra định kỳ.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-destructive flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Giả mạo danh tính sư phạm
                    </strong>
                    <p className="text-muted-foreground">
                      Cấm tải lên thẻ ngành giả mạo hoặc sử dụng thông tin danh tính của người khác để nhận huy hiệu Tích Xanh hoặc lừa đảo bán tài liệu.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                    <strong className="text-destructive flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Nội dung trái pháp luật
                    </strong>
                    <p className="text-muted-foreground">
                      Tuyệt đối không tải lên nội dung phản động, đồi trụy, vi phạm thuần phong mỹ tục, xâm phạm danh dự cá nhân hoặc bí mật nhà nước.
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
                  Tạm Dừng & Chấm Dứt Tài Khoản
                </h2>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <p>
                    EdTeach bảo lưu quyền tạm đình chỉ hoặc chấm dứt vĩnh viễn quyền truy cập tài khoản mà không cần báo trước nếu:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Người dùng vi phạm nghiêm trọng các quy định tại Điều 6 của văn bản này.</li>
                    <li>Có yêu cầu bằng văn bản từ cơ quan thực thi pháp luật hoặc cơ quan thanh tra giáo dục có thẩm quyền.</li>
                    <li>Tài khoản không phát sinh bất kỳ hoạt động đăng nhập nào trong vòng liên tục 24 tháng (tài khoản không hoạt động).</li>
                  </ul>
                  <p>
                    Khi tài khoản bị chấm dứt do vi phạm, số dư credits và quyền truy cập các tài nguyên số chưa sử dụng sẽ bị hủy bỏ mà không được hoàn tiền.
                  </p>
                </div>
              </section>

              {/* Điều 8 */}
              <section id="dieu-8" className="space-y-3 scroll-mt-24">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-black">
                    8
                  </span>
                  Luật Áp Dụng & Cơ Chế Giải Quyết Tranh Chấp
                </h2>
                <div className="p-4 rounded-xl bg-card border border-border space-y-2 text-xs">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <Gavel className="w-4 h-4 text-primary" /> Pháp luật Nước CHXHCN Việt Nam
                  </p>
                  <p className="text-muted-foreground">
                    Các Điều khoản Dịch vụ này được điều chỉnh và giải thích hoàn toàn theo <strong>pháp luật của Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    Mọi tranh chấp phát sinh liên quan đến việc sử dụng dịch vụ trước hết sẽ được ưu tiên thương lượng, hòa giải trên tinh thần tôn trọng lẫn nhau. Trong trường hợp không đạt được thỏa thuận sau 30 ngày kể từ ngày một bên thông báo bằng văn bản, vụ việc sẽ được đưa ra giải quyết tại <strong>Tòa án Nhân dân có thẩm quyền tại Thành phố Hà Nội</strong>. Phán quyết của Tòa án là chung thẩm và ràng buộc đối với cả hai bên.
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
