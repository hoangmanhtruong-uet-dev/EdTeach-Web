import { createClient } from "@supabase/supabase-js";
import { APP_URL, MINIMUM_PAYOUT_VND } from "@/lib/constants";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(url, key);
}

export interface AffiliateCommissionItem {
  id: string;
  inviteeMaskedEmail: string;
  orderCode: string;
  orderAmount: number;
  commissionAmount: number;
  createdAt: string;
}

export interface AffiliatePayoutItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  payoutType: "cash" | "credits";
  amountVnd: number;
  creditsReceived: number;
  bankCode?: string | null;
  bankAccount?: string | null;
  bankAccountName?: string | null;
  status: "pending" | "completed" | "rejected";
  adminNote?: string | null;
  referenceCode?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export interface AffiliateStats {
  referralCode: string;
  shareUrl: string;
  affiliateBalance: number;
  totalAffiliateEarned: number;
  inviteeCount: number;
  convertedCount: number;
  recentCommissions: AffiliateCommissionItem[];
  pendingPayouts: AffiliatePayoutItem[];
}

// In-memory Fallback Store for Local Development, Testing and Resilience
class AffiliateFallbackStore {
  private users: Map<
    string,
    {
      referralCode: string;
      affiliateBalance: number;
      totalEarned: number;
      referredBy?: string;
      email?: string;
      name?: string;
    }
  > = new Map();

  private commissions: Array<{
    id: string;
    inviterId: string;
    inviteeId: string;
    orderCode: string;
    orderAmount: number;
    commissionRate: number;
    commissionAmount: number;
    createdAt: string;
  }> = [];

  private payouts: AffiliatePayoutItem[] = [];

  constructor() {
    // Seed default demo user for frictionless tests
    this.users.set("demo-teacher-id", {
      referralCode: "EDU99VIP",
      affiliateBalance: 250000,
      totalEarned: 450000,
      email: "teacher@edutest.ai",
      name: "Thầy Nguyễn Văn An",
    });

    this.commissions.push({
      id: "comm-1",
      inviterId: "demo-teacher-id",
      inviteeId: "sub-1",
      orderCode: "109823",
      orderAmount: 229000,
      commissionRate: 0.2,
      commissionAmount: 45800,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    });

    this.payouts.push({
      id: "payout-seed-demo",
      userId: "demo-teacher-id",
      userName: "Thầy Nguyễn Văn An",
      userEmail: "teacher@edutest.ai",
      payoutType: "cash",
      amountVnd: 150000,
      creditsReceived: 0,
      bankCode: "VCB",
      bankAccount: "9876543210",
      bankAccountName: "NGUYEN VAN AN",
      status: "pending",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    });
  }

  getUser(userId: string) {
    if (!this.users.has(userId)) {
      this.users.set(userId, {
        referralCode: "EDU" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        affiliateBalance: 0,
        totalEarned: 0,
      });
    }
    return this.users.get(userId)!;
  }

  setReferredBy(inviteeId: string, inviterCodeOrId: string) {
    let inviterId = inviterCodeOrId;
    for (const [uid, u] of this.users.entries()) {
      if (u.referralCode === inviterCodeOrId) {
        inviterId = uid;
        break;
      }
    }
    const invitee = this.getUser(inviteeId);
    invitee.referredBy = inviterId;
  }

  addCommission(inviterId: string, inviteeId: string, orderCode: string, orderAmount: number, rate = 0.2) {
    const commissionAmount = Math.round(orderAmount * rate);
    const inviter = this.getUser(inviterId);
    inviter.affiliateBalance += commissionAmount;
    inviter.totalEarned += commissionAmount;

    const comm = {
      id: "comm_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      inviterId,
      inviteeId,
      orderCode,
      orderAmount,
      commissionRate: rate,
      commissionAmount,
      createdAt: new Date().toISOString(),
    };
    this.commissions.unshift(comm);
    return commissionAmount;
  }

  getCommissions(inviterId: string) {
    return this.commissions.filter((c) => c.inviterId === inviterId);
  }

