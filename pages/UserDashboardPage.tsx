import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { getUserData, getUserTransactions, getUserByAccountNumber, performTransfer } from '../services/firebase';
import { DollarSign, Send, FileText, CheckCircle, Briefcase, Landmark, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';


const portfolioData = [
  { name: 'Stocks', value: 4500.00, color: '#0077FF' },
  { name: 'ETFs', value: 3200.00, color: '#00D4FF' },
  { name: 'Bonds', value: 1500.00, color: '#0A2540' },
  { name: 'Cash', value: 800.00, color: '#6B7280' },
];

const holdingsData = [
    { symbol: 'AAPL', name: 'Apple Inc.', shares: 10, price: 175.20, change: 1.5, changePercent: 0.86 },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', shares: 5, price: 450.10, change: -0.25, changePercent: -0.06 },
    { symbol: 'TSLA', name: 'Tesla, Inc.', shares: 8, price: 250.75, change: 3.1, changePercent: 1.25 },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', shares: 15, price: 75.50, change: 0.05, changePercent: 0.07 },
];

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

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
        <div className="bg-stellar-blue/10 p-4 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-stellar-text-light">{title}</p>
            <p className="text-3xl font-bold text-stellar-text-dark">{value}</p>
            {subtext && <p className="text-sm text-green-500 font-semibold">{subtext}</p>}
        </div>
    </div>
);

const TransactionRow: React.FC<{ tx: Transaction, currentUserId: string, currencyCode: string }> = ({ tx, currentUserId, currencyCode }) => {
    const isDebit = tx.senderId === currentUserId;
    const amountColor = isDebit ? 'text-red-600' : 'text-green-600';
    const sign = isDebit ? '-' : '+';
    const peerName = isDebit ? `To: ${tx.receiverName}` : `From: ${tx.senderName}`;
    return (
        <tr className="border-b border-gray-100">
            <td className="py-4 px-4 text-sm text-stellar-text-light">{new Date(tx.timestamp?.toDate()).toLocaleDateString()}</td>
            <td className="py-4 px-4">
                <p className="font-semibold text-stellar-text-dark">{tx.description || tx.type}</p>
                <p className="text-xs text-stellar-text-light">{peerName}</p>
            </td>
            <td className={`py-4 px-4 font-mono text-right font-semibold ${amountColor}`}>{sign}{formatCurrency(tx.amount, currencyCode)}</td>
            <td className="py-4 px-4 text-right">
                {tx.status === 'completed' ? <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Completed</span> : <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>}
            </td>
        </tr>
    );
};

