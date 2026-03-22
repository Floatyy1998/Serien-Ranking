import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

// Hardcoded admin UID
const ADMIN_UID = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';

export function useAdminGuard() {
  const { user } = useAuth()!;
  const navigate = useNavigate();

  const isAdmin = !!user && user.uid === ADMIN_UID;
  const checking = !user;

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return { isAdmin, checking };
}
