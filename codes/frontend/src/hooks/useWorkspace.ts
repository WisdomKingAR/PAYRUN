import { useCallback, useEffect, useState } from 'react';
import type { Business } from '../types';
import { ensureBusiness } from '../lib/payrunApi';
import { useAuthStore } from '../store/useAuthStore';
import { getErrorMessage } from '../utils/errors';

export const useWorkspace = () => {
  const { user } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setBusiness(await ensureBusiness(user));
    } catch (caught) {
      setError(getErrorMessage(caught, 'Could not load workspace.'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { business, loading, error, refresh, setBusiness };
};
