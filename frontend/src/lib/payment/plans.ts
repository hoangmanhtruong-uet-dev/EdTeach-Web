import { isEmailAdmin } from "@/lib/auth/admin";

export interface PricingPlan {
  id: string;
  name: string;
  tier: "free" | "pro" | "max";
  price: string;
  amount: number;
  credits: number;
  period: string;
  billingCycle: "monthly" | "semester";
  badge?: string;
  popular?: boolean;
  features: string[];
  description: string;
}

export const PRO_MONTHLY: PricingPlan = {
  id: "pro_monthly",
  name: "Gói Giáo Viên PRO",
  tier: "pro",
  price: "149.000đ",
  amount: 149000,
  credits: 30000,
  period: "/tháng",
  billingCycle: "monthly",
  badge: "Khuyên dùng cho GV",
  popular: true,
  description: "Dành cho Giáo viên trường THCS / THPT đứng lớp tiêu chuẩn",
  features: [
    "Cộng +30.000 Credits/tháng vào ví",
    "Mở khóa Chấm trắc nghiệm OMR tự động không giới hạn (2 camera cùng lúc & Gemini Vision Fallback)",
    "Tạo đề thi trắc nghiệm AI không giới hạn chuẩn ma trận GDPT 2025",
    "Số hóa đề thi tự động từ đường dẫn Web (URL)",
    "Xuất file Word (.docx) & PDF sạch 100% (Không dính watermark hệ thống)",
    "Trộn tối đa 4 mã đề chuẩn GDPT 2025 (kèm Barem ma trận đặc tả)",
    "Mở khóa trọn bộ 54+ Thí nghiệm 3D (Labs) & Kính vẽ Neon bục giảng",
    "Phí sàn Chợ đề thi ưu đãi 15% & Giảm 20% credits mua đề",
  ],
};

export const PRO_SEMESTER: PricingPlan = {
  id: "pro_semester",
  name: "Gói PRO Học Kỳ (5 Tháng)",
  tier: "pro",
  price: "599.000đ",
  amount: 599000,
  credits: 150000,
  period: "/học kỳ (5 tháng)",
  billingCycle: "semester",
  badge: "Tiết kiệm 20%",
  popular: true,
  description: "Đồng hành xuyên suốt một học kỳ thi cử trọn vẹn",
  features: [
    "Toàn bộ đặc quyền của Gói Giáo Viên PRO",
    "Cộng +150.000 Credits vào ví (30.000/tháng x 5 tháng)",
    "Tiết kiệm ngay 146.000đ so với gia hạn từng tháng",
    "Không lo hết lượt giữa các đợt thi Giữa kỳ và Cuối kỳ",
  ],
};

export const MAX_MONTHLY: PricingPlan = {
  id: "max_monthly",
  name: "Gói Luyện Thi MAX",
  tier: "max",
  price: "229.000đ",
  amount: 229000,
  credits: 100000,
  period: "/tháng",
  billingCycle: "monthly",
  badge: "Dành cho gia sư & trung tâm",
  description: "Dành cho Giáo viên Luyện thi / Dạy thêm chuyên nghiệp / Trung tâm",
  features: [
    "Toàn bộ đặc quyền của Gói Giáo Viên PRO",
    "Cộng +100.000 Credits/tháng (Hạ tầng AI VIP - Chế độ Gemini Thinking / DeepSeek R1)",
    "Chấm OMR không giới hạn thiết bị & Tự khớp danh sách lớp (Roster import)",
    "Tải lên PDF/Ảnh đề cũ -> AI bóc tách & 'Nhân bản đề tương tự'",
    "Bộ công cụ sư phạm độc quyền: Live Clone biến thể câu hỏi, Scaffold gợi ý giải & Đa phương pháp",
    "Tự động sinh bài tập Bù lỗ hổng kiến thức (Remediation) & Báo cáo AI gửi Zalo phụ huynh",
    "Trộn đề công nghiệp từ 8 đến 12 mã đề thi độc lập chống quay cóp",
    "Đóng dấu Watermark thương hiệu riêng (Logo, Tên GV, SĐT, cơ sở dạy thêm)",
    "Phòng học Whiteboard tương tác 2 chiều (Học sinh vẽ trực tiếp & Live Poll)",
    "Phí sàn Chợ đề thi chỉ 5% & Giảm 50% credits mua đề VIP",
  ],
};

export const MAX_SEMESTER: PricingPlan = {
  id: "max_semester",
  name: "Gói MAX Học Kỳ (5 Tháng)",
  tier: "max",
  price: "899.000đ",
  amount: 899000,
  credits: 500000,
  period: "/học kỳ (5 tháng)",
  billingCycle: "semester",
  badge: "Tiết kiệm 246.000đ",
  description: "Giải pháp toàn diện cho cả mùa ôn thi tuyển sinh & đại học",
  features: [
    "Toàn bộ đặc quyền của Gói Luyện Thi MAX",
    "Cộng +500.000 Credits khổng lồ vào ví",
    "Tiết kiệm 246.000đ so với thanh toán từng tháng",
    "Ưu tiên xử lý AI tốc độ cao trong các giờ cao điểm mùa thi",
  ],
};

