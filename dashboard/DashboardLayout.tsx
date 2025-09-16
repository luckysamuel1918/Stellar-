import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserProfile, Transaction, Loan } from '../types';
import { getUserData, getUserTransactions, getUserLoans, updateLoan, adminUpdateBalance } from '../services/firebase';
import { Home, User as UserIcon, CreditCard, Receipt, HandCoins, LogOut, Loader2, Bell, MessageSquare, Sparkles } from 'lucide-react';
import { WestcoastLogo } from '../components/icons';

import HomeView from './Home';
import CardsView from './Cards';
import PaymentsView from './Payments';
import LoanView from './Loan';
import ProfileView from './Profile';
import HistoryView from './History';
import AiAssistantView from './AiAssistant';
import { DomesticTransferModal, InternationalTransferModal, CheckDepositModal } from './components';

interface DashboardContextType {
    user: UserProfile | null;
    transactions: Transaction[];
    loans: Loan[];
    loading: boolean;
    fetchData: () => Promise<void>;
    openDomesticTransferModal: () => void;
    openInternationalTransferModal: () => void;
    openCheckDepositModal: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};

const DashboardLayout: React.FC = () => {
    const { user: authUser, signOut } = useAuth();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showInternationalModal, setShowInternationalModal] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const processOverdueLoans = useCallback(async (user: UserProfile, userLoans: Loan[]) => {
        const now = new Date();
        for (const loan of userLoans) {
            if (loan.status === 'approved' && loan.dueDate && loan.dueDate.toDate() < now) {
                if (user.balance >= (loan.totalOwed ?? 0)) {
                    await adminUpdateBalance(user, loan.totalOwed!, 'debit', 'Overdue loan repayment', undefined, undefined, 'loan_repayment');
                    await updateLoan(loan.id!, { status: 'paid' });
                } else {
                    await updateLoan(loan.id!, { status: 'overdue' });
                }
            }
        }
    }, []);

    const fetchData = useCallback(async (isInitial = false) => {
        if (authUser) {
            if(isInitial) setLoading(true);
            try {
                const profile = await getUserData(authUser.uid);
                if (profile) {
                    const [txs, userLoans] = await Promise.all([
                        getUserTransactions(authUser.uid),
                        getUserLoans(authUser.uid)
                    ]);
                    await processOverdueLoans(profile, userLoans);
                    
                    // Refetch data after processing loans
                    const [finalProfile, finalTxs, finalLoans] = await Promise.all([
                        getUserData(authUser.uid),
                        getUserTransactions(authUser.uid),
                        getUserLoans(authUser.uid)
                    ]);

                    setUserData(finalProfile);
                    setTransactions(finalTxs);
                    setLoans(finalLoans);
                } else {
                    console.error("User profile not found in database, logging out.");
                    signOut();
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                if(isInitial) setLoading(false);
            }
        }
    }, [authUser, processOverdueLoans, signOut]);
    
    useEffect(() => {
        fetchData(true);
    }, [authUser]); // Only run on authUser change

    const handleSuccess = () => {
        fetchData(false);
    };

    useEffect(() => {
        // Auto-logout for inactivity for all users.
        if (userData) {
            let inactivityTimer: number;

            const resetTimer = () => {
                clearTimeout(inactivityTimer);
                // Set a 5-minute timer. When it expires, call signOut.
                inactivityTimer = window.setTimeout(() => signOut(), 5 * 60 * 1000);
            };

            // List of events that indicate user activity.
            const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
            
            // Add event listeners for each activity type. Any of these will reset the timer.
            activityEvents.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
            
            // Initialize the timer when the component mounts.
            resetTimer();

            // Cleanup function to remove listeners and clear the timer when the component unmounts.
            return () => {
                clearTimeout(inactivityTimer);
                activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
            };
        }
    }, [userData, signOut]);
    
    const SuspendedAccountModal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
        <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white/90 dark:bg-gray-800/90 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">We locked your account due to unusual activity.</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-4">
                    Email us to unlock it. If you're a commercial client, reach out to your servicing team.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Please note that you will not be able to access your account information, documents or statements online or on the mobile app until we unlock your account.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <a href="mailto:support@westcoasttrusts.com" className="w-full px-4 py-3 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90 transition-opacity flex-1">
                        Email us
                    </a>
                    <button onClick={onLogout} className="w-full px-4 py-3 font-bold text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-1">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );

    const getActiveView = () => {
        const path = location.pathname.replace('/dashboard', '');
        if (path === '' || path === '/') return 'home';
        return path.split('/')[1] || 'home';
    };
    
    const activeView = getActiveView();
    
    const navItems = [
        { id: 'home', label: "Home", icon: <Home />, path: '/dashboard' },
        { id: 'cards', label: "Cards", icon: <CreditCard />, path: '/dashboard/cards' },
        { id: 'payments', label: "Payments", icon: <Receipt />, path: '/dashboard/payments' },
        { id: 'loan', label: "Loan", icon: <HandCoins />, path: '/dashboard/loan' },
        { id: 'ai', label: "AI Assistant", icon: <Sparkles />, path: '/dashboard/ai' },
        { id: 'me', label: "Me", icon: <UserIcon />, path: '/dashboard/me' },
    ];
    
    if (loading && !userData) {
        return <div className="flex justify-center items-center h-screen bg-westcoast-bg dark:bg-gray-900"><Loader2 className="animate-spin text-westcoast-blue w-8 h-8"/></div>;
    }

    const contextValue: DashboardContextType = {
        user: userData,
        transactions,
        loans,
        loading,
        fetchData: () => fetchData(false),
        openDomesticTransferModal: () => setShowTransferModal(true),
        openInternationalTransferModal: () => setShowInternationalModal(true),
        openCheckDepositModal: () => setShowDepositModal(true),
    };

    const pageTitle = (navItems.find(item => item.id === activeView) || { label: "Dashboard" }).label;

    return (
        <DashboardContext.Provider value={contextValue}>
            <div className="bg-westcoast-bg dark:bg-gray-900 min-h-screen font-sans">
                {userData && userData.isSuspended && <SuspendedAccountModal onLogout={signOut} />}
                <div className={`flex ${userData && userData.isSuspended ? 'blur-sm pointer-events-none' : ''}`}>
                    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen p-4 flex-shrink-0">
                        <div className="mb-8"><WestcoastLogo /></div>
                        <nav className="flex-grow space-y-2">
                            {navItems.map(item => (
                                <SideNavItem key={item.id} icon={item.icon} label={item.label} active={activeView === item.id} onClick={() => navigate(item.path)} />
                            ))}
                        </nav>
                        <div className="mt-auto">
                            <SideNavItem icon={<LogOut />} label={"Log Out"} active={false} onClick={signOut} />
                        </div>
                    </aside>
                    <main className="flex-1 pb-20 md:pb-0">
                         <div className="max-w-4xl mx-auto md:px-8 md:py-6">
                            <header className="hidden md:flex justify-between items-center mb-8 px-4 md:px-0">
                                <h1 className="text-3xl font-bold text-westcoast-text-dark dark:text-white">{pageTitle}</h1>
                                <div className="flex items-center gap-4">
                                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                                    {userData && <Avatar user={userData} size="w-10 h-10"/>}
                                </div>
                            </header>
                            
                            <Routes>
                                <Route index element={<HomeView />} />
                                <Route path="cards" element={<CardsView />} />
                                <Route path="payments" element={<PaymentsView />} />
                                <Route path="loan" element={<LoanView />} />
                                <Route path="ai" element={<AiAssistantView />} />
                                <Route path="me" element={<ProfileView />} />
                                <Route path="history" element={<HistoryView />} />
                            </Routes>
                        </div>
                    </main>
                </div>
                {!(userData && userData.isSuspended) && (
                     <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-50">
                        <div className="flex justify-around py-2">
                             {navItems.map(item => (
                                <BottomNavItem key={item.id} icon={item.icon} label={item.label} active={activeView === item.id} onClick={() => navigate(item.path)} />
                            ))}
                        </div>
                    </footer>
                )}
            </div>

            {showTransferModal && userData && <DomesticTransferModal user={userData} onClose={() => setShowTransferModal(false)} onSuccess={handleSuccess} />}
            {showDepositModal && userData && <CheckDepositModal user={userData} onClose={() => setShowDepositModal(false)} onSuccess={handleSuccess} />}
            {showInternationalModal && userData && <InternationalTransferModal user={userData} onClose={() => setShowInternationalModal(false)} onSuccess={handleSuccess} />}
        </DashboardContext.Provider>
    );
};

const BottomNavItem: React.FC<{ icon: React.ReactElement<{ className?: string }>; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 w-16">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
             {React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'text-westcoast-blue' : 'text-gray-500 dark:text-gray-400'}` })}
        </div>
        <p className={`text-xs font-medium ${active ? 'text-westcoast-blue' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
    </button>
);

const SideNavItem: React.FC<{ icon: React.ReactElement<{ className?: string }>; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/50 text-westcoast-blue' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span>{label}</span>
    </button>
);

const Avatar: React.FC<{ user: UserProfile, size?: string, textClass?: string }> = ({ user, size = 'w-12 h-12', textClass = 'text-lg' }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { if (user?.photoURL) { setImgError(false); } }, [user?.photoURL]);
    const handleImageError = () => { setImgError(true); };
    const getInitials = (name: string) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };
    if (user && user.photoURL && !imgError) {
        return <img src={user.photoURL} alt={user.fullName} onError={handleImageError} className={`${size} rounded-full object-cover bg-gray-200 dark:bg-gray-700`} />;
    }
    return (
        <div className={`${size} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold ${textClass}`}>
            {getInitials(user && user.fullName)}
        </div>
    );
};

export default DashboardLayout;