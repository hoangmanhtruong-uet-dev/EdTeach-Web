import dns from "dns";

const dnsLookup = dns.promises.lookup;

export interface SafeFetchOptions extends RequestInit {
  maxRedirects?: number;
  maxSizeBytes?: number;
  timeoutMs?: number;
}

/**
 * Checks whether an IPv4 address is within private, loopback, link-local or reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Treat invalid IPv4 as unsafe
  }

  const [p0, p1] = parts;

  // 0.0.0.0/8 (Current network)
  if (p0 === 0) return true;
  // 10.0.0.0/8 (Private RFC 1918)
  if (p0 === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (p0 === 127) return true;
  // 169.254.0.0/16 (Link-Local & Cloud Metadata RFC 3927)
  if (p0 === 169 && p1 === 254) return true;
  // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
  // 192.168.0.0/16 (Private RFC 1918)
  if (p0 === 192 && p1 === 168) return true;
  // 100.64.0.0/10 (CGNAT RFC 6598)
  if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
  // 192.0.2.0/24 (TEST-NET-1 RFC 5737)
  if (p0 === 192 && p1 === 0 && parts[2] === 2) return true;
  // 198.51.100.0/24 (TEST-NET-2 RFC 5737)
  if (p0 === 198 && p1 === 51 && parts[2] === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3 RFC 5737)
  if (p0 === 203 && p1 === 0 && parts[2] === 113) return true;
  // 198.18.0.0/15 (Benchmarking RFC 2544)
  if (p0 === 198 && p1 >= 18 && p1 <= 19) return true;
  // 224.0.0.0/4 (Multicast RFC 5771)
  if (p0 >= 224 && p0 <= 239) return true;
  // 240.0.0.0/4 (Reserved RFC 1112)
  if (p0 >= 240) return true;

  return false;
}

/**
 * Checks whether an IPv6 address is within loopback, private ULA, link-local or mapped IPv4 ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // IPv6 Loopback & Unspecified
  if (normalized === "::1" || normalized === "::") return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const lastPart = normalized.split(":").pop();
    if (lastPart && lastPart.includes(".")) {
      return isPrivateOrReservedIPv4(lastPart);
    }
  }

  // Unique Local Address (ULA RFC 4193: fc00::/7 -> fc00 to fdff)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // Link-Local Unicast (RFC 4291: fe80::/10 -> fe80 to febf)
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // Multicast (ff00::/8)
  if (normalized.startsWith("ff")) return true;

  // Documentation (2001:db8::/32)
  if (normalized.startsWith("2001:db8")) return true;

  return false;
}

/**
 * Validates a URL against SSRF vulnerabilities (DNS rebinding, private IPs, loopback, cloud metadata).
 */
export async function validateUrlAgainstSSRF(rawUrl: string): Promise<URL> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Định dạng đường dẫn URL không hợp lệ.");
  }

  // Protocol whitelist
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Giao thức '${parsedUrl.protocol}' không được hỗ trợ. Chỉ chấp nhận http: hoặc https:.`);
  }

  // Port whitelist
  const port = parsedUrl.port;
  if (port && port !== "80" && port !== "443" && port !== "8080") {
    throw new Error(`Cổng kết nối '${port}' không được phép vì lý do bảo mật.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase().trim();

  // Hostname string blocklist
  const blockedHostPatterns = [
    "localhost",
    "metadata.google.internal",
    "metadata.goog",
    "169.254.169.254",
    "100.100.100.200",
    "instance-data",
  ];

  if (
    blockedHostPatterns.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    throw new Error("Truy cập vào tên miền nội bộ hoặc dịch vụ cloud metadata bị từ chối.");
  }

  // DNS Resolution to all IP records
  let lookupResults: dns.LookupAddress[] = [];
  try {
    lookupResults = await dnsLookup(hostname, { all: true });
  } catch (err: any) {
    throw new Error(`Không thể phân giải địa chỉ DNS cho tên miền '${hostname}': ${err.message}`);
  }

  if (!lookupResults || lookupResults.length === 0) {
    throw new Error(`Tên miền '${hostname}' không tồn tại bản ghi IP hợp lệ.`);
  }

  // Check each resolved IP
  for (const record of lookupResults) {
    const ip = record.address;
    if (record.family === 4) {
      if (isPrivateOrReservedIPv4(ip)) {
        throw new Error(`Tên miền phân giải đến dải IP riêng hoặc bị cấm (${ip}). Truy cập bị từ chối.`);
      }
    } else if (record.family === 6) {
      if (isPrivateOrReservedIPv6(ip)) {
        throw new Error(`Tên miền phân giải đến dải IPv6 nội bộ (${ip}). Truy cập bị từ chối.`);
      }
    }
  }

  return parsedUrl;
}

/**
 * Safe fetch implementation with manual redirect validation and response size limiter.
 */
export async function safeFetchWithAntiSSRF(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ text: string; finalUrl: string; status: number }> {
  const maxRedirects = options.maxRedirects ?? 3;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB
  const timeoutMs = options.timeoutMs ?? 12000;

  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (true) {
    // 1. Validate destination URL before issuing request
    await validateUrlAgainstSSRF(currentUrl);

    // 2. Execute fetch with manual redirect mode
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        ...options,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          ...(options.headers || {}),
        },
      });
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`Kết nối đến '${currentUrl}' bị quá thời gian cho phép (${timeoutMs}ms).`);
      }
      throw new Error(`Lỗi kết nối mạng: ${err.message}`);
    } finally {
      clearTimeout(timer);
    }

    // 3. Handle manual redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Vượt quá số lượt chuyển hướng tối đa (${maxRedirects}).`);
      }

      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`Mã phản hồi chuyển hướng ${response.status} nhưng thiếu header 'Location'.`);
      }

      // Resolve relative redirect against current URL
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    if (!response.ok) {
      throw new Error(`Trang web trả về mã lỗi HTTP ${response.status} (${response.statusText}).`);
    }

    // 4. Validate Content-Length header if present
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Kích thước dữ liệu (${contentLength} bytes) vượt quá giới hạn cho phép (5MB).`);
    }

    // 5. Read body as stream with chunk accumulator
    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      return { text, finalUrl: currentUrl, status: response.status };
    }

    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > maxSizeBytes) {
          reader.cancel();
          throw new Error(`Nội dung trang web vượt quá kích thước tối đa cho phép (5MB).`);
        }
        chunks.push(value);
      }
    }

    // Concatenate chunks and decode UTF-8
    const totalBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder("utf-8").decode(totalBuffer);
    return { text, finalUrl: currentUrl, status: response.status };
  }
}
