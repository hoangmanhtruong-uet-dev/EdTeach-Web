import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">
                Edu<span className="text-primary">Test</span> AI
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Nền tảng tạo đề thi tự động bằng AI dành cho giáo viên Việt Nam.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold">Sản phẩm</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground">Tính năng</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground">Bảng giá</Link></li>
              <li><Link href="/updates" className="text-primary font-medium hover:underline">Lộ trình & Bản mới v2.0</Link></li>
              <li><Link href="/guide" className="hover:text-foreground">Hướng dẫn</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold">Pháp lý</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Chính sách bảo mật</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold">Liên hệ</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Email: {SUPPORT_EMAIL}</li>
              <li>
                <Link href="https://facebook.com" className="hover:text-foreground">
                  Facebook
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2025 EduTest AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}