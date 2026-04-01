// ---------------------------------------------------------------------------
// BusinessManager CRM Integration Types
// Aligned with BusinessManager WEBHOOK_API.md v3.0.0
// ---------------------------------------------------------------------------

export interface BusinessManagerConfig {
  apiUrl: string;
  apiToken: string; // format: sk_live_{64_hex_characters}
  businessId: string;
  webhookSecret: string;
}

/**
 * Lead payload — matches POST /api/webhooks/crm/:businessId/leads
 * Required: email
 */
export interface BusinessManagerLead {
  firstName?: string;
  lastName?: string;
  email: string; // Required by BusinessManager
  phone?: string;
  company?: string;
  status?: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  source?: string; // e.g. "aura_platform"
  industry?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  externalId?: string; // Aura's internal ID for cross-reference
  tagIds?: number[];
}

/**
 * Contact payload — matches POST /api/webhooks/crm/:businessId/contacts
 * Required: email
 */
export interface BusinessManagerContact {
  firstName?: string;
  lastName?: string;
  email: string; // Required by BusinessManager
  phone?: string;
  company?: string;
  title?: string; // Job title
  contactType?: "primary" | "secondary" | "billing" | "shipping" | "other";
  notes?: string;
  customFields?: Record<string, unknown>;
  externalId?: string;
  tagIds?: number[];
}

/**
 * Customer payload — matches POST /api/webhooks/crm/:businessId/customers
 */
export interface BusinessManagerCustomer {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  externalId?: string;
  tagIds?: number[];
}

/**
 * Activity payload — matches POST /api/webhooks/crm/:businessId/activities
 * Required: entityType, entityId, activityType, subject
 */
export interface BusinessManagerActivity {
  entityType: "lead" | "contact" | "opportunity" | "customer";
  entityId: number; // BusinessManager entity ID
  activityType: "call" | "email" | "meeting" | "task" | "note";
  subject: string;
  createdBy: number; // BusinessManager user ID (required)
  description?: string;
  activityDate?: string; // ISO 8601
  dueDate?: string; // ISO 8601
  status?: "pending" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
  assignedTo?: number; // BusinessManager user ID
  externalId?: string;
}

/**
 * Opportunity payload — matches POST /api/webhooks/crm/:businessId/opportunities
 */
export interface BusinessManagerOpportunity {
  name: string;
  value?: number;
  currency?: string;
  probability?: number;
  status?: "new" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  source?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  externalId?: string;
  leadId?: number;
  contactId?: number;
}

/**
 * Inbound webhook event from BusinessManager → Aura
 */
export interface BusinessManagerWebhookEvent {
  event:
    | "lead.converted"
    | "lead.updated"
    | "opportunity.closed_won"
    | "account.updated"
    | "activity.created";
  data: Record<string, unknown>;
  timestamp: string;
  source: string;
}
