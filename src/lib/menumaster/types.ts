// ---------------------------------------------------------------------------
// MenuMaster CRM Integration Types
// ---------------------------------------------------------------------------

export interface MenuMasterConfig {
  apiUrl: string;
  apiToken: string;
  businessId: string;
  webhookSecret: string;
}

export interface MenuMasterLead {
  externalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status?: "new" | "contacted" | "qualified" | "converted" | "lost";
  dealerId?: string;
  dealerName?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface MenuMasterAccount {
  externalId?: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
  dealerTier?: string;
  status?: "active" | "inactive" | "suspended";
  metadata?: Record<string, unknown>;
}

export interface MenuMasterActivity {
  leadExternalId?: string;
  accountExternalId?: string;
  type:
    | "sample_given"
    | "sample_returned"
    | "meeting"
    | "call"
    | "email"
    | "note"
    | "demo"
    | "follow_up";
  subject: string;
  description?: string;
  dealerId?: string;
  dealerName?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface MenuMasterWebhookEvent {
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
