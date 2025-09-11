import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { 
    getUserData, getUserTransactions, getUserByAccountNumber, 
    performTransfer, adminUpdateBalance,
    updateUserProfile, generateAndSendOtp, verifyOtp, deleteOtp
} from '../services/firebase';
import { 
    Bell, MessageSquare, CreditCard, Send, Globe, ClipboardCheck, History,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Home, User as UserIcon,
    X, Loader2, UploadCloud, Banknote, ShieldCheck, Edit, Lock, Mail, Snowflake,
    AlertTriangle, Eye, Receipt, Printer, LogOut
} from 'lucide-react';
import { WestcoastLogo } from '../components/icons';

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

// --- MODAL & VIEW COMPONENTS ---

const ReceiptView = ({ receiptData, user, onClose, isInternational = false, bankDetails }) => {
    const printReceipt = () => window.print();

    return (
        <div className="text-center">
             <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #receipt-content, #receipt-content * { visibility: visible; }
                    #receipt-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div id="receipt-content" className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg text-left text-sm">
                <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6">
                    {/* Paid Stamp */}
                    <div className="absolute top-8 right-8 transform rotate-12 no-print">
                        <div className="border-4 border-green-500 text-green-500 rounded-full w-24 h-24 flex items-center justify-center font-black text-2xl uppercase opacity-70">
                            Paid
                        </div>
                    </div>
                    {/* Header */}
                    <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-600">
                        <div>
                            <WestcoastLogo />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">123 Finance St, Suite 100, San Francisco, CA 94105</p>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Transaction Receipt</span>
                    </div>

                    {/* Summary */}
                    <div className="text-center my-8">
                        <p className="text-gray-500 dark:text-gray-400">Amount Sent</p>
                        <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tighter break-all">{formatCurrency(receiptData.amount, user.currencyCode)}</p>
                        <div className="inline-flex items-center gap-2 mt-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold px-3 py-1 rounded-full text-sm">
                            <CheckCircle size={16}/>
                            <span>Transaction Completed</span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 dark:border-gray-600 pt-6">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs tracking-wider">Beneficiary Details</h3>
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Name</span><span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{receiptData.receiverName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Account</span><span className="font-semibold text-gray-800 dark:text-gray-200">{isInternational ? 'International Account' : receiptData.receiverAccountNumber}</span></div>
                            {bankDetails && Object.entries(bankDetails).map(([key, value]) => value && (
                                <div key={key} className="flex justify-between"><span className="text-gray-500 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="font-semibold text-gray-800 dark:text-gray-200">{String(value)}</span></div>
                            ))}
                        </div>
                         <div className="space-y-3">
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs tracking-wider">Sender Details</h3>
                             <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Name</span><span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{user.fullName}</span></div>
                             <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Account</span><span className="font-semibold text-gray-800 dark:text-gray-200">{user.accountNumber}</span></div>
                        </div>
                    </div>
                    
                     {/* Transaction Details Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-6 space-y-2">
                         <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Date</span><span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(receiptData.timestamp.toDate()).toLocaleString()}</span></div>
                         <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Transaction ID</span><span className="font-mono text-gray-700 dark:text-gray-200 text-xs">{receiptData.id}</span></div>
                         <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Description</span><span className="font-semibold text-gray-800 dark:text-gray-200">{receiptData.description || 'N/A'}</span></div>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex gap-4 no-print">
                <button onClick={printReceipt} className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Printer size={18}/> Print</button>
                <button onClick={onClose} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg">Done</button>
            </div>
        </div>
    );
};


const countryData = [
    { name: 'United States', currency: 'USD' }, { name: 'Canada', currency: 'CAD' }, { name: 'Mexico', currency: 'MXN' }, { name: 'United Kingdom', currency: 'GBP' }, { name: 'Germany', currency: 'EUR' }, { name: 'France', currency: 'EUR' }, { name: 'Japan', currency: 'JPY' }, { name: 'Australia', currency: 'AUD' }, { name: 'China', currency: 'CNY' }, { name: 'India', currency: 'INR' }, { name: 'Brazil', currency: 'BRL' }
];

const localBanks = [
    'Bank of America', 'JPMorgan Chase', 'Wells Fargo', 'Citibank', 'U.S. Bank', 'PNC Bank', 'TD Bank', 'Capital One'
];

const OtpInput = ({ otp, setOtp }) => {
    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    return (
        <div className="flex justify-center gap-2 my-4">
            {otp.map((data, index) => (
                <input
                    key={index}
                    type="text"
                    name="otp"
                    maxLength={1}
                    value={data}
                    onChange={e => handleChange(e.target, index)}
                    onKeyDown={e => handleKeyDown(e, index)}
                    onFocus={e => e.target.select()}
                    className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-westcoast-blue focus:border-transparent transition dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            ))}
        </div>
    );
};

const DomesticTransferModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [recipient, setRecipient] = useState(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [bankName, setBankName] = useState(localBanks[0]);
    const [routingNumber, setRoutingNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [fee, setFee] = useState(0);
    const [total, setTotal] = useState(0);
    const [userOtp, setUserOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receiptData, setReceiptData] = useState<Transaction | null>(null);

    useEffect(() => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            const calculatedFee = Math.max(1.50, numAmount * 0.005); // 0.5% with a $1.50 minimum
            setFee(calculatedFee);
            setTotal(numAmount + calculatedFee);
        } else {
            setFee(0);
            setTotal(0);
        }
    }, [amount]);

    const handleProceedToConfirm = async (e) => {
        e.preventDefault();
        setError('');
        if (!accountNumber || !/^\d{10}$/.test(accountNumber)) return setError('Account number must be 10 digits.');
        if (!beneficiaryName) return setError('Beneficiary name is required.');
        if (!routingNumber || !/^\d{9}$/.test(routingNumber)) return setError('Routing number must be 9 digits.');
        if (total <= 0) return setError('Please enter a valid amount.');
        if (total > user.balance) return setError('Insufficient funds for this transfer.');

        setLoading(true);
        try {
            const recipientData = await getUserByAccountNumber(accountNumber);
            if (recipientData && recipientData.uid === user.uid) {
                setLoading(false);
                return setError("You cannot transfer to your own account.");
            }

            const finalRecipient = recipientData || {
                uid: `EXT-${accountNumber}`,
                fullName: beneficiaryName,
                accountNumber: accountNumber,
                // Dummy data for the rest of the profile
                balance: 0,
                email: '',
                phone: '',
                address: '',
                state: '',
                country: '',
                currencyCode: user.currencyCode,
                isAdmin: false,
                createdAt: new Date(),
                customerId: '',
            };
            
            setRecipient(finalRecipient);
            setStep(2);
        } catch (e) {
            setError('An error occurred while verifying the account.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleProceedToOtp = async () => {
        setLoading(true);
        setError('');
        try {
            await generateAndSendOtp(user.uid, user.email, user.fullName);
            setStep(3);
        } catch(e) {
            setError("Failed to send OTP. Please try again later.");
            console.error("OTP Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        const otpString = userOtp.join('');
        if (otpString.length !== 6) {
            return setError("Please enter the 6-digit OTP.");
        }
        setLoading(true);
        setError('');
        try {
            const otpResult = await verifyOtp(user.uid, otpString);
            if (!otpResult.valid) {
                setError(otpResult.message);
                setLoading(false);
                return;
            }

            const transaction = await performTransfer(user, recipient, parseFloat(amount), purpose);
            if (transaction) {
                await deleteOtp(user.uid);
                setReceiptData(transaction);
                setStep(4);
            } else {
                setError('Transaction failed to record.');
            }
        } catch (e) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 sm:p-8 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 no-print"><X className="w-6 h-6" /></button>
            
            {step === 1 && (
                <form onSubmit={handleProceedToConfirm} className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Domestic Transfer</h2>
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Beneficiary Details</h3>
                        <div className="space-y-4">
                           <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                           <input value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="Beneficiary Full Name" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                           <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base"><option disabled>Bank Name</option>{localBanks.map(b=><option key={b}>{b}</option>)}</select>
                           <input value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} placeholder="Routing Number" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Transfer Details</h3>
                         <div className="space-y-4">
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                            <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Purpose of Transfer" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                        </div>
                        {amount && <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
                            <div className="flex justify-between"><span>Transfer Fee:</span><span className="font-medium">{formatCurrency(fee, user.currencyCode)}</span></div>
                            <div className="flex justify-between font-bold"><span>Total Debit:</span><span>{formatCurrency(total, user.currencyCode)}</span></div>
                        </div>}
                    </div>
                    {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg disabled:opacity-50 flex justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Continue'}</button>
                </form>
            )}

            {step === 2 && recipient && (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Confirm Transfer</h2>
                    <p className="text-gray-600 dark:text-gray-300">Please review the details below.</p>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-left space-y-3">
                        <div><span className="text-gray-500 dark:text-gray-400 text-sm">To:</span><p className="font-semibold dark:text-white">{recipient.fullName}</p></div>
                        <div><span className="text-gray-500 dark:text-gray-400 text-sm">Bank:</span><p className="font-semibold dark:text-white">{bankName}</p></div>
                        <div><span className="text-gray-500 dark:text-gray-400 text-sm">Routing Number:</span><p className="font-semibold dark:text-white">{routingNumber}</p></div>
                        <div className="border-t my-2 dark:border-gray-600"></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount:</span><span className="font-semibold dark:text-white">{formatCurrency(parseFloat(amount), user.currencyCode)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fee:</span><span className="font-semibold dark:text-white">{formatCurrency(fee, user.currencyCode)}</span></div>
                        <div className="flex justify-between text-lg"><span className="font-bold dark:text-white">Total:</span><span className="font-bold dark:text-white">{formatCurrency(total, user.currencyCode)}</span></div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg">Back</button>
                        <button onClick={handleProceedToOtp} disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center">
                           {loading ? <Loader2 className="animate-spin" /> : 'Confirm'}
                        </button>
                    </div>
                </div>
            )}
            
            {step === 3 && (
                <div className="text-center">
                    <div className="flex justify-center mb-4"><Avatar user={user} size="w-16 h-16" /></div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">OTP Verification</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 px-2">Hello, {user.fullName}, we've sent a 6-digit verification code to your ({user.phone}) and ({user.email})</p>
                    <OtpInput otp={userOtp} setOtp={setUserOtp} />
                    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                    <button onClick={handleTransfer} disabled={loading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck/> Verify & Transfer</>}
                    </button>
                    <button onClick={handleProceedToOtp} className="text-sm text-westcoast-blue hover:underline mt-4">Resend OTP</button>
                </div>
            )}
            
            {step === 4 && receiptData && (
                 <ReceiptView 
                    receiptData={receiptData} 
                    user={user} 
                    onClose={() => { onSuccess(); onClose(); }}
                    bankDetails={{ bankName, routingNumber }}
                />
            )}
        </div>
      </div>
    );
};

const InternationalTransferModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [beneficiaryName, setBeneficiaryName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [swiftBic, setSwiftBic] = useState('');
    const [country, setCountry] = useState(countryData[0].name);
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [fee, setFee] = useState(0);
    const [total, setTotal] = useState(0);
    const [userOtp, setUserOtp] = useState(new Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receiptData, setReceiptData] = useState<Transaction | null>(null);

    useEffect(() => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            const calculatedFee = 5.00 + numAmount * 0.01; // $5 flat fee + 1%
            setFee(calculatedFee);
            setTotal(numAmount + calculatedFee);
        } else {
            setFee(0);
            setTotal(0);
        }
    }, [amount]);

    const handleProceedToConfirm = (e) => {
        e.preventDefault();
        setError('');
        if (!beneficiaryName || !accountNumber || !bankName || !swiftBic) return setError('All beneficiary details are required.');
        if (total <= 0) return setError('Please enter a valid amount.');
        if (total > user.balance) return setError('Insufficient funds for this transfer.');
        setStep(2);
    };

    const handleProceedToOtp = async () => {
        setLoading(true);
        setError('');
        try {
            await generateAndSendOtp(user.uid, user.email, user.fullName);
            setStep(3);
        } catch(e) {
            setError("Failed to send OTP. Please try again later.");
            console.error("OTP Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async () => {
        const otpString = userOtp.join('');
        if (otpString.length !== 6) {
            return setError("Please enter the 6-digit OTP.");
        }
        setLoading(true);
        setError('');
        try {
            const otpResult = await verifyOtp(user.uid, otpString);
            if (!otpResult.valid) {
                setError(otpResult.message);
                setLoading(false);
                return;
            }

            const selectedCountryData = countryData.find(c => c.name === country);
            const tempRecipient: UserProfile = {
                uid: `INTL-${swiftBic}`,
                fullName: beneficiaryName,
                accountNumber: accountNumber,
                balance: 0,
                email: '',
                phone: '',
                address: '',
                state: '',
                country: country,
                currencyCode: (selectedCountryData && selectedCountryData.currency) || '',
                isAdmin: false,
                createdAt: new Date(),
                customerId: '',
            };
            const transaction = await performTransfer(user, tempRecipient, parseFloat(amount), purpose);
            if (transaction) {
                await deleteOtp(user.uid);
                setReceiptData(transaction);
                setStep(4);
            } else {
                setError('Transaction failed to record.');
            }
        } catch (e) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 sm:p-8 relative">
                 <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 no-print"><X className="w-6 h-6" /></button>
                {step === 1 && (
                    <form onSubmit={handleProceedToConfirm} className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">International Transfer</h2>
                         <div>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Beneficiary Details</h3>
                            <div className="space-y-4">
                               <input value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} placeholder="Beneficiary Full Name" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                               <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Account Number / IBAN" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                               <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                               <input value={swiftBic} onChange={e => setSwiftBic(e.target.value)} placeholder="SWIFT / BIC Code" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                               <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base"><option disabled>Country</option>{countryData.map(c=><option key={c.name}>{c.name}</option>)}</select>
                            </div>
                        </div>
                         <div>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Transfer Details</h3>
                            <div className="space-y-4">
                                <div className="relative">
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-3 border rounded-lg pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{user.currencyCode}</span>
                                </div>
                                <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Purpose of Transfer" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-base" required />
                            </div>
                            {amount && <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
                                <div className="flex justify-between"><span>Transfer Fee:</span><span className="font-medium">{formatCurrency(fee, user.currencyCode)}</span></div>
                                <div className="flex justify-between font-bold"><span>Total Debit:</span><span>{formatCurrency(total, user.currencyCode)}</span></div>
                            </div>}
                        </div>
                        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg disabled:opacity-50 flex justify-center">{loading ? <Loader2 className="animate-spin"/> : 'Continue'}</button>
                    </form>
                )}
                 {step === 2 && (
                    <div className="space-y-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Confirm Transfer</h2>
                        <p className="text-gray-600 dark:text-gray-300">Please review the international transfer details.</p>
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-left space-y-3">
                            <div><span className="text-gray-500 dark:text-gray-400 text-sm">To:</span><p className="font-semibold dark:text-white">{beneficiaryName}</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400 text-sm">Destination:</span><p className="font-semibold dark:text-white">{bankName}, {country}</p></div>
                             <div className="border-t my-2 dark:border-gray-600"></div>
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount:</span><span className="font-semibold dark:text-white">{formatCurrency(parseFloat(amount), user.currencyCode)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fee:</span><span className="font-semibold dark:text-white">{formatCurrency(fee, user.currencyCode)}</span></div>
                            <div className="flex justify-between text-lg"><span className="font-bold dark:text-white">Total:</span><span className="font-bold dark:text-white">{formatCurrency(total, user.currencyCode)}</span></div>
                        </div>
                         <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 rounded-lg">Back</button>
                            <button onClick={handleProceedToOtp} disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center">
                                {loading ? <Loader2 className="animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
                 {step === 3 && (
                    <div className="text-center">
                        <div className="flex justify-center mb-4"><Avatar user={user} size="w-16 h-16" /></div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">OTP Verification</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 px-2">Hello, {user.fullName}, we've sent a 6-digit verification code to your ({user.phone}) and ({user.email})</p>
                        <OtpInput otp={userOtp} setOtp={setUserOtp} />
                        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                         <button onClick={handleTransfer} disabled={loading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                             {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck/> Verify & Transfer</>}
                        </button>
                        <button onClick={handleProceedToOtp} className="text-sm text-westcoast-blue hover:underline mt-4">Resend OTP</button>
                    </div>
                )}
                {step === 4 && receiptData && (
                    <ReceiptView 
                        receiptData={receiptData} 
                        user={user} 
                        onClose={() => { onSuccess(); onClose(); }}
                        isInternational={true}
                        bankDetails={{ bankName: bankName, country: country, swiftBic: swiftBic }}
                    />
                )}
            </div>
        </div>
    );
};

const FileUploadBox = ({ side, image, onFileChange }: { side: 'front' | 'back', image: string | null, onFileChange: (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => void }) => {
    const inputId = `check-${side}-upload`;
    return (
        <div>
            <label htmlFor={inputId} className="cursor-pointer">
                <div className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-colors ${image ? 'border-green-500 bg-green-50 dark:bg-green-900/50 dark:border-green-600' : 'border-gray-300 dark:border-gray-600 hover:border-westcoast-blue dark:hover:border-westcoast-accent hover:bg-blue-50 dark:hover:bg-gray-700'}`}>
                    {image ? (
                        <img src={image} alt={`${side} of check preview`} className="max-h-full max-w-full object-contain rounded" />
                    ) : (
                        <>
                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Upload {side.charAt(0).toUpperCase() + side.slice(1)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Click to select file</span>
                        </>
                    )}
                </div>
            </label>
            <input id={inputId} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, side)} />
            {image && <p className="text-xs text-green-600 text-center mt-1 flex items-center justify-center gap-1"><CheckCircle size={14} /> Image selected</p>}
        </div>
    );
};

const CheckDepositModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: upload & amount, 2: success
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('File is too large. Max size is 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                if (side === 'front') {
                    setFrontImage(reader.result as string);
                } else {
                    setBackImage(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
            setError('');
        }
    };

    const handleDeposit = async () => {
        if (!frontImage || !backImage) {
            setError("Please upload both front and back images of the check.");
            return;
        }
        const numAmount = parseFloat(amount);
        if(isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await adminUpdateBalance(user, numAmount, 'credit', 'Mobile Check Deposit');
            setStep(2);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 3000);
        } catch(e) {
            setError(e.message || 'Failed to process deposit.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Check Deposit</h2>
                    <button onClick={onClose} className="p-1"><X className="w-6 h-6 text-gray-500 dark:text-gray-300" /></button>
                </div>
                 {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleDeposit(); }} className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Please upload clear images of the front and back of your signed check.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FileUploadBox side="front" image={frontImage} onFileChange={handleFileChange} />
                            <FileUploadBox side="back" image={backImage} onFileChange={handleFileChange} />
                        </div>

                        <div className="pt-2">
                             <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Check Amount</label>
                             <input id="deposit-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Amount in ${user.currencyCode}`} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center">
                            {loading ? <Loader2 className="animate-spin" /> : 'Deposit Check'}
                        </button>
                    </form>
                )}
                {step === 2 && (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold dark:text-white">Deposit Successful!</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">The funds will be available in your account shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TransactionHistoryView = ({ transactions, currentUserId, currencyCode }) => (
    <div className="p-4 md:p-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 md:hidden">Transaction History</h2>
        <div className="space-y-3">
            {transactions.length > 0 ? transactions.map(tx => (
                <TransactionItem key={tx.id} tx={tx} currentUserId={currentUserId} currencyCode={currencyCode} />
            )) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <p>No transactions found.</p>
                </div>
            )}
        </div>
    </div>
);

const ProfileView: React.FC<{ user: UserProfile, onUpdate: () => void }> = ({ user, onUpdate }) => {
    const { signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<UserProfile>(user);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData(user);
    }, [user]);

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
                onUpdate();
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
            onUpdate();
        } catch (err) {
            setError('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const InfoRow = ({ label, value, name, onChange, edit, type = "text", isReadOnly = false }) => (
        <div className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="text-gray-500 dark:text-gray-400 font-medium col-span-1">{label}</label>
            {edit && !isReadOnly ? (
                <input type={type} name={name} value={value} onChange={onChange} className="col-span-2 w-full px-3 py-1.5 border rounded-md dark:bg-gray-600 dark:border-gray-500 bg-gray-50" />
            ) : (
                <p className="font-semibold dark:text-white col-span-2 break-words">{value}</p>
            )}
        </div>
    );

    return (
        <div className="p-4 md:p-0">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-sm">
                 <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0 md:hidden">My Profile</h2>
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
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{user.fullName}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>

                <div className="mt-6 w-full text-sm">
                    <form onSubmit={handleSave}>
                        <div className="space-y-2">
                             <InfoRow label="Full Name" name="fullName" value={formData.fullName} onChange={handleFormChange} edit={editMode} />
                             {/* FIX: Add name and onChange props to satisfy component's prop types for read-only fields. These props are not used when isReadOnly is true, but are required by the component's inferred prop types. */}
                             <InfoRow label="Email" name="email" value={formData.email} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                             <InfoRow label="Phone" name="phone" value={formData.phone} onChange={handleFormChange} edit={editMode} type="tel"/>
                             <InfoRow label="Address" name="address" value={formData.address} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="State" name="state" value={formData.state} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Country" name="country" value={formData.country} onChange={handleFormChange} edit={editMode} />
                             <InfoRow label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                             <InfoRow label="Currency" name="currencyCode" value={formData.currencyCode} onChange={handleFormChange} edit={editMode} isReadOnly={true} />
                        </div>
                        
                        {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}

                        {editMode ? (
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => { setEditMode(false); setFormData(user); }} className="w-full py-2 bg-gray-200 dark:bg-gray-600 font-semibold rounded-lg">Cancel</button>
                                <button type="submit" disabled={saving} className="w-full py-2 bg-westcoast-blue text-white font-semibold rounded-lg disabled:opacity-50 flex justify-center items-center">{saving ? <Loader2 className="animate-spin" /> : 'Save Changes'}</button>
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


const CardsView: React.FC<{ user: UserProfile }> = ({ user }) => {
    return (
        <div className="p-4 md:p-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 md:hidden">My Cards</h2>
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm text-center">
                    <p className="text-gray-500 dark:text-gray-400">No cards have been added yet.</p>
                </div>
                <button className="w-full text-center py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm font-semibold text-westcoast-blue">
                    + Add New Card
                </button>
            </div>
        </div>
    );
};

const PaymentsView: React.FC<{ user: UserProfile, onSuccess: () => void }> = ({ user, onSuccess }) => {
    const [biller, setBiller] = useState('Edison Electric');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const billers = ['Edison Electric', 'Comcast Internet', 'State Water Co.', 'City Gas'];

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (numAmount > user.balance) {
            setError('Insufficient funds.');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await adminUpdateBalance(user, numAmount, 'debit', `Bill Payment to ${biller}`);
            setSuccess(`Successfully paid ${formatCurrency(numAmount, user.currencyCode)} to ${biller}.`);
            setAmount('');
            onSuccess(); // Refresh user data
        } catch (err) {
            setError(err.message || 'Payment failed.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-0">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 md:hidden">Bill Payments</h2>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm">
                <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                        <label htmlFor="biller" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Biller</label>
                        <select id="biller" value={biller} onChange={e => setBiller(e.target.value)} className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            {billers.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input id="payment-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Amount in ${user.currencyCode}`} className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <><Receipt/> Pay Now</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

const DashboardHomeView = ({ userData, transactions, onActionClick }) => (
    <>
        <header className="p-4 flex justify-between items-center md:hidden">
            <div className="flex items-center gap-3">
                <Avatar user={userData} />
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">Hi, {userData.fullName.split(' ')[0]}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
            </div>
        </header>

        <section className="px-4 md:px-0">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-westcoast-blue to-westcoast-accent text-white shadow-lg">
                <p className="text-sm opacity-80">Available Balance</p>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-4xl font-bold">{formatCurrency(userData.balance, userData.currencyCode).replace('.00', '')}<span className="text-xl font-semibold opacity-80 ml-1">{userData.currencyCode}</span></p>
                    <CreditCard className="w-8 h-8 opacity-50"/>
                </div>
                <div className="mt-4">
                    <span className="bg-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full">Active Account</span>
                </div>
            </div>
        </section>

        <section className="p-4 md:p-0 md:mt-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <QuickActionButton onClick={() => onActionClick('transfer')} icon={<Send className="w-6 h-6 text-westcoast-blue"/>} label="Domestic" />
                <QuickActionButton onClick={() => onActionClick('international')} icon={<Globe className="w-6 h-6 text-westcoast-blue"/>} label="International" />
                <QuickActionButton onClick={() => onActionClick('deposit')} icon={<ClipboardCheck className="w-6 h-6 text-westcoast-blue"/>} label="Deposit" />
                <QuickActionButton onClick={() => onActionClick('history')} icon={<History className="w-6 h-6 text-westcoast-blue"/>} label="History" />
            </div>
        </section>

        <section className="p-4 md:p-0 md:mt-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Recent Transactions</h2>
            <div className="space-y-3">
                {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} currentUserId={userData.uid} currencyCode={userData.currencyCode} />
                )) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <p>No recent transactions.</p>
                    </div>
                )}
            </div>
        </section>
    </>
);


// --- UI HELPER COMPONENTS ---

const Avatar: React.FC<{ user: UserProfile, size?: string, textClass?: string }> = ({ user, size = 'w-12 h-12', textClass = 'text-lg' }) => {
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
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (user && user.photoURL && !imgError) {
        return <img src={user.photoURL} alt={user.fullName} onError={handleImageError} className={`${size} rounded-full object-cover bg-gray-200 dark:bg-gray-700`} />;
    }
    
    return (
        <div className={`${size} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold ${textClass}`}>
            {getInitials(user && user.fullName)}
        </div>
    );
};

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 group">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p>
    </button>
);

const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string, currencyCode: string }> = ({ tx, currentUserId, currencyCode }) => {
    const isDebit = tx.senderId === currentUserId;
    const formattedDate = tx.timestamp && tx.timestamp.toDate ? new Date(tx.timestamp.toDate()).toLocaleDateString() : 'N/A';
    
    const getTransactionTitle = () => {
        if (tx.description) return tx.description;
        if (tx.type === 'transfer') {
            return isDebit ? `Transfer to ${tx.receiverName}` : `Transfer from ${tx.senderName}`;
        }
        if (tx.type === 'credit') {
            return tx.senderName === 'Westcoast Trust Bank Admin' ? 'Admin Credit' : `Credit from ${tx.senderName}`;
        }
        if (tx.type === 'debit') {
            return 'Debit';
        }
        if (tx.type === 'bill_payment') {
            return `Bill Payment to ${tx.receiverName}`;
        }
        return isDebit ? `To: ${tx.receiverName}` : `From: ${tx.senderName}`;
    };

    const getStatusPill = (status: 'completed' | 'pending' | 'failed') => {
        const styles = {
            completed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
            failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
        };
        const text = status.charAt(0).toUpperCase() + status.slice(1);
        return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${styles[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                {text}
            </span>
        );
    };

    const typeLabel = tx.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-full ${isDebit ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                {isDebit ? <ArrowUpRight className="w-5 h-5 text-red-500" /> : <ArrowDownLeft className="w-5 h-5 text-green-500" />}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{getTransactionTitle()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate} • {typeLabel}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                    {isDebit ? '-' : '+'}{formatCurrency(tx.amount, currencyCode)}
                </p>
                {getStatusPill(tx.status)}
            </div>
        </div>
    );
};

const BottomNavItem: React.FC<{ icon: React.ReactElement<{ className?: string }>; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 w-16">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
             {React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'text-westcoast-blue' : 'text-gray-500 dark:text-gray-400'}` })}
        </div>
        <p className={`text-xs font-medium ${active ? 'text-westcoast-blue' : 'text-gray-500 dark:text-gray-400'}`}>{label}</p>
    </button>
);

const SideNavItem: React.FC<{ icon: React.ReactElement<{ className?: string }>; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-blue-50 dark:bg-blue-900/50 text-westcoast-blue' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
        <span>{label}</span>
    </button>
);


// --- MAIN DASHBOARD PAGE ---

const UserDashboardPage: React.FC = () => {
    const { user, signOut } = useAuth();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('home');
    
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showInternationalModal, setShowInternationalModal] = useState(false);

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
        setLoading(true);
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (userData && userData.isSuspended) {
            let inactivityTimer: number;

            const resetTimer = () => {
                clearTimeout(inactivityTimer);
                inactivityTimer = window.setTimeout(() => {
                    signOut();
                }, 5 * 60 * 1000); // 5 minutes
            };

            const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
            
            activityEvents.forEach(event => {
                window.addEventListener(event, resetTimer, { passive: true });
            });

            resetTimer();

            return () => {
                clearTimeout(inactivityTimer);
                activityEvents.forEach(event => {
                    window.removeEventListener(event, resetTimer);
                });
            };
        }
    }, [userData, signOut]);

    const handleQuickAction = (action: string) => {
        switch(action) {
            case 'transfer': setShowTransferModal(true); break;
            case 'deposit': setShowDepositModal(true); break;
            case 'history': setActiveView('history'); break;
            case 'international': setShowInternationalModal(true); break;
            default: break;
        }
    }

    const SuspendedAccountModal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
        return (
            <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white/90 dark:bg-gray-800/90 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl border border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">We locked your account due to unusual activity.</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-4">
                        Email us to unlock it. If you're a commercial client, reach out to your servicing team.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        Please note that you will not be able to access your account information, documents or statements online or on the mobile app until we unlock your account.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <a href="mailto:support@westcoasttrusts.com" className="w-full px-4 py-3 font-bold text-white bg-westcoast-blue rounded-lg hover:opacity-90 transition-opacity flex-1">
                            Email us
                        </a>
                        <button onClick={onLogout} className="w-full px-4 py-3 font-bold text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex-1">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const navItems = [
        { id: 'home', label: 'Home', icon: <Home /> },
        { id: 'cards', label: 'Cards', icon: <CreditCard /> },
        { id: 'payments', label: 'Payments', icon: <Receipt /> },
        { id: 'history', label: 'History', icon: <History /> },
        { id: 'me', label: 'Me', icon: <UserIcon /> },
    ];
    
    const renderContent = () => {
        if(loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>
        if (!userData) return <div className="p-4 text-center">Could not load user data.</div>

        switch(activeView) {
            case 'home': return <DashboardHomeView userData={userData} transactions={transactions} onActionClick={handleQuickAction}/>;
            case 'history': return <TransactionHistoryView transactions={transactions} currentUserId={userData.uid} currencyCode={userData.currencyCode} />;
            case 'cards': return <CardsView user={userData} />;
            case 'payments': return <PaymentsView user={userData} onSuccess={fetchData} />;
            case 'me': return <ProfileView user={userData} onUpdate={fetchData} />;
            default: return <DashboardHomeView userData={userData} transactions={transactions} onActionClick={handleQuickAction} />;
        }
    }

    if (loading && !userData) return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><p>Loading dashboard...</p></div>;
    
    const pageTitle = (navItems.find(item => item.id === activeView) || { label: 'Dashboard' }).label;
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen font-sans">
            {userData && userData.isSuspended && <SuspendedAccountModal onLogout={signOut} />}
            
            <div className={`flex ${userData && userData.isSuspended ? 'blur-sm pointer-events-none' : ''}`}>
                
                {/* --- Sidebar for Desktop --- */}
                <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 min-h-screen p-4 flex-shrink-0">
                    <div className="mb-8">
                        <WestcoastLogo />
                    </div>
                    <nav className="flex-grow space-y-2">
                        {navItems.map(item => (
                            <SideNavItem 
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activeView === item.id}
                                onClick={() => setActiveView(item.id)}
                            />
                        ))}
                    </nav>
                    <div className="mt-auto">
                        <SideNavItem icon={<LogOut />} label="Log Out" active={false} onClick={signOut} />
                    </div>
                </aside>

                {/* --- Main Content --- */}
                <main className="flex-1">
                    <div className="max-w-4xl mx-auto md:px-8 md:py-6">
                        {/* Desktop Header */}
                        {userData && (
                            <header className="hidden md:flex justify-between items-center mb-8 px-4 md:px-0">
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                                    {pageTitle}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                                    <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-300"/></button>
                                    <Avatar user={userData} size="w-10 h-10"/>
                                </div>
                            </header>
                        )}

                        {showTransferModal && userData && <DomesticTransferModal user={userData} onClose={() => setShowTransferModal(false)} onSuccess={fetchData} />}
                        {showDepositModal && userData && <CheckDepositModal user={userData} onClose={() => setShowDepositModal(false)} onSuccess={fetchData} />}
                        {showInternationalModal && userData && <InternationalTransferModal user={userData} onClose={() => setShowInternationalModal(false)} onSuccess={fetchData} />}
                        
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* --- Bottom Bar for Mobile --- */}
            {!(userData && userData.isSuspended) && (
                 <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-around py-2">
                         {navItems.map(item => (
                            <BottomNavItem 
                                key={item.id}
                                icon={item.icon}
                                label={item.label}
                                active={activeView === item.id}
                                onClick={() => setActiveView(item.id)}
                            />
                        ))}
                    </div>
                </footer>
            )}
        </div>
    );
};

export default UserDashboardPage;
