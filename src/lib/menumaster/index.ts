export type {
  MenuMasterConfig,
  MenuMasterLead,
  MenuMasterContact,
  MenuMasterCustomer,
  MenuMasterActivity,
  MenuMasterOpportunity,
  MenuMasterWebhookEvent,
} from "./types";

export {
  syncLeadToMenuMaster,
  updateLeadInMenuMaster,
  getLeadsFromMenuMaster,
  syncContactToMenuMaster,
  updateContactInMenuMaster,
  syncCustomerToMenuMaster,
  updateCustomerInMenuMaster,
  logActivityToMenuMaster,
  logSampleActivity,
  syncOpportunityToMenuMaster,
  updateOpportunityInMenuMaster,
  checkMenuMasterHealth,
} from "./client";