const TransferModal: React.FC<{ userData: UserProfile; onClose: () => void; onTransferSuccess: (receipt: Transaction) => void; }> = ({ userData, onClose, onTransferSuccess }) => {
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            setError('Please enter a valid amount.');
            setLoading(false);
            return;
        }

        if (userData.balance < transferAmount) {
            setError('Insufficient funds.');
            setLoading(false);
            return;
        }
        
        if (userData.accountNumber === accountNumber) {
            setError('You cannot transfer money to your own account.');
            setLoading(false);
            return;
        }

        try {
            const receiverData = await getUserByAccountNumber(accountNumber);
            if (!receiverData) {
                setError('Recipient account not found.');
                return;
            }

            await performTransfer(userData, receiverData, transferAmount, description);
            onTransferSuccess({
                senderId: userData.uid,
                senderName: userData.fullName,
                receiverId: receiverData.uid,
                receiverName: receiverData.fullName,
                receiverAccountNumber: receiverData.accountNumber,
                amount: transferAmount,
                description,
                type: 'transfer',
                status: 'completed',
                timestamp: new Date()
            });

        } catch (err: any) {
            setError(err.message || 'An error occurred during the transfer.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-stellar-dark mb-6">Send Money</h2>
                <form onSubmit={handleTransfer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Recipient's Account Number</label>
                        <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Amount ({userData.currencyCode})</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Description (Optional)</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-stellar-blue text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Sending...' : 'Send'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReceiptModal: React.FC<{ receipt: Transaction, currencyCode: string, onClose: () => void }> = ({ receipt, currencyCode, onClose }) => (
     <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-stellar-dark">Transfer Successful</h2>
            <p className="text-stellar-text-light mb-6">You have sent {formatCurrency(receipt.amount, currencyCode)} to {receipt.receiverName}.</p>
            <div className="bg-stellar-bg p-6 rounded-lg text-left space-y-3">
                <div className="flex justify-between"><span className="text-stellar-text-light">Amount:</span><span className="font-bold text-stellar-text-dark">{formatCurrency(receipt.amount, currencyCode)}</span></div>
                <div className="flex justify-between"><span className="text-stellar-text-light">To:</span><span className="font-bold text-stellar-text-dark">{receipt.receiverName}</span></div>
                <div className="flex justify-between"><span className="text-stellar-text-light">Account:</span><span className="font-mono">{receipt.receiverAccountNumber}</span></div>
                 <div className="flex justify-between"><span className="text-stellar-text-light">Date:</span><span className="font-bold text-stellar-text-dark">{new Date(receipt.timestamp).toLocaleString()}</span></div>
                {receipt.description && <div className="flex justify-between"><span className="text-stellar-text-light">Description:</span><span className="font-bold text-stellar-text-dark">{receipt.description}</span></div>}
            </div>
            <button onClick={onClose} className="mt-8 w-full px-4 py-3 bg-stellar-blue text-white font-bold rounded-lg">Done</button>
        </div>
    </div>
);


const UserDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);
    const [receipt, setReceipt] = useState<Transaction | null>(null);

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

    const handleTransferSuccess = (receipt: Transaction) => {
        setTransferModalOpen(false);
        setReceipt(receipt);
        fetchData(); // Re-fetch data to update balance and transactions
    };

    if (loading) return <div className="text-center p-10">Loading dashboard...</div>;
    if (!userData) return <div className="text-center p-10">Could not load user data.</div>;

    const totalPortfolioValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
    const totalAssets = userData.balance + totalPortfolioValue;

    return (
        <div className="bg-stellar-bg min-h-[calc(100vh-150px)] p-4 sm:p-6 md:p-8">
            {isTransferModalOpen && <TransferModal userData={userData} onClose={() => setTransferModalOpen(false)} onTransferSuccess={handleTransferSuccess} />}
            {receipt && <ReceiptModal receipt={receipt} currencyCode={userData.currencyCode} onClose={() => setReceipt(null)} />}
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-stellar-dark">Welcome, {userData.fullName.split(' ')[0]}!</h1>
                    <p className="text-stellar-text-light">Here's your financial overview.</p>
                </header>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Assets" value={formatCurrency(totalAssets, userData.currencyCode)} icon={<TrendingUp className="text-stellar-blue"/>} subtext={`+ ${formatCurrency(125.70, userData.currencyCode)} Today`}/>
                    <StatCard title="Cash Balance" value={formatCurrency(userData.balance, userData.currencyCode)} icon={<Landmark className="text-stellar-blue"/>} />
                    <StatCard title="Investments" value={formatCurrency(totalPortfolioValue, userData.currencyCode)} icon={<Briefcase className="text-stellar-blue"/>} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-stellar-dark mb-4">Investment Portfolio</h2>
                         <div className="grid md:grid-cols-2 gap-6 h-[400px]">
                            <div className="flex flex-col justify-center items-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={portfolioData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                            {portfolioData.map((entry) => <Cell key={`cell-${entry.name}`} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value, userData.currencyCode)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                             <div className="overflow-x-auto">
                                <h3 className="font-bold text-stellar-dark mb-2">Top Holdings</h3>
                                <table className="w-full text-sm">
                                     <tbody>
                                         {holdingsData.map(h => (
                                             <tr key={h.symbol} className="border-b border-gray-100 last:border-0">
                                                 <td className="py-3 pr-2"><div className="font-bold text-stellar-dark">{h.symbol}</div><div className="text-xs text-stellar-text-light">{h.name}</div></td>
                                                 <td className="py-3 px-2 text-right"><div className="font-semibold text-stellar-dark">{formatCurrency(h.price * h.shares, userData.currencyCode)}</div><div className="text-xs text-stellar-text-light">{h.shares} shares</div></td>
                                                 <td className={`py-3 pl-2 text-right font-semibold ${h.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>{h.change > 0 && '+'}{h.changePercent.toFixed(2)}%</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center">
                         <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                         <div className="flex flex-col space-y-4">
                            <button onClick={() => setTransferModalOpen(true)} className="w-full bg-stellar-blue text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:opacity-90">
                                <Send size={20} />
                                <span>Send Money</span>
                            </button>
                            <button className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-300">
                                <FileText size={20} />
                                <span>Pay Bills</span>
                            </button>
                             <button className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-300">
                                <Briefcase size={20} />
                                <span>Trade</span>
                            </button>
                         </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-stellar-dark mb-4">Recent Transactions</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase">
                                    <th className="py-2 px-4 font-semibold">Date</th>
                                    <th className="py-2 px-4 font-semibold">Description</th>
                                    <th className="py-2 px-4 font-semibold text-right">Amount</th>
                                    <th className="py-2 px-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.slice(0, 10).map(tx => (
                                    <TransactionRow key={tx.id} tx={tx} currentUserId={userData.uid} currencyCode={userData.currencyCode} />
                                )) : (
                                    <tr><td colSpan={4} className="text-center py-8 text-stellar-text-light">No transactions yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboardPage;
