/**
 * Input validation and sanitization helpers for API routes.
 * Prevents XSS, injection, and ensures data integrity.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates an email address format per RFC 5322 simplified pattern.
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validates a phone number in E.164-ish format.
 * Allows optional leading +, digits only, 2-15 digits.
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  // Strip common formatting characters for validation
  const cleaned = phone.replace(/[\s\-().]/g, "");
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validates a UUID v1-v5 format string.
 */
export function validateUUID(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id);
}

/**
 * Validates a price value.
 * Must be a positive number, max 2 decimal places, max $99,999.
 */
export function validatePrice(price: number): boolean {
  if (typeof price !== "number" || !isFinite(price)) return false;
  if (price < 0 || price > 99999) return false;
  // Check at most 2 decimal places
  const decimalStr = price.toString();
  const dotIndex = decimalStr.indexOf(".");
  if (dotIndex !== -1) {
    const decimals = decimalStr.length - dotIndex - 1;
    if (decimals > 2) return false;
  }
  return true;
}

/**
 * Sanitizes a string to prevent XSS attacks.
 * Strips <script> tags, javascript: URIs, and on* event handlers.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // Remove <script>...</script> tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove standalone <script> or </script> tags
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, "");

  // Remove javascript: protocol URIs
  sanitized = sanitized.replace(/javascript\s*:/gi, "");

  // Remove vbscript: protocol URIs
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");

  // Remove data: URIs that could contain scripts
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, "");

  // Remove on* event handler attributes (e.g., onclick=, onerror=)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Remove any remaining HTML tags (complete strip for plain text fields)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Trim and normalize whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitizes HTML content, allowing only safe tags.
 * Allowed tags: p, br, strong, em, b, i, ul, ol, li, a (with href only).
 * All other tags and attributes are stripped.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // Remove <script>...</script> tags and their content first
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove <style>...</style> tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove javascript:, vbscript:, data:text/html URIs
  sanitized = sanitized.replace(/javascript\s*:/gi, "");
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");
  sanitized = sanitized.replace(/data\s*:\s*text\/html/gi, "");

  // Remove on* event handler attributes
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "");

  // Allow only safe tags, strip everything else
  // Process tags: keep allowed ones, remove others
  const allowedTags = new Set(["p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "a"]);

  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      return ""; // Strip disallowed tags
    }

    // For closing tags, just return the clean closing tag
    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    // For <a> tags, only keep href attribute (and validate it)
    if (tag === "a") {
      const hrefMatch = attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (hrefMatch) {
        const href = hrefMatch[1] || hrefMatch[2];
        // Only allow http, https, and mailto protocols
        if (/^(https?:|mailto:)/i.test(href) || href.startsWith("/")) {
          return `<a href="${escapeHtmlAttr(href)}" rel="nofollow noopener">`;
        }
      }
      return "<a>"; // Strip href if unsafe
    }

    // For <br>, self-close
    if (tag === "br") {
      return "<br />";
    }

    // For other allowed tags, strip all attributes
    return `<${tag}>`;
  });

  return sanitized.trim();
}

/**
 * Escapes a string for safe use in an HTML attribute value.
 */
function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Validates and normalizes pagination parameters.
 * Returns safe defaults if inputs are invalid.
 */
export function validatePagination(
  page: unknown,
  pageSize: unknown,
  maxPageSize: number = 100
): { page: number; pageSize: number } {
  let parsedPage = 1;
  let parsedPageSize = 20;

  if (page !== undefined && page !== null) {
    const num = typeof page === "string" ? parseInt(page, 10) : Number(page);
    if (!isNaN(num) && num >= 1) {
      parsedPage = Math.floor(num);
    }
  }

  if (pageSize !== undefined && pageSize !== null) {
    const num = typeof pageSize === "string" ? parseInt(pageSize, 10) : Number(pageSize);
    if (!isNaN(num) && num >= 1) {
      parsedPageSize = Math.min(Math.floor(num), maxPageSize);
    }
  }

  return { page: parsedPage, pageSize: parsedPageSize };
}

/**
 * Validates a rating value is an integer between 1 and 5.
 */
export function validateRating(rating: unknown): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Validates a shipping address object has required fields.
 */
export function validateShippingAddress(address: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!address || typeof address !== "object") {
    return { valid: false, error: "Shipping address is required" };
  }

  const addr = address as Record<string, unknown>;
  const requiredFields = ["street", "city", "state", "zip", "country"];

  for (const field of requiredFields) {
    if (!addr[field] || typeof addr[field] !== "string" || !(addr[field] as string).trim()) {
      return { valid: false, error: `Shipping address: ${field} is required` };
    }
  }

  // Validate ZIP code format (US: 5 digits or 5+4)
  const zip = (addr.zip as string).trim();
  if (!/^\d{5}(-\d{4})?$/.test(zip) && (addr.country as string).toUpperCase() === "US") {
    return { valid: false, error: "Invalid ZIP code format" };
  }

  // Validate state code (2 letters for US)
  const state = (addr.state as string).trim();
  if ((addr.country as string).toUpperCase() === "US" && !/^[A-Z]{2}$/i.test(state)) {
    return { valid: false, error: "State must be a 2-letter code" };
  }

  return { valid: true };
}

/**
 * Enforces a maximum string length, truncating if necessary.
 */
export function enforceMaxLength(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input.length > maxLength ? input.slice(0, maxLength) : input;
}
