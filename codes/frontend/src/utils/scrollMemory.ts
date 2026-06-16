const storagePrefix = 'payrun-scroll';
const restoredRoutes = ['/dashboard', '/employees', '/payroll/run', '/payroll/history', '/settings'];
const lastKnownPositions = new Map<string, { x: number; y: number }>();

export const shouldRestoreRoute = (pathname: string) =>
  restoredRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export const getScrollKey = (pathname: string, search: string) => `${storagePrefix}:${pathname}${search}`;

export const readScrollPosition = (key: string) => {
  const cached = lastKnownPositions.get(key);
  if (cached) return cached;

  const stored = window.sessionStorage.getItem(key);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as { x?: number; y?: number };
    return {
      x: Number.isFinite(parsed.x) ? Number(parsed.x) : 0,
      y: Number.isFinite(parsed.y) ? Number(parsed.y) : 0,
    };
  } catch {
    return null;
  }
};

export const saveCurrentScrollPosition = (pathname: string, search = '') => {
  if (!shouldRestoreRoute(pathname)) return;

  const key = getScrollKey(pathname, search);
  const position = {
    x: window.scrollX,
    y: window.scrollY,
  };

  lastKnownPositions.set(key, position);
  window.sessionStorage.setItem(
    key,
    JSON.stringify(position),
  );
};
