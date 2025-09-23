import React from 'react';
import { useDashboard } from './DashboardLayout';
import { Loader2, Wifi, Lock, Snowflake, PlusCircle } from 'lucide-react';
import { WestcoastLogo } from '../components/icons';
import { formatCurrency } from './components';

const CardsView: React.FC = () => {
    const { user, loading } = useDashboard();
    
    if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    const availableCredit = 10000;
    const currentBalance = 542.18;

    return (
        <div>
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-4 md:hidden">My Cards</h2>
            <div className="space-y-6">

                {/* Virtual Card Display */}
                <div className="bg-gradient-to-tr from-westcoast-dark to-gray-800 rounded-2xl p-6 text-white shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-westcoast-blue/20 rounded-full"></div>
                    <div className="flex justify-between items-start">
                        <WestcoastLogo className="text-white" />
                        <div className="flex items-center gap-2">
                             <div className="w-10 h-7 bg-yellow-400 rounded-md">
                                <div className="w-5 h-5 bg-gray-600 rounded-sm m-1"></div>
                            </div>
                            <Wifi className="w-6 h-6 transform rotate-90" />
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="font-mono text-2xl md:text-3xl tracking-widest break-all">
                            5282 2578 8543 1234
                        </p>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs uppercase opacity-70">Card Holder</p>
                            <p className="font-semibold">{user.fullName}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase opacity-70">Expires</p>
                            <p className="font-semibold">12/28</p>
                        </div>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" className="h-8" />
                    </div>
                </div>

                {/* Card Details & Actions */}
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                    <div className="grid grid-cols-2 gap-4 text-center border-b dark:border-gray-700 pb-4 mb-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Available Credit</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(availableCredit, user.currencyCode)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                            <p className="text-lg font-bold text-westcoast-text-dark dark:text-white">{formatCurrency(currentBalance, user.currencyCode)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <CardActionButton icon={<Lock size={20} />} label="Show PIN" />
                        <CardActionButton icon={<Snowflake size={20} />} label="Freeze Card" />
                        <CardActionButton icon={<PlusCircle size={20} />} label="Set Limit" />
                    </div>
                </div>

                <button className="w-full text-center py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm font-semibold text-westcoast-blue hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    + Add New Card
                </button>
            </div>
        </div>
    );
};

const CardActionButton: React.FC<{ icon: React.ReactElement; label: string; }> = ({ icon, label }) => (
    <button className="flex flex-col items-center justify-center p-2 space-y-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div className="text-gray-600 dark:text-gray-300">{icon}</div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</p>
    </button>
);


export default CardsView;