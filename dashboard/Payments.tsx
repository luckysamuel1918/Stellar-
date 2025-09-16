import React, { useState } from 'react';
import { useDashboard } from './DashboardLayout';
import { Transaction } from '../types';
import { adminUpdateBalance } from '../services/firebase';
import { Loader2, Receipt } from 'lucide-react';
import { formatCurrency } from './components';

const PaymentsView: React.FC = () => {
    const { user, loading: userLoading, fetchData } = useDashboard();
    const [biller, setBiller] = useState('Edison Electric');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const billers = ['Edison Electric', 'Comcast Internet', 'State Water Co.', 'City Gas'];

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (numAmount > user.balance) {
            setError('Insufficient funds.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await adminUpdateBalance(user, numAmount, 'debit', `Bill Payment to ${biller}`, undefined, undefined, 'bill_payment');
            setSuccess(`Successfully paid ${formatCurrency(numAmount, user.currencyCode)} to ${biller}.`);
            setAmount('');
            fetchData();
        } catch (err) {
            setError(err.message || 'Payment failed.');
        } finally {
            setLoading(false);
        }
    };
    
    if (userLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    return (
        <div className="p-4 md:p-0">
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-4 md:hidden">Bill Payments</h2>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                        <label htmlFor="biller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Biller</label>
                        <select id="biller" value={biller} onChange={e => setBiller(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            {billers.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input id="payment-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Amount in ${user.currencyCode}`} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <><Receipt/> Pay Now</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PaymentsView;