  addPayout(payout: AffiliatePayoutItem) {
    this.payouts.unshift(payout);
  }

  getPayouts(userId?: string) {
    if (userId) return this.payouts.filter((p) => p.userId === userId);
    return [...this.payouts];
  }

  getPayout(id: string) {
    return this.payouts.find((p) => p.id === id);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __affiliateFallbackStore: AffiliateFallbackStore | undefined;
}

export function getFallbackStore(): AffiliateFallbackStore {
  if (!globalThis.__affiliateFallbackStore) {
    globalThis.__affiliateFallbackStore = new AffiliateFallbackStore();
  }
  return globalThis.__affiliateFallbackStore;
}

const fallbackStore = getFallbackStore();

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "dongnghiep***@gmail.com";
  const [name, domain] = email.split("@");
  if (name.length <= 3) return name[0] + "***@" + domain;
  return name.substring(0, 3) + "***@" + domain;
}

export async function getAffiliateStats(
  userId: string,
  origin = APP_URL
): Promise<AffiliateStats> {
  const supabase = getServiceSupabase();

  try {
    const { data: user } = await (supabase.from("users") as any)
      .select("referral_code, affiliate_balance, total_affiliate_earned")
      .eq("id", userId)
      .maybeSingle();

    if (user && user.referral_code) {
      const referralCode = user.referral_code;
      const affiliateBalance = Number(user.affiliate_balance || 0);
      const totalAffiliateEarned = Number(user.total_affiliate_earned || 0);

      // Đếm số người đã đăng ký bằng mã này
      const { count: inviteeCount } = await (supabase.from("users") as any)
        .select("id", { count: "exact", head: true })
        .eq("referred_by", userId);

      // Lấy danh sách hoa hồng gần nhất
      const { data: commissions } = await (supabase.from("affiliate_commissions") as any)
        .select(`
          id,
          order_code,
          order_amount,
          commission_amount,
          created_at,
          invitee_id,
          users!affiliate_commissions_invitee_id_fkey(email)
        `)
        .eq("inviter_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const recentCommissions: AffiliateCommissionItem[] = (commissions || []).map((c: any) => ({
        id: c.id,
        inviteeMaskedEmail: maskEmail(c.users?.email || ""),
        orderCode: c.order_code,
        orderAmount: Number(c.order_amount),
        commissionAmount: Number(c.commission_amount),
        createdAt: c.created_at,
      }));

      // Lấy danh sách payouts
      const { data: payouts } = await (supabase.from("affiliate_payouts") as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      const pendingPayouts: AffiliatePayoutItem[] = (payouts || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        payoutType: p.payout_type,
        amountVnd: Number(p.amount_vnd),
        creditsReceived: p.credits_received || 0,
        bankCode: p.bank_code,
        bankAccount: p.bank_account,
        bankAccountName: p.bank_account_name,
        status: p.status,
        adminNote: p.admin_note,
        referenceCode: p.reference_code,
        createdAt: p.created_at,
        processedAt: p.processed_at,
      }));

      return {
        referralCode,
        shareUrl: `${origin}/register?ref=${referralCode}`,
        affiliateBalance,
        totalAffiliateEarned,
        inviteeCount: inviteeCount || 0,
        convertedCount: recentCommissions.length,
        recentCommissions,
        pendingPayouts,
      };
    }
  } catch (err) {
    console.warn("[Affiliate Store] Supabase error, falling back to local store:", err);
  }

  // Fallback Store
  const localUser = fallbackStore.getUser(userId);
  const localComms = fallbackStore.getCommissions(userId);
  const localPayouts = fallbackStore.getPayouts(userId);

  return {
    referralCode: localUser.referralCode,
    shareUrl: `${origin}/register?ref=${localUser.referralCode}`,
    affiliateBalance: localUser.affiliateBalance,
    totalAffiliateEarned: localUser.totalEarned,
    inviteeCount: localComms.length + 1,
    convertedCount: localComms.length,
    recentCommissions: localComms.map((c) => ({
      id: c.id,
      inviteeMaskedEmail: "gv.dongnghiep***@gmail.com",
      orderCode: c.orderCode,
      orderAmount: c.orderAmount,
      commissionAmount: c.commissionAmount,
      createdAt: c.createdAt,
    })),
    pendingPayouts: localPayouts,
  };
}

