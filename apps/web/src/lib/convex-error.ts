export function getConvexErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== 'object') return undefined;

  const data = (err as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return undefined;

  const code = (data as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}
