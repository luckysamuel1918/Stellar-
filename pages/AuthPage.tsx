import React, { useState } from 'react';
// FIX: Changed react-router-dom import to namespace import to fix module resolution errors.
import * as ReactRouterDom from 'react-router-dom';
import { auth } from '../services/firebase';
import SignupWizard from '../components/SignupWizard';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isLogin) {
    return <SignupWizard onLoginSwitch={() => setIsLogin(true)} />;
  }

  return <LoginForm onSignupSwitch={() => setIsLogin(false)} />;
};

const LoginForm: React.FC<{ onSignupSwitch: () => void }> = ({ onSignupSwitch }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = ReactRouterDom.useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      // Logic in App.tsx will redirect based on role
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-stellar-bg">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-stellar-dark">Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stellar-text-light">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-stellar-blue focus:border-stellar-blue"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stellar-text-light">
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
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-stellar-blue focus:border-stellar-blue"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-bold text-white bg-stellar-blue rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stellar-blue disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
          <div className="text-sm text-center">
            <button type="button" onClick={onSignupSwitch} className="font-medium text-stellar-blue hover:underline">
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
