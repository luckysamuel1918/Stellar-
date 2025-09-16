import React from 'react';
import { useDashboard } from './DashboardLayout';
import { Loader2 } from 'lucide-react';

const CardsView: React.FC = () => {
    const { user, loading } = useDashboard();
    
    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    return (
        <div className="p-4 md:p-0">
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-4 md:hidden">My Cards</h2>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm text-center">
                    <p className="text-gray-500 dark:text-gray-400">No cards have been added yet.</p>
                </div>
                <button className="w-full text-center py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm font-semibold text-westcoast-blue">
                    + Add New Card
                </button>
            </div>
        </div>
    );
};

export default CardsView;