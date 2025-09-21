import React, { useState } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
// FIX: Import `createUserWithEmailAndPassword` for correct Firebase auth usage.
import { auth, createUserProfileDocument, createUserWithEmailAndPassword } from '../services/firebase';
// FIX: Changed to namespace import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';

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
    { name: 'Botswana', currency: 'BWP' },
    { name: 'Brazil', currency: 'BRL' },
    { name: 'Bulgaria', currency: 'BGN' },
    { name: 'Cambodia', currency: 'KHR' },
    { name: 'Cameroon', currency: 'XAF' },
    { name: 'Canada', currency: 'CAD' },
    { name: 'Chile', currency: 'CLP' },
    { name: 'China', currency: 'CNY' },
    { name: 'Colombia', currency: 'COP' },
    { name: 'Costa Rica', currency: 'CRC' },
    { name: 'Croatia', currency: 'EUR' },
    { name: 'Cuba', currency: 'CUP' },
    { name: 'Cyprus', currency: 'EUR' },
    { name: 'Czech Republic', currency: 'CZK' },
    { name: 'Denmark', currency: 'DKK' },
    { name: 'Dominican Republic', currency: 'DOP' },
    { name: 'Ecuador', currency: 'USD' },
    { name: 'Egypt', currency: 'EGP' },
    { name: 'El Salvador', currency: 'USD' },
    { name: 'Estonia', currency: 'EUR' },
    { name: 'Ethiopia', currency: 'ETB' },
    { name: 'Fiji', currency: 'FJD' },
    { name: 'Finland', currency: 'EUR' },
    { name: 'France', currency: 'EUR' },
    { name: 'Gabon', currency: 'XAF' },
    { name: 'Georgia', currency: 'GEL' },
    { name: 'Germany', currency: 'EUR' },
    { name: 'Ghana', currency: 'GHS' },
    { name: 'Greece', currency: 'EUR' },
    { name: 'Guatemala', currency: 'GTQ' },
    { name: 'Honduras', currency: 'HNL' },
    { name: 'Hong Kong', currency: 'HKD' },
    { name: 'Hungary', currency: 'HUF' },
    { name: 'Iceland', currency: 'ISK' },
    { name: 'India', currency: 'INR' },
    { name: 'Indonesia', currency: 'IDR' },
    { name: 'Iran', currency: 'IRR' },
    { name: 'Iraq', currency: 'IQD' },
    { name: 'Ireland', currency: 'EUR' },
    { name: 'Israel', currency: 'ILS' },
    { name: 'Italy', currency: 'EUR' },
    { name: 'Jamaica', currency: 'JMD' },
    { name: 'Japan', currency: 'JPY' },
    { name: 'Jordan', currency: 'JOD' },
    { name: 'Kazakhstan', currency: 'KZT' },
    { name: 'Kenya', currency: 'KES' },
    { name: 'Kuwait', currency: 'KWD' },
    { name: 'Latvia', currency: 'EUR' },
    { name: 'Lebanon', currency: 'LBP' },
    { name: 'Libya', currency: 'LYD' },
    { name: 'Liechtenstein', currency: 'CHF' },
    { name: 'Lithuania', currency: 'EUR' },
    { name: 'Luxembourg', currency: 'EUR' },
    { name: 'Malaysia', currency: 'MYR' },
    { name: 'Maldives', currency: 'MVR' },
    { name: 'Malta', currency: 'EUR' },
    { name: 'Mauritius', currency: 'MUR' },
    { name: 'Mexico', currency: 'MXN' },
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
    { name: 'Nigeria', currency: 'NGN' },
    { name: 'North Korea', currency: 'KPW' },
    { name: 'North Macedonia', currency: 'MKD' },
    { name: 'Norway', currency: 'NOK' },
    { name: 'Oman', currency: 'OMR' },
    { name: 'Pakistan', currency: 'PKR' },
    { name: 'Panama', currency: 'PAB' },
    { name: 'Paraguay', currency: 'PYG' },
    { name: 'Peru', currency: 'PEN' },
    { name: 'Philippines', currency: 'PHP' },
    { name: 'Poland', currency: 'PLN' },
    { name: 'Portugal', currency: 'EUR' },
    { name: 'Qatar', currency: 'QAR' },
    { name: 'Romania', currency: 'RON' },
    { name: 'Russia', currency: 'RUB' },
    { name: 'San Marino', currency: 'EUR' },
    { name: 'Saudi Arabia', currency: 'SAR' },
    { name: 'Senegal', currency: 'XOF' },
    { name: 'Serbia', currency: 'RSD' },
    { name: 'Singapore', currency: 'SGD' },
    { name: 'Slovakia', currency: 'EUR' },
    { name: 'Slovenia', currency: 'EUR' },
    { name: 'Somalia', currency: 'SOS' },
    { name: 'South Africa', currency: 'ZAR' },
    { name: 'South Korea', currency: 'KRW' },
    { name: 'Spain', currency: 'EUR' },
    { name: 'Sri Lanka', currency: 'LKR' },
    { name: 'Sudan', currency: 'SDG' },
    { name: 'Sweden', currency: 'SEK' },
    { name: 'Switzerland', currency: 'CHF' },
    { name: 'Syria', currency: 'SYP' },
    { name: 'Taiwan', currency: 'TWD' },
    { name: 'Tanzania', currency: 'TZS' },
    { name: 'Thailand', currency: 'THB' },
    { name: 'Trinidad and Tobago', currency: 'TTD' },
    { name: 'Tunisia', currency: 'TND' },
    { name: 'Turkey', currency: 'TRY' },
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


