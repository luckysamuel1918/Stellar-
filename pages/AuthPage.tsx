





import React, { useState, useEffect } from 'react';
// FIX: Changed react-router-dom import to a named import to fix module resolution errors.
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, getUserByAccountNumber, getUserData } from '../services/firebase';
import SignupWizard from '../components/SignupWizard';
import { useAuth } from '../App';

const AuthPage: React.FC = () => {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialIsLogin = new URLSearchParams(location.search).get('action') !== 'signup';
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  useEffect(() => {
    if (!loading && user && userData) {
      navigate(userData.isAdmin ? '/admin-dashboard' : '/user-dashboard', { replace: true });
    }
  }, [user, userData, loading, navigate]);

  // Show a loading screen while checking for an active session to prevent form flicker
  if (loading || (user && userData)) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p>Loading...</p></div>;
  }

  if (!isLogin) {
    return <SignupWizard onLoginSwitch={() => setIsLogin(true)} />;
  }

  return <LoginForm onSignupSwitch={() => setIsLogin(false)} />;
};

const LoginForm: React.FC<{ onSignupSwitch: () => void }> = ({ onSignupSwitch }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userEmail = identifier;
      
      // Check if identifier is an account number (10 digits)
      if (!identifier.includes('@') && /^\d{10}$/.test(identifier)) {
        const userProfile = await getUserByAccountNumber(identifier);
        if (userProfile) {
          if (userProfile.isAdmin) {
            setError("Admin accounts should use the admin sign-in page.");
            setLoading(false);
            return;
          }
          userEmail = userProfile.email;
        } else {
          setError("Invalid account number or password.");
          setLoading(false);
          return;
        }
      }

      const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
      const profile = await getUserData(userCredential.user!.uid);

      if (profile && profile.isAdmin) {
        setError('Admin accounts should use the admin sign-in page.');
        await auth.signOut();
      } else {
        navigate('/user-dashboard'); // Redirect to user dashboard on success
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError("Invalid email/account number or password.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-westcoast-bg dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-westcoast-dark dark:text-white">Sign In</h2>
            <p className="mt-2 text-sm text-westcoast-text-light dark:text-gray-300">
                Please use your registered email/account number and password.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">
              Email or Account Number
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="min-h-[20px]">
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-westcoast-blue disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
          <div className="text-sm text-center">
            <button type="button" onClick={onSignupSwitch} className="font-medium text-westcoast-blue hover:underline">
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;