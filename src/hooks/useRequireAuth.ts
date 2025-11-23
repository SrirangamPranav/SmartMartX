import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useRequireAuth = (requiredRole?: 'customer' | 'retailer' | 'wholesaler') => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth/login');
      } else if (requiredRole && !roles.includes(requiredRole)) {
        navigate('/');
      }
    }
  }, [user, roles, loading, requiredRole, navigate]);

  return { user, roles, loading };
};
