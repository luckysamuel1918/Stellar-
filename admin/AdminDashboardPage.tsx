// FIX: Imported `useRef` and `useCallback` to resolve 'Cannot find name' errors.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction, Loan } from '../types';
import { 
    getAllUsers, adminUpdateBalance, updateUserProfile, adminDeleteUser,
    adminRestoreUser, getUserTransactions, adminUpdateTransaction, getChatMessages, sendChatMessage,
    wipeChatHistory, Timestamp, getAllLoans, updateLoan
} from '../services/firebase';
import { Users, DollarSign, Edit, Trash2, MessageSquare, Clock, X, Loader2, Send as SendIcon, AlertTriangle, Search, TrendingUp, ShieldOff, ShieldCheck, LogOut, Banknote } from 'lucide-react';
import { formatCurrency } from '../dashboard/components';

const Avatar: React.FC<{ user: UserProfile, size?: string, textClass?: string }> = ({ user, size = 'w-10 h-10', textClass = 'text-sm' }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (user?.photoURL) {
            setImgError(false);
        }
    }, [user?.photoURL]);

    const handleImageError = () => {
        setImgError(true);
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (user.photoURL && !imgError) {
        return <img src={user.photoURL} alt={user.fullName} onError={handleImageError} className={`${size} rounded-full object-cover bg-gray-200 dark:bg-gray-700`} />;
    }
    
    return (
        <div className={`${size} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold ${textClass}`}>
            {getInitials(user.fullName)}
        </div>
    );
};

