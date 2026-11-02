/**
 * Quản lý trạng thái gói cước, CTA matrix và tính toán giá chu kỳ chuẩn
 * Đáp ứng các quy tắc S2, S3, S4, S7 - EduTest AI
 */

import { IS_BETA_ALL_FEATURES_UNLOCKED } from "./plans";

export type PlanTier = "free" | "pro" | "max";
export type UserPlanState = "free" | "pro" | "max-paid" | "max-beta";
export type BillingCycle = "monthly" | "semester";

export interface PlanCtaResult {
  label: string;
  disabled: boolean;
  variant: "current" | "included" | "renew" | "upgrade" | "default";
  actionType: "none" | "checkout";
  badge?: string;
  helperText?: string;
}

export interface PlanPricingDetail {
  tier: PlanTier;
  cycle: BillingCycle;
  name: string;
  displayPrice: string; // e.g. "149.000đ" or "119.800đ"
  periodLabel: string; // e.g. "/tháng"
  totalPriceText: string; // e.g. "thanh toán một lần 599.000đ"
  rawAmount: number;
  credits: number;
  originalPriceText?: string; // e.g. "745.000đ" (gạch ngang)
  savingsPercent?: number; // e.g. 20 or 21
  savingsBadge?: string; // e.g. "Tiết kiệm 20%"
}

/**
 * Xác định phân hạng trạng thái của người dùng
 */
export function getUserPlanState(profile: any, user?: any): UserPlanState {
  const p = profile || user;
  const rawTier = p?.tier || (p as any)?.subscription_tier;

  // Nếu người dùng đã thực sự có tier pro hoặc max/school trên database
  if (rawTier === "max" || rawTier === "school") {
    return "max-paid";
  }
  if (rawTier === "pro") {
    return "pro";
  }

  // Nếu trong chế độ Beta toàn sàn và chưa thanh toán gói riêng
  if (IS_BETA_ALL_FEATURES_UNLOCKED) {
    return "max-beta";
  }

  return "free";
}

/**
 * Ma trận trạng thái nút bấm CTA (3 Gói x 4 Trạng thái người dùng)
 * Tuân thủ S2 mục 4
 */
