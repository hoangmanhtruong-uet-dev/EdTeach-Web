import { type NextRequest } from "next/server";

/**
 * Cloudflare & Reverse Proxy Aware Client IP Extraction.
 *
 * Prioritizes canonical Cloudflare header `cf-connecting-ip` to prevent IP spoofing
 * behind Cloudflare proxy/WAF, followed by `x-real-ip`, and then the first hop of
 * `x-forwarded-for`.
 */
export function getClientIp(
  req: NextRequest | Request | { headers: Headers | { get(name: string): string | null } }
): string {
  try {
    const headers = "headers" in req ? req.headers : null;
    if (!headers) return "127.0.0.1";

    // 1. Cloudflare canonical client IP
    const cfIp = headers.get("cf-connecting-ip");
    if (cfIp && isValidIpFormat(cfIp.trim())) {
      return cfIp.trim();
    }

    // 2. Standard Reverse Proxy Real IP
    const realIp = headers.get("x-real-ip");
    if (realIp && isValidIpFormat(realIp.trim())) {
      return realIp.trim();
    }

    // 3. X-Forwarded-For (take the first client IP before upstream proxies)
    const forwardedFor = headers.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0]?.trim();
      if (firstIp && isValidIpFormat(firstIp)) {
        return firstIp;
      }
    }
  } catch (err) {
    console.warn("[getClientIp] Error extracting client IP:", err);
  }

  return "127.0.0.1";
}

/**
 * Basic IP sanity check (IPv4 or IPv6)
 */
function isValidIpFormat(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // IPv4 regex
  const ipv4Pattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  // IPv6 regex
  const ipv6Pattern = /^[a-fA-F0-9:]+$/;
  return ipv4Pattern.test(ip) || (ip.includes(":") && ipv6Pattern.test(ip));
}
