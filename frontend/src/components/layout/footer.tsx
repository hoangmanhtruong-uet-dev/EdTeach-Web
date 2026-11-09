import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50 dark:bg-slate-950/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Developer Overview */}
          <div className="lg:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Edu<span className="text-primary">Test</span>
              </span>
            </Link>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Sản phẩm được phát triển bởi MTD Studio
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Nền tảng tạo đề thi và khảo thí thông minh chuẩn GDPT 2025 dành cho giáo viên Việt Nam.
            </p>
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
                <Mail className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                <span>
                  Email hỗ trợ:{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline text-primary break-all">
                    {SUPPORT_EMAIL}
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div>
            © 2025 - 2026 EduTest. Sản phẩm được phát triển bởi MTD Studio.
          </div>
          <div>
            Tuân thủ Nghị định 13/2023/NĐ-CP & Luật Quảng cáo 16/2012/QH13
          </div>
        </div>
      </div>
    </footer>
  );
}