import type {
  MenuMasterLead,
  MenuMasterAccount,
  MenuMasterActivity,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration — skip silently if not configured
// ---------------------------------------------------------------------------

const MENUMASTER_API_URL = process.env.MENUMASTER_API_URL ?? "";
const MENUMASTER_API_TOKEN = process.env.MENUMASTER_API_TOKEN ?? "";
const MENUMASTER_BUSINESS_ID = process.env.MENUMASTER_BUSINESS_ID ?? "";
const REQUEST_TIMEOUT_MS = 10_000;

function isConfigured(): boolean {
  return !!(MENUMASTER_API_URL && MENUMASTER_API_TOKEN && MENUMASTER_BUSINESS_ID);
}

function buildUrl(path: string): string {
  const base = MENUMASTER_API_URL.replace(/\/+$/, "");
  const businessPath = `/api/webhooks/crm/${MENUMASTER_BUSINESS_ID}`;
  return `${base}${businessPath}${path}`;
}

function defaultHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-API-Token": MENUMASTER_API_TOKEN,
  };
}

// ---------------------------------------------------------------------------
// Core request helper — fire-and-forget, never throws
// ---------------------------------------------------------------------------

async function menuMasterRequest(
  method: "POST" | "PATCH",
  path: string,
  body: unknown
): Promise<boolean> {
  if (!isConfigured()) {
    console.warn(
      "[menumaster] Not configured — skipping request to",
      path
    );
    return false;
  }

  const url = buildUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(
        `[menumaster] ${method} ${path} returned ${response.status}: ${response.statusText}`
      );
      return false;
    }

    console.log(`[menumaster] ${method} ${path} succeeded`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[menumaster] Failed ${method} ${path}: ${message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Domain-specific sync functions
// ---------------------------------------------------------------------------

/**
 * Sync a lead to MenuMaster CRM.
 * Fire-and-forget — never throws.
 */
export async function syncLeadToMenuMaster(
  lead: MenuMasterLead
): Promise<boolean> {
  return menuMasterRequest("POST", "/leads", {
    ...lead,
    timestamp: new Date().toISOString(),
    source_system: "aura",
  });
}

/**
 * Sync an account/organization to MenuMaster CRM.
 * Fire-and-forget — never throws.
 */
export async function syncAccountToMenuMaster(
  account: MenuMasterAccount
): Promise<boolean> {
  return menuMasterRequest("POST", "/accounts", {
    ...account,
    timestamp: new Date().toISOString(),
    source_system: "aura",
  });
}

/**
 * Log a sample distribution or other activity to MenuMaster CRM.
 * Fire-and-forget — never throws.
 */
export async function logSampleActivity(
  activity: MenuMasterActivity
): Promise<boolean> {
  return menuMasterRequest("POST", "/activities", {
    ...activity,
    timestamp: new Date().toISOString(),
    source_system: "aura",
  });
}

/**
 * Update an existing lead in MenuMaster CRM.
 * Fire-and-forget — never throws.
 */
export async function updateLeadInMenuMaster(
  externalId: string,
  updates: Partial<MenuMasterLead>
): Promise<boolean> {
  return menuMasterRequest("PATCH", `/leads/${externalId}`, {
    ...updates,
    updated_at: new Date().toISOString(),
    source_system: "aura",
  });
}
