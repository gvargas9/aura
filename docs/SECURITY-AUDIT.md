# Aura Platform Security Audit Report

**Date**: 2026-03-27
**Auditor**: Security Hardening Audit
**Scope**: API security, input validation, rate limiting, CSRF protection, security headers, cookie configuration, error sanitization

---

## 1. What Was Reviewed

### API Endpoints Audited
- `/api/chat` -- AI chat endpoint (Gemini integration)
- `/api/checkout` -- Stripe checkout session creation
- `/api/gift-cards/purchase` -- Gift card purchase
- `/api/gift-cards/redeem` -- Gift card redemption
- `/api/promo-codes/validate` -- Promo code validation
- `/api/b2b/apply` -- B2B dealer application
- `/api/reviews` -- Product review submission and listing
- `/api/orders` -- Order creation and listing
- `/api/products` -- Product listing and admin creation

### Infrastructure Components Audited
- Next.js middleware (`src/middleware.ts`)
- Supabase auth middleware (`src/lib/supabase/middleware.ts`)
- Supabase client configuration (server + browser)
- Authentication helpers (`src/lib/api/auth.ts`)
- Next.js configuration (`next.config.ts`)

---

## 2. Vulnerabilities Found and Fixed

### 2.1 No Rate Limiting on Any Endpoints (CRITICAL)

**Risk**: All API endpoints were unprotected against brute-force attacks, credential stuffing, and denial-of-service. An attacker could:
- Enumerate gift card codes via `/api/gift-cards/redeem`
- Brute-force promo codes via `/api/promo-codes/validate`
- Abuse the AI chat API (cost escalation) via `/api/chat`
- Spam B2B applications via `/api/b2b/apply`

**Fix**: Implemented in-memory rate limiting (`src/lib/api/rate-limit.ts`) with IP-based tracking and auto-cleanup. Applied rate limits:

| Endpoint | Limit |
|----------|-------|
| `/api/chat` | 10/min |
| `/api/checkout` | 10/min |
| `/api/gift-cards/purchase` | 5/min |
| `/api/gift-cards/redeem` | 10/min |
| `/api/promo-codes/validate` | 20/min |
| `/api/b2b/apply` | 3/min |
| `/api/reviews` (POST) | 5/min |

Rate-limited responses return HTTP 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

### 2.2 No Input Sanitization (HIGH)

**Risk**: Several endpoints accepted user text input without sanitization, creating stored XSS vulnerabilities if content was rendered in admin panels or other user-facing views:
- Review titles and bodies stored raw
- B2B application fields stored raw
- Product names and descriptions stored raw
- Order notes stored raw
- Chat messages passed unsanitized to AI

**Fix**: Implemented input validation library (`src/lib/api/validation.ts`) with:
- `sanitizeString()` -- strips `<script>` tags, `javascript:` URIs, `on*` event handlers, and all HTML tags
- `sanitizeHtml()` -- allows only safe tags (p, br, strong, em, ul, ol, li, a with href)
- `enforceMaxLength()` -- truncates strings to safe limits
- Applied to all user-facing text inputs across audited endpoints

### 2.3 No Security Headers (HIGH)

**Risk**: Missing security headers left the application vulnerable to:
- Clickjacking (no `X-Frame-Options`)
- MIME type confusion attacks (no `X-Content-Type-Options`)
- Cross-site scripting via browser heuristics (no `X-XSS-Protection`)
- Information leakage via Referer header (no `Referrer-Policy`)

**Fix**: Added comprehensive security headers to all responses via middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Content-Security-Policy with allowlists for self, Supabase, Stripe, and Google domains

### 2.4 No CSRF Protection (MEDIUM)

**Risk**: State-changing API routes (POST/PUT/DELETE) had no CSRF protection. While Supabase auth tokens mitigate some risk, a malicious site could still trigger actions if a user had an active session.

**Fix**: Implemented CSRF validation (`src/lib/api/csrf.ts`) in the middleware:
- Verifies `Origin` or `Referer` header matches the application domain
- Applied to all POST/PUT/DELETE/PATCH requests to `/api/*`
- Webhook endpoints are excluded (they use their own authentication like Stripe signatures)
- Non-browser clients (no Origin/Referer) are allowed through since CSRF is a browser-specific attack

