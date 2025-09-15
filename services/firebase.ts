// FIX: Refactored to use Firebase v8 compat libraries to fix module resolution errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

import { UserProfile, Transaction } from "../types";

// Manually define types that were previously imported from the v9 SDK.
type FirebaseApp = firebase.app.App;
export type User = firebase.User;

const firebaseConfig = {
  apiKey: (process && process.env && process.env.API_KEY) || '',
  authDomain: "westcoast-trust-demo.firebaseapp.com",
  databaseURL: "https://westcoast-trust-demo.firebaseio.com",
  projectId: "westcoast-trust-demo",
  storageBucket: "westcoast-trust-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6a7b8c9d0e1",
  measurementId: "G-DEMO123ABC"
};

let app: FirebaseApp;
try {
    // Use v8-style initialization.
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
    } else {
        app = firebase.app();
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    // This is a critical error. We stop the app and show a clear message.
    // Replacing the body prevents other scripts from running and React from mounting.
    document.body.innerHTML = `<div style="text-align: center; padding: 40px; font-family: 'Inter', sans-serif; background-color: #F6F9FC; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="font-size: 1.5rem; font-weight: bold; color: #0A2540;">Application Configuration Error</h1>
        <p style="margin-top: 1rem; color: #6B7280;">There's a problem with the app's setup. The API key for backend services is missing or invalid.</p>
        <p style="margin-top: 0.5rem; color: #6B7280;">Please ensure environment variables are correctly configured.</p>
    </div>`;
    throw new Error("Firebase initialization failed due to invalid configuration. Halting application.");
}

const auth = firebase.auth();
const db = firebase.firestore();
const { Timestamp } = firebase.firestore;
const { serverTimestamp, increment } = firebase.firestore.FieldValue;

// Re-export auth functions to be used in components
const { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = auth;
export { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  auth, 
  db,
  Timestamp
};

export const createUserProfileDocument = async (userAuth: User, additionalData: any) => {
  if (!userAuth) return;
  const userRef = db.doc(`users/${userAuth.uid}`);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { email } = userAuth;
    const { fullName, phone, address, state, country, currencyCode, accountNumber, pin } = additionalData;
    const createdAt = serverTimestamp();
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
        balance: 1000, // Starting balance for new users for demo purposes
        isAdmin: email === 'admin@westcoasttrust.com', // Example admin setup
        isSuspended: false,
        createdAt,
        photoURL: '',
      };
      await userRef.set(newUserProfile);
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }
  return userRef;
};

export const getUserData = async (uid: string): Promise<UserProfile | null> => {
    if (!uid) return null;
    const userRef = db.doc(`users/${uid}`);
    const snapshot = await userRef.get();
    if (snapshot.exists) {
        return { uid, ...snapshot.data() } as UserProfile;
    }
    return null;
}

export const getUserDataWithPin = async (uid: string): Promise<(UserProfile & { pin: string }) | null> => {
    if (!uid) return null;
    const userRef = db.doc(`users/${uid}`);
    const snapshot = await userRef.get();
    if (snapshot.exists) {
        return { uid, ...snapshot.data() } as UserProfile & { pin: string };
    }
    return null;
}

