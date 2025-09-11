

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { getUserData, getUserTransactions } from '../services/firebase';
import { 
    Bell, MessageSquare, CreditCard, Send, Globe, ClipboardCheck, History,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Home, User as UserIcon, Landmark
} from 'lucide-react';

const formatCurrency = (amount: number, currency: string) => {
    const safeCurrency = currency || 'USD';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
        }).format(amount);
    } catch (e) {
        console.error(`Invalid currency code: ${safeCurrency}`, e);
        return `$${amount.toFixed(2)}`; // Fallback for invalid codes
    }
};

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <button className="flex flex-col items-center justify-center space-y-2">
        <div className="bg-white p-4 rounded-xl shadow-sm">
            {icon}
        </div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
    </button>
);

const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string, currencyCode: string }> = ({ tx, currentUserId, currencyCode }) => {
    const isDebit = tx.senderId === currentUserId;
    const formattedDate = tx.timestamp ? new Date(tx.timestamp.toDate()).toLocaleDateString() : 'N/A';
    
    return (
        <div className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-full ${isDebit ? 'bg-red-100' : 'bg-green-100'}`}>
                {isDebit ? <ArrowUpRight className="w-5 h-5 text-red-500" /> : <ArrowDownLeft className="w-5 h-5 text-green-500" />}
            </div>
            <div className="flex-grow">
                <div className="flex items-center">
                    <p className="font-bold text-gray-800 text-sm">{tx.description || (isDebit ? tx.receiverName : tx.senderName)}</p>
                    {tx.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 ml-1 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-500">{formattedDate} • {isDebit ? tx.receiverAccountNumber.slice(-8) : tx.senderId.slice(-8)}</p>
            </div>
            <div className="text-right">
                <p className={`font-bold text-sm ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                    {isDebit ? '-' : ''}${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                </p>
                 {tx.status === 'completed' && 
                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                        Completed
                    </span>
                 }
            </div>
        </div>
    );
};

// FIX: Changed icon prop type from React.ReactNode to React.ReactElement to fix cloneElement typing issue.
const NavItem: React.FC<{ icon: React.ReactElement; label: string; active?: boolean }> = ({ icon, label, active }) => (
    <button className="flex flex-col items-center justify-center space-y-1 w-16">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100' : ''}`}>
             {React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'text-westcoast-blue' : 'text-gray-500'}` })}
        </div>
        <p className={`text-xs font-medium ${active ? 'text-westcoast-blue' : 'text-gray-500'}`}>{label}</p>
    </button>
);


const UserDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (user) {
            try {
                const profile = await getUserData(user.uid);
                setUserData(profile);
                if (profile) {
                    const txs = await getUserTransactions(user.uid);
                    setTransactions(txs);
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-100"><p>Loading dashboard...</p></div>;
    if (!userData) return <div className="flex justify-center items-center h-screen bg-gray-100"><p>Could not load user data.</p></div>;

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <div className="max-w-md mx-auto bg-gray-100 pb-24">
                
                <header className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Hi, {userData.fullName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 bg-white rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600"/></button>
                        <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600"/></button>
                    </div>
                </header>

                <section className="px-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-westcoast-blue to-westcoast-accent text-white shadow-lg">
                        <p className="text-sm opacity-80">Available Balance</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-4xl font-bold">{formatCurrency(userData.balance, userData.currencyCode).replace('.00', '')}<span className="text-xl font-semibold opacity-80 ml-1">{userData.currencyCode}</span></p>
                            <CreditCard className="w-8 h-8 opacity-50"/>
                        </div>
                        <div className="mt-4">
                            <span className="bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full">Active Account</span>
                        </div>
                    </div>
                </section>

                <section className="p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-4 gap-3 text-center">
                        <QuickActionButton icon={<Send className="w-6 h-6 text-westcoast-blue"/>} label="Domestic Transfer" />
                        <QuickActionButton icon={<Globe className="w-6 h-6 text-westcoast-blue"/>} label="International" />
                        <QuickActionButton icon={<ClipboardCheck className="w-6 h-6 text-westcoast-blue"/>} label="Check Deposit" />
                        <QuickActionButton icon={<History className="w-6 h-6 text-westcoast-blue"/>} label="History" />
                    </div>
                </section>

                <section className="p-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Transactions</h2>
                    <div className="space-y-3">
                        {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                            <TransactionItem key={tx.id} tx={tx} currentUserId={userData.uid} currencyCode={userData.currencyCode} />
                        )) : (
                            <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm">
                                <p>No recent transactions.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-200">
                <div className="flex justify-around py-2">
                    <NavItem icon={<Home />} label="Home" active />
                    <NavItem icon={<CreditCard />} label="Cards" />
                    <NavItem icon={<Send />} label="Payments" />
                    <NavItem icon={<Landmark />} label="Loan" />
                    <NavItem icon={<UserIcon />} label="Me" />
                </div>
            </footer>
        </div>
    );
};

export default UserDashboardPage;