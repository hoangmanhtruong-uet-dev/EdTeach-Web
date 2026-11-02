import { test, expect } from '@playwright/test';

/**
 * Tier 2 — Feature 5: Centralized Config & Canonical Domain (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 5), RC-12, SET-07, AFF-03
 * Opaque-box contract: Host header injection resistance, protocol robustness, and method validation.
 */
test.describe('Tier 2: Feature 5 - Centralized Config Edge Cases', () => {
  test('T2-F05-01: Malicious Host header does not result in external redirect', async ({ request }) => {
    const response = await request.get('/dashboard', {
      maxRedirects: 0,
      headers: {
        host: 'evil-attacker-site.com',
      },
    });
    const location = response.headers()['location'] || '';
    expect(location).not.toContain('evil-attacker-site.com');
  });

  test('T2-F05-02: Spoofed X-Forwarded-Host header does not pollute login redirection', async ({ request }) => {
    const response = await request.get('/dashboard', {
      maxRedirects: 0,
      headers: {
        'x-forwarded-host': 'malicious-phishing-host.com',
      },
    });
    const location = response.headers()['location'] || '';
    expect(location).not.toContain('malicious-phishing-host.com');
  });

  test('T2-F05-03: Health endpoint properly handles HEAD method', async ({ request }) => {
    const response = await request.head('/api/health');
    expect([200, 405]).toContain(response.status());
  });

  test('T2-F05-04: API endpoint rejects unsupported HTTP DELETE method on read-only endpoints', async ({ request }) => {
    const response = await request.delete('/api/health');
    expect([404, 405]).toContain(response.status());
  });

  test('T2-F05-05: Extremely large query string does not crash the server', async ({ request }) => {
    const largeQuery = 'a'.repeat(8000);
    const response = await request.get(`/api/health?param=${largeQuery}`);
    expect([200, 414, 431]).toContain(response.status());
  });
});