export function getPlanCta(
  planTier: PlanTier,
  userState: UserPlanState,
  _expiresAt?: string | null
): PlanCtaResult {
  switch (userState) {
    case "free": {
      if (planTier === "free") {
        return {
          label: "Gói hiện tại",
          disabled: true,
          variant: "current",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Nâng cấp PRO ngay",
          disabled: false,
          variant: "upgrade",
          actionType: "checkout",
        };
      }
      return {
        label: "Nâng cấp MAX ngay",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
    }

    case "pro": {
      if (planTier === "free") {
        return {
          label: "Đã bao gồm trong gói của bạn",
          disabled: true,
          variant: "included",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Gia hạn gói PRO",
          disabled: false,
          variant: "renew",
          actionType: "checkout",
        };
      }
      return {
        label: "Nâng cấp lên MAX",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
    }

    case "max-paid": {
      if (planTier === "free") {
        return {
          label: "Đã bao gồm trong gói của bạn",
          disabled: true,
          variant: "included",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Đã bao gồm trong gói MAX",
          disabled: true,
          variant: "included",
          actionType: "none",
          helperText: "Bạn đã có đặc quyền MAX cao hơn",
        };
      }
      return {
        label: "Gia hạn gói MAX",
        disabled: false,
        variant: "renew",
        actionType: "checkout",
      };
    }

    case "max-beta": {
      if (planTier === "free") {
        return {
          label: "Gói tiêu chuẩn tài khoản",
          disabled: true,
          variant: "default",
          actionType: "none",
        };
      }
      if (planTier === "pro") {
        return {
          label: "Đăng ký gói PRO",
          disabled: false,
          variant: "upgrade",
          actionType: "checkout",
          helperText: "Đang dùng thử Beta MAX",
        };
      }
      return {
        label: "Đăng ký chính thức gói MAX",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
        helperText: "Kích hoạt chính thức sau Beta",
      };
    }

    default:
      return {
        label: "Chọn gói",
        disabled: false,
        variant: "upgrade",
        actionType: "checkout",
      };
  }
}

/**
 * Tính toán giá gói và mức chiết khấu theo chu kỳ thực tế
 * Không bao giờ đổi giá/credits niêm yết
 */
export function getPlanPricing(tier: PlanTier, cycle: BillingCycle): PlanPricingDetail {
  if (tier === "free") {
    return {
      tier: "free",
      cycle,
      name: "Gói Miễn Phí",
      displayPrice: "0đ",
      periodLabel: "/ mãi mãi",
      totalPriceText: "Miễn phí trải nghiệm trọn đời",
      rawAmount: 0,
      credits: 5000,
    };
  }

  if (tier === "pro") {
    if (cycle === "monthly") {
      return {
        tier: "pro",
        cycle: "monthly",
        name: "Gói Giáo Viên PRO",
        displayPrice: "149.000đ",
        periodLabel: "/tháng",
        totalPriceText: "Thanh toán từng tháng",
        rawAmount: 149000,
        credits: 30000,
      };
    }
    // Semester 5 months: 599.000đ (thay vì 149.000 * 5 = 745.000đ)
    // Quy đổi tháng: 599.000 / 5 = 119.800đ/tháng
    // Tiết kiệm: (745000 - 599000) / 745000 = 19.597% -> làm tròn 20%
    const monthlyEquivalent = Math.round(599000 / 5);
    const savingsPercent = Math.round(((149000 * 5 - 599000) / (149000 * 5)) * 100);
    return {
      tier: "pro",
      cycle: "semester",
      name: "Gói PRO Học Kỳ (5 Tháng)",
      displayPrice: `${monthlyEquivalent.toLocaleString("vi-VN")}đ`,
      periodLabel: "/tháng",
      totalPriceText: "thanh toán một lần 599.000đ (5 tháng)",
      originalPriceText: "745.000đ",
      rawAmount: 599000,
      credits: 150000,
      savingsPercent,
      savingsBadge: `Tiết kiệm ${savingsPercent}%`,
    };
  }

  // MAX
  if (cycle === "monthly") {
    return {
      tier: "max",
      cycle: "monthly",
      name: "Gói Luyện Thi MAX",
      displayPrice: "229.000đ",
      periodLabel: "/tháng",
      totalPriceText: "Thanh toán từng tháng",
      rawAmount: 229000,
      credits: 100000,
    };
  }

  // MAX Semester 5 months: 899.000đ (thay vì 229.000 * 5 = 1.145.000đ)
  // Quy đổi tháng: 899.000 / 5 = 179.800đ/tháng
  // Tiết kiệm: (1145000 - 899000) / 1145000 = 21.48% -> làm tròn 21%
  const maxMonthlyEquivalent = Math.round(899000 / 5);
  const maxSavingsPercent = Math.round(((229000 * 5 - 899000) / (229000 * 5)) * 100);
  return {
    tier: "max",
    cycle: "semester",
    name: "Gói MAX Học Kỳ (5 Tháng)",
    displayPrice: `${maxMonthlyEquivalent.toLocaleString("vi-VN")}đ`,
    periodLabel: "/tháng",
    totalPriceText: "thanh toán một lần 899.000đ (5 tháng)",
    originalPriceText: "1.145.000đ",
    rawAmount: 899000,
    credits: 500000,
    savingsPercent: maxSavingsPercent,
    savingsBadge: `Tiết kiệm ${maxSavingsPercent}%`,
  };
}

/**
 * Gắn sự kiện đo lường an toàn (không gửi dữ liệu cá nhân)
 */
export function trackPlanEvent(
  eventName:
    | "plan_view"
    | "plan_cycle_toggle"
    | "plan_cta_click"
    | "checkout_open"
    | "checkout_success"
    | "checkout_abandon"
    | "faq_expand",
  metadata?: Record<string, any>
) {
  try {
    if (typeof window !== "undefined") {
      // Dispatches custom event for any analytics listeners
      window.dispatchEvent(
        new CustomEvent("edutest_plan_event", {
          detail: { eventName, ...metadata, timestamp: Date.now() },
        })
      );
      if (process.env.NODE_ENV === "development") {
        console.debug(`[Telemetry] ${eventName}`, metadata);
      }
    }
  } catch {
    // Ignore telemetry errors
  }
}
