import type { FieldMapping } from '@/lib/engine/types';

export function formatE164AU(phone: string): string {
  if (!phone || phone === '--') return '';

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Already in E.164 format
  if (cleaned.startsWith('+')) return cleaned;

  // Australian number starting with 0
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+61' + cleaned.slice(1);
  }

  // Australian number without leading 0 (9 digits)
  if (cleaned.length === 9 && !cleaned.startsWith('0')) {
    return '+61' + cleaned;
  }

  // If it starts with 61 and is 11 digits, add +
  if (cleaned.startsWith('61') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  // Default: prepend + if it looks like a full international number
  if (cleaned.length >= 10) {
    return '+' + cleaned;
  }

  return cleaned;
}

export function applyTransform(
  value: string,
  transform: string | null
): string {
  if (!transform) return value;

  switch (transform) {
    case 'e164_au':
      return formatE164AU(value);
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'trim':
      return value.trim();
    default:
      return value;
  }
}

export function applyFieldMappings(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    let value = getNestedValue(source, mapping.sourceField);

    if (value === undefined || value === null || value === '') {
      if (mapping.isRequired && !mapping.defaultValue) {
        throw new Error(`Required field missing: ${mapping.sourceField}`);
      }
      value = mapping.defaultValue ?? '';
    }

    const stringValue = String(value);
    result[mapping.destinationField] = applyTransform(
      stringValue,
      mapping.transform
    );
  }

  return result;
}

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