### 2.5 Internal Error Details Leaked to Clients (MEDIUM)

**Risk**: Several API catch blocks returned raw error messages that could expose internal database schema, file paths, or stack traces to clients in production.

**Fix**: Created error sanitization helper (`src/lib/api/safe-error.ts`):
- Development: returns full error message for debugging
- Production: returns generic safe message, logs full details server-side
- Known safe patterns (auth errors, validation errors) are passed through
- Applied to all audited API endpoints

### 2.6 Missing `secure` Flag on Auth Cookies (MEDIUM)

**Risk**: Supabase SSR library defaults do not set the `secure` flag on cookies, meaning auth tokens could be transmitted over unencrypted HTTP connections in production.

**Fix**: Enhanced cookie configuration in `src/lib/supabase/middleware.ts` to enforce `secure: true` in production and `sameSite: "lax"` as a baseline.

### 2.7 Missing UUID Validation on ID Parameters (LOW)

**Risk**: Endpoints accepting UUID parameters (productId, user_id) did not validate format, potentially allowing injection into Supabase queries.

**Fix**: Added UUID validation to:
- `/api/reviews` (POST) -- validates `productId`
- `/api/orders` (POST) -- validates `user_id`

### 2.8 Missing Phone Validation on B2B Apply (LOW)

**Risk**: The B2B application endpoint accepted any string as a phone number.

**Fix**: Added phone number format validation using E.164-compatible pattern.

---

## 3. Remaining Risks and Recommended Mitigations

### 3.1 In-Memory Rate Limiting (Accepted Risk)

**Status**: Current rate limiting uses an in-memory Map, which does not persist across server restarts or scale across multiple instances.

**Mitigation**: Acceptable for current scale. When deploying to multi-instance environments:
- Migrate to Redis-based rate limiting (e.g., `@upstash/ratelimit`)
- Or use Vercel Edge Config / KV for serverless-compatible rate limiting

### 3.2 Supabase Auth Cookies Not HttpOnly (Known Limitation)

**Status**: Supabase SSR intentionally sets `httpOnly: false` because the browser-side SDK needs to read auth tokens from cookies. This means JavaScript on the page can access auth cookies.

**Mitigation**: This is mitigated by:
- Content Security Policy preventing unauthorized script execution
- Supabase's built-in token rotation and short-lived access tokens
- CSRF protection preventing cross-origin exploitation

### 3.3 SQL Injection via `.ilike` and `.or` Patterns

**Status**: Several endpoints construct Supabase `.or()` and `.ilike()` queries with user-provided search terms. While Supabase parameterizes these internally, the pattern `name.ilike.%${search}%` could theoretically be exploited if Supabase's escaping has bugs.

**Mitigation**: Supabase uses PostgREST which parameterizes queries. For additional safety:
- Consider adding allowlist-based character filtering on search terms
- Monitor Supabase security advisories

### 3.4 No WAF or DDoS Protection

**Status**: The application has no web application firewall or DDoS protection beyond rate limiting.

**Recommendation**:
- Deploy behind Vercel's built-in DDoS protection (automatic on Vercel)
- Or add Cloudflare as a reverse proxy with WAF rules

### 3.5 No Audit Logging

**Status**: Security-relevant events (failed logins, rate limit hits, CSRF rejections) are logged to console but not to a persistent audit trail.

**Recommendation**:
- Add structured audit logging for security events
- Consider sending security events to a SIEM (e.g., Datadog, Sentry)

### 3.6 Admin Role Check in Middleware is Deferred

**Status**: The admin route check in `src/lib/supabase/middleware.ts` has a comment "For now, we'll let it through and handle role checking in the page." While admin API routes properly check roles, the middleware-level check would be a stronger defense.

**Recommendation**: Implement middleware-level admin role verification using a Supabase service role check for admin routes.

### 3.7 Stripe Webhook Signature Verification

**Status**: Not audited in this pass. Stripe webhook endpoints should verify the `Stripe-Signature` header using the webhook secret.

