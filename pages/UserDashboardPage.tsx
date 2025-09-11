import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../App';
import { UserProfile, Transaction } from '../types';
import { 
    getUserData, getUserTransactions, getUserByAccountNumber, 
    performTransfer, getUserDataWithPin, adminUpdateBalance,
    uploadProfilePicture, updateUserProfile
} from '../services/firebase';
import { 
    Bell, MessageSquare, CreditCard, Send, Globe, ClipboardCheck, History,
    ArrowUpRight, ArrowDownLeft, CheckCircle, Home, User as UserIcon, Landmark,
    X, Loader2, Camera, Banknote, ShieldCheck, Edit
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

const DomesticTransferModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [accountNumber, setAccountNumber] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receiptData, setReceiptData] = useState<Transaction | null>(null);

    const handleAccountLookup = async () => {
        if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
            setError('Account number must be 10 digits.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const recipientData = await getUserByAccountNumber(accountNumber);
            if (recipientData && recipientData.uid !== user.uid) {
                setRecipient(recipientData);
                setStep(2);
            } else if (recipientData && recipientData.uid === user.uid) {
                 setError("You cannot transfer money to your own account.");
            } else {
                setError('Account not found. Please check the number and try again.');
            }
        } catch (e) {
            setError('An error occurred while verifying the account.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleConfirmDetails = () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError('Please enter a valid transfer amount.');
            return;
        }
         if (numAmount > user.balance) {
            setError('Insufficient funds for this transfer.');
            return;
        }
        setError('');
        setStep(3);
    };

    const handleTransfer = async () => {
        if (pin.length !== 4) {
            setError('PIN must be 4 digits.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const senderData = await getUserDataWithPin(user.uid);
            if(senderData && senderData.pin === pin) {
                const transaction = await performTransfer(user, recipient, parseFloat(amount), description);
                if (transaction) {
                    setReceiptData(transaction);
                    setStep(4); // Move to receipt view
                } else {
                    setError('Transaction failed to record.');
                }
            } else {
                 setError('Invalid PIN. Transfer failed.');
            }
        } catch (e) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleCloseAndRefresh = () => {
        onSuccess();
        onClose();
    };
    
    const printStyles = `
        @media print {
            body * { visibility: hidden; }
            #transfer-receipt, #transfer-receipt * { visibility: visible; }
            #transfer-receipt { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none; }
        }
    `;

    return (
      <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
        <style>{printStyles}</style>
        <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <div className="flex justify-between items-center mb-4 no-print">
                <h2 className="text-xl font-bold text-gray-800">{step < 4 ? 'Domestic Transfer' : 'Transfer Receipt'}</h2>
                <button onClick={onClose} className="p-1"><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

            {step === 1 && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Enter the 10-digit account number of the recipient.</p>
                    <input type="tel" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Recipient Account Number" className="w-full p-3 border rounded-lg" maxLength={10} />
                    <button onClick={handleAccountLookup} disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg disabled:opacity-50 flex justify-center">
                        {loading ? <Loader2 className="animate-spin" /> : 'Find Recipient'}
                    </button>
                </div>
            )}
            {step === 2 && recipient && (
                 <div className="space-y-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm text-gray-500">Recipient</p>
                        <p className="font-bold text-gray-800">{recipient.fullName}</p>
                    </div>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-3 border rounded-lg" />
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (Optional)" className="w-full p-3 border rounded-lg" />
                    <button onClick={handleConfirmDetails} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg">Continue</button>
                 </div>
            )}
             {step === 3 && recipient && (
                 <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-gray-600">You are sending</p>
                        <p className="text-4xl font-bold text-westcoast-dark">{formatCurrency(parseFloat(amount), user.currencyCode)}</p>
                        <p className="text-gray-600">to <span className="font-semibold">{recipient.fullName}</span></p>
                    </div>
                    <p className="text-sm text-center text-gray-600">Enter your 4-digit PIN to authorize this transaction.</p>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="****" maxLength={4} className="w-full p-3 border rounded-lg text-center text-2xl tracking-[1rem]" />
                    <button onClick={handleTransfer} disabled={loading} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 flex justify-center items-center gap-2">
                        {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck/> Confirm & Send</>}
                    </button>
                 </div>
            )}
            {step === 4 && receiptData && (
                <div id="transfer-receipt">
                    <div className="text-center mb-6">
                        <WestcoastLogo className="mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Transfer Successful</h2>
                        <p className="text-sm text-gray-500">Receipt ID: {receiptData.id}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center justify-center gap-2 mb-6">
                        <CheckCircle className="w-5 h-5" /> <span className="font-semibold">Transaction Completed</span>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center"><span className="text-gray-500">Amount Sent</span><span className="text-xl font-bold text-gray-900">{formatCurrency(receiptData.amount, user.currencyCode)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-700">{new Date(receiptData.timestamp.toDate()).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Description</span><span className="font-semibold text-gray-700">{receiptData.description || 'N/A'}</span></div>
                    </div>
                    <hr className="my-4"/>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><p className="text-gray-500 mb-1">From</p><p className="font-bold">{user.fullName}</p><p className="font-mono">...{user.accountNumber.slice(-4)}</p></div>
                        <div><p className="text-gray-500 mb-1">To</p><p className="font-bold">{receiptData.receiverName}</p><p className="font-mono">...{receiptData.receiverAccountNumber.slice(-4)}</p></div>
                    </div>
                    <div className="mt-8 flex gap-3 no-print">
                        <button onClick={handleCloseAndRefresh} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg">Done</button>
                        <button onClick={() => window.print()} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg">Print Receipt</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    );
};

const CheckDepositModal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: camera, 2: amount, 3: success
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            streamRef.current = stream;
        } catch (err) {
            setError('Camera access is required for this feature. Please enable it in your browser settings.');
        }
    };
    
    const stopCamera = () => {
        if(streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const captureImage = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageData = canvas.toDataURL('image/jpeg');
        if (!frontImage) setFrontImage(imageData);
        else setBackImage(imageData);
    };

    const handleDeposit = async () => {
        const numAmount = parseFloat(amount);
        if(isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            await adminUpdateBalance(user, numAmount, 'credit', 'Mobile Check Deposit');
            setStep(3);
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
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Check Deposit</h2>
                    <button onClick={onClose} className="p-1"><X className="w-6 h-6 text-gray-500" /></button>
                </div>
                 {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</p>}

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="bg-black rounded-lg overflow-hidden aspect-video">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                        <p className="text-center font-semibold text-gray-700">
                            { !frontImage ? 'Capture Front of Check' : 'Capture Back of Check' }
                        </p>
                        <button onClick={captureImage} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                            <Camera/> Capture
                        </button>
                        {frontImage && backImage && (
                            <button onClick={() => setStep(2)} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg">Continue</button>
                        )}
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Please enter the amount written on the check.</p>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" className="w-full p-3 border rounded-lg" />
                        <button onClick={handleDeposit} disabled={loading} className="w-full bg-westcoast-blue text-white font-bold py-3 rounded-lg flex justify-center">
                            {loading ? <Loader2 className="animate-spin" /> : 'Deposit Check'}
                        </button>
                    </div>
                )}
                {step === 3 && (
                    <div className="text-center py-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold">Deposit Successful!</h3>
                        <p className="text-gray-600 mt-2">The funds will be available in your account shortly.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TransactionHistoryView = ({ transactions, currentUserId, currencyCode }) => (
    <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction History</h2>
        <div className="space-y-3">
            {transactions.length > 0 ? transactions.map(tx => (
                <TransactionItem key={tx.id} tx={tx} currentUserId={currentUserId} currencyCode={currencyCode} />
            )) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm">
                    <p>No transactions found.</p>
                </div>
            )}
        </div>
    </div>
);

const ProfileView: React.FC<{ user: UserProfile, onUpdate: () => void }> = ({ user, onUpdate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            setError('File is too large. Max size is 2MB.');
            return;
        }

        setUploading(true);
        setError('');
        try {
            const downloadURL = await uploadProfilePicture(user.uid, file);
            await updateUserProfile(user.uid, { photoURL: downloadURL });
            onUpdate(); // This will call fetchData in parent
        } catch (err) {
            setError('Failed to upload picture. Please try again.');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">My Profile</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center">
                <div className="relative mb-4">
                    <Avatar user={user} size="w-24 h-24 text-3xl" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-1 -right-1 bg-westcoast-blue text-white rounded-full p-2 hover:bg-opacity-90 disabled:bg-gray-400 transition-colors">
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{user.fullName}</h3>
                <p className="text-gray-500">{user.email}</p>
                <div className="mt-6 w-full space-y-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between"><span className="text-gray-500">Account Number</span><span className="font-mono font-semibold">{user.accountNumber}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-semibold">{user.phone}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="font-semibold">{user.country}</span></div>
                </div>
                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
};

const PlaceholderView = ({ title }) => (
     <div className="p-4 flex items-center justify-center h-96">
        <div className="text-center">
             <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
             <p className="text-gray-500">This feature is coming soon!</p>
        </div>
    </div>
);

const DashboardHomeView = ({ userData, transactions, onActionClick }) => (
    <>
        <header className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Avatar user={userData} />
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Hi, {userData.fullName.split(' ')[0]}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="p-2 bg-white rounded-full shadow-sm"><MessageSquare className="w-5 h-5 text-gray-600"/></button>
                <button className="p-2 bg-white rounded-full shadow-sm"><Bell className="w-5 h-5 text-gray-600"/></button>
            </div>
        </header>

        <section className="px-4">
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

        <section className="p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3 text-center">
                <QuickActionButton onClick={() => onActionClick('transfer')} icon={<Send className="w-6 h-6 text-westcoast-blue"/>} label="Domestic" />
                <QuickActionButton onClick={() => onActionClick('international')} icon={<Globe className="w-6 h-6 text-westcoast-blue"/>} label="International" />
                <QuickActionButton onClick={() => onActionClick('deposit')} icon={<ClipboardCheck className="w-6 h-6 text-westcoast-blue"/>} label="Deposit" />
                <QuickActionButton onClick={() => onActionClick('history')} icon={<History className="w-6 h-6 text-westcoast-blue"/>} label="History" />
            </div>
        </section>

        <section className="p-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Recent Transactions</h2>
            <div className="space-y-3">
                {transactions.length > 0 ? transactions.slice(0, 5).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} currentUserId={userData.uid} currencyCode={userData.currencyCode} />
                )) : (
                    <div className="text-center py-8 text-gray-500 bg-white rounded-xl shadow-sm">
                        <p>No recent transactions.</p>
                    </div>
                )}
            </div>
        </section>
    </>
);


// --- UI HELPER COMPONENTS ---

const Avatar: React.FC<{ user: UserProfile, size?: string, textClass?: string }> = ({ user, size = 'w-12 h-12', textClass = 'text-lg' }) => {
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    if (user.photoURL) {
        return <img src={user.photoURL} alt={user.fullName} className={`${size} rounded-full object-cover bg-gray-200`} />;
    }
    
    return (
        <div className={`${size} rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold ${textClass}`}>
            {getInitials(user.fullName)}
        </div>
    );
};

const QuickActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2">
        <div className="bg-white p-4 rounded-xl shadow-sm">
            {icon}
        </div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
    </button>
);

const TransactionItem: React.FC<{ tx: Transaction, currentUserId: string, currencyCode: string }> = ({ tx, currentUserId, currencyCode }) => {
    const isDebit = tx.senderId === currentUserId;
    const formattedDate = tx.timestamp ? new Date(tx.timestamp.toDate()).toLocaleDateString() : 'N/A';
    
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
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
        };
        const text = status.charAt(0).toUpperCase() + status.slice(1);
        return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {text}
            </span>
        );
    };

    const typeLabel = tx.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="bg-white p-3 rounded-xl flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-full ${isDebit ? 'bg-red-100' : 'bg-green-100'}`}>
                {isDebit ? <ArrowUpRight className="w-5 h-5 text-red-500" /> : <ArrowDownLeft className="w-5 h-5 text-green-500" />}
            </div>
            <div className="flex-grow">
                <p className="font-bold text-gray-800 text-sm truncate">{getTransactionTitle()}</p>
                <p className="text-xs text-gray-500">{formattedDate} • {typeLabel}</p>
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

