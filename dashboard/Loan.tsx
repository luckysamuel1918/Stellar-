import React, { useState } from 'react';
import { useDashboard } from './DashboardLayout';
import { adminUpdateBalance } from '../services/firebase';
import { Loader2, HandCoins, CheckCircle, XCircle, Percent, Banknote, CalendarClock, Info } from 'lucide-react';
import { formatCurrency } from './components';
import { GoogleGenAI, Type } from "@google/genai";

const LoanResultDisplay = ({ result, onAccept, onReset }) => {
    const isApproved = result.decision === 'Approved';

    const handleAccept = () => {
        onAccept(result.maxApprovedAmount);
    };

    return (
        <div className={`p-5 rounded-2xl shadow-sm border-l-4 ${isApproved ? 'bg-green-50 border-green-500 dark:bg-green-900/40 dark:border-green-600' : 'bg-red-50 border-red-500 dark:bg-red-900/40 dark:border-red-600'}`}>
            <div className="flex items-start gap-4">
                {isApproved ? <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" /> : <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />}
                <div>
                    <h3 className={`font-bold text-lg ${isApproved ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>Loan Application {result.decision}</h3>
                    <p className={`text-sm mt-1 ${isApproved ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{result.reason}</p>
                </div>
            </div>

            {isApproved && (
                <div className="mt-4 pl-12 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2"><Banknote size={16}/> Approved Amount</p>
                            <p className="font-bold text-lg text-westcoast-text-dark dark:text-white">{formatCurrency(result.maxApprovedAmount, 'USD')}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2"><Percent size={16}/> Interest Rate</p>
                            <p className="font-bold text-lg text-westcoast-text-dark dark:text-white">{result.interestRate.toFixed(2)}% APR</p>
                        </div>
                         <div className="bg-white dark:bg-gray-700 p-3 rounded-lg col-span-2">
                            <p className="text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-2"><CalendarClock size={16}/> Est. Monthly Payment</p>
                            <p className="font-bold text-lg text-westcoast-text-dark dark:text-white">{formatCurrency(result.monthlyPayment, 'USD')} / mo (60 months)</p>
                        </div>
                    </div>
                     <div className="pt-2 flex flex-col sm:flex-row gap-3">
                        <button onClick={handleAccept} className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors">Accept Loan Offer</button>
                        <button onClick={onReset} className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Decline</button>
                    </div>
                </div>
            )}

            {!isApproved && (
                <div className="mt-4 pl-12">
                     <button onClick={onReset} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-2.5 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Try Again</button>
                </div>
            )}
        </div>
    );
};

const LoanView: React.FC = () => {
    const { user, transactions, loading: userLoading, fetchData } = useDashboard();
    const [loanAmount, setLoanAmount] = useState('');
    const [loanPurpose, setLoanPurpose] = useState('Home Improvement');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [loanResult, setLoanResult] = useState<any | null>(null);
    const [loanAccepted, setLoanAccepted] = useState(false);

    const resetForm = () => {
        setLoanAmount('');
        setLoanPurpose('Home Improvement');
        setLoanResult(null);
        setError('');
        setLoanAccepted(false);
    };

    const handleCheckEligibility = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(loanAmount);
        if (!user || !transactions) return;
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid loan amount.');
            return;
        }
        setError('');
        setLoading(true);
        setLoanResult(null);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                setError("Loan service is currently unavailable. API key not configured.");
                setLoading(false);
                return;
            }

            const prompt = `
              Act as a loan eligibility officer for Westcoast Trust Bank.
              Analyze the following user profile and loan request to determine eligibility.

              User Profile:
              - Full Name: ${user.fullName}
              - Current Balance: ${formatCurrency(user.balance, user.currencyCode)}
              - Account Opened: ${new Date(user.createdAt.toDate()).toLocaleDateString()}
              - Recent Transactions (last 5):
                ${transactions.slice(0, 5).map(tx => `- ${tx.description}: ${formatCurrency(tx.amount, user.currencyCode)} on ${new Date(tx.timestamp.toDate()).toLocaleDateString()}`).join('\n')}

              Loan Request:
              - Amount: ${formatCurrency(parseFloat(loanAmount), user.currencyCode)}
              - Purpose: ${loanPurpose}

              Based on this data, make a decision. The user's balance is a key factor. A very low balance relative to the loan amount is a high risk.
              - If the loan amount is less than 20% of their current balance, it's a low-risk loan and should almost always be approved.
              - If the loan amount is between 20% and 50% of their balance, it's a medium risk. Consider approval with a slightly higher interest rate (around 9-13%).
              - If the loan amount is more than 50% of their balance, it's a high risk and should likely be denied, unless they have a very high balance (e.g., > $100,000).
              - Generate a plausible annual interest rate between 5.5% and 18.5% based on risk.
              - Calculate an estimated monthly payment based on a 5-year (60 month) term. The formula for monthly payment M is: M = P * (i * (1 + i)^n) / ((1 + i)^n - 1), where P is the principal, i is the monthly interest rate (annual rate / 12 / 100), and n is the number of months.
              - If denied, set maxApprovedAmount, interestRate, and monthlyPayment to 0.

              Return ONLY a valid JSON object with your decision.
            `;

            const schema = {
              type: Type.OBJECT,
              properties: {
                decision: { type: Type.STRING, description: "Can be 'Approved', 'Denied', or 'Pending Review'." },
                reason: { type: Type.STRING, description: "A user-friendly reason for the decision." },
                maxApprovedAmount: { type: Type.NUMBER, description: "The amount approved for the loan." },
                interestRate: { type: Type.NUMBER, description: "The annual interest rate, e.g., 8.5 for 8.5%." },
                monthlyPayment: { type: Type.NUMBER, description: "The estimated monthly payment." },
              },
              required: ["decision", "reason", "maxApprovedAmount", "interestRate", "monthlyPayment"]
            };

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            });

            const result = JSON.parse(response.text);
            setLoanResult(result);

        } catch (err) {
            console.error("Error checking eligibility:", err);
            setError("We couldn't process your loan request at this time. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptLoan = async (approvedAmount: number) => {
        if (!user) return;
        setLoading(true);
        try {
            await adminUpdateBalance(user, approvedAmount, 'credit', 'Loan Disbursement');
            await fetchData(); // Refresh user data to show new balance
            setLoanAccepted(true);
        } catch (err) {
            setError("Failed to disburse the loan. Please contact support.");
        } finally {
            setLoading(false);
        }
    };
    
    if (userLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user) return <div className="p-4 text-center">Could not load user data.</div>;

    if (loanAccepted) {
        return (
            <div className="p-4 md:p-0 space-y-6">
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-westcoast-text-dark dark:text-white">Loan Accepted!</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">The funds have been successfully deposited into your account.</p>
                    <button onClick={resetForm} className="mt-6 bg-westcoast-blue text-white font-bold py-2.5 px-6 rounded-lg">Apply for Another Loan</button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-0 space-y-6">
            <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white md:hidden">Loan Center</h2>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                        <HandCoins className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-westcoast-text-dark dark:text-white">Loan Overview</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Your current loan status</p>
                    </div>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Total Outstanding Loan</p>
                    <p className="text-3xl font-bold text-westcoast-text-dark dark:text-white mt-1">{formatCurrency(0, user.currencyCode)}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">You have no active loans. Apply today!</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                 <h3 className="font-bold text-lg text-westcoast-text-dark dark:text-white mb-4">Apply for a New Loan</h3>
                 {loanResult ? (
                    <LoanResultDisplay result={loanResult} onAccept={handleAcceptLoan} onReset={resetForm} />
                 ) : (
                    <form onSubmit={handleCheckEligibility} className="space-y-4">
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
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-800 dark:text-blue-200 text-xs">
                           <Info size={28} className="flex-shrink-0"/>
                           <span>Eligibility is determined by an AI model based on your profile. This is a simulation and not a real offer of credit.</span>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center">
                            {loading ? <Loader2 className="animate-spin" /> : 'Check Eligibility'}
                        </button>
                    </form>
                 )}
            </div>
        </div>
    );
};

export default LoanView;
