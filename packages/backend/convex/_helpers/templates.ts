/**
 * Position templates surfaced in the "create election" flow.
 * Keyed by template id ("none", "ssg", …).
 */
export const POSITION_TEMPLATES: Record<string, readonly string[]> = {
  none: [],
  ssg: [
    'President',
    'Vice President',
    'Secretary',
    'Treasurer',
    'Auditor',
    'Public Information Officer',
    'Peace Officer',
  ],
};

export function getTemplatePositions(templateId: string): readonly string[] {
  return POSITION_TEMPLATES[templateId] ?? [];
}
