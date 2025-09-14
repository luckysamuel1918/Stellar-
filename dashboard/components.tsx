import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { 
    getUserByAccountNumber, 
    performTransfer, adminUpdateBalance,
    generateAndSendOtp, verifyOtp, deleteOtp
} from '../services/firebase';
import { 
    CheckCircle, X, Loader2, UploadCloud, ShieldCheck, 
    Receipt, Printer, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { WestcoastLogo } from '../components/icons';

export const formatCurrency = (amount: number, currency: string) => {
    const safeCurrency = currency || 'USD';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
        }).format(amount);
    } catch (e) {
        console.error(`Invalid currency code: ${safeCurrency}`, e);
        return `$${amount.toFixed(2)}`;
    }
};

export const ReceiptView = ({ receiptData, user, onClose, isInternational = false, bankDetails }) => {
    const printReceipt = () => window.print();

    const DetailRow = ({ label, value }) => (
        <div className="flex justify-between items-start gap-4">
            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">{label}</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-right break-words text-base">{value}</span>
        </div>
    );

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
            <div id="receipt-content" className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg text-left">
                <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 sm:p-8">
                    <div className="absolute top-8 right-8 transform rotate-12 no-print">
                        <div className="border-4 border-green-500 text-green-500 rounded-full w-24 h-24 flex items-center justify-center font-black text-2xl uppercase opacity-70">Paid</div>
                    </div>
                    <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-600">
                        <div>
                            <WestcoastLogo />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">123 Finance St, Suite 100, San Francisco, CA 94105</p>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Transaction Receipt</span>
                    </div>
                    <div className="text-center my-8">
                        <p className="text-gray-500 dark:text-gray-400">Amount Sent</p>
                        <p className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tighter break-all">{formatCurrency(receiptData.amount, user.currencyCode)}</p>
                        <div className="inline-flex items-center gap-2 mt-2 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 font-semibold px-3 py-1 rounded-full text-sm">
                            <CheckCircle size={16}/>
                            <span>Transaction Completed</span>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 uppercase text-sm tracking-wider">Beneficiary Details</h3>
                            <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                                <DetailRow label="Name" value={receiptData.receiverName} />
                                <DetailRow label="Account" value={isInternational ? 'International Account' : receiptData.receiverAccountNumber} />
                                {bankDetails && Object.entries(bankDetails).map(([key, value]) => value && (
                                    <DetailRow key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} value={String(value)} />
                                ))}
                            </div>
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-semibold text-gray-600 dark:text-gray-300 uppercase text-sm tracking-wider">Sender Details</h3>
                             <div className="p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-4">
                                <DetailRow label="Name" value={user.fullName} />
                                <DetailRow label="Account" value={user.accountNumber} />
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-5 mt-8 space-y-3">
                         <DetailRow label="Date" value={new Date(receiptData.timestamp.toDate()).toLocaleString()} />
                         <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-500 dark:text-gray-400 flex-shrink-0 text-sm">Transaction ID</span>
                            <span className="font-mono text-gray-700 dark:text-gray-300 text-xs text-right break-all">{receiptData.id}</span>
                         </div>
                         <DetailRow label="Description" value={receiptData.description || 'N/A'} />
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

export const DomesticTransferModal = ({ user, onClose, onSuccess }) => {
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
                onSuccess();
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 relative">
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
                    onClose={onClose}
                    bankDetails={{ bankName, routingNumber }}
                />
            )}
        </div>
      </div>
    );
};

export const InternationalTransferModal = ({ user, onClose, onSuccess }) => {
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
                onSuccess();
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 relative">
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
                        onClose={onClose}
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

export const CheckDepositModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
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
            onSuccess();
            setStep(2);
            setTimeout(() => {
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

export const Avatar: React.FC<{ user: UserProfile, size?: string, textClass?: string }> = ({ user, size = 'w-12 h-12', textClass = 'text-lg' }) => {
    const [imgError, setImgError] = useState(false);
    useEffect(() => { if (user?.photoURL) { setImgError(false); } }, [user?.photoURL]);
    const handleImageError = () => { setImgError(true); };
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

export const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 group">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm group-hover:bg-blue-50 dark:group-hover:bg-gray-700 transition-colors">
            {icon}
        </div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</p>
    </button>
);

export const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string, currencyCode: string }> = ({ tx, currentUserId, currencyCode }) => {
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
        if (tx.type === 'debit') return 'Debit';
        if (tx.type === 'bill_payment') return `Bill Payment to ${tx.receiverName}`;
        return isDebit ? `To: ${tx.receiverName}` : `From: ${tx.senderName}`;
    };

    const getStatusPill = (status: 'completed' | 'pending' | 'failed') => {
        const styles = {
            completed: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
            failed: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
        };
        const text = status.charAt(0).toUpperCase() + status.slice(1);
        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${styles[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{text}</span>;
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
                <p className={`font-bold text-sm ${isDebit ? 'text-red-600' : 'text-green-600'}`}>{isDebit ? '-' : '+'}{formatCurrency(tx.amount, currencyCode)}</p>
                {getStatusPill(tx.status)}
            </div>
        </div>
    );
};
