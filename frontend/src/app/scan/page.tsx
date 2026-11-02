"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";

export default function ScanLandingPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectByPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/grading/continuous-session?pin=${encodeURIComponent(pin.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && data.session) {
        router.push(`/scan/${data.session.sessionToken}`);
      } else {
        // Fallback kiểm tra remote session cũ
        const oldRes = await fetch("/api/grading/remote-session/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: pin.trim(), token: pin.trim() }),
        });
        const oldData = await oldRes.json();
        if (oldRes.ok && oldData.success && oldData.session) {
          router.push(`/scan/${oldData.session.token}`);
        } else {
          setError(data.error || "Mã PIN 4 số không đúng hoặc phiên đã hết hạn.");
        }
      }
    } catch (err: any) {
      setError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <Smartphone className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-xl font-black text-neutral-100 tracking-tight">
            Kết Nối Máy Quét Phiếu
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            Nhập mã PIN 4 số hiển thị trên màn hình máy tính của giáo viên để bắt đầu chụp phiếu liên tục.
          </p>
        </div>

        <form onSubmit={handleConnectByPin} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setError(null);
              }}
              placeholder="Ví dụ: 8216"
              className="w-full text-center text-3xl font-mono font-black tracking-widest py-3.5 px-4 bg-neutral-950 border border-neutral-700 focus:border-emerald-500 rounded-2xl text-white outline-none transition placeholder:text-neutral-600 placeholder:text-lg"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 shadow-lg shadow-emerald-950/40"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang kết nối...
              </>
            ) : (
              <>
                Vào phòng chấm
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bảo mật phiên chấm thi • Kết nối tức thì không cần cài App</span>
        </div>
      </div>
    </div>
  );
}
