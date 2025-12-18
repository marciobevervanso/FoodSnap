import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { User } from '../types';

export const ProtectedRoute: React.FC<React.PropsWithChildren<{
  user: User | null;
  isLoading: boolean;
  requiredAdmin?: boolean;
}>> = ({ children, user, isLoading, requiredAdmin = false }) => {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (requiredAdmin && !user.is_admin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
