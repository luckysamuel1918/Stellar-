// FIX: Imported `useRef` and `useCallback` to resolve 'Cannot find name' errors.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { 
    getAllUsers, adminUpdateBalance, updateUserProfile, adminDeleteUser,
    getUserTransactions, adminUpdateTransaction, getChatMessages, sendChatMessage,
    wipeChatHistory, Timestamp
} from '../services/firebase';
import { Users, DollarSign, Edit, Trash2, MessageSquare, Clock, X, Loader2, Send as SendIcon, AlertTriangle, Search, TrendingUp, ShieldOff, ShieldCheck, LogOut } from 'lucide-react';

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
                        <InputField label="Account Number" name="accountNumber" type="text" value={formData.accountNumber} onChange={handleChange} pattern="\d{10}" title="Account number must be 10 digits" />
                        <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
                    </div>
                    <InputField label="Address" name="address" value={formData.address} onChange={handleChange} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="State / Province" name="state" value={formData.state} onChange={handleChange} />
                        <InputField label="Country" name="country" value={formData.country} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <InputField label="Currency Code" name="currencyCode" value={formData.currencyCode} onChange={handleChange} />
                     </div>

                    <div className="flex items-center justify-between mt-4 p-3 bg-red-50 dark:bg-red-900/40 rounded-lg">
                        <label htmlFor="isSuspended" className="font-medium text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle size={18}/> Suspend Account</label>
                        <input id="isSuspended" name="isSuspended" type="checkbox" checked={!!formData.isSuspended} onChange={handleChange} className="h-5 w-5 rounded text-red-600 focus:ring-red-500 border-gray-300" />
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
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Transaction['status']>('completed');
    
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
        setStatus(tx.status);
        setDescription(tx.description || '');
    };
    
    const handleSave = async () => {
        const newTimestamp = Timestamp.fromDate(new Date(`${date}T${time}`));
        await adminUpdateTransaction(editingTx.id, { timestamp: newTimestamp, status, description });
        const updatedTxs = transactions.map(tx => tx.id === editingTx.id ? { ...tx, timestamp: newTimestamp, status, description } : tx);
        setTransactions(updatedTxs.sort((a, b) => {
            const aSeconds = (a.timestamp && a.timestamp.seconds) || 0;
            const bSeconds = (b.timestamp && b.timestamp.seconds) || 0;
            return bSeconds - aSeconds;
        }));
        setEditingTx(null);
    };

    return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold text-westcoast-dark dark:text-white mb-4">Transactions for {user.fullName}</h2>
                <div className="overflow-y-auto flex-grow pr-2">
                    {loading ? <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div> : (
                        <ul className="space-y-3">
                            {transactions.map(tx => (
                                <li key={tx.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    {editingTx && editingTx.id === tx.id ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500" />
                                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500" />
                                                <select value={status} onChange={e => setStatus(e.target.value as Transaction['status'])} className="px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500">
                                                    <option value="completed">Completed</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="failed">Failed</option>
                                                </select>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={description} 
                                                onChange={e => setDescription(e.target.value)} 
                                                placeholder="Transaction description"
                                                className="w-full mt-2 px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500" 
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingTx(null)} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-500 rounded">Cancel</button>
                                                <button onClick={handleSave} className="text-xs px-2 py-1 bg-westcoast-blue text-white rounded">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center flex-wrap gap-2">
                                            <div>
                                                <p className="font-semibold text-sm">{tx.description || 'Transaction'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{tx.timestamp.toDate().toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{tx.status}</span>
                                                <p className={`font-mono text-sm font-semibold ${tx.senderId === user.uid ? 'text-red-600' : 'text-green-600'}`}>{tx.senderId === user.uid ? '-' : '+'}{tx.amount.toFixed(2)}</p>
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
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
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
                                    <p className={`text-xs mt-1 ${msg.senderId === 'admin' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>{msg.timestamp && msg.timestamp.toDate().toLocaleTimeString()}</p>
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

const StatCard = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AdminDashboardPage: React.FC = () => {
    const { userData, signOut } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{type: string | null, user: UserProfile | null}>({ type: null, user: null });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Auto-logout for inactivity for admins.
        if (userData) {
            let inactivityTimer: number;

            const resetTimer = () => {
                clearTimeout(inactivityTimer);
                // Set a 5-minute timer. When it expires, call signOut.
                inactivityTimer = window.setTimeout(() => signOut(), 5 * 60 * 1000);
            };

            // List of events that indicate user activity.
            const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
            
            // Add event listeners for each activity type. Any of these will reset the timer.
            activityEvents.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
            
            // Initialize the timer when the component mounts.
            resetTimer();

            // Cleanup function to remove listeners and clear the timer when the component unmounts.
            return () => {
                clearTimeout(inactivityTimer);
                activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
            };
        }
    }, [userData, signOut]);

    const fetchUsers = useCallback(async () => {
        // setLoading(true); // Don't show loader on refresh
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

    const handleToggleSuspend = async (userToUpdate: UserProfile) => {
        const action = userToUpdate.isSuspended ? "unsuspend" : "suspend";
        if (window.confirm(`Are you sure you want to ${action} ${userToUpdate.fullName}?`)) {
            try {
                await updateUserProfile(userToUpdate.uid, { isSuspended: !userToUpdate.isSuspended });
                fetchUsers(); // Refresh the list
            } catch (error) {
                console.error(`Failed to ${action} user:`, error);
                alert(`Could not ${action} the user. Please try again.`);
            }
        }
    };
    
    const openModal = (type: string, user: UserProfile) => setModal({ type, user });
    const closeModal = () => setModal({ type: null, user: null });

    const filteredUsers = users.filter(user =>
        String(user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(user.accountNumber || '').includes(searchTerm)
    );

    if (loading) return <div className="flex justify-center items-center min-h-screen text-center p-10"><Loader2 className="w-10 h-10 animate-spin text-westcoast-blue"/></div>;

    const totalFunds = users.reduce((acc, user) => acc + (user.balance || 0), 0);

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
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-westcoast-dark dark:text-white">Admin Dashboard</h1>
                        <p className="text-westcoast-text-light dark:text-gray-300">Welcome, {userData && userData.fullName}!</p>
                    </div>
                    <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-westcoast-text-dark dark:text-white font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatCard title="Total Users" value={users.length} icon={<Users className="w-6 h-6 text-blue-600"/>} />
                    <StatCard title="Total Funds" value={totalFunds.toLocaleString('en-US', {style: 'currency', currency: 'USD', minimumFractionDigits: 0})} icon={<TrendingUp className="w-6 h-6 text-blue-600"/>} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-westcoast-dark dark:text-white">User Management</h2>
                        <div className="relative w-full sm:max-w-xs">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                             <input
                                type="text"
                                placeholder="Search by name, email, account..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-westcoast-blue focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase">
                                    <th className="py-3 px-4 font-semibold">Name</th>
                                    <th className="py-3 px-4 font-semibold hidden md:table-cell">Account No.</th>
                                    <th className="py-3 px-4 font-semibold text-right hidden md:table-cell">Balance</th>
                                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.uid} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar user={user} />
                                                <div>
                                                    <p className="font-semibold text-westcoast-text-dark dark:text-white flex items-center gap-2">
                                                        {user.fullName}
                                                        {user.isSuspended && (
                                                            <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
                                                                SUSPENDED
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-westcoast-text-light dark:text-gray-400">{user.email}</p>
                                                    <div className="mt-2 space-y-1 md:hidden">
                                                        <p className="text-xs"><span className="font-medium text-gray-500 dark:text-gray-400">Acc:</span> <span className="font-mono text-westcoast-text-light dark:text-gray-300">{user.accountNumber}</span></p>
                                                        <p className="text-xs"><span className="font-medium text-gray-500 dark:text-gray-400">Bal:</span> <span className="font-mono font-semibold dark:text-white">{(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user.currencyCode}</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-westcoast-text-light dark:text-gray-400 font-mono hidden md:table-cell">{user.accountNumber}</td>
                                        <td className="py-4 px-4 font-mono text-right font-semibold dark:text-white hidden md:table-cell">{(user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user.currencyCode}</td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center flex-wrap gap-1">
                                                 <button onClick={() => openModal('balance', user)} title="Manage Balance" className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><DollarSign size={18} /></button>
                                                 <button onClick={() => openModal('edit', user)} title="Edit Profile" className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"><Edit size={18} /></button>
                                                 <button onClick={() => openModal('transactions', user)} title="Manage Transactions" className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"><Clock size={18} /></button>
                                                 <button onClick={() => openModal('chat', user)} title="Chat with User" className="text-cyan-600 hover:text-cyan-800 p-2 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/50"><MessageSquare size={18} /></button>
                                                 <button onClick={() => handleToggleSuspend(user)} title={user.isSuspended ? "Unsuspend User" : "Suspend User"} className={`p-2 rounded-full ${user.isSuspended ? 'text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/50' : 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'}`}>{user.isSuspended ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}</button>
                                                 <button onClick={() => openModal('delete', user)} title="Delete User" className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredUsers.length === 0 && <p className="text-center py-8 text-gray-500">No users found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;