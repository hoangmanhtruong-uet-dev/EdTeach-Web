"use client";

import React, { useState } from "react";
import { X, Building2, CheckCircle2, FileText, Send, Loader2 } from "lucide-react";

interface VatInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VatInvoiceModal({ isOpen, onClose }: VatInvoiceModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !taxId.trim() || !address.trim() || !email.trim()) {
      setError("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email nhận hóa đơn không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate saving VAT info
    setTimeout(() => {
      try {
        const vatData = {
          companyName: companyName.trim(),
          taxId: taxId.trim(),
          address: address.trim(),
          email: email.trim(),
          orderCode: orderCode.trim(),
          note: note.trim(),
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("edutest_vat_request_latest", JSON.stringify(vatData));
      } catch {
        // ignore storage errors
      }
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 800);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Yêu cầu xuất Hóa đơn điện tử VAT
              </h3>
              <p className="text-xs text-muted-foreground">
                Dành cho Trường học, Trung tâm và Doanh nghiệp
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  Đã tiếp nhận yêu cầu xuất hóa đơn!
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Bộ phận Kế toán EduTest AI sẽ lập và gửi Hóa đơn điện tử VAT hợp lệ tới email{" "}
                  <strong className="text-foreground">{email}</strong> trong vòng 24–48 giờ làm việc.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Tên đơn vị / Trường học / Công ty <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trường THPT Chu Văn An / Công ty TNHH..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Mã số thuế (MST) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mã số thuế doanh nghiệp"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Mã đơn hàng / Giao dịch
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 104829 (tùy chọn)"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Địa chỉ trụ sở theo ĐKKD / Quyết định thành lập <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Email nhận hóa đơn điện tử (.pdf & .xml) <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ketoan@truonghoc.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Ghi chú thêm cho Kế toán
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Xuất hóa đơn dịch vụ phần mềm Giáo dục EduTest AI..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Gửi yêu cầu VAT</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default VatInvoiceModal;
