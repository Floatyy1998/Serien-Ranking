import { useEffect } from 'react';
import { showToast } from '../lib/toast';

export function useNetworkStatus(): void {
  useEffect(() => {
    const handleOffline = () => showToast('Keine Internetverbindung', 3000, 'error');
    const handleOnline = () => showToast('Wieder online', 1500, 'success');

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
}