export async function recordCommission(
  inviterId: string,
  inviteeId: string,
  orderCode: string,
  orderAmount: number,
  commissionRate = 0.2
): Promise<{ success: boolean; commissionAmount: number }> {
  // Anti self-referral
  if (inviterId === inviteeId) {
    return { success: false, commissionAmount: 0 };
  }

  const commissionAmount = Math.round(orderAmount * commissionRate);
  const supabase = getServiceSupabase();

  try {
    // 1. Ghi nhận vào affiliate_commissions
    await (supabase.from("affiliate_commissions") as any).insert({
      inviter_id: inviterId,
      invitee_id: inviteeId,
      order_code: orderCode,
      order_amount: orderAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
    });

    // 2. Tăng số dư affiliate_balance và total_affiliate_earned
    const { data: inviter } = await (supabase.from("users") as any)
      .select("affiliate_balance, total_affiliate_earned")
      .eq("id", inviterId)
      .maybeSingle();

    if (inviter) {
      const newBalance = Number(inviter.affiliate_balance || 0) + commissionAmount;
      const newTotal = Number(inviter.total_affiliate_earned || 0) + commissionAmount;

      await (supabase.from("users") as any)
        .update({
          affiliate_balance: newBalance,
          total_affiliate_earned: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inviterId);

      // Đồng bộ vào ngăn withdrawable_revenue_vnd của bảng wallets
      const { data: inviterWallet } = await (supabase.from("wallets") as any)
        .select("id, withdrawable_revenue_vnd")
        .eq("user_id", inviterId)
        .maybeSingle();
      if (inviterWallet) {
        await (supabase.from("wallets") as any)
          .update({
            withdrawable_revenue_vnd: Number(inviterWallet.withdrawable_revenue_vnd || 0) + commissionAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inviterWallet.id);
      }
    }

    return { success: true, commissionAmount };
  } catch (err) {
    console.warn("[Affiliate Store] recordCommission DB failed, storing locally:", err);
    fallbackStore.addCommission(inviterId, inviteeId, orderCode, orderAmount, commissionRate);
    return { success: true, commissionAmount };
  }
}

export async function convertAffiliateToCredits(
  userId: string,
  amountVnd: number
): Promise<{ success: boolean; creditsAdded: number; newBalanceVnd: number; error?: string }> {
  if (amountVnd < 10000) {
    return {
      success: false,
      creditsAdded: 0,
      newBalanceVnd: 0,
      error: "Số tiền quy đổi tối thiểu là 10.000đ.",
    };
  }

  // ECO-01 FIX: Xóa bỏ hoàn toàn hệ số nhân 1.5x để triệt tiêu lỗ hổng Arbitrage
  // Tỷ giá chuẩn: 1 credit = 100 VNĐ -> amountVnd / 100
  const creditsAdded = Math.round(amountVnd / 100);
  const supabase = getServiceSupabase();
  const nowIso = new Date().toISOString();

  try {
    // 1. Kiểm tra số dư người dùng
    const { data: user } = await (supabase.from("users") as any)
      .select("affiliate_balance")
      .eq("id", userId)
      .maybeSingle();

    if (!user) {
      // Local demo fallback
      const localUser = fallbackStore.getUser(userId);
      if (localUser.affiliateBalance < amountVnd) {
        return {
          success: false,
          creditsAdded: 0,
          newBalanceVnd: localUser.affiliateBalance,
          error: `Số dư hoa hồng không đủ (${localUser.affiliateBalance.toLocaleString()}đ < ${amountVnd.toLocaleString()}đ).`,
        };
      }
      localUser.affiliateBalance -= amountVnd;
      fallbackStore.addPayout({
        id: "payout_" + Date.now(),
        userId,
        userName: localUser.name || "Thầy Cô",
        userEmail: localUser.email || "teacher@edutest.ai",
        payoutType: "credits",
        amountVnd,
        creditsReceived: creditsAdded,
        status: "completed",
        adminNote: "Quy đổi Promotional Credits tức thì (Demo Fallback)",
        createdAt: nowIso,
        processedAt: nowIso,
      });
      return { success: true, creditsAdded, newBalanceVnd: localUser.affiliateBalance };
    }

    const currentBalance = Number(user.affiliate_balance || 0);
    if (currentBalance < amountVnd) {
      return {
        success: false,
        creditsAdded: 0,
        newBalanceVnd: currentBalance,
        error: `Số dư hoa hồng không đủ (${currentBalance.toLocaleString()}đ < ${amountVnd.toLocaleString()}đ).`,
      };
    }

    const newBalanceVnd = currentBalance - amountVnd;

    // 2. Trừ số dư hoa hồng
    await (supabase.from("users") as any)
      .update({ affiliate_balance: newBalanceVnd, updated_at: nowIso })
      .eq("id", userId);

    // 3. Cộng Credits vào Wallets (ngăn promotional_balance) và đồng bộ withdrawable_revenue_vnd
    const { data: wallet } = await (supabase.from("wallets") as any)
      .select("id, balance, promotional_balance, withdrawable_revenue_vnd")
      .eq("user_id", userId)
      .maybeSingle();

    if (wallet) {
      const newPromoBalance = (wallet.promotional_balance || 0) + creditsAdded;
      const newWithdrawable = Math.max(0, (wallet.withdrawable_revenue_vnd || 0) - amountVnd);
      await (supabase.from("wallets") as any)
        .update({
          promotional_balance: newPromoBalance,
          withdrawable_revenue_vnd: newWithdrawable,
          updated_at: nowIso,
        })
        .eq("id", wallet.id);

      // Ghi nhật ký ví
      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: wallet.id,
        amount: creditsAdded,
        type: "bonus",
        description: `⚡ Đổi ${amountVnd.toLocaleString("vi-VN")}đ hoa hồng sang +${creditsAdded.toLocaleString("vi-VN")} Promotional Credits`,
        metadata: {
          converted_from_vnd: amountVnd,
          rate_vnd_per_credit: 100,
          bucket: "promotional_balance",
        },
      });
    }

    // 4. Ghi nhận Payout record hoàn tất tức thì (0s)
    await (supabase.from("affiliate_payouts") as any).insert({
      user_id: userId,
      payout_type: "credits",
      amount_vnd: amountVnd,
      credits_received: creditsAdded,
      status: "completed",
      admin_note: "Quy đổi tự động sang Promotional Credits (1 credit = 100 VNĐ)",
      processed_at: nowIso,
    });

    return { success: true, creditsAdded, newBalanceVnd };
  } catch (err) {
    console.warn("[Affiliate Store] DB conversion failed, falling back to local:", err);
    const localUser = fallbackStore.getUser(userId);
    if (localUser.affiliateBalance < amountVnd) {
      return {
        success: false,
        creditsAdded: 0,
        newBalanceVnd: localUser.affiliateBalance,
        error: "Số dư hoa hồng không đủ.",
      };
    }
    localUser.affiliateBalance -= amountVnd;
    fallbackStore.addPayout({
      id: "payout_" + Date.now(),
      userId,
      payoutType: "credits",
      amountVnd,
      creditsReceived: creditsAdded,
      status: "completed",
      adminNote: "Quy đổi Credits 1.5x tức thì (Local Fallback)",
      createdAt: nowIso,
      processedAt: nowIso,
    });
    return { success: true, creditsAdded, newBalanceVnd: localUser.affiliateBalance };
  }
}

