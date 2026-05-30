import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getScrollKey, readScrollPosition, saveCurrentScrollPosition, shouldRestoreRoute } from '../utils/scrollMemory';

export const ScrollMemory = () => {
  const location = useLocation();
  const scrollKey = getScrollKey(location.pathname, location.search);
  const shouldRestore = shouldRestoreRoute(location.pathname);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

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

    let attempts = 0;
    let timeout = 0;

    const restorePosition = () => {
      attempts += 1;
      window.scrollTo(position.x, position.y);

      const canReachPosition = document.documentElement.scrollHeight >= position.y + window.innerHeight;
      const closeEnough = Math.abs(window.scrollY - position.y) < 8;

      if ((canReachPosition && closeEnough) || attempts >= 45) return;

      timeout = window.setTimeout(restorePosition, 100);
    };

    timeout = window.setTimeout(restorePosition, 0);

    return () => window.clearTimeout(timeout);
  }, [scrollKey, shouldRestore]);

  return null;
};
