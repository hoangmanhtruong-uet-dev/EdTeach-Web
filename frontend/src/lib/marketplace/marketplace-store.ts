import { MarketplaceItem, MarketplacePurchase, PayoutRequest } from "@/types/marketplace";

// ========================================================
// MARKETPLACE STORE (Không lưu mock test giả, chỉ lưu đề thật do giáo viên đăng tải)
// ========================================================

export const INITIAL_MARKETPLACE_ITEMS: MarketplaceItem[] = [];

// ========================================================
// GLOBAL IN-MEMORY PERSISTENCE FOR MARKETPLACE
// ========================================================

declare global {
  // eslint-disable-next-line no-var
  var __marketplaceItems: Map<string, MarketplaceItem> | undefined;
  // eslint-disable-next-line no-var
  var __marketplacePurchases: MarketplacePurchase[] | undefined;
  // eslint-disable-next-line no-var
  var __payoutRequests: PayoutRequest[] | undefined;
}

if (!globalThis.__marketplaceItems) {
  globalThis.__marketplaceItems = new Map();
} else {
  // Dọn sạch toàn bộ mock test cũ nếu có trong bộ nhớ dev server
  for (const [key, item] of Array.from(globalThis.__marketplaceItems.entries())) {
    if (
      key.startsWith("00000000-") ||
      key.startsWith("mk-") ||
      item.seller_name?.includes("Thầy Vũ Tuấn Anh") ||
      item.seller_name?.includes("Cô Nguyễn Bích Trâm") ||
      item.seller_name?.includes("Thầy Trần Hoàng Nam") ||
      item.seller_name?.includes("Thầy Trần Nam") ||
      item.seller_name?.includes("Cô Hoàng Mai") ||
      item.seller_name?.includes("Thầy Lê Quang") ||
      item.seller_name?.includes("Cô Nguyễn Thảo") ||
      item.seller_name?.includes("Cô Phạm Phương") ||
      item.seller_name?.includes("Thầy Đỗ Tuấn")
    ) {
      globalThis.__marketplaceItems.delete(key);
    }
  }
}

if (!globalThis.__marketplacePurchases) {
  globalThis.__marketplacePurchases = [];
}

if (!globalThis.__payoutRequests) {
  globalThis.__payoutRequests = [];
}

export const marketplaceItemsStore = globalThis.__marketplaceItems!;
export const marketplacePurchasesStore = globalThis.__marketplacePurchases!;
export const payoutRequestsStore = globalThis.__payoutRequests!;
