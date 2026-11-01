"use client";

import React from "react";
import Link from "next/link";
import { Download, Play, Video, Image as ImageIcon, Copy, Check, ExternalLink, Sparkles, ArrowLeft } from "lucide-react";

export default function MarketingKitPage() {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const banners = [
    {
      id: "banner_1",
      title: "1. Bục Giảng Số Split-Screen (50:50)",
      desc: "Cột trái chiếu đề 3 lớp mở dần (Gợi ý → Công thức → Lời giải) • Cột phải Bảng nháp Excalidraw tự lưu nét vẽ.",
      src: "/marketing/banners/banner_1_split_screen.png",
      tag: "FLAGSHIP BỤC GIẢNG",
    },
    {
      id: "banner_2",
      title: "2. Kính Vẽ Neon Đè Lên 54+ Phòng TN 3D",
      desc: "Vừa cho mô hình Vật lý/Hóa học/Sinh học chạy, vừa bật lớp kính vẽ neon đè trực tiếp để vẽ vector và khoanh chú thích.",
      src: "/marketing/banners/banner_2_lab3d_glass.png",
      tag: "54+ THÍ NGHIỆM 3D",
    },
    {
      id: "banner_3",
      title: "3. AI Đẻ Câu Tương Tự & Timer 2 Phút",
      desc: "Chữa xong câu khó, AI sinh ngay câu hỏi cùng dạng đổi số liệu kèm đồng hồ đếm ngược ⏱️ 02:00 cho cả lớp làm thử.",
      src: "/marketing/banners/banner_3_ai_clone_timer.png",
      tag: "VŨ KHÍ AI VIP",
    },
    {
      id: "banner_4",
      title: "4. Bảng Vẽ Sư Phạm — Bảng Xanh Phấn Trắng",
      desc: "Phông nền bảng xanh chống lóa chân thực, bảng đen, ô ly học sinh • Ngăn kéo chèn câu hỏi từ kho đề & chợ đề.",
      src: "/marketing/banners/banner_4_chalkboard.png",
      tag: "BẢNG VẼ SƯ PHẠM",
    },
    {
      id: "banner_5",
      title: "5. Chấm OMR Điện Thoại & Chữa Nóng Trên Bảng",
      desc: "Quét camera 3 phút chấm cả lớp • Tự động lọc các câu sai trên 40% để đưa thẳng lên Bục Giảng chữa dứt điểm.",
      src: "/marketing/banners/banner_5_omr_grading.png",
      tag: "CHẤM THI 0Đ MÁY QUÉT",
    },
  ];

  const seedingPosts = [
    {
      title: "Mẫu 1: Đánh vào Nỗi Đau Máy Chiếu & Giảng Dạy Tương Tác",
      text: `🔥 CÁC THẦY CÔ ĐANG DẠY HỌC BẰNG MÁY CHIẾU HAY SMART BOARD ĐÃ BIẾT CÁCH NÀY CHƯA?

Không chỉ là phần mềm soạn đề thông thường, EdTeach vừa ra mắt tính năng BỤC GIẢNG SỐ 4.0 cực đỉnh cho năm học chuẩn GDPT 2025:
✨ Chế độ Split-Screen chia đôi: Chiếu đề phông chữ to rõ mở dần 3 lớp (Gợi ý 💡 -> Công thức 📐 -> Lời giải chi tiết ✅). Cột bên cạnh là Bảng nháp tự động lưu nét vẽ cho từng câu!
✨ Hơn 54+ Phòng thí nghiệm 3D (Lý, Hóa, Sinh, Địa) có KÍNH VẼ TRONG SUỐT: Vừa cho con lắc dao động/phản ứng hóa học chạy, vừa vẽ vector lực đè trực tiếp lên màn hình.
✨ Vũ khí AI 'Đẻ câu tương tự' tại chỗ kèm đồng hồ đếm ngược ⏱️ 02:00 để cả lớp vận dụng ngay.
✨ Chấm thi trắc nghiệm OMR bằng camera điện thoại 0 đồng, lọc ngay câu sai >40% đưa lên bục giảng chữa dứt điểm!

🎁 Hiện tại đang MỞ KHÓA MIỄN PHÍ 14 NGÀY toàn bộ tính năng PRO & MAX cho giáo viên trải nghiệm:
👉 Thầy/Cô dùng thử ngay tại: https://ed-teach-rust.vercel.app

#EdTeach #BucGiangSo #GDPT2025 #GiaoVienVietNam #SoanDeAI #Excalidraw #ThiNghiem3D`,
    },
    {
      title: "Mẫu 2: Dành riêng cho Giáo viên Tự Nhiên (Toán - Lý - Hóa - Sinh)",
      text: `⚡ BÍ QUYẾT GIÚP TIẾT DẠY TOÁN - LÝ - HÓA HÚT HỌC SINH TỪ PHÚT ĐẦU TIÊN!

Thầy/Cô dạy bài khó mà học sinh dưới lớp lơ mơ?
Bấm 1 nút trên EdTeach:
1️⃣ AI tự động BẺ NHỎ BÀI TOÁN thành 3 bước dẫn dắt (Giả thiết -> Phương trình -> Biện luận).
2️⃣ Đẻ ngay câu hỏi tương tự đổi số liệu số đẹp kèm Timer 2 phút cho học sinh làm thử.
3️⃣ Mở mô hình 3D trực quan bật kính vẽ neon khoanh chú thích ngay trên chuyển động vật lý.

Đăng ký tài khoản miễn phí tặng ngay 5.000 credits trải nghiệm cho Thầy Cô:
👉 Trải nghiệm ngay: https://ed-teach-rust.vercel.app`,
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Về Dashboard
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-blue-400 font-semibold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Bộ Tài Nguyên Seeding Quảng Cáo
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Bộ Ấn Phẩm Seeding & Video Giới Thiệu Bục Giảng Số 4.0
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Đầy đủ Video HD 1080p có thuyết minh tiếng Việt chuẩn, 5 Banner đồ họa 1920x1080 và bài viết mẫu để đi seeding Facebook / Zalo / TikTok.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/marketing/edteach_flagship_demo.mp4"
              download="edteach_flagship_demo.mp4"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-bold shadow-lg transition"
            >
              <Download className="w-4 h-4" />
              <span>Tải Video MP4 (~900KB)</span>
            </a>
          </div>
        </div>

        {/* SECTION 1: VIDEO DEMO CHIẾU BỤC GIẢNG SỐ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <Video className="w-5 h-5 text-amber-400" />
            <h2>1. Video Demo Nghiệp Vụ Thực Tế (HD 1080p • H.264 MP4 • Có Thuyết Minh)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Video quay trực tiếp từ màn hình Bục Giảng Số: Split-Screen 3 lớp mở lời giải, tương tác mô hình 3D, Kính vẽ neon, AI đẻ câu tương tự và Timer 2 phút.
          </p>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl p-4">
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative">
              <video
                src="/marketing/edteach_flagship_demo.mp4"
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-4">
                <span>⏱️ Thời lượng: <strong>26 giây</strong> (Tối ưu Reels / TikTok / Shorts)</span>
                <span>📺 Định dạng: <strong>MP4 1080p (H.264 + AAC)</strong></span>
                <span>🎙️ Giọng thuyết minh: <strong>Hoài My (Việt Nam)</strong></span>
              </div>
              <a
                href="/marketing/edteach_flagship_demo.mp4"
                download="edteach_flagship_demo.mp4"
                className="text-blue-400 hover:underline font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Bấm vào đây để tải file video về máy
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 2: BỘ 5 BANNER HÌNH ẢNH QUẢNG CÁO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <h2>2. Bộ 5 Banner Đồ Họa 1920x1080 (Chuẩn Đăng Facebook / Zalo / Forum)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Hình ảnh được chụp từ màn hình thực tế, đóng khung mockup viền trình duyệt chuyên nghiệp với tiêu đề sư phạm bắt mắt.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col shadow-lg">
                <div className="aspect-video w-full bg-slate-950 relative overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.src} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300 border border-amber-400/30">
                    {b.tag}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{b.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{b.desc}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">1920 x 1080 (PNG)</span>
                    <a
                      href={b.src}
                      download={`${b.id}.png`}
                      className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải ảnh gốc
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: MẪU BÀI VIẾT SEEDING SẴN SÀNG */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-bold text-white">
            <Copy className="w-5 h-5 text-emerald-400" />
            <h2>3. Mẫu Bài Viết Seeding Có Sẵn (Chỉ Cần Bấm Copy & Đăng Kèm Ảnh/Video)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {seedingPosts.map((post, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-amber-300">{post.title}</h3>
                    <button
                      onClick={() => handleCopy(post.text, idx)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        copiedIndex === idx
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Đã copy
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy bài viết
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl whitespace-pre-wrap font-sans leading-relaxed border border-slate-800/80 max-h-60 overflow-y-auto">
                    {post.text}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
