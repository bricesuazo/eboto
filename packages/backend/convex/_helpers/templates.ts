export interface PositionTemplate {
  label: string;
  positions: readonly string[];
}

export const POSITION_TEMPLATES: Record<string, PositionTemplate> = {
  none: { label: 'No template', positions: [] },
  ssg: {
    label: 'Supreme Student Government (SSG)',
    positions: [
      'President',
      'Vice President',
      'Secretary',
      'Treasurer',
      'Auditor',
      'Public Information Officer',
      'Peace Officer',
    ],
  },
};

export function getTemplatePositions(templateId: string): readonly string[] {
  return POSITION_TEMPLATES[templateId]?.positions ?? [];
}