const ManageBalanceModal: React.FC<{ user: UserProfile; onClose: () => void; onUpdate: () => void; }> = ({ user, onClose, onUpdate }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [description, setDescription] = useState('');
    const [senderName, setSenderName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid positive amount.');
            setLoading(false);
            return;
        }
        try {
            const dateTime = new Date(`${date}T${time}`);
            const customTimestamp = Timestamp.fromDate(dateTime);
            await adminUpdateBalance(user, numAmount, type, description || `Administrative ${type}`, senderName, customTimestamp);
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to update balance.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-2">Manage Balance</h2>
                <p className="text-westcoast-text-light dark:text-gray-300 mb-6">For <span className="font-semibold">{user.fullName}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Transaction Type</label>
                        <select value={type} onChange={e => setType(e.target.value as 'credit' | 'debit')} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <option value="credit">Credit (Add Funds)</option>
                            <option value="debit">Debit (Remove Funds)</option>
                        </select>
                    </div>
                     {type === 'credit' && (
                        <div>
                            <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Sender's Name</label>
                            <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="e.g., John Doe" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Amount ({user.currencyCode})</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Purpose of Transfer / Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional: e.g. Monthly Salary" className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Transaction Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">Transaction Time</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg dark:bg-gray-600 dark:text-white">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-westcoast-blue text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Processing...' : 'Update Balance'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">{label}</label>
        <input {...props} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
    </div>
);

const EditUserModal = ({ user, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const { uid, ...profileData } = formData;
            await updateUserProfile(uid, profileData);
            onUpdate();
        } catch(err) {
            setError('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-6">Edit User Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <p className="text-xs text-yellow-600 -mt-2 ml-1">Note: This only changes the database record, not the login email.</p>
                     <InputField label="Photo URL" name="photoURL" type="url" value={formData.photoURL || ''} onChange={handleChange} placeholder="https://example.com/image.png" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                        <InputField label="Balance" name="balance" type="number" value={formData.balance} onChange={handleChange} />
                    </div>
                    <div className="flex items-center space-x-4 pt-2">
                        <div className="flex items-center">
                            <input id="isSuspended" name="isSuspended" type="checkbox" checked={formData.isSuspended || false} onChange={handleChange} className="h-4 w-4 text-westcoast-blue focus:ring-westcoast-blue border-gray-300 rounded" />
                            <label htmlFor="isSuspended" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Account Suspended</label>
                        </div>
                         <div className="flex items-center">
                            <input id="isAdmin" name="isAdmin" type="checkbox" checked={formData.isAdmin || false} onChange={handleChange} className="h-4 w-4 text-westcoast-blue focus:ring-westcoast-blue border-gray-300 rounded" />
                            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Admin Privileges</label>
                        </div>
                    </div>
                     {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg dark:bg-gray-600 dark:text-white">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-westcoast-blue text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChatModal: React.FC<{ user: UserProfile, onClose: () => void }> = ({ user, onClose }) => {
    const { userData: admin } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = getChatMessages(user.uid, (msgs) => {
            setMessages(msgs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !admin) return;
        
        await sendChatMessage(user.uid, {
            text: newMessage,
            senderId: admin.uid,
            senderName: 'Admin Support'
        });
        setNewMessage('');
    };
    
    const handleWipeHistory = async () => {
        if(window.confirm("Are you sure you want to permanently delete this chat history?")) {
            await wipeChatHistory(user.uid);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-bold text-westcoast-dark dark:text-white">Chat with {user.fullName}</h2>
                        <p className="text-xs text-gray-500">User ID: {user.uid}</p>
                    </div>
                    <div>
                        <button onClick={handleWipeHistory} className="text-xs text-red-500 hover:underline mr-4">Wipe History</button>
                        <button onClick={onClose} className="p-1"><X className="w-6 h-6 text-gray-500" /></button>
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div> :
                        messages.length === 0 ? <div className="text-center text-gray-500 mt-8">No messages yet.</div> :
                        messages.map(msg => (
                            <div key={msg.id} className={`flex my-2 ${msg.senderId === admin?.uid ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.senderId === admin?.uid ? 'bg-westcoast-blue text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp?.toDate()).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))
                    }
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex gap-2">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <button type="submit" className="bg-westcoast-blue text-white p-3 rounded-lg"><SendIcon size={18}/></button>
                </form>
            </div>
        </div>
    );
};

const LoanApprovalModal: React.FC<{ loan: Loan, user: UserProfile, onClose: () => void, onUpdate: () => void }> = ({ loan, user, onClose, onUpdate }) => {
    const [interestRate, setInterestRate] = useState('5.5');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState<'approved' | 'rejected'>('approved');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const updatedLoanData: Partial<Omit<Loan, 'id'>> = { status };
            if (status === 'approved') {
                const rate = parseFloat(interestRate);
                if (isNaN(rate) || rate <= 0) {
                    setError('Invalid interest rate.');
                    setLoading(false);
                    return;
                }
                if (!dueDate) {
                    setError('Due date is required for approval.');
                    setLoading(false);
                    return;
                }
                const totalOwed = loan.loanAmount * (1 + rate / 100);
                updatedLoanData.interestRate = rate;
                updatedLoanData.totalOwed = totalOwed;
                updatedLoanData.dueDate = Timestamp.fromDate(new Date(dueDate));
                updatedLoanData.approvalDate = Timestamp.now();
                
                // The user object passed here might not be the most up-to-date.
                // It's safer to fetch all users once than to re-fetch here.
                // Assuming the parent component passes a user from a fresh list.
                await adminUpdateBalance(user, loan.loanAmount, 'credit', 'Loan Disbursement', 'Westcoast Trust Loans', undefined, 'loan_disbursement');
            }
            await updateLoan(loan.id!, updatedLoanData);
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to update loan status.');
        } finally {
            setLoading(false);
        }
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-4">Manage Loan Application</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p><span className="font-semibold">Applicant:</span> {loan.fullName}</p>
                    <p><span className="font-semibold">Amount:</span> {formatCurrency(loan.loanAmount, user.currencyCode)}</p>
                    <p><span className="font-semibold">Purpose:</span> {loan.loanPurpose}</p>

                    <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="approved">Approve</option>
                        <option value="rejected">Reject</option>
                    </select>

                    {status === 'approved' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium">Interest Rate (%)</label>
                                <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium">Due Date</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required/>
                            </div>
                        </>
                    )}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-westcoast-blue text-white font-semibold rounded-lg">
                            {loading ? 'Submitting...' : 'Submit Decision'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const NavButton = ({ view, icon, label, selectedView, onClick }) => (
    <button 
        onClick={onClick} 
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${selectedView === view ? 'bg-blue-50 dark:bg-blue-900/50 text-westcoast-blue' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const EditTransactionModal = ({ transaction, onClose, onUpdate }) => {
    const initialDate = transaction.timestamp.toDate();
    const [formData, setFormData] = useState({
        amount: transaction.amount,
        status: transaction.status,
        description: transaction.description,
        date: initialDate.toISOString().split('T')[0],
        time: initialDate.toTimeString().substring(0, 5),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const numAmount = parseFloat(formData.amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                setError('Invalid amount.');
                setLoading(false);
                return;
            }

            const newTimestamp = Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`));
            const dataToUpdate = {
                amount: numAmount,
                status: formData.status,
                description: formData.description,
                timestamp: newTimestamp,
            };

            await adminUpdateTransaction(transaction.id, dataToUpdate);
            onUpdate();
        } catch (err) {
            setError('Failed to update transaction.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-4">Edit Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Amount" name="amount" type="number" value={formData.amount} onChange={handleChange} />
                    <InputField label="Description" name="description" value={formData.description} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
                        <InputField label="Time" name="time" type="time" value={formData.time} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-westcoast-blue text-white font-semibold rounded-lg">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UserTransactionsModal = ({ user, onClose, onUpdate }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const txs = await getUserTransactions(user.uid);
        setTransactions(txs);
        setLoading(false);
    }, [user.uid]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleUpdateAndRefetch = () => {
        setEditingTransaction(null);
        fetchTransactions();
        onUpdate(); // Also trigger the main dashboard refetch if needed
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-4xl h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-westcoast-dark dark:text-white">Transaction History for {user.fullName}</h2>
                        <button onClick={onClose}><X /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" /></div> : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Description</th>
                                        <th className="p-2">Amount</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="border-t dark:border-gray-700">
                                            <td className="p-2">{new Date(tx.timestamp.toDate()).toLocaleString()}</td>
                                            <td className="p-2">{tx.description}</td>
                                            <td className={`p-2 font-semibold ${tx.senderId === user.uid ? 'text-red-500' : 'text-green-500'}`}>
                                                {formatCurrency(tx.amount, user.currencyCode)}
                                            </td>
                                            <td className="p-2">{tx.status}</td>
                                            <td className="p-2">
                                                <button onClick={() => setEditingTransaction(tx)} className="p-1 text-blue-500 hover:bg-blue-100 rounded-full">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {editingTransaction && <EditTransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} onUpdate={handleUpdateAndRefetch} />}
        </>
    );
};

const AdminDashboardPage: React.FC = () => {
    const { userData, signOut } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<'dashboard' | 'users' | 'loans'>('dashboard');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [showManageBalanceModal, setShowManageBalanceModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [selectedLoan, setSelectedLoan] = useState<{ loan: Loan, user: UserProfile } | null>(null);
    const [showTransactionsModal, setShowTransactionsModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [userList, loanList] = await Promise.all([
                getAllUsers(),
                getAllLoans()
            ]);
            setUsers(userList);
            setLoans(loanList);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = () => {
        if (selectedUser) {
            setShowManageBalanceModal(false);
            setShowEditModal(false);
            setShowTransactionsModal(false);
        }
        if (selectedLoan) {
            setSelectedLoan(null);
        }
        fetchData();
    };
    
    const handleDeleteUser = async () => {
        if (selectedUser) {
            setLoading(true);
            try {
                await adminDeleteUser(selectedUser.uid);
                fetchData();
                setShowDeleteModal(false);
            } catch (error) {
                console.error("Error deleting user:", error);
                alert('Failed to delete user.');
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleRestoreUser = async (userToRestore: UserProfile) => {
        if (window.confirm(`Are you sure you want to restore account for ${userToRestore.fullName}? The user will be able to log in again.`)) {
            setLoading(true);
            try {
                await adminRestoreUser(userToRestore.uid);
                await fetchData();
            } catch (error) {
                console.error("Error restoring user:", error);
                alert('Failed to restore user.');
            } finally {
                setLoading(false);
            }
        }
    };

    const openChat = (user: UserProfile) => {
        setSelectedUser(user);
        setShowChatModal(true);
    };

    const formatDate = (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return new Date(timestamp.toDate()).toLocaleDateString();
        }
        return 'N/A';
    };
    
    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.accountNumber.includes(searchTerm)
    );
    
    const totalUsers = users.length;
    const totalBalance = users.reduce((acc, user) => acc + user.balance, 0);

    const renderView = () => {
        switch(selectedView) {
            case 'users':
                return (
                    <div>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="Search users by name, email, or account number..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-westcoast-blue"
                                />
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="p-3">User</th>
                                        <th scope="col" className="p-3">Account No.</th>
                                        <th scope="col" className="p-3">Balance</th>
                                        <th scope="col" className="p-3">Status</th>
                                        <th scope="col" className="p-3">Joined</th>
                                        <th scope="col" className="p-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.uid} className={`border-b dark:border-gray-700 ${user.isDeleted ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 opacity-70' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                            <td className="p-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <Avatar user={user} />
                                                    <div>
                                                        <div>{user.fullName}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono">{user.accountNumber}</td>
                                            <td className="p-3 font-semibold">{formatCurrency(user.balance, user.currencyCode)}</td>
                                            <td className="p-3">
                                                {user.isDeleted ? (
                                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">Deactivated</span>
                                                ) : user.isSuspended ? (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-yellow-900 dark:text-yellow-300">Suspended</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Active</span>
                                                )}
                                            </td>
                                            <td className="p-3">{formatDate(user.createdAt)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end items-center space-x-1">
                                                    <button onClick={() => { setSelectedUser(user); setShowManageBalanceModal(true); }} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full" title="Manage Balance"><DollarSign size={16}/></button>
                                                    <button onClick={() => { setSelectedUser(user); setShowTransactionsModal(true); }} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" title="View Transactions"><Clock size={16}/></button>
                                                    <button onClick={() => { setSelectedUser(user); setShowEditModal(true); }} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full" title="Edit User"><Edit size={16}/></button>
                                                    <button onClick={() => openChat(user)} className="p-2 text-purple-500 hover:bg-purple-100 rounded-full" title="Chat with User"><MessageSquare size={16}/></button>
                                                    {user.isDeleted ? (
                                                        <button onClick={() => handleRestoreUser(user)} className="p-2 text-green-500 hover:bg-green-100 rounded-full" title="Restore User"><ShieldCheck size={16}/></button>
                                                    ) : (
                                                        <button onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="p-2 text-red-500 hover:bg-red-100 rounded-full" title="Deactivate User"><Trash2 size={16}/></button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'loans':
                const getLoanStatusPill = (status) => {
                    const styles = {
                        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                        approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
                        paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                        overdue: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
                    };
                    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
                };
                return (
                     <div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Loan Management</h3>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3">Applicant</th>
                                        <th className="p-3">Amount</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Requested</th>
                                        <th className="p-3">Due Date</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map(loan => (
                                        <tr key={loan.id} className="border-b dark:border-gray-700">
                                            <td className="p-3 font-medium text-gray-900 dark:text-white">{loan.fullName}</td>
                                            <td className="p-3">{formatCurrency(loan.loanAmount, users.find(u => u.uid === loan.userId)?.currencyCode || 'USD')}</td>
                                            <td className="p-3">{getLoanStatusPill(loan.status)}</td>
                                            <td className="p-3">{formatDate(loan.requestDate)}</td>
                                            <td className="p-3">{loan.dueDate ? formatDate(loan.dueDate) : 'N/A'}</td>
                                            <td className="p-3">
                                                {loan.status === 'pending' && (
                                                    <button onClick={() => {
                                                        const loanUser = users.find(u => u.uid === loan.userId);
                                                        if (loanUser) {
                                                            setSelectedLoan({ loan, user: loanUser });
                                                        } else {
                                                            alert("Could not find user for this loan.");
                                                        }
                                                    }} className="font-semibold text-blue-600 hover:underline">Review</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                );
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full"><Users className="text-blue-500"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalUsers}</p>
                            </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full"><TrendingUp className="text-green-500"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Platform Balance</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(totalBalance, 'USD')}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm flex items-center gap-4">
                            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full"><Banknote className="text-yellow-500"/></div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Loans</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-white">{loans.filter(l => l.status === 'pending').length}</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-westcoast-bg dark:bg-gray-900"><Loader2 className="animate-spin text-westcoast-blue w-8 h-8"/></div>;
    }

    return (
        <div className="flex min-h-screen bg-westcoast-bg dark:bg-gray-900 font-sans">
            <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 bg-westcoast-dark rounded-full flex items-center justify-center font-bold text-white text-lg">A</div>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">Admin</p>
                        <p className="text-xs text-gray-500">{userData?.email}</p>
                    </div>
                </div>
                 <nav className="flex-grow space-y-2">
                     <NavButton view="dashboard" icon={<TrendingUp size={20}/>} label="Dashboard" selectedView={selectedView} onClick={() => setSelectedView('dashboard')} />
                     <NavButton view="users" icon={<Users size={20}/>} label="Users" selectedView={selectedView} onClick={() => setSelectedView('users')} />
                     <NavButton view="loans" icon={<Banknote size={20}/>} label="Loans" selectedView={selectedView} onClick={() => setSelectedView('loans')} />
                </nav>
                 <div>
                    <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <LogOut size={20}/>
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 p-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 capitalize">{selectedView}</h1>
                {renderView()}
            </main>

            {showManageBalanceModal && selectedUser && <ManageBalanceModal user={selectedUser} onClose={() => setShowManageBalanceModal(false)} onUpdate={handleUpdate} />}
            {showEditModal && selectedUser && <EditUserModal user={selectedUser} onClose={() => setShowEditModal(false)} onUpdate={handleUpdate} />}
            {showTransactionsModal && selectedUser && <UserTransactionsModal user={selectedUser} onClose={() => setShowTransactionsModal(false)} onUpdate={handleUpdate} />}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-westcoast-dark dark:text-white">Deactivate User Account</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Are you sure you want to deactivate <span className="font-semibold">{selectedUser.fullName}</span>? They will not be able to log in but their data will be preserved and can be restored later.</p>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg dark:bg-gray-600 dark:text-white">Cancel</button>
                            <button onClick={handleDeleteUser} disabled={loading} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Deactivating...' : 'Deactivate'}</button>
                        </div>
                    </div>
                </div>
            )}
            {showChatModal && selectedUser && <ChatModal user={selectedUser} onClose={() => setShowChatModal(false)} />}
            {selectedLoan && <LoanApprovalModal loan={selectedLoan.loan} user={selectedLoan.user} onClose={() => setSelectedLoan(null)} onUpdate={handleUpdate} />}
        </div>
    );
};

export default AdminDashboardPage;