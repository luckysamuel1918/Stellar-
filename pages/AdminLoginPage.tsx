import React, { useState, useEffect } from 'react';
// FIX: Changed react-router-dom import to a named import to fix module resolution errors.
import { useNavigate } from 'react-router-dom';
import { auth, getUserData, updateUserProfile, createUserProfileDocument } from '../services/firebase';
import { useAuth } from '../App';

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userData, loading: authLoading, refreshUserData } = useAuth();

  useEffect(() => {
    // Redirect only if the logged-in user is an admin.
    // This allows a non-admin user to see this page and attempt to log in as an admin.
    if (!authLoading && userData?.isAdmin) {
      navigate('/admin-dashboard', { replace: true });
    }
  }, [userData, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const profile = await getUserData(userCredential.user.uid);

      if (profile && profile.isAdmin) {
          navigate('/admin-dashboard');
      } else if (email === 'admin@westcoasttrust.com') {
          // This is the designated admin email. If their profile is missing or not marked as admin,
          // we will correct it on successful login.
          if (!profile) {
              await createUserProfileDocument(userCredential.user, {
                  fullName: 'Admin',
                  phone: '000-000-0000',
                  address: '123 Admin Way',
                  state: 'CA',
                  country: 'United States',
                  currencyCode: 'USD',
                  accountNumber: '0000000000',
                  pin: '0000',
              });
          } else {
              await updateUserProfile(userCredential.user.uid, { isAdmin: true });
          }
          // Refresh user data in the auth context to avoid a login loop
          await refreshUserData();
          navigate('/admin-dashboard');
      } else {
          setError('Access denied. Not an admin account.');
          await auth.signOut(); // Sign out non-admin user
      }
    } catch (err: any) {
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  // Show a loading screen while auth state is being checked, or if the user is an admin (who will be redirected).
  // This prevents the form from flashing briefly for a logged-in admin.
  if (authLoading || userData?.isAdmin) {
      return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><p>Loading...</p></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-westcoast-bg">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-westcoast-dark">Admin Sign In</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-westcoast-text-light">
              Admin Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-westcoast-text-light">
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
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-westcoast-blue disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;