/**
 * Bảng giá chính thức của EdTeach - Server-Side Source of Truth
 * Ngăn chặn tuyệt đối lỗ hổng Thao túng giá (Price Tampering)
 */

export interface PricingPackage {
  id: string;
  name: string;
  amount: number;
  credits: number;
  isPro: boolean;
  tier?: "pro" | "max";
}

export const PRICING_PACKAGES: Record<string, PricingPackage> = {
  pro_monthly: {
    id: "pro_monthly",
    name: "Gói Giáo Viên PRO",
    amount: 149000,
    credits: 30000,
    isPro: true,
    tier: "pro",
  },
  pro_monthly_legacy: {
    id: "pro_monthly_legacy",
    name: "Gói Giáo Viên PRO (Ưu Đãi)",
    amount: 99000,
    credits: 30000,
    isPro: true,
    tier: "pro",
  },
  pro_semester: {
    id: "pro_semester",
    name: "Gói PRO Học Kỳ (5 Tháng)",
    amount: 599000,
    credits: 150000,
    isPro: true,
    tier: "pro",
  },
  max_monthly: {
    id: "max_monthly",
    name: "Gói Luyện Thi MAX",
    amount: 229000,
    credits: 100000,
    isPro: true,
    tier: "max",
  },
  max_semester: {
    id: "max_semester",
    name: "Gói MAX Học Kỳ (5 Tháng)",
    amount: 899000,
    credits: 500000,
    isPro: true,
    tier: "max",
  },
  credits_50: {
    id: "credits_50",
    name: "Gói 50 Credits",
    amount: 49000,
    credits: 50,
    isPro: false,
  },
  credits_100: {
    id: "credits_100",
    name: "Gói 100 Credits",
    amount: 89000,
    credits: 100,
    isPro: false,
  },
  credits_200: {
    id: "credits_200",
    name: "Gói 200 Credits",
    amount: 159000,
    credits: 200,
    isPro: false,
  },
  credits_500: {
    id: "credits_500",
    name: "Gói 500 Credits",
    amount: 349000,
    credits: 500,
    isPro: false,
  },
};

/**
 * Xác thực và tìm gói nạp hợp lệ dựa trên amount và credits hoặc packageId
 */
export function validateAndResolvePackage(params: {
  packageId?: string;
  amount?: number;
  credits?: number;
  isPro?: boolean;
}): PricingPackage | null {
  const { packageId, amount, credits, isPro } = params;

  if (packageId && PRICING_PACKAGES[packageId]) {
    return PRICING_PACKAGES[packageId];
  }

  // Đối chiếu chặt chẽ theo amount và credits với bảng giá chuẩn
  for (const pkg of Object.values(PRICING_PACKAGES)) {
    if (pkg.amount === amount && pkg.credits === credits) {
      if (isPro !== undefined && pkg.isPro !== isPro) {
        continue;
      }
      return pkg;
    }
  }

  return null;
}
