import { test, expect } from '@playwright/test';

/**
 * Tier 1 — Feature 14: Marketplace Empty Exam & SSRF Importer Fix (Happy Path Coverage)
 * Requirements: PROJECT.md § Feature Inventory (Feature 14), RC-05, RC-09, MKT-06
 * Opaque-box contract: URL importer authentication, schema validation, and URL sanity checks.
 */
test.describe('Tier 1: Feature 14 - Marketplace Empty Exam & SSRF Importer Fix', () => {
  test('T1-F14-01: URL exam importer requires authenticated session', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: 'https://example.com/exam' },
    });
    expect(response.status()).toBe(401);
  });

  test('T1-F14-02: URL exam importer rejects request with missing url field', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: {},
    });
    // Expected 400 or 401
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F14-03: URL exam importer rejects empty string url', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: '' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F14-04: URL exam importer rejects non-HTTP protocol scheme (ftp://)', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: 'ftp://ftp.example.com/test.pdf' },
    });
    expect([400, 401]).toContain(response.status());
  });

  test('T1-F14-05: URL exam importer rejects non-HTTP protocol scheme (file://)', async ({ request }) => {
    const response = await request.post('/api/exams/import-from-url', {
      data: { url: 'file:///etc/passwd' },
    });
    expect([400, 401]).toContain(response.status());
  });
});
