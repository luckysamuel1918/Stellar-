
// FIX: Removed the triple-slash directive for "vite/client" as it's no longer used and was causing a type resolution error.

// FIX: Changed firebase imports to use scoped packages (@firebase/app, etc.) to resolve module not found errors.
import { initializeApp } from "@firebase/app";
// FIX: Changed firebase imports to use scoped packages (@firebase/app, etc.) to resolve module not found errors.
import { getAuth, User, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "@firebase/auth";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp, 
    Timestamp, 
    collection, 
    query, 
    where, 
    getDocs,
    addDoc,
    runTransaction,
    increment,
    updateDoc,
    writeBatch,
    orderBy,
    onSnapshot,
    deleteDoc,
// FIX: Changed firebase imports to use scoped packages (@firebase/app, etc.) to resolve module not found errors.
} from "@firebase/firestore";
import { UserProfile, Transaction, Loan } from "../types";

// --- CURRENCY FORMATTER ---
const formatCurrency = (amount: number, currency: string) => {
    const safeCurrency = currency || 'USD';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
        }).format(amount);
    } catch (e) {
        console.error(`Invalid currency code: ${safeCurrency}`, e);
        // Fallback to just using the amount with a dollar sign if formatting fails
        return `$${amount.toFixed(2)}`;
    }
};


// --- EMAILJS HELPERS ---

const SERVICE_ID = "service_27dimqt";
const PUBLIC_KEY = "XiKkaXx4HIwQb00-G";
const CREDIT_TEMPLATE_ID = "template_kozdmyg";
const DEBIT_TEMPLATE_ID = "template_ms0phzn";

