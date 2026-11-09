/**
 * Server-Side Input Validation & Sanitization Helpers
 *
 * Provides schema and type checks for incoming API route payloads
 * to prevent type coercion vulnerabilities, unexpected injections, and invalid data structures.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_REGEX.test(value);
}

export function sanitizeString(value: unknown, maxLength: number = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function parsePositiveInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationError {
  success: false;
  error: string;
}

export type ValidateResult<T> = ValidationSuccess<T> | ValidationError;

/**
 * Validates Marketplace Buy payload: { item_id: string (UUID), expected_price?: number }
 */
export function validateBuyItemPayload(body: unknown): ValidateResult<{
  item_id: string;
  expected_price: number | null;
}> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Dữ liệu yêu cầu không hợp lệ (cần JSON object)." };
  }
  const payload = body as Record<string, unknown>;

  if (!payload.item_id || !isValidUUID(payload.item_id)) {
    return { success: false, error: "Mã đề thi (item_id) không hợp lệ hoặc thiếu." };
  }

  let expected_price: number | null = null;
  if (payload.expected_price !== undefined && payload.expected_price !== null) {
    if (typeof payload.expected_price !== "number" || isNaN(payload.expected_price) || payload.expected_price < 0) {
      return { success: false, error: "Giá kỳ vọng (expected_price) không hợp lệ." };
    }
    expected_price = Math.round(payload.expected_price);
  }

  return {
    success: true,
    data: {
      item_id: payload.item_id,
      expected_price,
    },
  };
}

/**
 * Validates Marketplace Payout payload: { amount_vnd, bank_name, account_number, account_holder }
 */
export function validatePayoutPayload(body: unknown): ValidateResult<{
  amount_vnd: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
}> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Dữ liệu yêu cầu không hợp lệ." };
  }
  const payload = body as Record<string, unknown>;

  const amount_vnd = Number(payload.amount_vnd || (payload.amount_credits ? Number(payload.amount_credits) * 100 : 0));
  if (!amount_vnd || isNaN(amount_vnd) || amount_vnd <= 0) {
    return { success: false, error: "Số tiền yêu cầu rút không hợp lệ." };
  }

  const bank_name = sanitizeString(payload.bank_name, 100);
  const account_number = sanitizeString(payload.account_number, 50);
  const account_holder = sanitizeString(payload.account_holder, 100);

  if (!bank_name || !account_number || !account_holder) {
    return { success: false, error: "Vui lòng nhập đầy đủ thông tin ngân hàng, số tài khoản và tên chủ tài khoản." };
  }

  return {
    success: true,
    data: {
      amount_vnd: Math.round(amount_vnd),
      bank_name,
      account_number,
      account_holder: account_holder.toUpperCase(),
    },
  };
}
