import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../state/store';

const AuthWrapper = ({ children }) => {
  const { isAuthenticated, isOnboardingCompleted } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOnboardingCompleted) {
      navigate('/');
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isOnboardingCompleted, navigate]);

  if (!isOnboardingCompleted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-temple flex items-center justify-center">
        <div className="card-divine p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthWrapper;