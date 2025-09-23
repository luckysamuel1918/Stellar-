import React from 'react';
import { useDashboard } from './DashboardLayout';
import { Loader2 } from 'lucide-react';
import { TransactionItem } from './components';

const HistoryView = () => {
    const { user, transactions, loading } = useDashboard();
    
    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    return (
        <div>
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-4">Transaction History</h2>
            <div className="space-y-3">
                {transactions.length > 0 ? transactions.map(tx => (
                    <TransactionItem key={tx.id} tx={tx} currentUserId={user.uid} currencyCode={user.currencyCode} />
                )) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <p>No transactions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryView;