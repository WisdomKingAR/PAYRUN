export const getErrorMessage = (caught: unknown, fallback: string) => {
  if (caught instanceof Error && caught.message) return caught.message;

  if (caught && typeof caught === 'object') {
    const record = caught as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
      .map(String)
      .filter(Boolean);

    if (parts.length > 0) return parts.join(' ');
  }

  return fallback;
};
