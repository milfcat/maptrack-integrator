export interface DecryptedCredentials {
  [key: string]: string; // e.g., { api_key: "xxx", api_secret: "yyy", webhook_secret: "zzz" }
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  eventType?: string;
  deduplicationKey?: string;
}

export interface EnrichedData {
  original: Record<string, unknown>;
  enriched: Record<string, unknown>;
}

export interface TransformedData {
  [key: string]: unknown;
}

export interface PushResult {
  success: boolean;
  responseStatus?: number;
  responseBody?: Record<string, unknown>;
  error?: string;
}

export interface FieldMapping {
  sourceField: string;
  destinationField: string;
  transform: string | null;
  isRequired: boolean;
  defaultValue: string | null;
}

export interface IntegrationHandler {
  slug: string;
  sourceService: string;
  destinationService: string;

  validateWebhook(
    payload: unknown,
    headers: Record<string, string>,
    credentials: DecryptedCredentials
  ): WebhookValidationResult;

  enrich(
    payload: unknown,
    credentials: DecryptedCredentials
  ): Promise<EnrichedData>;

  transform(
    enrichedData: EnrichedData,
    fieldMappings: FieldMapping[]
  ): TransformedData;

  push(
    transformedData: TransformedData,
    credentials: DecryptedCredentials,
    destinationConfig: Record<string, unknown>
  ): Promise<PushResult>;
}
