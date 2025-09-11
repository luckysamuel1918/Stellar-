import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
// FIX: Changed react-router-dom import to namespace import to fix module resolution errors.
import * as ReactRouterDom from 'react-router-dom';
import { auth, User, getUserData } from './services/firebase';
import { UserProfile } from './types';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { StellarLogo } from './components/icons';
import { Menu, Search, User as UserIcon, LogOut, X, Facebook, Twitter, Instagram, Youtube, Briefcase, Landmark } from 'lucide-react';

// --- AUTH CONTEXT ---
interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
  signOut: () => void;
}
const AuthContext = createContext<AuthContextType>({ user: null, userData: null, loading: true, signOut: () => {} });

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = ReactRouterDom.useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const profile = await getUserData(user.uid);
        setUserData(profile);
      } else {
        setUserData(null);
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const signOut = useCallback(async () => {
      try {
          await auth.signOut();
          setUserData(null);
          navigate('/');
      } catch (error) {
          console.error("Sign out error", error);
      }
  }, [navigate]);

  const value = { user, userData, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// --- LAYOUT COMPONENTS ---
const Header: React.FC = () => {
    const { user, userData, signOut } = useAuth();
    const navigate = ReactRouterDom.useNavigate();

    const handleDashboardRedirect = () => {
      if(user && userData) {
          navigate(userData.isAdmin ? '/admin-dashboard' : '/user-dashboard');
      }
    }
    
    const navLinks = [
        { name: "Banking", href: "#", icon: <Landmark size={16} className="mr-2" /> },
        { name: "Investing", href: "#", icon: <Briefcase size={16} className="mr-2" /> },
        { name: "About Us", href: "#" },
        { name: "Support", href: "#" },
    ];

    return (
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-8">
                    <ReactRouterDom.Link to="/">
                        <StellarLogo />
                    </ReactRouterDom.Link>
                    <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-stellar-text-light">
                        {navLinks.map(link => (
                            <a key={link.name} href={link.href} className="hover:text-stellar-blue transition-colors flex items-center">
                                {link.icon}{link.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {user ? (
                         <div className="flex items-center space-x-2">
                             <button onClick={handleDashboardRedirect} className="bg-stellar-blue text-white font-semibold px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity flex items-center">
                                <UserIcon size={16} className="mr-2"/>
                                <span>Dashboard</span>
                            </button>
                            <button onClick={signOut} className="bg-gray-200 text-stellar-text-dark font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition-colors flex items-center">
                                <LogOut size={16} className="mr-2"/>
                                <span>Log Out</span>
                            </button>
                        </div>
                    ) : (
                        <>
                         <button onClick={() => navigate('/user')} className="text-stellar-dark font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => navigate('/user')} className="bg-stellar-dark text-white font-semibold px-4 py-2 rounded-full text-sm hover:bg-stellar-blue transition-colors">
                            Open an Account
                        </button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

const Footer: React.FC = () => (
    <footer className="bg-stellar-dark text-white">
        <div className="container mx-auto px-4 pt-16 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-1">
                    <StellarLogo className="text-white" />
                    <p className="text-sm text-gray-400 mt-4">Your Financial Future, Elevated.</p>
                </div>
                {[{title: 'Personal', items: ['Checking', 'Savings', 'Credit Cards', 'Personal Loans']},
                  {title: 'Investing', items: ['Stocks & ETFs', 'Managed Portfolios', 'Retirement', 'Pricing']},
                  {title: 'Resources', items: ['Market News', 'Blog', 'Support Center', 'Contact Us']},
                  {title: 'Company', items: ['About Us', 'Careers', 'Legal', 'Privacy Policy']}].map(section => (
                    <div key={section.title}>
                        <h3 className="font-semibold mb-4">{section.title}</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            {section.items.map(item => <li key={item}><a href="#" className="hover:text-stellar-accent transition-colors">{item}</a></li>)}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
                 <p className="text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Stellar Bank & Capital. All rights reserved.</p>
                 <div className="flex items-center space-x-5">
                    <a href="#" className="text-gray-400 hover:text-white"><Twitter size={20}/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><Facebook size={20}/></a>
                    <a href="#" className="text-gray-400 hover:text-white"><Instagram size={20}/></a>
                 </div>
            </div>
        </div>
    </footer>
);


const AppLayout: React.FC = () => (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
            <ReactRouterDom.Outlet />
        </main>
        <Footer />
    </div>
);

// --- ROUTING & PROTECTION ---
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userData, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    if (user && userData && !userData.isAdmin) return <>{children}</>;
    return <ReactRouterDom.Navigate to="/user" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userData, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    if (user && userData && userData.isAdmin) return <>{children}</>;
    return <ReactRouterDom.Navigate to="/admin-login" replace />;
};

const App: React.FC = () => {
    return (
        <ReactRouterDom.HashRouter>
            <AuthProvider>
                <ReactRouterDom.Routes>
                    <ReactRouterDom.Route element={<AppLayout />}>
                        <ReactRouterDom.Route path="/" element={<HomePage />} />
                        <ReactRouterDom.Route path="/user" element={<AuthPage />} />
                        <ReactRouterDom.Route path="/admin-login" element={<AdminLoginPage />} />
                        <ReactRouterDom.Route
                            path="/user-dashboard"
                            element={<UserRoute><UserDashboardPage /></UserRoute>}
                        />
                         <ReactRouterDom.Route
                            path="/admin-dashboard"
                            element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
                        />
                    </ReactRouterDom.Route>
                </ReactRouterDom.Routes>
            </AuthProvider>
        </ReactRouterDom.HashRouter>
    );
}

export default App;