const InputField = ({ id, label, error, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">{label}</label>
    <input id={id} {...props} className={`w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white ${error ? 'border-red-500' : 'border-gray-300'}`} />
    <div className="min-h-[20px]">
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  </div>
);

const SelectField = ({ id, label, error, children, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-westcoast-text-light dark:text-gray-300">{label}</label>
    <select id={id} {...props} className={`w-full px-4 py-2 mt-1 border rounded-lg shadow-sm focus:ring-westcoast-blue focus:border-westcoast-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
      {children}
    </select>
    <div className="min-h-[20px]">
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  </div>
);

const SignupWizard: React.FC<{ onLoginSwitch: () => void }> = ({ onLoginSwitch }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', address: '', state: '', country: '', currencyCode: '',
        password: '', confirmPassword: '', pin: '',
        maritalStatus: '', occupation: '', dateOfBirth: '', zipCode: ''
    });
    const [errors, setErrors] = useState<any>({});
    const [accountNumber, setAccountNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [firebaseError, setFirebaseError] = useState('');
    const navigate = ReactRouterDOM.useNavigate();

    const validateStep = () => {
        const newErrors: any = {};
        if (step === 1) {
            if (!formData.fullName) newErrors.fullName = 'Full name is required.';
            if (!formData.email) newErrors.email = 'Email is required.'; else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid.';
            if (!formData.phone) newErrors.phone = 'Phone number is required.'; else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) newErrors.phone = 'Phone number is invalid.';
        } else if (step === 2) {
            if (!formData.address) newErrors.address = 'House address is required.';
            if (!formData.state) newErrors.state = 'State is required.';
            if (!formData.country) newErrors.country = 'Country is required.';
            if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital status is required.';
            if (!formData.occupation) newErrors.occupation = 'Occupation is required.';
            if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
            if (!formData.zipCode) newErrors.zipCode = 'Zip code is required.';
        } else if (step === 3) {
            if (!formData.password) newErrors.password = 'Password is required.'; else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
            if (!formData.pin) newErrors.pin = '4-digit PIN is required.'; else if (!/^\d{4}$/.test(formData.pin)) newErrors.pin = 'PIN must be exactly 4 digits.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
    const handleBack = () => { setStep(s => s - 1); };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        const newFormData = { ...formData, [id]: value };
        if (id === 'country') {
            const selectedCountry = countryData.find(c => c.name === value);
            newFormData.currencyCode = selectedCountry ? selectedCountry.currency : '';
        }
        setFormData(newFormData);
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validateStep()) {
            setLoading(true);
            setFirebaseError('');
            try {
                // FIX: Use `createUserWithEmailAndPassword` as a function, passing `auth` as the first argument.
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const { user } = userCredential;
                const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                setAccountNumber(newAccountNumber);
                await createUserProfileDocument(user, { ...formData, accountNumber: newAccountNumber });
                setStep(4);
            } catch (error: any) {
                if(error.code === 'auth/email-already-in-use') {
                    setFirebaseError('This email address is already in use.');
                } else {
                    setFirebaseError('Failed to create account. Please try again.');
                }
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    const ProgressTracker = () => (
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-center text-westcoast-dark dark:text-white mb-2">Open a Westcoast Account</h2>
            <p className="text-center text-westcoast-text-light dark:text-gray-300 font-semibold">{`Step ${step} of 3`}</p>
            <div className="flex mt-4">
                {[1, 2, 3].map(s => (<div key={s} className="w-1/3 px-1"><div className={`h-2 rounded-full ${step >= s ? 'bg-westcoast-blue' : 'bg-gray-200 dark:bg-gray-600'}`}></div></div>))}
            </div>
        </div>
    );

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-westcoast-bg dark:bg-gray-900 p-2 sm:p-4">
            <div className="w-full max-w-xl p-6 sm:p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                {step < 4 ? <ProgressTracker /> : null}
                {firebaseError && <p className="text-sm text-red-600 text-center mb-4">{firebaseError}</p>}

                {step === 1 && <div className="space-y-4">
                    <InputField id="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} error={errors.fullName} required />
                    <InputField id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
                    <InputField id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} error={errors.phone} required placeholder="+1234567890" />
                </div>}

                {step === 2 && <div className="space-y-4">
                    <InputField id="address" label="House Address" value={formData.address} onChange={handleChange} error={errors.address} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField id="state" label="State / Province" value={formData.state} onChange={handleChange} error={errors.state} required />
                        <InputField id="zipCode" label="Zip Code" value={formData.zipCode} onChange={handleChange} error={errors.zipCode} required />
                    </div>
                     <SelectField id="country" label="Country" value={formData.country} onChange={handleChange} error={errors.country} required>
                        <option value="">Select a country</option>
                        {countryData.sort((a,b) => a.name.localeCompare(b.name)).map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
                    </SelectField>
                    {formData.currencyCode && <p className="text-sm text-westcoast-text-light dark:text-gray-300">Selected Currency: <span className="font-bold">{formData.currencyCode}</span></p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField id="occupation" label="Occupation" value={formData.occupation} onChange={handleChange} error={errors.occupation} required />
                        <InputField id="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} required />
                    </div>
                    <SelectField id="maritalStatus" label="Marital Status" value={formData.maritalStatus} onChange={handleChange} error={errors.maritalStatus} required>
                        <option value="">Select status...</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </SelectField>
                </div>}
                
                {step === 3 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField id="password" label="Password" type="password" value={formData.password} onChange={handleChange} error={errors.password} required />
                    <InputField id="confirmPassword" label="Confirm Password" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
                    <div className="md:col-span-2"><InputField id="pin" label="4-Digit Security PIN" type="number" value={formData.pin} onChange={handleChange} error={errors.pin} required maxLength="4" pattern="\d{4}" /></div>
                </div>}

                {step === 4 && <div className="text-center py-8">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-westcoast-dark dark:text-white mb-2">Account Created Successfully!</h2>
                    <p className="text-westcoast-text-light dark:text-gray-300 mb-6">Your new account is ready. Welcome to Westcoast.</p>
                    <div className="bg-westcoast-bg dark:bg-gray-700 p-4 rounded-lg"><p className="text-sm text-westcoast-text-light dark:text-gray-300">Your Account Number</p><p className="text-2xl font-mono font-bold text-westcoast-blue tracking-widest">{accountNumber}</p></div>
                     <button onClick={() => navigate('/dashboard')} className="mt-8 px-6 py-3 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90">Go to Dashboard</button>
                </div>}

                {step < 4 && <div className="flex justify-between items-center pt-6">
                    <div>{step > 1 && <button onClick={handleBack} className="flex items-center px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"><ArrowLeft className="w-4 h-4 mr-2" /> Back</button>}</div>
                    <button type="button" onClick={onLoginSwitch} className="text-sm font-medium text-westcoast-blue hover:underline">Already have an account?</button>
                    {step < 3 ? <button onClick={handleNext} className="flex items-center px-4 py-2 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90">Next <ArrowRight className="w-4 h-4 ml-2" /></button>
                     : <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90 disabled:opacity-50">{loading ? 'Creating Account...' : 'Create Account'}</button>}
                </div>}
            </div>
        </div>
    );
};

export default SignupWizard;