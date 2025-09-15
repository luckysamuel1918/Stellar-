import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from './DashboardLayout';
import { Loader2, Bell, MessageSquare, CreditCard, Send, Globe, ClipboardCheck, History } from 'lucide-react';
import { QuickActionButton, TransactionItem, Avatar, formatCurrency } from './components';

const HomeView = () => {
    const { user: userData, transactions, loading, openDomesticTransferModal, openInternationalTransferModal, openCheckDepositModal } = useDashboard();
    const navigate = useNavigate();

    const handleActionClick = (action: string) => {
        switch(action) {
            case 'transfer': openDomesticTransferModal(); break;
            case 'international': openInternationalTransferModal(); break;
            case 'deposit': openCheckDepositModal(); break;
            case 'history': navigate('/dashboard/history'); break;
            default: break;
        }
    }
    
    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!userData) return <div className="p-4 text-center">Could not load user data.</div>;

    return (
        <>
            <header className="p-4 flex justify-between items-center md:hidden">
                <div className="flex items-center gap-3">
                    <Avatar user={userData} />
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{`Hi, ${userData.fullName.split(' ')[0]}`}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                </div>
            </header>

            <section className="px-4 md:px-0">
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

            <section className="p-4 md:p-0 md:mt-8">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <QuickActionButton onClick={() => handleActionClick('transfer')} icon={<Send className="w-6 h-6 text-westcoast-blue"/>} label={"Domestic"} />
                    <QuickActionButton onClick={() => handleActionClick('international')} icon={<Globe className="w-6 h-6 text-westcoast-blue"/>} label={"International"} />
                    <QuickActionButton onClick={() => handleActionClick('deposit')} icon={<ClipboardCheck className="w-6 h-6 text-westcoast-blue"/>} label={"Deposit"} />
                    <QuickActionButton onClick={() => handleActionClick('history')} icon={<History className="w-6 h-6 text-westcoast-blue"/>} label={"History"} />
                </div>
            </section>

            <section className="p-4 md:p-0 md:mt-8">
                 <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Recent Transactions</h2>
                    <button onClick={() => navigate('/dashboard/history')} className="text-sm font-semibold text-westcoast-blue hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                    {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                        <TransactionItem key={tx.id} tx={tx} currentUserId={userData.uid} currencyCode={userData.currencyCode} />
                    )) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                            <p>No recent transactions.</p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

export default HomeView;
