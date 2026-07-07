import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_UID } from '../../config/admin';

export function useAdminGuard() {
  const { user } = useAuth() || {};
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
