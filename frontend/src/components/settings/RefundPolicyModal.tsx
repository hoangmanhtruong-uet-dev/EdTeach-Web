"use client";

import React from "react";
import { X, ShieldCheck, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface RefundPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RefundPolicyModal({ isOpen, onClose }: RefundPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Chính Sách Hoàn Tiền & Bảo Vệ Khách Hàng
              </h3>
              <p className="text-xs text-muted-foreground">
                Minh bạch, bảo đảm quyền lợi Thầy Cô giáo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-foreground/90 max-h-[70vh] overflow-y-auto">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3">
            <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-foreground">Thời hạn yêu cầu hoàn tiền:</p>
              <p className="text-muted-foreground mt-0.5">
                Trong vòng <strong>03 ngày</strong> kể từ thời điểm giao dịch VietQR được xác nhận thành công.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>1. Điều kiện áp dụng hoàn tiền 100%:</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                Chuyển khoản nhầm số tiền hoặc chuyển trùng lệnh hai lần cho cùng một mã đơn.
              </li>
              <li>
                Gặp sự cố kỹ thuật của hệ thống khiến tính năng không thể kích hoạt và Thầy Cô chưa sử dụng quá <strong>500 Credits</strong> trong gói.
              </li>
              <li>
                Trường học đặt nhầm gói đăng ký và thông báo lại ngay trong vòng 24 giờ.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>2. Trường hợp không áp dụng hoàn tiền:</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                Tài khoản đã sử dụng trên 500 Credits để tạo đề thi AI hoặc đã xuất file Word không giới hạn.
              </li>
              <li>
                Các gói nạp Credits lẻ đã được tiêu thụ vào tạo đề thi hoặc giao dịch trên Chợ đề.
              </li>
              <li>
                Quá thời hạn 03 ngày kể từ khi thanh toán thành công.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-sm">
              3. Phương thức và thời gian giải ngân:
            </h4>
            <p className="text-muted-foreground">
              Tiền hoàn sẽ được chuyển khoản trực tiếp qua hệ thống Napas247 về chính số tài khoản ngân hàng mà Thầy Cô đã dùng để thanh toán trong vòng <strong>24 – 48 giờ làm việc</strong>.
            </p>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Hỗ trợ khẩn cấp: <strong>Zalo OA EduTest AI</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RefundPolicyModal;
