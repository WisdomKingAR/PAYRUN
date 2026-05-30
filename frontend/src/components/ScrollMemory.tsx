import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getScrollKey, readScrollPosition, saveCurrentScrollPosition, shouldRestoreRoute } from '../utils/scrollMemory';

export const ScrollMemory = () => {
  const location = useLocation();
  const scrollKey = getScrollKey(location.pathname, location.search);
  const shouldRestore = shouldRestoreRoute(location.pathname);

  useEffect(() => {
    if (!shouldRestore) return undefined;

    let frame = 0;

    const savePosition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => saveCurrentScrollPosition(location.pathname, location.search));
    };

    window.addEventListener('scroll', savePosition, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', savePosition);
      saveCurrentScrollPosition(location.pathname, location.search);
    };
  }, [location.pathname, location.search, shouldRestore]);

  useLayoutEffect(() => {
    if (!shouldRestore) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const position = readScrollPosition(scrollKey);
    if (!position) {
      window.scrollTo(0, 0);
      return undefined;
    }

    const timers = [0, 50, 150, 350, 700, 1200].map((delay) =>
      window.setTimeout(() => window.scrollTo(position.x, position.y), delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [scrollKey, shouldRestore]);

  return null;
};