export const getUserByAccountNumber = async (accountNumber: string): Promise<UserProfile | null> => {
    const usersRef = db.collection("users");
    const q = usersRef.where("accountNumber", "==", accountNumber);
    const querySnapshot = await q.get();
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
        const docRef = await db.collection("transactions").add(dataWithTimestamp);
        const docSnap = await docRef.get();
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
    
    const senderRef = db.doc(`users/${sender.uid}`);

    await db.runTransaction(async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        if (!senderDoc.exists || (senderDoc.data()?.balance || 0) < amount) {
            throw new Error("Insufficient funds.");
        }
        
        transaction.update(senderRef, { balance: increment(-amount) });

        const isInternal = receiver.uid && !receiver.uid.startsWith('EXT-') && !receiver.uid.startsWith('INTL-');
        if (isInternal) {
            const receiverRef = db.doc(`users/${receiver.uid}`);
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

    return newTransaction;
};


export const adminUpdateBalance = async (
    user: UserProfile, 
    amount: number, 
    type: 'credit' | 'debit', 
    description: string,
    senderName?: string,
    customTimestamp?: firebase.firestore.Timestamp,
    transactionType?: Transaction['type']
): Promise<Transaction | null> => {
    const userRef = db.doc(`users/${user.uid}`);
    const currentBalance = Number(user.balance) || 0;
    const amountToIncrement = type === 'credit' ? amount : -amount;

    if(currentBalance + amountToIncrement < 0) throw new Error("Debit amount exceeds user balance.");

    await userRef.update({ balance: increment(amountToIncrement) });

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
    return newTransaction;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = db.collection('users');
    const userSnapshot = await usersCollection.get();
    return userSnapshot.docs.map(docData => ({ uid: docData.id, ...docData.data() } as UserProfile));
};

export const getUserTransactions = async (uid: string): Promise<Transaction[]> => {
    const transactionsRef = db.collection("transactions");
    const sentQuery = transactionsRef.where("senderId", "==", uid);
    const receivedQuery = transactionsRef.where("receiverId", "==", uid);
    
    const [senderSnapshot, receiverSnapshot] = await Promise.all([sentQuery.get(), receivedQuery.get()]);

    const transactionsMap = new Map<string, Transaction>();
    senderSnapshot.forEach((docData) => transactionsMap.set(docData.id, { id: docData.id, ...docData.data() } as Transaction));
    receiverSnapshot.forEach((docData) => transactionsMap.set(docData.id, { id: docData.id, ...docData.data() } as Transaction));

    const uniqueTransactions = Array.from(transactionsMap.values());
    return uniqueTransactions.sort((a, b) => {
        const aSeconds = (a.timestamp && a.timestamp.seconds) || 0;
        const bSeconds = (b.timestamp && b.timestamp.seconds) || 0;
        return bSeconds - aSeconds;
    });
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!uid) return;
    const userRef = db.doc(`users/${uid}`);
    await userRef.update(data);
};

export const adminDeleteUser = async (uid: string): Promise<void> => {
    if (!uid) throw new Error("User ID is required.");
    const batch = db.batch();
    const userRef = db.doc(`users/${uid}`);

    const transactionsRef = db.collection("transactions");
    const sentQuery = transactionsRef.where("senderId", "==", uid);
    const receivedQuery = transactionsRef.where("receiverId", "==", uid);

    const [sentSnapshot, receivedSnapshot] = await Promise.all([sentQuery.get(), receivedQuery.get()]);
    sentSnapshot.forEach(docData => batch.delete(docData.ref));
    receivedSnapshot.forEach(docData => batch.delete(docData.ref));

    const messagesRef = db.collection(`chats/${uid}/messages`);
    const messagesSnapshot = await messagesRef.get();
    messagesSnapshot.forEach(docData => batch.delete(docData.ref));
    
    batch.delete(userRef);

    await batch.commit();
};

export const adminUpdateTransaction = async (transactionId: string, data: Partial<Transaction>): Promise<void> => {
    if (!transactionId) return;
    const txRef = db.doc(`transactions/${transactionId}`);
    await txRef.update(data);
};

export const getChatMessages = (userId: string, callback: (messages: any[]) => void) => {
    const messagesQuery = db.collection(`chats/${userId}/messages`).orderBy('timestamp', 'asc');
    return messagesQuery.onSnapshot(snapshot => {
        const messages = snapshot.docs.map(docData => ({ id: docData.id, ...docData.data() }));
        callback(messages);
    });
};

export const sendChatMessage = async (userId: string, message: { text: string; senderId: string; senderName: string; }) => {
    if (!userId || !message.text) return;
    await db.collection(`chats/${userId}/messages`).add({
        ...message,
        timestamp: serverTimestamp()
    });
};

export const wipeChatHistory = async (userId:string) => {
    const messagesRef = db.collection(`chats/${userId}/messages`);
    const snapshot = await messagesRef.get();
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach(docData => batch.delete(docData.ref));
    await batch.commit();
};

export const generateAndSendOtp = async (uid: string, email: string, name: string): Promise<void> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRef = db.doc(`otps/${uid}`);
    const expiresAt = Timestamp.fromMillis(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRef.set({
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
    const otpRef = db.doc(`otps/${uid}`);
    const snapshot = await otpRef.get();

    if (!snapshot.exists) {
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
    await otpRef.update({ verified: true });
    return { valid: true, message: 'OTP verified successfully.' };
};

export const deleteOtp = async (uid: string): Promise<void> => {
    const otpRef = db.doc(`otps/${uid}`);
    await otpRef.delete();
};