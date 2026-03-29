import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF protection for state-changing requests (POST, PUT, DELETE, PATCH).
 * Verifies that the Origin or Referer header matches the expected application domain.
 *
 * This is a lightweight CSRF check that relies on the browser's same-origin policy
 * for Origin/Referer headers, which cannot be spoofed by JavaScript on other domains.
 *
 * Webhook endpoints should skip this check since they use their own authentication
 * (e.g., Stripe signature verification).
 */

function getExpectedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      origins.push(parsed.origin);
    } catch {
      // Invalid URL in env var, skip
    }
  }

  // Always allow localhost for development
  origins.push("http://localhost:3000");
  origins.push("http://127.0.0.1:3000");

  return origins;
}

/**
 * Validates CSRF by checking Origin/Referer headers against expected domains.
 * Returns null if the request passes CSRF validation, or a NextResponse with 403 if it fails.
 */
export function validateCsrf(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase();

  // Only check state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // If neither header is present, the request may be from a non-browser client
  // (e.g., curl, Postman, server-to-server). We allow these through since
  // they cannot exploit CSRF (CSRF requires a victim's browser).
  // The API routes themselves handle authentication separately.
  if (!origin && !referer) {
    return null;
  }

  const expectedOrigins = getExpectedOrigins();

  // Check Origin header first (preferred, more reliable)
  if (origin) {
    if (expectedOrigins.some((expected) => origin === expected)) {
      return null; // Valid origin
    }
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (expectedOrigins.some((expected) => refererOrigin === expected)) {
        return null; // Valid referer
      }
    } catch {
      // Malformed referer, reject
    }
  }

  return NextResponse.json(
    { error: "Forbidden: Invalid request origin" },
    { status: 403 }
  );
}

/**
 * Checks if the request path is a webhook endpoint that should skip CSRF.
 */
export function isWebhookPath(pathname: string): boolean {
  const webhookPaths = [
    "/api/webhooks/",
    "/api/webhook/",
  ];
  return webhookPaths.some((path) => pathname.startsWith(path));
}