export async function requestCashPayout(
  userId: string,
  params: {
    amountVnd: number;
    bankCode: string;
    bankAccount: string;
    bankAccountName: string;
  }
): Promise<{ success: boolean; payoutId?: string; error?: string }> {
  const { amountVnd, bankCode, bankAccount, bankAccountName } = params;

  if (amountVnd < MINIMUM_PAYOUT_VND) {
    return {
      success: false,
      error: `Hạn mức rút tiền mặt tối thiểu là ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ.`,
    };
  }

  if (!bankCode || !bankAccount || !bankAccountName) {
    return { success: false, error: "Vui lòng điền đầy đủ thông tin tài khoản ngân hàng nhận tiền." };
  }

  const supabase = getServiceSupabase();
  const nowIso = new Date().toISOString();

  try {
    const { data: user } = await (supabase.from("users") as any)
      .select("affiliate_balance")
      .eq("id", userId)
      .maybeSingle();

    if (!user) {
      // Local demo fallback
      const localUser = fallbackStore.getUser(userId);
      if (localUser.affiliateBalance < amountVnd) {
        return {
          success: false,
          error: `Số dư khả dụng không đủ (${localUser.affiliateBalance.toLocaleString()}đ < ${amountVnd.toLocaleString()}đ).`,
        };
      }
      localUser.affiliateBalance -= amountVnd;
      const payoutId = "payout_" + Date.now();
      fallbackStore.addPayout({
        id: payoutId,
        userId,
        userName: localUser.name || "Thầy Cô",
        userEmail: localUser.email || "teacher@edutest.ai",
        payoutType: "cash",
        amountVnd,
        creditsReceived: 0,
        bankCode,
        bankAccount,
        bankAccountName: bankAccountName.toUpperCase(),
        status: "pending",
        createdAt: nowIso,
      });
      return { success: true, payoutId };
    }

    const currentBalance = Number(user.affiliate_balance || 0);
    if (currentBalance < amountVnd) {
      return {
        success: false,
        error: `Số dư khả dụng không đủ (${currentBalance.toLocaleString()}đ < ${amountVnd.toLocaleString()}đ).`,
      };
    }

    // Tạm giữ số dư (Deduct pending balance)
    const newBalance = currentBalance - amountVnd;
    await (supabase.from("users") as any)
      .update({ affiliate_balance: newBalance, updated_at: nowIso })
      .eq("id", userId);

    // Đồng bộ trừ ngăn withdrawable_revenue_vnd trong bảng wallets
    const { data: userWallet } = await (supabase.from("wallets") as any)
      .select("id, withdrawable_revenue_vnd")
      .eq("user_id", userId)
      .maybeSingle();

    if (userWallet) {
      await (supabase.from("wallets") as any)
        .update({
          withdrawable_revenue_vnd: Math.max(0, Number(userWallet.withdrawable_revenue_vnd || 0) - amountVnd),
          updated_at: nowIso,
        })
        .eq("id", userWallet.id);

      await (supabase.from("wallet_txns") as any).insert({
        wallet_id: userWallet.id,
        amount: 0,
        type: "payout_request",
        description: `Yêu cầu rút hoa hồng affiliate ${amountVnd.toLocaleString("vi-VN")} VNĐ về ${bankCode}`,
        metadata: {
          payout_type: "affiliate",
          amount_vnd: amountVnd,
          bank_code: bankCode,
        },
        created_at: nowIso,
      });
    }

    const { data: payout, error: insErr } = await (supabase.from("affiliate_payouts") as any)
      .insert({
        user_id: userId,
        payout_type: "cash",
        amount_vnd: amountVnd,
        bank_code: bankCode,
        bank_account: bankAccount,
        bank_account_name: bankAccountName.toUpperCase(),
        status: "pending",
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    return { success: true, payoutId: payout.id };
  } catch (err) {
    console.warn("[Affiliate Store] DB cash payout failed, storing locally:", err);
    const localUser = fallbackStore.getUser(userId);
    if (localUser.affiliateBalance < amountVnd) {
      return { success: false, error: "Số dư không đủ." };
    }
    localUser.affiliateBalance -= amountVnd;
    const payoutId = "payout_" + Date.now();
    fallbackStore.addPayout({
      id: payoutId,
      userId,
      payoutType: "cash",
      amountVnd,
      creditsReceived: 0,
      bankCode,
      bankAccount,
      bankAccountName: bankAccountName.toUpperCase(),
      status: "pending",
      createdAt: nowIso,
    });
    return { success: true, payoutId };
  }
}

export async function getAllPayoutsForAdmin(): Promise<AffiliatePayoutItem[]> {
  const supabase = getServiceSupabase();

  try {
    const { data: payouts } = await (supabase.from("affiliate_payouts") as any)
      .select(`
        *,
        users!affiliate_payouts_user_id_fkey(name, email)
      `)
      .order("created_at", { ascending: false });

    const dbItems = (payouts || []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      userName: p.users?.name || "Thầy Cô",
      userEmail: p.users?.email || "",
      payoutType: p.payout_type,
      amountVnd: Number(p.amount_vnd),
      creditsReceived: p.credits_received || 0,
      bankCode: p.bank_code,
      bankAccount: p.bank_account,
      bankAccountName: p.bank_account_name,
      status: p.status,
      adminNote: p.admin_note,
      referenceCode: p.reference_code,
      createdAt: p.created_at,
      processedAt: p.processed_at,
    }));
    const localItems = fallbackStore.getPayouts();
    // Merge without duplicate IDs
    const merged = [...dbItems];
    for (const item of localItems) {
      if (!merged.some(m => m.id === item.id)) {
        merged.push(item);
      }
    }
    return merged;
  } catch (err) {
    console.warn("[Affiliate Store] DB getAllPayouts failed, using fallback:", err);
  }

  return fallbackStore.getPayouts();
}