**Recommendation**: Verify that `/api/webhooks/stripe` uses `stripe.webhooks.constructEvent()` with proper signature validation.

### 3.8 Content Security Policy Tuning

**Status**: The CSP includes `'unsafe-inline'` and `'unsafe-eval'` for scripts, which weakens XSS protection. This is common with Next.js due to its inline script patterns.

**Recommendation**:
- Investigate using nonce-based CSP for Next.js inline scripts
- Remove `'unsafe-eval'` if not strictly required

---

## 4. Security Architecture Overview

```
                    Client (Browser)
                         |
                    [HTTPS/TLS]
                         |
                  +------v-------+
                  |  Next.js     |
                  |  Middleware   |
                  | - Security   |
                  |   Headers    |
                  | - CSRF Check |
                  | - Session    |
                  |   Refresh    |
                  | - Route      |
                  |   Protection |
                  +------+-------+
                         |
            +------------+------------+
            |                         |
    +-------v--------+     +---------v--------+
    |  API Routes     |     | Server Components|
    | - Rate Limiting |     | - Auth Check     |
    | - Input Valid.  |     | - Data Fetch     |
    | - Auth Check    |     +------------------+
    | - Error Sanitize|
    +-------+--------+
            |
    +-------v--------+
    |  Supabase       |
    | - RLS Policies  |
    | - Auth (JWT)    |
    | - Parameterized |
    |   Queries       |
    +----------------+
```

### Defense-in-Depth Layers

1. **Transport**: HTTPS enforced (via hosting platform)
2. **Edge/Middleware**: Security headers, CSRF validation, session management
3. **API Layer**: Rate limiting, input validation, authentication, authorization
4. **Database Layer**: Row Level Security (RLS), parameterized queries
5. **Error Handling**: Sanitized error responses, server-side logging
6. **Cookie Security**: Secure flag in production, SameSite=Lax

---

## 5. Files Created / Modified

### New Files
| File | Purpose |
|------|---------|
| `src/lib/api/rate-limit.ts` | In-memory rate limiting with auto-cleanup |
| `src/lib/api/validation.ts` | Input validation and XSS sanitization helpers |
| `src/lib/api/csrf.ts` | CSRF protection via Origin/Referer validation |
| `src/lib/api/safe-error.ts` | API error response sanitization |
| `docs/SECURITY-AUDIT.md` | This security audit report |

### Modified Files
| File | Changes |
|------|---------|
| `src/middleware.ts` | Added security headers, CSRF protection |
| `src/lib/supabase/middleware.ts` | Added secure cookie flag for production |
| `src/app/api/chat/route.ts` | Rate limiting, input sanitization |
| `src/app/api/checkout/route.ts` | Rate limiting, error sanitization |
| `src/app/api/gift-cards/purchase/route.ts` | Rate limiting, error sanitization |
| `src/app/api/gift-cards/redeem/route.ts` | Rate limiting, error sanitization |
| `src/app/api/promo-codes/validate/route.ts` | Rate limiting, error sanitization |
| `src/app/api/b2b/apply/route.ts` | Rate limiting, input validation, error sanitization |
| `src/app/api/reviews/route.ts` | Rate limiting, input sanitization, UUID validation |
| `src/app/api/orders/route.ts` | Input validation (shipping address, UUID, notes) |
| `src/app/api/products/route.ts` | Price validation, name/description sanitization |

---

## 6. Recommendations for Production

1. **Upgrade rate limiting to Redis** when scaling beyond a single instance
2. **Enable Supabase MFA** for admin accounts
3. **Implement audit logging** for security-critical events
4. **Add Stripe webhook signature verification** audit
5. **Tighten CSP** by removing `unsafe-eval` and using nonces
6. **Add dependency scanning** (e.g., `npm audit`, Snyk) to CI/CD pipeline
7. **Enable Supabase Database Audit Logs** for compliance
8. **Implement API key rotation** schedule for Stripe, Gemini, and Supabase keys
9. **Add penetration testing** before public launch
10. **Set up security monitoring** alerts for rate limit spikes and auth failures
