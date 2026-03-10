import type { IntegrationHandler } from './types';
import { smartleadJustcallHandler } from '@/lib/integrations/smartlead-justcall/handler';

const handlers = new Map<string, IntegrationHandler>();

// Register all integration handlers
handlers.set(smartleadJustcallHandler.slug, smartleadJustcallHandler);

export function getHandler(slug: string): IntegrationHandler | undefined {
  return handlers.get(slug);
}

export function getAllHandlers(): IntegrationHandler[] {
  return Array.from(handlers.values());
}