export const CREDIT_PACKS = [
  { credits: 50, price: "49.000đ", amount: 49000, perCredit: "980đ", popular: false, isPro: false },
  { credits: 100, price: "89.000đ", amount: 89000, perCredit: "890đ", popular: true, isPro: false },
  { credits: 200, price: "159.000đ", amount: 159000, perCredit: "795đ", popular: false, isPro: false },
  { credits: 500, price: "349.000đ", amount: 349000, perCredit: "698đ", popular: false, isPro: false },
];

// ==============================================================================
// CHẾ ĐỘ THỬ NGHIỆM BETA: false
// Đã kết thúc giai đoạn thử nghiệm Beta, quay về phân cấp 3 gói chuẩn: FREE, PRO, MAX.
// ==============================================================================
export const IS_BETA_ALL_FEATURES_UNLOCKED = false;

/**
 * Kiểm tra xem gói thuê bao có còn hạn sử dụng hay không.
 * - Trả về false nếu subscription_expires_at đã qua hoặc không hợp lệ.
 * - Trả về true nếu subscription_expires_at > now().
 * - Nếu subscription_expires_at là null/undefined:
 *   + Với trường học (school) hoặc tài khoản quản trị: coi là vĩnh viễn/hợp đồng.
 *   + Với các gói trả phí pro/max thông thường: nếu có ngày hết hạn thì bắt buộc phải chưa hết hạn.
 */
export function isSubscriptionActive(profile: any): boolean {
  if (!profile) return false;

  const rawExpires = profile.subscription_expires_at || (profile as any).subscriptionExpiresAt;
  if (rawExpires) {
    const expiresTimestamp = new Date(rawExpires).getTime();
    if (isNaN(expiresTimestamp) || expiresTimestamp <= Date.now()) {
      return false; // Đã hết hạn!
    }
    return true; // Còn hạn
  }

  // Nếu không có subscription_expires_at:
  // Nếu là gói free thì không có quyền trả phí
  if (!profile.tier || profile.tier === "free") return false;

  // Trường học (school) hoặc tài khoản được cấp thủ công không set hạn
  return true;
}

/**
 * Kiểm tra người dùng có quyền gói MAX (Luyện thi VIP / Trường học / Quản trị viên)
 */
export function isMaxUser(profile: any): boolean {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  if (!profile) return false;

  // Quản trị viên hệ thống (theo database hoặc environment config) có toàn quyền gói MAX
  if (profile.role === "admin" || isEmailAdmin(profile)) {
    return true;
  }

  // Nguồn chân lý là cột 'tier' trên bảng public.users
  const tier = profile.tier || (profile as any).subscription_tier;
  if (tier !== "max" && tier !== "school") {
    return false;
  }
  // Đối chiếu chặt chẽ subscription_expires_at > now()
  return isSubscriptionActive(profile);
}

/**
 * Kiểm tra người dùng có quyền gói PRO (Gói MAX tự động bao gồm toàn bộ quyền gói PRO)
 */
export function isProUser(profile: any): boolean {
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return true;
  if (!profile) return false;
  // Người dùng gói MAX có toàn bộ đặc quyền của gói PRO
  if (isMaxUser(profile)) return true;
  const tier = profile.tier || (profile as any).subscription_tier;
  if (tier !== "pro") {
    return false;
  }
  // Đối chiếu chặt chẽ subscription_expires_at > now()
  return isSubscriptionActive(profile);
}

/**
 * Kiểm tra xem người dùng có thực sự nạp tiền / đăng ký gói trả phí hay không
 * Dùng để phân luồng API Key:
 * - isRealPayingUser = true  -> Gọi GEMINI_API_KEY_PAID (Hạ tầng 2.000 RPM, bảo mật cao cấp)
 * - isRealPayingUser = false -> Gọi GEMINI_API_KEY_FREE (Hạ tầng Free tier)
 */
export function isRealPayingUser(profile: any): boolean {
  return isProUser(profile);
}

/**
 * Lấy phân hạng hiệu lực hiện tại sau khi đã kiểm tra thời hạn
 */
export function getEffectiveTier(profile: any): "free" | "pro" | "max" | "school" {
  if (isMaxUser(profile)) {
    return profile?.tier === "school" ? "school" : "max";
  }
  if (isProUser(profile)) {
    return "pro";
  }
  return "free";
}

export function getTierName(profile: any): string {
  if (isMaxUser(profile)) {
    return profile?.tier === "school" ? "GÓI TRƯỜNG HỌC (SCHOOL)" : "GÓI LUYỆN THI MAX";
  }
  if (isProUser(profile)) return "GÓI GIÁO VIÊN PRO";
  if (IS_BETA_ALL_FEATURES_UNLOCKED) return "GÓI LUYỆN THI MAX (BETA)";
  return "GÓI MIỄN PHÍ";
}
