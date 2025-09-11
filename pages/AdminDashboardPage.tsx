



import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { 
    getAllUsers, adminUpdateBalance, updateUserProfile, adminDeleteUser,
    getUserTransactions, adminUpdateTransaction, getChatMessages, sendChatMessage,
    wipeChatHistory
} from '../services/firebase';
import firebase from "firebase/compat/app";
import { Users, DollarSign, Edit, Trash2, MessageSquare, Clock, X, Loader2, Send as SendIcon, AlertTriangle } from 'lucide-react';

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
            const customTimestamp = firebase.firestore.Timestamp.fromDate(dateTime);
            await adminUpdateBalance(user, numAmount, type, description || `Admin ${type}`, senderName, customTimestamp);
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
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={`Admin ${type}`} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
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

const EditUserModal = ({ user, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ ...user });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-6">Edit User Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
                    <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                    <p className="text-xs text-yellow-600 -mt-2 ml-1">Note: This only changes the database record, not the login email.</p>
                    <InputField label="Account Number" name="accountNumber" type="text" value={formData.accountNumber} onChange={handleChange} pattern="\d{10}" title="Account number must be 10 digits" />
                    <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                    <InputField label="Address" name="address" value={formData.address} onChange={handleChange} />
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
const InputField = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">{label}</label>
        <input {...props} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
    </div>
);

