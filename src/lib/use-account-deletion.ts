'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { accountRequest } from './account-management';

export function useAccountDeletion() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    setEnabled(false);
    if (user) accountRequest<{ enabled: boolean }>('availability')
      .then(result => { if (active) setEnabled(result.enabled === true); })
      .catch(() => { if (active) setEnabled(false); });
    return () => { active = false; };
  }, [user?.uid]);
  return enabled;
}
