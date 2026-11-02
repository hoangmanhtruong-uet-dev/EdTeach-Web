import { APIRequestContext, expect } from '@playwright/test';

/**
 * Shared API Helper Utilities for Opaque-Box E2E Testing
 */

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
}

/**
 * Perform a GET request without automatic redirection to verify redirect headers
 */
export async function getWithoutRedirect(
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>
) {
  return await request.get(path, {
    maxRedirects: 0,
    headers: headers || {},
  });
}

/**
 * Assert that an unauthenticated request is redirected to login
 */
export async function assertRedirectsToLogin(
  request: APIRequestContext,
  path: string,
  customHeaders?: Record<string, string>
) {
  const response = await getWithoutRedirect(request, path, customHeaders);
  const status = response.status();
  // Expect redirect HTTP status code (301, 302, 307, 308)
  expect([301, 302, 307, 308]).toContain(status);
  const location = response.headers()['location'] || '';
  expect(location).toContain('/login');
}

/**
 * Assert that an API request is rejected with expected status and error payload
 */
export async function assertApiError(
  response: any,
  expectedStatus: number,
  expectedErrorSubstring?: string
) {
  expect(response.status()).toBe(expectedStatus);
  const body = await response.json();
  if (expectedErrorSubstring) {
    const errorText = body.error || body.message || JSON.stringify(body);
    expect(errorText.toLowerCase()).toContain(expectedErrorSubstring.toLowerCase());
  }
  return body;
}

/**
 * Helper to generate random string identifier for test isolation
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
