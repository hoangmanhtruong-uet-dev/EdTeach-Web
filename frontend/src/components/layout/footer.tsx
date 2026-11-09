import Link from "next/link";
import { BookOpen, Building2, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50 dark:bg-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Corporate Overview */}
          <div className="lg:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Edu<span className="text-primary">Test</span> AI
              </span>
            </Link>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Công ty TNHH Công nghệ Giáo dục EdTeach Việt Nam
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Nền tảng tạo đề thi và khảo thí thông minh chuẩn GDPT 2025 dành cho giáo viên Việt Nam.
            </p>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-1.5">
                <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong className="text-slate-700 dark:text-slate-300">Mã số thuế (MST):</strong> 0110826928
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong className="text-slate-700 dark:text-slate-300">Địa chỉ trụ sở:</strong> Tầng 5, Tòa nhà FPT, Phố Duy Tân, Phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội
                </span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Sản phẩm</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Bảng giá</Link></li>
              <li><Link href="/updates" className="text-primary font-medium hover:underline">Lộ trình & Bản mới v2.0</Link></li>
              <li><Link href="/settings?tab=guide" className="hover:text-primary transition-colors">Hướng dẫn</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pháp lý</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Chính sách Cookie</Link></li>
              <li><Link href="/refund" className="hover:text-primary transition-colors">Chính sách hoàn tiền</Link></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hỗ trợ & Liên hệ</h3>
            <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <Phone className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>Hotline: <strong className="text-slate-800 dark:text-slate-200">1900 6825</strong> (8:00 - 21:00)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Mail className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>Email: <a href="mailto:support@edteach.vn" className="hover:underline text-primary">support@edteach.vn</a></span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>Liên hệ DPO: <a href="mailto:dpo@edteach.vn" className="hover:underline text-primary">dpo@edteach.vn</a></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            © 2025 - 2026 EduTest AI. Bản quyền thuộc về Công ty TNHH Công nghệ Giáo dục EdTeach Việt Nam.
          </div>
          <div>
            Tuân thủ Nghị định 13/2023/NĐ-CP & Luật Quảng cáo 16/2012/QH13
          </div>
        </div>
      </div>
    </footer>
  );
}