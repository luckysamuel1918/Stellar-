import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from './DashboardLayout';
import { useAuth } from '../App';
import { updateUserProfile } from '../services/firebase';
import { UserProfile } from '../types';
import { Loader2, Edit, LogOut } from 'lucide-react';
import { Avatar } from './components';

const ProfileView: React.FC = () => {
    const { user, loading: userLoading, fetchData } = useDashboard();
    const { signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserProfile | null>(user);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    if (userLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>;
    if (!user || !formData) return <div className="p-4 text-center">Could not load user data.</div>;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (file.size > 1 * 1024 * 1024) { setError('File is too large. Max size is 1MB.'); return; }
        setUploading(true);
        setError('');
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                await updateUserProfile(user.uid, { photoURL: reader.result as string });
                fetchData();
            } catch (err) {
                setError(`Failed to upload picture.`);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const { uid, balance, isAdmin, createdAt, customerId, email, photoURL, ...updateData } = formData;
            await updateUserProfile(user.uid, updateData);
            setEditMode(false);
            fetchData();
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const InfoRow = ({ label, value, name, onChange, edit, type = "text", isReadOnly = false }) => (
        <div className="py-3 border-b border-gray-100 dark:border-gray-700 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
            <label htmlFor={name} className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
            {edit && !isReadOnly ? (
                <input type={type} name={name} id={name} value={value} onChange={onChange} className="mt-1 w-full px-3 py-1.5 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-gray-50 sm:mt-0 sm:col-span-2" />
            ) : (
                <p className="mt-1 font-semibold dark:text-white break-words sm:mt-0 sm:col-span-2">{value}</p>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-0">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-xl font-bold text-westcoast-text-dark dark:text-white mb-2 sm:mb-0 md:hidden">My Profile</h2>
                    {!editMode && <button onClick={() => setEditMode(true)} className="flex items-center justify-center gap-2 text-sm font-semibold bg-blue-50 dark:bg-blue-900/40 px-4 py-2 rounded-lg text-westcoast-blue self-start sm:self-center"><Edit size={16}/> Edit Profile</button>}
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                        <Avatar user={user} size="w-24 h-24 text-3xl" />
                        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} disabled={uploading} className="absolute -bottom-1 -right-1 bg-westcoast-blue text-white rounded-full p-2 hover:bg-opacity-90 disabled:bg-gray-400 transition-colors">
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                    <h3 className="text-2xl font-bold text-westcoast-text-dark dark:text-white">{user.fullName}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>

                <div className="mt-6 w-full text-sm">
                    <form onSubmit={handleSave}>
                        <div className="space-y-2">
                             <InfoRow label="Full Name" name="fullName" value={formData.fullName} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Email Address" name="email" value={formData.email} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                             <InfoRow label="Phone Number" name="phone" value={formData.phone} onChange={handleFormChange} edit={editMode} type="tel"/>
                             <InfoRow label="House Address" name="address" value={formData.address} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="State / Province" name="state" value={formData.state} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Country" name="country" value={formData.country} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                             <InfoRow label="Currency" name="currencyCode" value={formData.currencyCode} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                        </div>
                        
                        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}

                        {editMode ? (
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => { setEditMode(false); setFormData(user); }} className="w-full py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="w-full py-2 bg-westcoast-blue text-white font-semibold rounded-lg disabled:opacity-50 flex justify-center items-center">{saving ? <Loader2 className="animate-spin" /> : "Save Changes"}</button>
                            </div>
                        ) : (
                             <button onClick={signOut} className="md:hidden mt-6 w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors">
                                <LogOut size={18} />
                                Log Out
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;