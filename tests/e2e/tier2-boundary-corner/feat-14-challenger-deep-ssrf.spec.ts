import { test, expect } from '@playwright/test';

/**
 * Empirical Challenger Stress Harness — Advanced SSRF & Header Spoofing Probes
 */
test.describe('Challenger Stress — Advanced SSRF Vectors & Protocol Escapes', () => {
  const ssrfVectors = [
    'http://0.0.0.0:80',
    'http://[::1]:80',
    'http://127.0.0.1:8080',
    'http://10.255.255.255',
    'http://172.16.0.1',
    'http://192.168.1.254',
    'http://169.254.169.254/latest/meta-data/',
    'ftp://127.0.0.1/test',
    'file:///etc/passwd',
    'gopher://127.0.0.1:6379/_INFO',
    'javascript:alert(1)',
  ];

  for (const url of ssrfVectors) {
    test(`[Challenger SSRF] Vector ${url} is strictly rejected with 400, 401, or 403`, async ({ request }) => {
      const response = await request.post('/api/exams/import-from-url', {
        data: { url },
      });
      expect([400, 401, 403]).toContain(response.status());
    });
  }

  const spoofHeaders = [
    { 'X-Original-URL': '/admin' },
    { 'X-Rewrite-URL': '/admin' },
    { 'X-Forwarded-Host': 'admin.edteach.vn' },
    { 'X-Custom-Role': 'superadmin' },
  ];

  for (const headers of spoofHeaders) {
    const headerName = Object.keys(headers)[0];
    test(`[Challenger Auth] Header spoofing ${headerName} does not bypass /dashboard protection`, async ({ request }) => {
      const response = await request.get('/dashboard', {
        headers,
        maxRedirects: 0,
      });
      expect([301, 302, 307, 308]).toContain(response.status());
      const location = response.headers()['location'] || '';
      expect(location).toContain('/login');
    });
  }
});
