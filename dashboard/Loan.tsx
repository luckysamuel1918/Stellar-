import React, { useState } from 'react';
import { useDashboard } from './DashboardLayout';
import { adminUpdateBalance, createLoanApplication, updateLoan } from '../services/firebase';
import { Loader2, HandCoins, CheckCircle, Percent, Banknote, CalendarClock, Info, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency } from './components';

const LoanView: React.FC = () => {
    const { user, loans, loading: dataLoading, fetchData } = useDashboard();
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPurpose, setLoanPurpose] = useState('Home Improvement');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const activeLoan = loans.find(l => l.status === 'approved' || l.status === 'overdue');
    const pendingLoan = loans.find(l => l.status === 'pending');

    const handleApplicationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const amount = parseFloat(loanAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid loan amount.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await createLoanApplication({
                userId: user.uid,
                fullName: user.fullName,
                loanAmount: amount,
                loanPurpose: loanPurpose,
            });
            setLoanAmount('');
            setLoanPurpose('Home Improvement');
            setSuccessMessage('Your loan application has been submitted for review.');
            await fetchData();
        } catch (err) {
            console.error("Error submitting loan application:", err);
            setError("We couldn't submit your application. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleRepayLoan = async () => {
        if (!user || !activeLoan) return;
        
        const amountOwed = activeLoan.totalOwed || 0;
        if (user.balance < amountOwed) {
            alert("Insufficient funds to repay the loan.");
            return;
        }

        if (window.confirm(`Are you sure you want to repay ${formatCurrency(amountOwed, user.currencyCode)}? This will be deducted from your main balance.`)) {
            setLoading(true);
            try {
                await adminUpdateBalance(user, amountOwed, 'debit', 'Loan Repayment', undefined, undefined, 'loan_repayment');
                await updateLoan(activeLoan.id!, { status: 'paid' });
                setSuccessMessage('Loan repaid successfully!');
                await fetchData();
            } catch (err) {
                 setError('Failed to process repayment. Please contact support.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (dataLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    const renderContent = () => {
        if (successMessage && !activeLoan && !pendingLoan) {
             return (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-westcoast-text-dark dark:text-white">Success!</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">{successMessage}</p>
                    <button onClick={() => setSuccessMessage('')} className="mt-6 bg-westcoast-blue text-white font-bold py-2.5 px-6 rounded-lg">
                        OK
                    </button>
                </div>
            );
        }

        if (pendingLoan) {
            return (
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full">
                            <Clock className="w-6 h-6 text-yellow-600"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-westcoast-text-dark dark:text-white">Application Pending</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your request is under review.</p>
                        </div>
                    </div>
                    <div className="text-center bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">Requested Amount</p>
                        <p className="text-3xl font-bold text-westcoast-text-dark dark:text-white mt-1">{formatCurrency(pendingLoan.loanAmount, user.currencyCode)}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">We will notify you once a decision has been made.</p>
                    </div>
                </div>
            );
        }

        if (activeLoan) {
            const isOverdue = activeLoan.status === 'overdue';
            const formattedDueDate = activeLoan.dueDate && typeof activeLoan.dueDate.toDate === 'function' ? new Date(activeLoan.dueDate.toDate()).toLocaleDateString() : 'N/A';
            return (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${isOverdue ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                            {isOverdue ? <AlertTriangle className="w-6 h-6 text-red-600"/> : <CheckCircle className="w-6 h-6 text-green-600"/>}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-westcoast-text-dark dark:text-white">Active Loan</h3>
                            <p className={`text-sm font-semibold ${isOverdue ? 'text-red-500' : 'text-green-500'}`}>{isOverdue ? 'Payment Overdue' : 'Loan Approved'}</p>
                        </div>
                    </div>
                     <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Total Owed</span>
                            <span className="font-bold text-xl text-westcoast-text-dark dark:text-white">{formatCurrency(activeLoan.totalOwed || 0, user.currencyCode)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Due Date</span>
                            <span className="font-semibold text-westcoast-text-dark dark:text-white">{formattedDueDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 dark:text-gray-400">Interest Rate (APR)</span>
                            <span className="font-semibold text-westcoast-text-dark dark:text-white">{activeLoan.interestRate?.toFixed(2) || 'N/A'}%</span>
                        </div>
                    </div>
                    <button onClick={handleRepayLoan} disabled={loading} className="mt-4 w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" /> : `Repay Loan Now`}
                    </button>
                </div>
            );
        }

        return (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                 <h3 className="font-bold text-lg text-westcoast-text-dark dark:text-white mb-4">Apply for a New Loan</h3>
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="loan-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Amount</label>
                        <input id="loan-amount" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} placeholder={`Loan Amount in ${user.currencyCode}`} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="loan-purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                        <select id="loan-purpose" value={loanPurpose} onChange={e => setLoanPurpose(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option>Home Improvement</option>
                            <option>Debt Consolidation</option>
                            <option>Major Purchase</option>
                            <option>Business</option>
                            <option>Other</option>
                        </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center">
                        {loading ? <Loader2 className="animate-spin" /> : 'Submit Application'}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-0 space-y-6">
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white md:hidden">Loan Center</h2>
            {renderContent()}
        </div>
    );
};

export default LoanView;