const NavItem: React.FC<{ icon: React.ReactElement<{ className?: string }>; label: string; active?: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 w-16">
        <div className={`p-2 rounded-lg ${active ? 'bg-blue-100' : ''}`}>
             {React.cloneElement(icon, { className: `w-6 h-6 ${active ? 'text-westcoast-blue' : 'text-gray-500'}` })}
        </div>
        <p className={`text-xs font-medium ${active ? 'text-westcoast-blue' : 'text-gray-500'}`}>{label}</p>
    </button>
);

// --- MAIN DASHBOARD PAGE ---

const UserDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserProfile | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('home');
    
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showInternationalModal, setShowInternationalModal] = useState(false);

    const fetchData = useCallback(async () => {
        if (user) {
            // Don't set loading to true on refresh to avoid screen flicker
            // setLoading(true); 
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

    const handleQuickAction = (action: string) => {
        switch(action) {
            case 'transfer': setShowTransferModal(true); break;
            case 'deposit': setShowDepositModal(true); break;
            case 'history': setActiveView('history'); break;
            case 'international': setShowInternationalModal(true); break;
            default: break;
        }
    }
    
    const renderContent = () => {
        if(loading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin w-8 h-8 text-westcoast-blue"/></div>
        if (!userData) return <div className="p-4 text-center">Could not load user data.</div>

        switch(activeView) {
            case 'home': return <DashboardHomeView userData={userData} transactions={transactions} onActionClick={handleQuickAction}/>;
            case 'history': return <TransactionHistoryView transactions={transactions} currentUserId={userData.uid} currencyCode={userData.currencyCode} />;
            case 'cards': return <PlaceholderView title="Manage Cards" />;
            case 'payments': return <PlaceholderView title="Bill Payments" />;
            case 'loan': return <PlaceholderView title="Loan Center" />;
            case 'me': return <ProfileView user={userData} onUpdate={fetchData} />;
            default: return <DashboardHomeView userData={userData} transactions={transactions} onActionClick={handleQuickAction} />;
        }
    }

    if (loading && !userData) return <div className="flex justify-center items-center h-screen bg-gray-100"><p>Loading dashboard...</p></div>;
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <div className="max-w-md mx-auto bg-gray-100 pb-24">
                
                {showTransferModal && userData && <DomesticTransferModal user={userData} onClose={() => setShowTransferModal(false)} onSuccess={fetchData} />}
                {showDepositModal && userData && <CheckDepositModal user={userData} onClose={() => setShowDepositModal(false)} onSuccess={fetchData} />}
                {showInternationalModal && (
                    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
                         <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Coming Soon!</h2>
                            <p className="text-gray-600 mb-4">International transfers will be available shortly.</p>
                            <button onClick={() => setShowInternationalModal(false)} className="bg-westcoast-blue text-white font-bold py-2 px-6 rounded-lg">Close</button>
                         </div>
                    </div>
                )}
                
                {renderContent()}

            </div>

            <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-sm border-t border-gray-200">
                <div className="flex justify-around py-2">
                    <NavItem icon={<Home />} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
                    <NavItem icon={<CreditCard />} label="Cards" active={activeView === 'cards'} onClick={() => setActiveView('cards')} />
                    <NavItem icon={<Send />} label="Payments" active={activeView === 'payments'} onClick={() => setActiveView('payments')} />
                    <NavItem icon={<Landmark />} label="Loan" active={activeView === 'loan'} onClick={() => setActiveView('loan')} />
                    <NavItem icon={<UserIcon />} label="Me" active={activeView === 'me'} onClick={() => setActiveView('me')} />
                </div>
            </footer>
        </div>
    );
};

export default UserDashboardPage;