import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';

// Hardcoded admin UID
const ADMIN_UID = '83fRTz3YqgMkjz646AJ1GO6I8Kg1';

export function useAdminGuard() {
  const { user } = useAuth()!;
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    if (user.uid === ADMIN_UID) {
      setIsAdmin(true);
    } else {
      navigate('/', { replace: true });
    }
    setChecking(false);
  }, [user, navigate]);

  return { isAdmin, checking };
}
