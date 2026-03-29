/**
 * API error response sanitization.
 * Ensures internal details (stack traces, database errors, file paths) are never
 * leaked to clients in production.
 */

const isDev = process.env.NODE_ENV === "development";

/**
 * Returns a safe error response object.
 * - In development: returns the full error message for debugging.
 * - In production: returns a generic message, logs full details server-side.
 */
export function safeError(
  error: unknown,
  fallbackMessage: string = "An unexpected error occurred"
): { error: string } {
  // Extract message from various error types
  let message: string;
  let stack: string | undefined;

  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  } else if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object" && "message" in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = fallbackMessage;
  }

  if (isDev) {
    return { error: message };
  }

  // In production, log the real error but return a safe message
  console.error("[API Error]", {
    message,
    stack,
    timestamp: new Date().toISOString(),
  });

  // Check for known safe error patterns that are OK to show users
  const safePatterns = [
    /authentication required/i,
    /unauthorized/i,
    /forbidden/i,
    /not found/i,
    /invalid .+ format/i,
    /missing required field/i,
    /already exists/i,
    /too many requests/i,
    /validation failed/i,
  ];

  if (safePatterns.some((pattern) => pattern.test(message))) {
    return { error: message };
  }

  return { error: fallbackMessage };
}

/**
 * Wraps a potentially sensitive database error into a safe user-facing message.
 */
export function safeDatabaseError(
  error: unknown,
  operation: string = "operation"
): { error: string } {
  if (isDev) {
    const msg = error instanceof Error ? error.message : String(error);
    return { error: `Database error during ${operation}: ${msg}` };
  }

  console.error(`[Database Error] ${operation}:`, error);
  return { error: `Failed to complete ${operation}. Please try again.` };
}
