export interface JustCallAIReportWebhook {
  event?: string;
  call_id?: string | number;
  agent_id?: string | number;
  contact_id?: string | number;
  phone_number?: string;
  direction?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  timestamp?: string;
}
