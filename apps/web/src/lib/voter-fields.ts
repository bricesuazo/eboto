import type { VoterFieldType } from '@eboto/backend/schema';

export const FIELD_TYPES: { value: VoterFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
];

export const isVoterFieldType = (v: unknown): v is VoterFieldType =>
  v === 'text' || v === 'number' || v === 'boolean' || v === 'date';

export const htmlInputTypeFor = (type: VoterFieldType) => {
  switch (type) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'text':
    case 'boolean':
    default:
      return 'text';
  }
};

const VOTER_FIELD_EXAMPLES: Record<VoterFieldType, readonly [string, string]> =
  {
    text: ['Sample', 'Example'],
    number: ['3', '4'],
    boolean: ['true', 'false'],
    date: ['2026-12-01', '2026-12-31'],
  };

export const sampleValueForType = (
  type: VoterFieldType,
  rowIndex: number,
): string => VOTER_FIELD_EXAMPLES[type][rowIndex === 0 ? 0 : 1];

export const SAMPLE_VOTER_EMAILS = [
  'jane@school.edu',
  'john@school.edu',
] as const;

const NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const validateFieldValue = (
  type: VoterFieldType,
  rawValue: string,
): string | null => {
  const value = rawValue.trim();
  if (!value) return null;
  switch (type) {
    case 'number':
      if (!NUMBER_RE.test(value) || Number.isNaN(Number(value))) {
        return 'Must be a number';
      }
      return null;
    case 'boolean': {
      const lower = value.toLowerCase();
      if (lower !== 'true' && lower !== 'false') {
        return 'Must be "true" or "false"';
      }
      return null;
    }
    case 'date': {
      if (!DATE_RE.test(value)) return 'Use format YYYY-MM-DD';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return 'Invalid date';
      return null;
    }
    case 'text':
    default:
      return null;
  }
};
