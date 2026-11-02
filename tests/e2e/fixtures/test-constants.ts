/**
 * Centralized Test Constants & Oracle Values for EdTeach E2E Test Suite
 * Derived from ORIGINAL_REQUEST.md, PROJECT.md, and Master Backlog.
 */

export const TEST_CONSTANTS = {
  // Canonical URLs & Application Origin
  DEFAULT_BASE_URL: 'http://localhost:3001',
  CANONICAL_DOMAIN: 'https://ed-teach-rust.vercel.app',

  // Financial & Wallet Business Constants
  MINIMUM_PAYOUT_VND: 200_000,
  LEGACY_AFFILIATE_MIN_VND: 100_000,
  LEGACY_MARKETPLACE_MIN_VND: 50_000,
  REFERRAL_BONUS_CREDITS: 2_000,
  AI_TUTOR_DAILY_LIMIT_PER_STUDENT: 3,

  // PhET 3D Simulations
  PHET_TOTAL_SIMULATIONS: 54,
  PHET_SUBJECTS: ['phys', 'chem', 'bio', 'geo'] as const,
  PHET_COUNTS: {
    phys: 10,
    chem: 25,
    bio: 5,
    geo: 14,
  },

  // Security Vectors & Bypass Payloads
  SECURITY_PAYLOADS: {
    AUDIT_HEADER: { 'x-playwright-audit': 'true' },
    AUDIT_QUERY: '?audit=true',
    SSRF_LOCAL_HOST: 'http://localhost:3000',
    SSRF_LOOPBACK_IP: 'http://127.0.0.1:80',
    SSRF_CLOUD_METADATA: 'http://169.254.169.254/latest/meta-data',
    SSRF_PRIVATE_10: 'http://10.0.0.1/admin',
    SSRF_PRIVATE_192: 'http://192.168.1.1/router',
    NON_HTTP_SCHEME: 'file:///etc/passwd',
    PATH_TRAVERSAL_DIR: '../../etc/passwd',
    SQLI_PAYLOAD: "'; DROP TABLE users; --",
    XSS_PAYLOAD: "<script>alert('xss')</script>",
  },

  // Protected Routes Whitelist
  PROTECTED_TEACHER_ROUTES: [
    '/dashboard',
    '/exams',
    '/wallet',
    '/settings',
    '/teach',
    '/grading',
  ],
  PROTECTED_STUDENT_ROUTES: [
    '/student',
    '/student/exams',
    '/student/practice',
    '/student/progress',
  ],
  PROTECTED_ADMIN_ROUTES: [
    '/admin',
    '/api/admin/affiliate',
    '/api/admin/verifications',
  ],
  PROTECTED_TOOLS_ROUTES: [
    '/whiteboard',
    '/marketplace',
  ],

  // Pricing & Subscription Catalog
  TIERS: ['free', 'pro', 'max'] as const,
  PLANS: {
    PRO_MONTHLY: { id: 'pro_monthly', priceVnd: 149_000, credits: 30_000 },
    PRO_SEMESTER: { id: 'pro_semester', priceVnd: 599_000, credits: 150_000 },
    MAX_MONTHLY: { id: 'max_monthly', priceVnd: 229_000, credits: 100_000 },
    MAX_SEMESTER: { id: 'max_semester', priceVnd: 899_000, credits: 500_000 },
  },
};
