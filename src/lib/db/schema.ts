import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const integrations = pgTable(
  'integrations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    sourceService: text('source_service').notNull(),
    destinationService: text('destination_service').notNull(),
    sourceConfig: jsonb('source_config'),
    destinationConfig: jsonb('destination_config'),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    uniqueIndex('idx_integrations_slug').on(table.slug),
    index('idx_integrations_enabled').on(table.enabled),
  ]
);

export const apiCredentials = pgTable(
  'api_credentials',
  {
    id: serial('id').primaryKey(),
    integrationId: integer('integration_id')
      .references(() => integrations.id)
      .notNull(),
    service: text('service').notNull(),
    credentialType: text('credential_type').notNull(),
    encryptedValue: text('encrypted_value').notNull(),
    iv: text('iv').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at'),
  },
  (table) => [
    uniqueIndex('idx_credentials_unique').on(
      table.integrationId,
      table.service,
      table.credentialType
    ),
  ]
);

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: serial('id').primaryKey(),
    integrationId: integer('integration_id')
      .references(() => integrations.id)
      .notNull(),
    eventType: text('event_type').notNull(),
    sourceService: text('source_service').notNull(),
    rawPayload: jsonb('raw_payload').notNull(),
    status: text('status').default('received').notNull(),
    error: text('error'),
    deduplicationKey: text('deduplication_key'),
    receivedAt: timestamp('received_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => [
    index('idx_webhook_events_integration_status').on(
      table.integrationId,
      table.status
    ),
    index('idx_webhook_events_received_at').on(table.receivedAt),
    index('idx_webhook_events_dedup').on(
      table.integrationId,
      table.deduplicationKey
    ),
  ]
);

export const dataTransfers = pgTable(
  'data_transfers',
  {
    id: serial('id').primaryKey(),
    webhookEventId: integer('webhook_event_id')
      .references(() => webhookEvents.id)
      .notNull(),
    integrationId: integer('integration_id')
      .references(() => integrations.id)
      .notNull(),
    step: text('step').notNull(),
    direction: text('direction').notNull(),
    service: text('service').notNull(),
    requestUrl: text('request_url'),
    requestMethod: text('request_method'),
    requestBody: jsonb('request_body'),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    status: text('status').default('pending').notNull(),
    error: text('error'),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_data_transfers_webhook_event').on(table.webhookEventId),
    index('idx_data_transfers_integration_status').on(
      table.integrationId,
      table.status
    ),
  ]
);

export const processingJobs = pgTable(
  'processing_jobs',
  {
    id: serial('id').primaryKey(),
    type: text('type').notNull(),
    status: text('status').default('pending').notNull(),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    lockedAt: timestamp('locked_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_processing_jobs_status_type').on(table.status, table.type),
  ]
);

export const fieldMappings = pgTable(
  'field_mappings',
  {
    id: serial('id').primaryKey(),
    integrationId: integer('integration_id')
      .references(() => integrations.id)
      .notNull(),
    sourceField: text('source_field').notNull(),
    destinationField: text('destination_field').notNull(),
    transform: text('transform'),
    isRequired: boolean('is_required').default(false).notNull(),
    defaultValue: text('default_value'),
  },
  (table) => [
    index('idx_field_mappings_integration').on(table.integrationId),
  ]
);
