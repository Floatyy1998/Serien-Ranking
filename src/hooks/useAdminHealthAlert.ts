import { useEffect } from 'react';
import { dbRef } from '../services/db/ref';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../lib/toast';
import { ADMIN_UID } from '../config/admin';

export function useAdminHealthAlert() {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) return;

    const IGNORED_TYPES = new Set(['missing-all-genre', 'missing-all-rating']);

    const ref = dbRef('admin/dataIntegrityIssues');
    ref.once('value').then((snap) => {
      const data = snap.val();
      if (!data) return;

      const totalIssues = Object.values(data).reduce((sum: number, u: unknown) => {
        const issues = (u as { issues?: { type?: string }[] }).issues || [];
        return sum + issues.filter((i) => !IGNORED_TYPES.has(i.type || '')).length;
      }, 0);

      if (totalIssues > 0) {
        showToast(`⚠ ${totalIssues} Data Health Probleme`, 3000);
      }
    });
  }, [user]);
}
