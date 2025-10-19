import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from './DashboardLayout';
import { useAuth } from '../App';
import { updateUserProfile } from '../services/firebase';
import { UserProfile } from '../types';
import { Loader2, Edit, LogOut } from 'lucide-react';
import { Avatar } from './components';

const countryData = [
    { name: 'Afghanistan', currency: 'AFN' },
    { name: 'Albania', currency: 'ALL' },
    { name: 'Algeria', currency: 'DZD' },
    { name: 'Andorra', currency: 'EUR' },
    { name: 'Angola', currency: 'AOA' },
    { name: 'Argentina', currency: 'ARS' },
    { name: 'Armenia', currency: 'AMD' },
    { name: 'Australia', currency: 'AUD' },
    { name: 'Austria', currency: 'EUR' },
    { name: 'Azerbaijan', currency: 'AZN' },
    { name: 'Bahamas', currency: 'BSD' },
    { name: 'Bahrain', currency: 'BHD' },
    { name: 'Bangladesh', currency: 'BDT' },
    { name: 'Barbados', currency: 'BBD' },
    { name: 'Belarus', currency: 'BYN' },
    { name: 'Belgium', currency: 'EUR' },
    { name: 'Belize', currency: 'BZD' },
    { name: 'Benin', currency: 'XOF' },
    { name: 'Bhutan', currency: 'BTN' },
    { name: 'Bolivia', currency: 'BOB' },
    { name: 'Bosnia and Herzegovina', currency: 'BAM' },
    { name: 'Botswana', currency: 'BWP' },
    { name: 'Brazil', currency: 'BRL' },
    { name: 'Brunei', currency: 'BND' },
    { name: 'Bulgaria', currency: 'BGN' },
    { name: 'Burkina Faso', currency: 'XOF' },
    { name: 'Burundi', currency: 'BIF' },
    { name: 'Cambodia', currency: 'KHR' },
    { name: 'Cameroon', currency: 'XAF' },
    { name: 'Canada', currency: 'CAD' },
    { name: 'Cape Verde', currency: 'CVE' },
    { name: 'Central African Republic', currency: 'XAF' },
    { name: 'Chad', currency: 'XAF' },
    { name: 'Chile', currency: 'CLP' },
    { name: 'China', currency: 'CNY' },
    { name: 'Colombia', currency: 'COP' },
    { name: 'Comoros', currency: 'KMF' },
    { name: 'Congo (Brazzaville)', currency: 'XAF' },
    { name: 'Congo (Kinshasa)', currency: 'CDF' },
    { name: 'Costa Rica', currency: 'CRC' },
    { name: 'Croatia', currency: 'EUR' },
    { name: 'Cuba', currency: 'CUP' },
    { name: 'Cyprus', currency: 'EUR' },
    { name: 'Czech Republic', currency: 'CZK' },
    { name: 'Denmark', currency: 'DKK' },
    { name: 'Djibouti', currency: 'DJF' },
    { name: 'Dominican Republic', currency: 'DOP' },
    { name: 'Ecuador', currency: 'USD' },
    { name: 'Egypt', currency: 'EGP' },
    { name: 'El Salvador', currency: 'USD' },
    { name: 'Equatorial Guinea', currency: 'XAF' },
    { name: 'Eritrea', currency: 'ERN' },
    { name: 'Estonia', currency: 'EUR' },
    { name: 'Ethiopia', currency: 'ETB' },
    { name: 'Fiji', currency: 'FJD' },
    { name: 'Finland', currency: 'EUR' },
    { name: 'France', currency: 'EUR' },
    { name: 'Gabon', currency: 'XAF' },
    { name: 'Gambia', currency: 'GMD' },
    { name: 'Georgia', currency: 'GEL' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Ghana', currency: 'GHS' },
    { name: 'Greece', currency: 'EUR' },
    { name: 'Guatemala', currency: 'GTQ' },
    { name: 'Guinea', currency: 'GNF' },
    { name: 'Guinea-Bissau', currency: 'XOF' },
    { name: 'Guyana', currency: 'GYD' },
    { name: 'Haiti', currency: 'HTG' },
    { name: 'Honduras', currency: 'HNL' },
    { name: 'Hungary', currency: 'HUF' },
    { name: 'Iceland', currency: 'ISK' },
    { name: 'India', currency: 'INR' },
    { name: 'Indonesia', currency: 'IDR' },
    { name: 'Iran', currency: 'IRR' },
    { name: 'Iraq', currency: 'IQD' },
    { name: 'Ireland', currency: 'EUR' },
    { name: 'Israel', currency: 'ILS' },
    { name: 'Italy', currency: 'EUR' },
    { name: 'Ivory Coast', currency: 'XOF' },
    { name: 'Jamaica', currency: 'JMD' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Jordan', currency: 'JOD' },
    { name: 'Kazakhstan', currency: 'KZT' },
    { name: 'Kenya', currency: 'KES' },
    { name: 'Kuwait', currency: 'KWD' },
    { name: 'Kyrgyzstan', currency: 'KGS' },
    { name: 'Laos', currency: 'LAK' },
    { name: 'Latvia', currency: 'EUR' },
    { name: 'Lebanon', currency: 'LBP' },
    { name: 'Lesotho', currency: 'LSL' },
    { name: 'Liberia', currency: 'LRD' },
    { name: 'Libya', currency: 'LYD' },
    { name: 'Liechtenstein', currency: 'CHF' },
    { name: 'Lithuania', currency: 'EUR' },
    { name: 'Luxembourg', currency: 'EUR' },
    { name: 'Madagascar', currency: 'MGA' },
    { name: 'Malawi', currency: 'MWK' },
    { name: 'Malaysia', currency: 'MYR' },
    { name: 'Maldives', currency: 'MVR' },
    { name: 'Mali', currency: 'XOF' },
    { name: 'Malta', currency: 'EUR' },
    { name: 'Mauritania', currency: 'MRU' },
    { name: 'Mauritius', currency: 'MUR' },
    { name: 'Mexico', currency: 'MXN' },
    { name: 'Moldova', currency: 'MDL' },
    { name: 'Monaco', currency: 'EUR' },
    { name: 'Mongolia', currency: 'MNT' },
    { name: 'Montenegro', currency: 'EUR' },
    { name: 'Morocco', currency: 'MAD' },
    { name: 'Mozambique', currency: 'MZN' },
    { name: 'Myanmar', currency: 'MMK' },
    { name: 'Namibia', currency: 'NAD' },
    { name: 'Nepal', currency: 'NPR' },
    { name: 'Netherlands', currency: 'EUR' },
    { name: 'New Zealand', currency: 'NZD' },
    { name: 'Nicaragua', currency: 'NIO' },
    { name: 'Niger', currency: 'XOF' },
    { name: 'Nigeria', currency: 'NGN' },
    { name: 'North Korea', currency: 'KPW' },
    { name: 'North Macedonia', currency: 'MKD' },
    { name: 'Norway', currency: 'NOK' },
    { name: 'Oman', currency: 'OMR' },
    { name: 'Pakistan', currency: 'PKR' },
    { name: 'Panama', currency: 'PAB' },
    { name: 'Papua New Guinea', currency: 'PGK' },
    { name: 'Paraguay', currency: 'PYG' },
    { name: 'Peru', currency: 'PEN' },
    { name: 'Philippines', currency: 'PHP' },
    { name: 'Poland', currency: 'PLN' },
    { name: 'Portugal', currency: 'EUR' },
    { name: 'Qatar', currency: 'QAR' },
    { name: 'Romania', currency: 'RON' },
    { name: 'Russia', currency: 'RUB' },
    { name: 'Rwanda', currency: 'RWF' },
    { name: 'San Marino', currency: 'EUR' },
    { name: 'Sao Tome and Principe', currency: 'STN' },
    { name: 'Saudi Arabia', currency: 'SAR' },
    { name: 'Senegal', currency: 'XOF' },
    { name: 'Serbia', currency: 'RSD' },
    { name: 'Sierra Leone', currency: 'SLL' },
    { name: 'Singapore', currency: 'SGD' },
    { name: 'Slovakia', currency: 'EUR' },
    { name: 'Slovenia', currency: 'EUR' },
    { name: 'Somalia', currency: 'SOS' },
    { name: 'South Africa', currency: 'ZAR' },
    { name: 'South Korea', currency: 'KRW' },
    { name: 'South Sudan', currency: 'SSP' },
    { name: 'Spain', currency: 'EUR' },
    { name: 'Sri Lanka', currency: 'LKR' },
    { name: 'Sudan', currency: 'SDG' },
    { name: 'Sweden', currency: 'SEK' },
    { name: 'Switzerland', currency: 'CHF' },
    { name: 'Syria', currency: 'SYP' },
    { name: 'Taiwan', currency: 'TWD' },
    { name: 'Tajikistan', currency: 'TJS' },
    { name: 'Tanzania', currency: 'TZS' },
    { name: 'Thailand', currency: 'THB' },
    { name: 'Timor-Leste', currency: 'USD' },
    { name: 'Togo', currency: 'XOF' },
    { name: 'Tonga', currency: 'TOP' },
    { name: 'Trinidad and Tobago', currency: 'TTD' },
    { name: 'Tunisia', currency: 'TND' },
    { name: 'Turkey', currency: 'TRY' },
    { name: 'Turkmenistan', currency: 'TMT' },
    { name: 'Uganda', currency: 'UGX' },
    { name: 'Ukraine', currency: 'UAH' },
    { name: 'United Arab Emirates', currency: 'AED' },
    { name: 'United Kingdom', currency: 'GBP' },
    { name: 'United States', currency: 'USD' },
    { name: 'Uruguay', currency: 'UYU' },
    { name: 'Uzbekistan', currency: 'UZS' },
    { name: 'Venezuela', currency: 'VES' },
    { name: 'Vietnam', currency: 'VND' },
    { name: 'Yemen', currency: 'YER' },
    { name: 'Zambia', currency: 'ZMW' },
    { name: 'Zimbabwe', currency: 'ZWL' },
];

const InfoRow = ({ label, value, name, onChange, edit, type = "text", isReadOnly = false }) => (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
        <label htmlFor={name} className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
        {edit && !isReadOnly ? (
            <input type={type} name={name} id={name} value={value || ''} onChange={onChange} className="mt-1 w-full px-3 py-1.5 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-gray-50 sm:mt-0 sm:col-span-2" />
        ) : (
            <p className="mt-1 font-semibold dark:text-white break-words sm:mt-0 sm:col-span-2">{value}</p>
        )}
    </div>
);

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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(currentFormData => {
            if (!currentFormData) return null;

            const { name, value } = e.target;
            const newFormData = { ...currentFormData, [name]: value };

            if (name === 'country') {
                const selectedCountry = countryData.find(c => c.name === value);
                if (selectedCountry) {
                    newFormData.currencyCode = selectedCountry.currency;
                }
            }
            return newFormData;
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setSaving(true);
        setError('');
        try {
            // FIX: Explicitly create the update object with only editable fields.
            // This prevents issues with the previous destructuring logic and ensures
            // only the intended data is sent to Firestore for a permanent save.
            const dataToUpdate: Partial<UserProfile> = {
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                occupation: formData.occupation,
                maritalStatus: formData.maritalStatus,
                address: formData.address,
                state: formData.state,
                zipCode: formData.zipCode,
                country: formData.country,
                currencyCode: formData.currencyCode,
            };

            await updateUserProfile(user.uid, dataToUpdate);
            setEditMode(false);
            await fetchData(); // Await fetch to ensure data is fresh before re-render
        } catch (err) {
            console.error(err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
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
                             <InfoRow label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleFormChange} edit={editMode} type="date"/>
                             <InfoRow label="Occupation" name="occupation" value={formData.occupation || ''} onChange={handleFormChange} edit={editMode} />
                             
                             <div className="py-3 border-b border-gray-100 dark:border-gray-700 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                                 <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Marital Status</label>
                                 {editMode ? (
                                     <select name="maritalStatus" id="maritalStatus" value={formData.maritalStatus || ''} onChange={handleFormChange} className="mt-1 w-full px-3 py-1.5 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-gray-50 sm:mt-0 sm:col-span-2">
                                         <option value="Single">Single</option>
                                         <option value="Married">Married</option>
                                         <option value="Divorced">Divorced</option>
                                         <option value="Widowed">Widowed</option>
                                     </select>
                                 ) : (
                                     <p className="mt-1 font-semibold dark:text-white break-words sm:mt-0 sm:col-span-2">{formData.maritalStatus || ''}</p>
                                 )}
                             </div>

                             <InfoRow label="House Address" name="address" value={formData.address} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="State / Province" name="state" value={formData.state} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Zip Code" name="zipCode" value={formData.zipCode || ''} onChange={handleFormChange} edit={editMode} />
                             <div className="py-3 border-b border-gray-100 dark:border-gray-700 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center">
                                <label htmlFor="country" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                                {editMode ? (
                                    <select name="country" id="country" value={formData.country} onChange={handleFormChange} className="mt-1 w-full px-3 py-1.5 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-gray-50 sm:mt-0 sm:col-span-2">
                                        {countryData.sort((a,b) => a.name.localeCompare(b.name)).map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
                                    </select>
                                ) : (
                                    <p className="mt-1 font-semibold dark:text-white break-words sm:mt-0 sm:col-span-2">{formData.country}</p>
                                )}
                            </div>
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