const DeleteUserModal = ({ user, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await adminDeleteUser(user.uid);
            onUpdate();
        } catch(err) {
            setError('Failed to delete user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white">Confirm Deletion</h2>
                <p className="text-westcoast-text-light dark:text-gray-300 my-4">Are you sure you want to permanently delete <span className="font-bold">{user.fullName}</span>? This will also remove all their transactions and chat history. This action cannot be undone.</p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <div className="flex justify-center space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg dark:bg-gray-600 dark:text-white">Cancel</button>
                    <button onClick={handleDelete} disabled={loading} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Deleting...' : 'Delete User'}</button>
                </div>
            </div>
        </div>
    );
};

const ManageTransactionsModal = ({ user, onClose }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTx, setEditingTx] = useState(null);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    
    useEffect(() => {
        getUserTransactions(user.uid).then(txs => {
            setTransactions(txs);
            setLoading(false);
        });
    }, [user.uid]);
    
    const handleEditClick = (tx) => {
        const txDate = tx.timestamp.toDate();
        setEditingTx(tx);
        setDate(txDate.toISOString().split('T')[0]);
        setTime(txDate.toTimeString().substring(0, 5));
    };
    
    const handleSave = async () => {
        const newTimestamp = firebase.firestore.Timestamp.fromDate(new Date(`${date}T${time}`));
        await adminUpdateTransaction(editingTx.id, { timestamp: newTimestamp });
        const updatedTxs = transactions.map(tx => tx.id === editingTx.id ? { ...tx, timestamp: newTimestamp } : tx);
        setTransactions(updatedTxs);
        setEditingTx(null);
    };

    return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-4">Transactions for {user.fullName}</h2>
                <div className="overflow-y-auto flex-grow">
                    {loading ? <p>Loading...</p> : (
                        <ul className="space-y-3">
                            {transactions.map(tx => (
                                <li key={tx.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    {editingTx?.id === tx.id ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500" />
                                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500" />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingTx(null)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-500 rounded">Cancel</button>
                                                <button onClick={handleSave} className="text-xs px-2 py-1 bg-westcoast-blue text-white rounded">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold">{tx.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{tx.timestamp.toDate().toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-mono">{tx.amount.toFixed(2)}</p>
                                                <button onClick={() => handleEditClick(tx)}><Edit size={16} className="text-gray-500 hover:text-westcoast-blue" /></button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-semibold">Close</button>
            </div>
        </div>
    );
};

const ChatModal = ({ user, admin, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        const unsubscribe = getChatMessages(user.uid, setMessages);
        return () => unsubscribe();
    }, [user.uid]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setLoading(true);
        await sendChatMessage(user.uid, {
            text: newMessage,
            senderId: 'admin',
            senderName: admin.fullName
        });
        setNewMessage('');
        setLoading(false);
    };

    const handleWipe = async () => {
        if (window.confirm(`Are you sure you want to delete all chat history for ${user.fullName}?`)) {
            await wipeChatHistory(user.uid);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col">
                <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-westcoast-dark dark:text-white">Chat with {user.fullName}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">User ID: {user.uid}</p>
                    </div>
                    <div>
                        <button onClick={handleWipe} className="mr-4 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={18} /></button>
                        <button onClick={onClose} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
                    </div>
                </header>
                <main className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-4">
                        {messages.map(msg => (
                             <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                 <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderId === 'admin' ? 'bg-westcoast-blue text-white' : 'bg-gray-200 text-black dark:bg-gray-700 dark:text-white'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <p className={`text-xs mt-1 ${msg.senderId === 'admin' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{msg.timestamp?.toDate().toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t dark:border-gray-700">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-westcoast-blue dark:bg-gray-700 dark:border-gray-600" />
                        <button type="submit" disabled={loading} className="bg-westcoast-blue text-white rounded-full p-3 disabled:opacity-50"><SendIcon size={18} /></button>
                    </form>
                </footer>
            </div>
        </div>
    );
};


const AdminDashboardPage: React.FC = () => {
    const { userData } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{type: string | null, user: UserProfile | null}>({ type: null, user: null });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => !u.isAdmin));
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleUpdateSuccess = () => {
        setModal({ type: null, user: null });
        fetchUsers();
    };
    
    const openModal = (type: string, user: UserProfile) => setModal({ type, user });
    const closeModal = () => setModal({ type: null, user: null });

    if (loading) return <div className="text-center p-10">Loading admin dashboard...</div>;

    const renderModal = () => {
        if (!modal.user) return null;
        switch(modal.type) {
            case 'balance': return <ManageBalanceModal user={modal.user} onClose={closeModal} onUpdate={handleUpdateSuccess} />;
            case 'edit': return <EditUserModal user={modal.user} onClose={closeModal} onUpdate={handleUpdateSuccess} />;
            case 'delete': return <DeleteUserModal user={modal.user} onClose={closeModal} onUpdate={handleUpdateSuccess} />;
            case 'transactions': return <ManageTransactionsModal user={modal.user} onClose={closeModal} />;
            case 'chat': return <ChatModal user={modal.user} admin={userData} onClose={closeModal} />;
            default: return null;
        }
    }

    return (
        <div className="bg-westcoast-bg dark:bg-gray-900 min-h-screen p-4 sm:p-6 md:p-8">
            {renderModal()}
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-westcoast-dark dark:text-white">Admin Dashboard</h1>
                    <p className="text-westcoast-text-light dark:text-gray-300">Welcome, {userData?.fullName}!</p>
                </header>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-4">User Management</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase">
                                    <th className="py-2 px-4 font-semibold">Name</th>
                                    <th className="py-2 px-4 font-semibold">Account No.</th>
                                    <th className="py-2 px-4 font-semibold text-right">Balance</th>
                                    <th className="py-2 px-4 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-westcoast-text-dark dark:text-white">{user.fullName}</p>
                                            <p className="text-sm text-westcoast-text-light dark:text-gray-400">{user.email}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-westcoast-text-light dark:text-gray-400 font-mono">{user.accountNumber}</td>
                                        <td className="py-3 px-4 font-mono text-right font-semibold dark:text-white">{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user.currencyCode}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                 <button onClick={() => openModal('balance', user)} title="Manage Balance" className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><DollarSign size={18} /></button>
                                                 <button onClick={() => openModal('edit', user)} title="Edit Profile" className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><Edit size={18} /></button>
                                                 <button onClick={() => openModal('transactions', user)} title="Manage Transactions" className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"><Clock size={18} /></button>
                                                 <button onClick={() => openModal('chat', user)} title="Chat with User" className="text-cyan-600 hover:text-cyan-800 p-2 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/50"><MessageSquare size={18} /></button>
                                                 <button onClick={() => openModal('delete', user)} title="Delete User" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;