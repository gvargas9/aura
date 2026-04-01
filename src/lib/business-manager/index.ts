export type {
  BusinessManagerConfig,
  BusinessManagerLead,
  BusinessManagerContact,
  BusinessManagerCustomer,
  BusinessManagerActivity,
  BusinessManagerOpportunity,
  BusinessManagerWebhookEvent,
} from "./types";

export {
  syncLeadToBusinessManager,
  updateLeadInBusinessManager,
  getLeadsFromBusinessManager,
  syncContactToBusinessManager,
  updateContactInBusinessManager,
  syncCustomerToBusinessManager,
  updateCustomerInBusinessManager,
  logActivityToBusinessManager,
  logSampleActivity,
  syncOpportunityToBusinessManager,
  updateOpportunityInBusinessManager,
  checkBusinessManagerHealth,
} from "./client";
