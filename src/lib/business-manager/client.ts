/**
 * BusinessManager CRM Webhook Client
 *
 * Fire-and-forget outbound calls to BusinessManager's webhook API.
 * Aligned with WEBHOOK_API.md v3.0.0.
 *
 * Auth: X-API-Token header with sk_live_{64_hex} format
 * Base: /api/webhooks/crm/{businessId}/
 *
 * Never throws — logs errors and returns false on failure.
 */

import type {
  BusinessManagerLead,
  BusinessManagerContact,
  BusinessManagerCustomer,
  BusinessManagerActivity,
  BusinessManagerOpportunity,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration — skip silently if not configured
// ---------------------------------------------------------------------------

const BUSINESS_MANAGER_API_URL = process.env.BUSINESS_MANAGER_API_URL ?? "";
const BUSINESS_MANAGER_API_TOKEN = process.env.BUSINESS_MANAGER_API_TOKEN ?? "";
const BUSINESS_MANAGER_BUSINESS_ID = process.env.BUSINESS_MANAGER_BUSINESS_ID ?? "";
const REQUEST_TIMEOUT_MS = 10_000;

function isConfigured(): boolean {
  return !!(BUSINESS_MANAGER_API_URL && BUSINESS_MANAGER_API_TOKEN && BUSINESS_MANAGER_BUSINESS_ID);
}

function buildUrl(path: string): string {
  const base = BUSINESS_MANAGER_API_URL.replace(/\/+$/, "");
  return `${base}/api/webhooks/crm/${BUSINESS_MANAGER_BUSINESS_ID}${path}`;
}

function defaultHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-API-Token": BUSINESS_MANAGER_API_TOKEN,
  };
}

// ---------------------------------------------------------------------------
// Core request helper — fire-and-forget, never throws
// ---------------------------------------------------------------------------

async function businessManagerRequest(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown
): Promise<{ success: boolean; data?: Record<string, unknown> }> {
  if (!isConfigured()) return { success: false };

  const url = buildUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      headers: defaultHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(
        `[business-manager] ${method} ${path} → ${response.status}: ${JSON.stringify(data)}`
      );
      return { success: false, data };
    }

    console.log(`[business-manager] ${method} ${path} → OK`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[business-manager] ${method} ${path} failed: ${message}`);
    return { success: false };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Leads — POST /api/webhooks/crm/:businessId/leads
// ---------------------------------------------------------------------------

/**
 * Create a lead in BusinessManager CRM.
 * Required: email
 */
export async function syncLeadToBusinessManager(lead: BusinessManagerLead) {
  return businessManagerRequest("POST", "/leads", {
    ...lead,
    source: lead.source ?? "aura_platform",
  });
}

/**
 * Update an existing lead by BusinessManager lead ID.
 * PATCH /api/webhooks/crm/:businessId/leads/:leadId
 */
export async function updateLeadInBusinessManager(
  leadId: number,
  updates: Partial<BusinessManagerLead>
) {
  return businessManagerRequest("PATCH", `/leads/${leadId}`, updates);
}

/**
 * Get all leads (optionally filtered).
 * GET /api/webhooks/crm/:businessId/leads
 */
export async function getLeadsFromBusinessManager(params?: {
  status?: string;
  source?: string;
  assignedTo?: number;
  page?: number;
  limit?: number;
}) {
  const query = params
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : "";
  return businessManagerRequest("GET", `/leads${query}`);
}

// ---------------------------------------------------------------------------
// Contacts — POST /api/webhooks/crm/:businessId/contacts
// ---------------------------------------------------------------------------

/**
 * Create a contact in BusinessManager CRM.
 * Required: email
 */
export async function syncContactToBusinessManager(contact: BusinessManagerContact) {
  return businessManagerRequest("POST", "/contacts", contact);
}

/**
 * Update an existing contact.
 * PATCH /api/webhooks/crm/:businessId/contacts/:contactId
 */
export async function updateContactInBusinessManager(
  contactId: number,
  updates: Partial<BusinessManagerContact>
) {
  return businessManagerRequest("PATCH", `/contacts/${contactId}`, updates);
}

// ---------------------------------------------------------------------------
// Customers — POST /api/webhooks/crm/:businessId/customers
// ---------------------------------------------------------------------------

/**
 * Create a customer in BusinessManager CRM.
 * Required: email
 */
export async function syncCustomerToBusinessManager(customer: BusinessManagerCustomer) {
  return businessManagerRequest("POST", "/customers", customer);
}

/**
 * Update an existing customer.
 * PATCH /api/webhooks/crm/:businessId/customers/:customerId
 */
export async function updateCustomerInBusinessManager(
  customerId: number,
  updates: Partial<BusinessManagerCustomer>
) {
  return businessManagerRequest("PATCH", `/customers/${customerId}`, updates);
}

// ---------------------------------------------------------------------------
// Activities — POST /api/webhooks/crm/:businessId/activities
// ---------------------------------------------------------------------------

/**
 * Create an activity on a CRM entity.
 * Required: entityType, entityId, activityType, subject
 */
export async function logActivityToBusinessManager(activity: BusinessManagerActivity) {
  return businessManagerRequest("POST", "/activities", activity);
}

/**
 * Log a sample-related activity on a lead.
 * Convenience wrapper for sample tracking.
 */
export async function logSampleActivity(params: {
  leadId: number;
  subject: string;
  description: string;
  createdBy?: number;
  activityType?: "meeting" | "note" | "task";
  status?: "pending" | "completed";
  assignedTo?: number;
  externalId?: string;
}) {
  return logActivityToBusinessManager({
    entityType: "lead",
    entityId: params.leadId,
    activityType: params.activityType ?? "note",
    subject: params.subject,
    createdBy: params.createdBy ?? 1, // Default to admin user
    description: params.description,
    status: params.status ?? "completed",
    activityDate: new Date().toISOString(),
    assignedTo: params.assignedTo,
    externalId: params.externalId,
  });
}

// ---------------------------------------------------------------------------
// Opportunities — POST /api/webhooks/crm/:businessId/opportunities
// ---------------------------------------------------------------------------

/**
 * Create an opportunity in BusinessManager CRM.
 */
export async function syncOpportunityToBusinessManager(opp: BusinessManagerOpportunity) {
  return businessManagerRequest("POST", "/opportunities", opp);
}

/**
 * Update an existing opportunity.
 * PATCH /api/webhooks/crm/:businessId/opportunities/:oppId
 */
export async function updateOpportunityInBusinessManager(
  oppId: number,
  updates: Partial<BusinessManagerOpportunity>
) {
  return businessManagerRequest("PATCH", `/opportunities/${oppId}`, updates);
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

/**
 * Check if BusinessManager webhook service is reachable.
 * GET /api/webhooks/health (no auth required, no businessId)
 */
export async function checkBusinessManagerHealth(): Promise<boolean> {
  if (!BUSINESS_MANAGER_API_URL) return false;

  const url = `${BUSINESS_MANAGER_API_URL.replace(/\/+$/, "")}/api/webhooks/health`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return data?.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
