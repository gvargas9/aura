import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateSession } from "@/lib/supabase/middleware";
import { validateCsrf, isWebhookPath } from "@/lib/api/csrf";

// Security headers applied to all responses
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://*.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://generativelanguage.googleapis.com https://accounts.google.com",
    "frame-src 'self' https://js.stripe.com https://accounts.google.com https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

// Embed-specific headers: allow framing from any origin
const embedSecurityHeaders: Record<string, string> = {
  ...securityHeaders,
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors *",
  ].join("; "),
};
// Remove X-Frame-Options for embeds (frame-ancestors * takes precedence)
delete embedSecurityHeaders["X-Frame-Options"];

function applySecurityHeaders(response: NextResponse, isEmbed: boolean = false): NextResponse {
  const headers = isEmbed ? embedSecurityHeaders : securityHeaders;
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  // For embeds, explicitly remove X-Frame-Options if it was inherited
  if (isEmbed) {
    response.headers.delete("X-Frame-Options");
  }
  return response;
}

// Known domains that should NOT trigger custom domain lookup
function isKnownDomain(host: string): boolean {
  const known = [
    "localhost",
    "127.0.0.1",
    "aura.com",
    "www.aura.com",
  ];
  // Also check the configured app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      known.push(parsed.hostname);
    } catch {
      // skip
    }
  }
  const hostname = host.split(":")[0]; // strip port
  return known.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

// Simple in-memory cache for custom domain lookups (TTL: 60s)
const domainCache = new Map<string, { slug: string | null; ts: number }>();
const DOMAIN_CACHE_TTL = 60_000; // 1 minute

async function resolveCustomDomain(host: string): Promise<string | null> {
  const hostname = host.split(":")[0];
  const cached = domainCache.get(hostname);
  if (cached && Date.now() - cached.ts < DOMAIN_CACHE_TTL) {
    return cached.slug;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("storefronts")
      .select("slug")
      .eq("custom_domain", hostname)
      .eq("is_active", true)
      .single();

    const slug = data?.slug ?? null;
    domainCache.set(hostname, { slug, ts: Date.now() });
    return slug;
  } catch {
    domainCache.set(hostname, { slug: null, ts: Date.now() });
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isEmbedRoute = pathname.startsWith("/embed/");

  // --- Custom domain resolution ---
  const host = request.headers.get("host") || "";
  if (!isKnownDomain(host) && !pathname.startsWith("/store/") && !isEmbedRoute) {
    const slug = await resolveCustomDomain(host);
    if (slug) {
      // Rewrite to the storefront page while keeping the original URL visible
      const url = request.nextUrl.clone();
      url.pathname = `/store/${slug}${pathname === "/" ? "" : pathname}`;
      const response = NextResponse.rewrite(url);
      return applySecurityHeaders(response);
    }
  }

  // CSRF protection for API mutation routes (skip webhooks)
  if (pathname.startsWith("/api/") && !isWebhookPath(pathname)) {
    const csrfError = validateCsrf(request);
    if (csrfError) {
      return applySecurityHeaders(csrfError);
    }
  }

  // Run Supabase session management (auth refresh, route protection)
  const response = await updateSession(request);

  // Apply security headers to all responses
  return applySecurityHeaders(response, isEmbedRoute);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
