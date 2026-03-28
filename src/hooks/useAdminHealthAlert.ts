import { useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../AuthContext';
import { showToast } from '../lib/toast';

const ADMIN_UID = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';

export function useAdminHealthAlert() {
  const { user } = useAuth() || {};

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) return;

    const IGNORED_TYPES = new Set(['missing-all-genre', 'missing-all-rating']);

    const ref = firebase.database().ref('admin/dataIntegrityIssues');
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