const sendCreditEmail = async (params: any) => {
    const templateParams = {
        ...params,
        email: params.to_email,
        name: params.customer_name,
    };
    try {
        await (window as any).emailjs.send(SERVICE_ID, CREDIT_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    } catch (error) {
        console.error("EmailJS credit alert failed:", error);
    }
};

const sendDebitEmail = async (params: any) => {
    const templateParams = {
        ...params,
        email: params.to_email,
        name: params.customer_name,
    };
    try {
        await (window as any).emailjs.send(SERVICE_ID, DEBIT_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    } catch (error) {
        console.error("EmailJS debit alert failed:", error);
    }
};

// --- INITIALIZATION ---

// FIX: Replaced environment variable-based configuration with the provided hardcoded values to resolve deployment issues.
const firebaseConfig = {
  apiKey: "AIzaSyBMdIjlbAJ2nPMjOLtVhFhC0iArzNYKd6I",
  authDomain: "westcoast-c85e4.firebaseapp.com",
  databaseURL: "https://westcoast-c85e4-default-rtdb.firebaseio.com",
  projectId: "westcoast-c85e4",
  storageBucket: "westcoast-c85e4.appspot.com",
  messagingSenderId: "15776220227",
  appId: "1:15776220227:web:a5cf2658b895aff29180f6",
  measurementId: "G-MNTK4NDZH4"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- EXPORTS ---

// Re-export auth instance and core auth functions for convenience
export { auth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword };

// Re-export User type from auth
export type { User };

// Re-export Timestamp
// FIX: Export 'serverTimestamp' to make it available for use in other modules.
export { Timestamp, serverTimestamp };

// --- FIRESTORE FUNCTIONS ---

export const createUserProfileDocument = async (userAuth: User, additionalData: any) => {
  if (!userAuth) return;
  const userRef = doc(db, `users/${userAuth.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = userAuth;
    const { fullName, phone, address, state, country, currencyCode, accountNumber, pin, maritalStatus, occupation, dateOfBirth, zipCode } = additionalData;
    try {
      const newUserProfile: Omit<UserProfile, 'uid'> & { pin: string } = {
        email,
        fullName,
        phone,
        address,
        state,
        country,
        currencyCode,
        accountNumber,
        customerId: `WCB-${userAuth.uid.slice(-8).toUpperCase()}`,
        pin, // Note: Storing a PIN directly is insecure. This is for demonstration only.
        balance: 0, 
        isAdmin: email === 'admin@westcoasttrust.com', // Example admin setup
        isSuspended: false,
        createdAt: serverTimestamp(),
        photoURL: null,
        isDeleted: false,
        deletedAt: null,
        maritalStatus,
        occupation,
        dateOfBirth,
        zipCode,
      };
      await setDoc(userRef, newUserProfile);
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }
  return userRef;
};

export const getUserData = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
        return { uid, ...snapshot.data() } as UserProfile;
    }
    return null;
}

export const getUserDataWithPin = async (uid: string): Promise<(UserProfile & { pin: string }) | null> => {
    if (!uid) return null;
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
        return { uid, ...snapshot.data() } as UserProfile & { pin: string };
    }
    return null;
}

export const getUserByAccountNumber = async (accountNumber: string): Promise<UserProfile | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("accountNumber", "==", accountNumber));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
}

export const createTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    try {
        const dataWithTimestamp = {
            ...transactionData,
            timestamp: transactionData.timestamp || serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "transactions"), dataWithTimestamp);
        const docSnap = await getDoc(docRef);
        return { id: docSnap.id, ...docSnap.data() } as Transaction;
    } catch (error) {
        console.error("Error creating transaction:", error);
        return null;
    }
};

export const performTransfer = async (sender: UserProfile, receiver: UserProfile, amount: number, description: string): Promise<Transaction | null> => {
    if (sender.balance < amount) {
        throw new Error("Insufficient funds.");
    }
    
    const senderRef = doc(db, `users/${sender.uid}`);

    await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        if (!senderDoc.exists() || (senderDoc.data()?.balance || 0) < amount) {
            throw new Error("Insufficient funds.");
        }
        
        transaction.update(senderRef, { balance: increment(-amount) });

        const isInternal = receiver.uid && !receiver.uid.startsWith('EXT-') && !receiver.uid.startsWith('INTL-');
        if (isInternal) {
            const receiverRef = doc(db, `users/${receiver.uid}`);
            transaction.update(receiverRef, { balance: increment(amount) });
        }
    });

    const commonDetails = {
        amount,
        description,
        status: 'completed' as const,
        receiverAccountNumber: receiver.accountNumber,
        receiverName: receiver.fullName
    };

    const newTransaction = await createTransaction({
        ...commonDetails,
        senderId: sender.uid,
        senderName: sender.fullName,
        receiverId: receiver.uid,
        type: 'transfer',
        timestamp: serverTimestamp(),
    });

    if (newTransaction) {
        // Send debit alert to sender
        const updatedSender = await getUserData(sender.uid);
        if (updatedSender) {
            sendDebitEmail({
                customer_name: updatedSender.fullName,
                amount: formatCurrency(amount, updatedSender.currencyCode),
                recipient_name: receiver.fullName,
                date_time: new Date().toLocaleString(),
                description: description || 'N/A',
                balance: formatCurrency(updatedSender.balance, updatedSender.currencyCode),
                subject: 'Westcoast Trust Bank Debit Alert',
                to_email: updatedSender.email,
                from_email: 'support@westcoasttrusts.com'
            });
        }
        // Send credit alert to receiver if internal
        const isInternal = receiver.uid && !receiver.uid.startsWith('EXT-') && !receiver.uid.startsWith('INTL-');
        if (isInternal) {
            const updatedReceiver = await getUserData(receiver.uid);
            if (updatedReceiver) {
                sendCreditEmail({
                    customer_name: updatedReceiver.fullName,
                    amount: formatCurrency(amount, updatedReceiver.currencyCode),
                    sender_name: sender.fullName,
                    date_time: new Date().toLocaleString(),
                    description: description || 'N/A',
                    balance: formatCurrency(updatedReceiver.balance, updatedReceiver.currencyCode),
                    subject: 'Westcoast Trust Bank Credit Alert',
                    to_email: updatedReceiver.email,
                    from_email: 'support@westcoasttrusts.com'
                });
            }
        }
    }

    return newTransaction;
};


export const adminUpdateBalance = async (
    user: UserProfile, 
    amount: number, 
    type: 'credit' | 'debit', 
    description: string,
    senderName?: string,
    customTimestamp?: Timestamp,
    transactionType?: Transaction['type']
): Promise<Transaction | null> => {
    const userRef = doc(db, `users/${user.uid}`);
    const currentBalance = Number(user.balance) || 0;
    const amountToIncrement = type === 'credit' ? amount : -amount;

    if(currentBalance + amountToIncrement < 0) throw new Error("Debit amount exceeds user balance.");

    await updateDoc(userRef, { balance: increment(amountToIncrement) });

    const newTransaction = await createTransaction({
        amount,
        description,
        status: 'completed',
        type: transactionType || type,
        senderId: 'admin',
        senderName: senderName || 'Westcoast Trust Bank Admin',
        receiverId: user.uid,
        receiverName: user.fullName,
        receiverAccountNumber: user.accountNumber,
        timestamp: customTimestamp || serverTimestamp(),
    });

    if (newTransaction) {
        const updatedUser = await getUserData(user.uid);
        if (updatedUser) {
            const date_time = (customTimestamp ? customTimestamp.toDate() : new Date()).toLocaleString();

            if (type === 'credit') {
                sendCreditEmail({
                    customer_name: updatedUser.fullName,
                    amount: formatCurrency(amount, updatedUser.currencyCode),
                    sender_name: senderName || 'Westcoast Trust Bank Admin',
                    date_time,
                    description: description || 'N/A',
                    balance: formatCurrency(updatedUser.balance, updatedUser.currencyCode),
                    subject: 'Westcoast Trust Bank Credit Alert',
                    to_email: updatedUser.email,
                    from_email: 'support@westcoasttrusts.com'
                });
            } else { // debit
                let recipientName = 'Westcoast Trust Bank';
                if (transactionType === 'bill_payment' && description.startsWith('Bill Payment to ')) {
                    recipientName = description.substring('Bill Payment to '.length);
                }
                if (transactionType === 'loan_repayment') {
                    recipientName = 'Westcoast Trust Bank Loans';
                }
                sendDebitEmail({
                    customer_name: updatedUser.fullName,
                    amount: formatCurrency(amount, updatedUser.currencyCode),
                    recipient_name: recipientName,
                    date_time,
                    description: description || 'N/A',
                    balance: formatCurrency(updatedUser.balance, updatedUser.currencyCode),
                    subject: 'Westcoast Trust Bank Debit Alert',
                    to_email: updatedUser.email,
                    from_email: 'support@westcoasttrusts.com'
                });
            }
        }
    }

    return newTransaction;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(docData => ({ uid: docData.id, ...docData.data() } as UserProfile));
};

export const getUserTransactions = async (uid: string): Promise<Transaction[]> => {
    const transactionsRef = collection(db, "transactions");
    const sentQuery = query(transactionsRef, where("senderId", "==", uid));
    const receivedQuery = query(transactionsRef, where("receiverId", "==", uid));
    
    const [senderSnapshot, receiverSnapshot] = await Promise.all([getDocs(sentQuery), getDocs(receivedQuery)]);

    const transactionsMap = new Map<string, Transaction>();
    senderSnapshot.forEach((docData) => transactionsMap.set(docData.id, { id: docData.id, ...docData.data() } as Transaction));
    receiverSnapshot.forEach((docData) => transactionsMap.set(docData.id, { id: docData.id, ...docData.data() } as Transaction));

    const uniqueTransactions = Array.from(transactionsMap.values());
    return uniqueTransactions.sort((a, b) => {
        const getSeconds = (timestamp: any) => (timestamp && typeof timestamp.seconds === 'number') ? timestamp.seconds : 0;
        const aSeconds = getSeconds(a.timestamp);
        const bSeconds = getSeconds(b.timestamp);
        return bSeconds - aSeconds;
    });
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!uid) return;
    const userRef = doc(db, `users/${uid}`);
    await updateDoc(userRef, data);
};

export const adminDeleteUser = async (uid: string): Promise<void> => {
    if (!uid) throw new Error("User ID is required.");
    const userRef = doc(db, `users/${uid}`);
    // Perform a soft delete by updating the user document
    await updateDoc(userRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
    });
};

export const adminRestoreUser = async (uid: string): Promise<void> => {
    if (!uid) throw new Error("User ID is required.");
    const userRef = doc(db, `users/${uid}`);
    await updateDoc(userRef, {
        isDeleted: false,
        deletedAt: null,
    });
};

export const adminUpdateTransaction = async (transactionId: string, data: Partial<Transaction>): Promise<void> => {
    if (!transactionId) return;
    const txRef = doc(db, `transactions/${transactionId}`);
    await updateDoc(txRef, data);
};

export const getChatMessages = (userId: string, callback: (messages: any[]) => void) => {
    const messagesQuery = query(collection(db, `chats/${userId}/messages`), orderBy('timestamp', 'asc'));
    return onSnapshot(messagesQuery, snapshot => {
        const messages = snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
        callback(messages);
    });
};

export const sendChatMessage = async (userId: string, message: { text: string; senderId: string; senderName: string; }) => {
    if (!userId || !message.text) return;
    await addDoc(collection(db, `chats/${userId}/messages`), {
        ...message,
        timestamp: serverTimestamp()
    });
};

export const wipeChatHistory = async (userId:string) => {
    const messagesRef = collection(db, `chats/${userId}/messages`);
    const snapshot = await getDocs(messagesRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(docData => batch.delete(docData.ref));
    await batch.commit();
};

// --- OTP FUNCTIONS ---

export const generateAndSendOtp = async (uid: string, email: string, name: string): Promise<void> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRef = doc(db, `otps/${uid}`);
    const expiresAt = Timestamp.fromMillis(Date.now() + 5 * 60 * 1000); // 5 minutes

    await setDoc(otpRef, {
        otp,
        email,
        createdAt: serverTimestamp(),
        expiresAt,
        verified: false
    });
    
    const templateParams = {
        otp_code: otp,
        to_email: email,
        to_name: name,
        from_email: 'support@westcoasttrusts.com'
    };

    await (window as any).emailjs.send(
        "service_ddqz3a6",
        "template_zsv0alp",
        templateParams,
        "VYfq3eW-NMpJkm35M"
    );
};

export const verifyOtp = async (uid: string, userOtp: string): Promise<{ valid: boolean; message: string; }> => {
    const otpRef = doc(db, `otps/${uid}`);
    const snapshot = await getDoc(otpRef);

    if (!snapshot.exists()) {
        return { valid: false, message: 'OTP not found. Please request a new one.' };
    }
    const data = snapshot.data();
    if (!data) {
        return { valid: false, message: 'Invalid OTP document.' };
    }
    const now = Date.now();
    if (data.expiresAt.toMillis() < now) {
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }
    if (data.otp !== userOtp) {
        return { valid: false, message: 'Invalid OTP. Please try again.' };
    }
    await updateDoc(otpRef, { verified: true });
    return { valid: true, message: 'OTP verified successfully.' };
};

export const deleteOtp = async (uid: string): Promise<void> => {
    const otpRef = doc(db, `otps/${uid}`);
    await deleteDoc(otpRef);
};

// --- LOAN FUNCTIONS ---

export const createLoanApplication = async (loanData: Omit<Loan, 'id' | 'status' | 'requestDate'>): Promise<void> => {
  await addDoc(collection(db, 'loans'), {
    ...loanData,
    status: 'pending',
    requestDate: serverTimestamp(),
  });
};

export const getUserLoans = async (userId: string): Promise<Loan[]> => {
  if (!userId) return [];
  const q = query(collection(db, 'loans'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));

  return loans.sort((a, b) => {
    const getSeconds = (timestamp: any) => (timestamp && typeof timestamp.seconds === 'number') ? timestamp.seconds : 0;
    const aSeconds = getSeconds(a.requestDate);
    const bSeconds = getSeconds(b.requestDate);
    return bSeconds - aSeconds;
  });
};

export const getAllLoans = async (): Promise<Loan[]> => {
  const q = query(collection(db, 'loans'), orderBy('requestDate', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};

export const updateLoan = async (loanId: string, data: Partial<Omit<Loan, 'id'>>): Promise<void> => {
  if (!loanId) return;
  const loanRef = doc(db, 'loans', loanId);
  await updateDoc(loanRef, data);
};


export default app;