export async function processPayoutAdmin(
  payoutId: string,
  action: "approve" | "reject",
  adminNote?: string,
  referenceCode?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabase();
  const nowIso = new Date().toISOString();

  try {
    const { data: payout } = await (supabase.from("affiliate_payouts") as any)
      .select("*")
      .eq("id", payoutId)
      .maybeSingle();

    if (!payout) {
      // Try local
      const localP = fallbackStore.getPayout(payoutId);
      if (localP) {
        localP.status = action === "approve" ? "completed" : "rejected";
        localP.adminNote = adminNote || (action === "approve" ? "Đã chuyển khoản VietQR" : "Từ chối");
        localP.referenceCode = referenceCode;
        localP.processedAt = nowIso;
        if (action === "reject") {
          const u = fallbackStore.getUser(localP.userId);
          u.affiliateBalance += localP.amountVnd;
        }
        return { success: true };
      }
      return { success: false, error: "Không tìm thấy yêu cầu rút tiền." };
    }

    if (payout.status !== "pending") {
      return { success: false, error: "Yêu cầu này đã được xử lý trước đó." };
    }

    if (action === "approve") {
      await (supabase.from("affiliate_payouts") as any)
        .update({
          status: "completed",
          admin_note: adminNote || "Đã duyệt và chuyển khoản VietQR thành công",
          reference_code: referenceCode || "FT" + Date.now(),
          processed_at: nowIso,
        })
        .eq("id", payoutId);
    } else {
      // Từ chối -> Hoàn lại tiền vào affiliate_balance cho user
      await (supabase.from("affiliate_payouts") as any)
        .update({
          status: "rejected",
          admin_note: adminNote || "Yêu cầu rút tiền bị từ chối.",
          processed_at: nowIso,
        })
        .eq("id", payoutId);

      const { data: user } = await (supabase.from("users") as any)
        .select("affiliate_balance")
        .eq("id", payout.user_id)
        .maybeSingle();

      if (user) {
        const refunded = Number(user.affiliate_balance || 0) + Number(payout.amount_vnd);
        await (supabase.from("users") as any)
          .update({ affiliate_balance: refunded, updated_at: nowIso })
          .eq("id", payout.user_id);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Affiliate Store] processPayoutAdmin error:", err);
    return { success: false, error: err.message };
  }
}
