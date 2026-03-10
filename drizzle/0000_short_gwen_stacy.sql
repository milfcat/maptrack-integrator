CREATE TABLE "api_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"service" text NOT NULL,
	"credential_type" text NOT NULL,
	"encrypted_value" text,
	"iv" text,
	"registry_key_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_key_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"service" text NOT NULL,
	"credential_type" text NOT NULL,
	"encrypted_value" text NOT NULL,
	"iv" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "data_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_event_id" integer NOT NULL,
	"integration_id" integer NOT NULL,
	"step" text NOT NULL,
	"direction" text NOT NULL,
	"service" text NOT NULL,
	"request_url" text,
	"request_method" text,
	"request_body" jsonb,
	"response_status" integer,
	"response_body" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"source_field" text NOT NULL,
	"destination_field" text NOT NULL,
	"transform" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" text
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"source_service" text NOT NULL,
	"destination_service" text NOT NULL,
	"source_config" jsonb,
	"destination_config" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"locked_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"source_service" text NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	"deduplication_key" text,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_registry_key_id_api_key_registry_id_fk" FOREIGN KEY ("registry_key_id") REFERENCES "public"."api_key_registry"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfers" ADD CONSTRAINT "data_transfers_webhook_event_id_webhook_events_id_fk" FOREIGN KEY ("webhook_event_id") REFERENCES "public"."webhook_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_transfers" ADD CONSTRAINT "data_transfers_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_mappings" ADD CONSTRAINT "field_mappings_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_credentials_unique" ON "api_credentials" USING btree ("integration_id","service","credential_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_registry_service_type" ON "api_key_registry" USING btree ("service","credential_type");--> statement-breakpoint
CREATE INDEX "idx_data_transfers_webhook_event" ON "data_transfers" USING btree ("webhook_event_id");--> statement-breakpoint
CREATE INDEX "idx_data_transfers_integration_status" ON "data_transfers" USING btree ("integration_id","status");--> statement-breakpoint
CREATE INDEX "idx_field_mappings_integration" ON "field_mappings" USING btree ("integration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_integrations_slug" ON "integrations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_integrations_enabled" ON "integrations" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "idx_processing_jobs_status_type" ON "processing_jobs" USING btree ("status","type");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_integration_status" ON "webhook_events" USING btree ("integration_id","status");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_received_at" ON "webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_events_dedup" ON "webhook_events" USING btree ("integration_id","deduplication_key");