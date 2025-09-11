





import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
// FIX: Changed react-router-dom import to a named import to fix module resolution errors.
import { Routes, Route, Link, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { auth, User, getUserData } from './services/firebase';
import { UserProfile } from './types';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { WestcoastLogo } from './components/icons';
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
  const navigate = useNavigate();

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
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                    <Link to="/">
                        <WestcoastLogo />
                    </Link>
                    <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-westcoast-text-light">
                        {navLinks.map(link => (
                            <a key={link.name} href={link.href} className="hover:text-westcoast-blue transition-colors flex items-center">
                                {link.icon}{link.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                    {user ? (
                         <div className="flex items-center space-x-2">
                             <button onClick={handleDashboardRedirect} className="bg-westcoast-blue text-white font-semibold px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity flex items-center">
                                <UserIcon size={16} className="mr-2"/>
                                <span>Dashboard</span>
                            </button>
                            <button onClick={signOut} className="bg-gray-200 text-westcoast-text-dark font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-300 transition-colors flex items-center">
                                <LogOut size={16} className="mr-2"/>
                                <span>Log Out</span>
                            </button>
                        </div>
                    ) : (
                        <>
                         <button onClick={() => navigate('/user')} className="text-westcoast-dark font-semibold px-4 py-2 rounded-full text-sm hover:bg-gray-100 transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => navigate('/user')} className="bg-westcoast-dark text-white font-semibold px-4 py-2 rounded-full text-sm hover:bg-westcoast-blue transition-colors">
                            Open an Account
                        </button>
                        </>
                    )}
                </div>
                 <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
                        <Menu className="h-6 w-6 text-westcoast-dark" />
                    </button>
                </div>
            </nav>

             {isMobileMenuOpen && (
                 <div className="fixed inset-0 bg-white z-50 p-4 md:hidden">
                    <div className="flex justify-between items-center mb-8">
                        <WestcoastLogo />
                        <button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
                            <X className="h-6 w-6 text-westcoast-dark" />
                        </button>
                    </div>
                    <div className="flex flex-col space-y-4">
                        {navLinks.map(link => (
                             <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-westcoast-text-dark hover:text-westcoast-blue transition-colors flex items-center p-2 rounded-md">
                                {link.icon}{link.name}
                            </a>
                        ))}
                        <hr className="my-4" />
                        {user ? (
                            <div className="flex flex-col space-y-3">
                                <button onClick={() => { handleDashboardRedirect(); setIsMobileMenuOpen(false); }} className="bg-westcoast-blue text-white font-semibold px-4 py-3 rounded-full text-base hover:opacity-90 transition-opacity flex items-center justify-center">
                                    <UserIcon size={16} className="mr-2"/>
                                    <span>Dashboard</span>
                                </button>
                                <button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} className="bg-gray-200 text-westcoast-text-dark font-semibold px-4 py-3 rounded-full text-base hover:bg-gray-300 transition-colors flex items-center justify-center">
                                    <LogOut size={16} className="mr-2"/>
                                    <span>Log Out</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                <button onClick={() => { navigate('/user'); setIsMobileMenuOpen(false); }} className="bg-gray-100 text-westcoast-dark font-semibold px-4 py-3 rounded-full text-base hover:bg-gray-200 transition-colors">
                                    Sign In
                                </button>
                                <button onClick={() => { navigate('/user'); setIsMobileMenuOpen(false); }} className="bg-westcoast-dark text-white font-semibold px-4 py-3 rounded-full text-base hover:bg-westcoast-blue transition-colors">
                                    Open an Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

const Footer: React.FC = () => (
    <footer className="bg-westcoast-dark text-white">
        <div className="container mx-auto px-4 pt-16 pb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                <div className="col-span-2 lg:col-span-1">
                    <WestcoastLogo className="text-white" />
                    <p className="text-sm text-gray-400 mt-4">Your Financial Future, Elevated.</p>
                </div>
                {[{title: 'Personal', items: ['Checking', 'Savings', 'Credit Cards', 'Personal Loans']},
                  {title: 'Investing', items: ['Stocks & ETFs', 'Managed Portfolios', 'Retirement', 'Pricing']},
                  {title: 'Resources', items: ['Market News', 'Blog', 'Support Center', 'Contact Us']},
                  {title: 'Company', items: ['About Us', 'Careers', 'Legal', 'Privacy Policy']}].map(section => (
                    <div key={section.title}>
                        <h3 className="font-semibold mb-4">{section.title}</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            {section.items.map(item => <li key={item}><a href="#" className="hover:text-westcoast-accent transition-colors">{item}</a></li>)}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
                 <p className="text-gray-400 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Westcoast Trust Bank. All rights reserved.</p>
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
            <Outlet />
        </main>
        <Footer />
    </div>
);

// --- ROUTING & PROTECTION ---
const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userData, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    if (user && userData && !userData.isAdmin) return <>{children}</>;
    return <Navigate to="/user" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, userData, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
    if (user && userData && userData.isAdmin) return <>{children}</>;
    return <Navigate to="/admin-login" replace />;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/user" element={<AuthPage />} />
                    <Route path="/admin-login" element={<AdminLoginPage />} />
                    <Route
                        path="/admin-dashboard"
                        element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
                    />
                </Route>
                
                <Route
                    path="/user-dashboard"
                    element={<UserRoute><UserDashboardPage /></UserRoute>}
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;