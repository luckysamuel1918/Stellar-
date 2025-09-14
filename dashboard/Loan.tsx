import React from 'react';
import { useDashboard } from './DashboardLayout';
import { Loader2, HandCoins } from 'lucide-react';
import { formatCurrency } from './components';

const LoanView: React.FC = () => {
    const { user, loading } = useDashboard();
    
    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    return (
        <div className="p-4 md:p-0 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white md:hidden">Loan Center</h2>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                        <HandCoins className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">Loan Overview</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your current loan status</p>
                    </div>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Total Outstanding Loan</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(0, user.currencyCode)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">You have no active loans. Apply today!</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                 <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4">Apply for a New Loan</h3>
                 <form className="space-y-4">
                     <div>
                        <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Amount</label>
                        <input id="loan-amount" type="number" placeholder={`Amount in ${user.currencyCode}`} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div>
                        <label htmlFor="loan-purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                        <select id="loan-purpose" className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option>Home Improvement</option>
                            <option>Debt Consolidation</option>
                            <option>Major Purchase</option>
                            <option>Business</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg">
                        Check Eligibility
                    </button>
                 </form>
            </div>
        </div>
    );
};

export default LoanView;
