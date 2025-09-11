import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { UserProfile } from '../types';
import { getAllUsers, adminUpdateBalance } from '../services/firebase';
import { Users, DollarSign, Edit } from 'lucide-react';

const ManageBalanceModal: React.FC<{ user: UserProfile; onClose: () => void; onUpdate: () => void; }> = ({ user, onClose, onUpdate }) => {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'credit' | 'debit'>('credit');
    const [description, setDescription] = useState('');
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
            await adminUpdateBalance(user, numAmount, type, description || `Admin ${type}`);
            onUpdate();
        } catch (err: any) {
            setError(err.message || 'Failed to update balance.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-stellar-dark mb-2">Manage Balance</h2>
                <p className="text-stellar-text-light mb-6">For <span className="font-semibold">{user.fullName}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Transaction Type</label>
                        <select value={type} onChange={e => setType(e.target.value as 'credit' | 'debit')} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="credit">Credit (Add Funds)</option>
                            <option value="debit">Debit (Remove Funds)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Amount ({user.currencyCode})</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-stellar-text-light">Description</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={`Admin ${type}`} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-stellar-blue text-white font-semibold rounded-lg disabled:opacity-50">{loading ? 'Processing...' : 'Update Balance'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboardPage: React.FC = () => {
    const { userData } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(allUsers.filter(u => !u.isAdmin)); // Exclude other admins
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
        setSelectedUser(null);
        fetchUsers();
    };

    if (loading) return <div className="text-center p-10">Loading admin dashboard...</div>;

    return (
        <div className="bg-stellar-bg min-h-[calc(100vh-150px)] p-4 sm:p-6 md:p-8">
            {selectedUser && <ManageBalanceModal user={selectedUser} onClose={() => setSelectedUser(null)} onUpdate={handleUpdateSuccess} />}
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-stellar-dark">Admin Dashboard</h1>
                    <p className="text-stellar-text-light">Welcome, {userData?.fullName}!</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-md flex items-center">
                        <div className="bg-stellar-blue/10 p-4 rounded-full mr-4"><Users className="text-stellar-blue"/></div>
                        <div>
                            <p className="text-sm font-medium text-stellar-text-light">Total Users</p>
                            <p className="text-3xl font-bold text-stellar-text-dark">{users.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-stellar-dark mb-4">User Management</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-400 uppercase">
                                    <th className="py-2 px-4 font-semibold">Name</th>
                                    <th className="py-2 px-4 font-semibold">Email</th>
                                    <th className="py-2 px-4 font-semibold">Account No.</th>
                                    <th className="py-2 px-4 font-semibold text-right">Balance</th>
                                    <th className="py-2 px-4 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid} className="border-b border-gray-100 last:border-0">
                                        <td className="py-4 px-4 font-semibold text-stellar-text-dark">{user.fullName}</td>
                                        <td className="py-4 px-4 text-sm text-stellar-text-light">{user.email}</td>
                                        <td className="py-4 px-4 text-sm text-stellar-text-light font-mono">{user.accountNumber}</td>
                                        <td className="py-4 px-4 font-mono text-right font-semibold">{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {user.currencyCode}</td>
                                        <td className="py-4 px-4 text-center">
                                            <button onClick={() => setSelectedUser(user)} className="text-stellar-blue hover:text-stellar-accent p-1">
                                                <Edit size={18} />
                                            </button>
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
