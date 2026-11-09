/**
 * Upload Security & MIME Whitelist Guard
 *
 * Protects against:
 * - Stored XSS via SVG scripts / SVG injection
 * - Denial of Service / Memory Exhaustion via oversized files
 * - MIME confusion / Polyglot file attacks via Magic Bytes verification
 */

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

export const MAX_VERIFICATION_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;       // 2MB

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

/**
 * Checks if a MIME string is in the strict image whitelist (blocks SVG, HTML, scripts)
 */
export function isAllowedImageMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  const cleanMime = mime.toLowerCase().trim();
  // Explicitly reject SVG or XML based graphics
  if (cleanMime.includes("svg") || cleanMime.includes("xml")) {
    return false;
  }
  return ALLOWED_IMAGE_MIMES.includes(cleanMime as AllowedImageMime);
}

/**
 * Inspects binary magic numbers (file header signatures)
 * to verify true file format independently of file extension or client header.
 */
export function verifyImageMagicBytes(buffer: Buffer): { valid: boolean; format?: "jpeg" | "png" | "webp" } {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: "jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, format: "png" };
  }

  // 3. WebP: RIFF ... WEBP
  // Offset 0-3: 'RIFF', Offset 8-11: 'WEBP'
  const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (isRiff && isWebp) {
    return { valid: true, format: "webp" };
  }

  return { valid: false };
}

/**
 * Full image payload validation: Size, MIME whitelist, and Magic Byte verification.
 */
export function validateImageBuffer(
  buffer: Buffer,
  declaredMime: string,
  maxSizeBytes: number = MAX_VERIFICATION_FILE_SIZE
): ValidationResult {
  // 1. File size check
  if (buffer.length > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `Dung lượng tệp (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa cho phép (${maxMb}MB).`,
    };
  }

  // 2. Declared MIME whitelist check
  if (!isAllowedImageMime(declaredMime)) {
    return {
      valid: false,
      error: "Định dạng tệp không được hỗ trợ. Chỉ chấp nhận ảnh JPG, PNG hoặc WebP (không hỗ trợ SVG).",
    };
  }

  // 3. Magic bytes binary signature check
  const magic = verifyImageMagicBytes(buffer);
  if (!magic.valid) {
    return {
      valid: false,
      error: "Dữ liệu tệp bị lỗi hoặc không khớp với chữ ký nhị phân của định dạng ảnh hợp lệ.",
    };
  }

  return {
    valid: true,
    detectedMime: `image/${magic.format}`,
  };
}
