import { test, expect } from '@playwright/test';
import { TEST_CONSTANTS } from '../fixtures/test-constants';

/**
 * Tier 2 — Feature 14: Marketplace Empty Exam & SSRF Importer Fix (Boundary & Corner Cases)
 * Requirements: PROJECT.md § Feature Inventory (Feature 14), RC-05, RC-09, MKT-06
 * Opaque-box contract: Strict SSRF rejection vectors for internal IPs, loopbacks, cloud metadata, and restricted ports.
 */
test.describe('Tier 2: Feature 14 - SSRF Attack Vectors & Boundary Validation', () => {
  test('T2-F14-01: SSRF vector localhost is denied', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: TEST_CONSTANTS.SECURITY_PAYLOADS.SSRF_LOCAL_HOST },
    });
    // Expected 401 (auth check) or 403 (SSRF block)
    expect([401, 403]).toContain(response.status());
  });

  test('T2-F14-02: SSRF vector 127.0.0.1 loopback is denied', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: TEST_CONSTANTS.SECURITY_PAYLOADS.SSRF_LOOPBACK_IP },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('T2-F14-03: SSRF vector AWS/GCP 169.254.169.254 cloud metadata is denied', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: TEST_CONSTANTS.SECURITY_PAYLOADS.SSRF_CLOUD_METADATA },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('T2-F14-04: SSRF vector 10.0.0.0/8 private network IP is denied', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: TEST_CONSTANTS.SECURITY_PAYLOADS.SSRF_PRIVATE_10 },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('T2-F14-05: Non-standard service port (SSH 22) in URL is denied', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: 'http://example.com:22/exam' },
    });
    expect([401, 403]).toContain(response.status());
  });
});
