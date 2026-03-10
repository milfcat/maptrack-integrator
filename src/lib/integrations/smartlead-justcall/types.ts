export interface SmartLeadEmailSentWebhook {
  webhook_id?: string;
  webhook_name?: string;
  sl_email_lead_id: string | number;
  sl_email_lead_map_id?: string;
  webhook_url?: string;
  stats_id?: string;
  event_type: string;
  event_timestamp?: string;
  time_sent?: string;
  from_email: string;
  to_email: string;
  to_name: string;
  subject?: string;
  campaign_id: string | number;
  campaign_name: string;
  campaign_status?: string;
  sequence_number?: string;
  sent_message?: {
    message_id?: string;
    html?: string;
    text?: string;
    time?: string;
  };
  message_id?: string;
  client_id?: string;
  app_url?: string;
  ui_master_inbox_link?: string;
  secret_key?: string;
  description?: string;
  metadata?: {
    webhook_created_at?: string;
  };
}
