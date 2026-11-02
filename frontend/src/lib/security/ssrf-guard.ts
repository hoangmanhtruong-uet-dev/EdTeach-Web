import dns from "node:dns/promises";
import net from "node:net";

export interface SSRFCheckResult {
  isSafe: boolean;
  reason?: string;
  resolvedIp?: string;
}

/**
 * Validates whether an IP address belongs to loopback, private networks,
 * link-local (cloud metadata), CGNAT, documentation, multicast, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 0) return true; // Invalid format treated as unsafe

  if (version === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [p0, p1, p2, p3] = parts;

    // 0.0.0.0/8 (Current network)
    if (p0 === 0) return true;
    // 10.0.0.0/8 (RFC 1918 Private)
    if (p0 === 10) return true;
    // 100.64.0.0/10 (RFC 6598 Shared Carrier NAT)
    if (p0 === 100 && p1 >= 64 && p1 <= 127) return true;
    // 127.0.0.0/8 (Loopback)
    if (p0 === 127) return true;
    // 169.254.0.0/16 (Link-Local & Cloud Metadata 169.254.169.254)
    if (p0 === 169 && p1 === 254) return true;
    // 172.16.0.0/12 (RFC 1918 Private)
    if (p0 === 172 && p1 >= 16 && p1 <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (p0 === 192 && p1 === 0 && p2 === 0) return true;
    // 192.0.2.0/24 (TEST-NET-1)
    if (p0 === 192 && p1 === 0 && p2 === 2) return true;
    // 192.168.0.0/16 (RFC 1918 Private)
    if (p0 === 192 && p1 === 168) return true;
    // 198.18.0.0/15 (Network Benchmark)
    if (p0 === 198 && p1 >= 18 && p1 <= 19) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (p0 === 198 && p1 === 51 && p2 === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (p0 === 203 && p1 === 0 && p2 === 113) return true;
    // 224.0.0.0/4 (Multicast)
    if (p0 >= 224 && p0 <= 239) return true;
    // 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
    if (p0 >= 240) return true;

    return false;
  }

  if (version === 6) {
    const normalized = ip.toLowerCase();

    // Loopback (::1)
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // Unspecified (::)
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

    // IPv4-mapped IPv6 (::ffff:192.168.1.1)
    if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
      const v4Part = normalized.replace(/^.*ffff:/, "");
      if (net.isIPv4(v4Part)) return isPrivateOrReservedIp(v4Part);
    }

    // Unique Local Addresses RFC 4193 (fc00::/7 -> fc.. or fd..)
    if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

    // Link-local Unicast RFC 4291 (fe80::/10 -> fe8, fe9, fea, feb)
    if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

    // Site-local (deprecated RFC 3879 - fec0::/10)
    if (/^fec[0-9a-f]:/i.test(normalized)) return true;

    // Multicast (ff00::/8)
    if (normalized.startsWith("ff")) return true;

    // Documentation RFC 3849 (2001:db8::/32)
    if (normalized.startsWith("2001:db8:") || normalized.startsWith("2001:0db8:")) return true;

    return false;
  }

  return true;
}

/**
 * Resolves hostname and verifies that all resolved IP addresses are public and safe.
 */
export async function validateUrlForSSRF(urlString: string): Promise<SSRFCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { isSafe: false, reason: "Định dạng URL không hợp lệ." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isSafe: false, reason: "Chỉ cho phép giao thức http:// hoặc https://." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Blacklist forbidden hostname patterns
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home") ||
    hostname.endsWith(".corp")
  ) {
    return { isSafe: false, reason: "Không được phép truy cập mạng nội bộ hoặc máy chủ cục bộ (SSRF)." };
  }

  // Reject non-standard ports
  const port = parsed.port;
  if (port && port !== "80" && port !== "443" && port !== "8080") {
    return { isSafe: false, reason: "Chỉ cho phép kết nối đến các cổng web tiêu chuẩn (80, 443)." };
  }

  // If hostname is already an IP literal, validate directly
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return { isSafe: false, reason: "Địa chỉ IP đích thuộc vùng mạng riêng hoặc hạ tầng nội bộ.", resolvedIp: hostname };
    }
    return { isSafe: true, resolvedIp: hostname };
  }

  // Resolve DNS to verify all returned IPv4 and IPv6 addresses
  try {
    const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
    if (!addresses || addresses.length === 0) {
      return { isSafe: false, reason: "Không thể phân giải địa chỉ IP cho tên miền này." };
    }

    for (const record of addresses) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          isSafe: false,
          reason: `Tên miền phân giải đến IP nội bộ (${record.address}), bị từ chối truy cập vì lý do bảo mật.`,
          resolvedIp: record.address,
        };
      }
    }

    return { isSafe: true, resolvedIp: addresses[0].address };
  } catch (err: any) {
    return { isSafe: false, reason: `Lỗi DNS lookup: ${err.message}` };
  }
}

/**
 * Safely fetches a URL by checking every redirect hop against SSRF rules (max 3 hops).
 */
export async function safeFetchWithAntiSSRF(
  initialUrl: string,
  options: { maxRedirects?: number; timeoutMs?: number; userAgent?: string } = {}
): Promise<{ text: string; finalUrl: string }> {
  const maxRedirects = options.maxRedirects ?? 3;
  const timeoutMs = options.timeoutMs ?? 10000;
  const userAgent =
    options.userAgent ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const ssrfCheck = await validateUrlForSSRF(currentUrl);
    if (!ssrfCheck.isSafe) {
      throw new Error(ssrfCheck.reason || "Yêu cầu bị từ chối do chính sách bảo mật SSRF.");
    }

    const response = await fetch(currentUrl, {
      method: "GET",
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "manual", // Do NOT follow redirects automatically
      signal: AbortSignal.timeout(timeoutMs),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Máy chủ trả về chuyển hướng nhưng thiếu tiêu đề Location.");
      }

      redirectCount++;
      if (redirectCount > maxRedirects) {
        throw new Error(`Quá số lần chuyển hướng cho phép (tối đa ${maxRedirects} lần).`);
      }

      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!response.ok) {
      throw new Error(`Trang web trả về mã lỗi HTTP ${response.status}`);
    }

    const text = await response.text();
    return { text, finalUrl: currentUrl };
  }

  throw new Error("Vượt quá số lần chuyển hướng.");
}
