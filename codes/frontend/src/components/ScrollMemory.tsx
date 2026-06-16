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

    let settled = false;
    let rafId = 0;

    // Create observer first so tryRestore can reference it
    const observer = new MutationObserver(() => {
      const tallEnough = document.documentElement.scrollHeight >= position.y + window.innerHeight;
      if (tallEnough && !settled) {
        window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(tryRestore);
      }
    });

    const tryRestore = () => {
      if (settled) return;
      window.scrollTo(position.x, position.y);
      const closeEnough = Math.abs(window.scrollY - position.y) < 8;
      if (closeEnough) { settled = true; observer.disconnect(); }
    };

    // Start observing DOM changes (e.g. async form content loading)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Attempt restore immediately
    tryRestore();

    // Safety timeout — give up after 8 seconds
    const safetyTimeout = window.setTimeout(() => {
      if (!settled) { settled = true; observer.disconnect(); }
    }, 8000);

    return () => {
      settled = true;
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(safetyTimeout);
    };
  }, [scrollKey, shouldRestore]);

  return null;
};
