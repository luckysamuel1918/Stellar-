// FIX: Import Firebase v8 compatibility modules to resolve module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { UserProfile, Transaction } from "../types";

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

// FIX: Use Firebase v8 compatibility initialization.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth: firebase.auth.Auth = firebase.auth();
const db = firebase.firestore();
const Timestamp = firebase.firestore.Timestamp;

// FIX: Refactored to use Firebase v8 API.
export const createUserProfileDocument = async (userAuth: firebase.User, additionalData: any) => {
  if (!userAuth) return;
  const userRef = db.doc(`users/${userAuth.uid}`);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const { email } = userAuth;
    const { fullName, phone, address, state, country, currencyCode, accountNumber, pin } = additionalData;
    const createdAt = firebase.firestore.FieldValue.serverTimestamp();
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

// FIX: Refactored to use Firebase v8 API.
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

// FIX: Refactored to use Firebase v8 API.
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

// FIX: Refactored to use Firebase v8 API.
export const createTransaction = async (transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    try {
        const dataWithTimestamp = {
            ...transactionData,
            timestamp: transactionData.timestamp || firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("transactions").add(dataWithTimestamp);
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() } as Transaction;
    } catch (error) {
        console.error("Error creating transaction:", error);
        return null;
    }
};

// FIX: Refactored to use Firebase v8 API.
export const performTransfer = async (sender: UserProfile, receiver: UserProfile, amount: number, description: string): Promise<Transaction | null> => {
    if (sender.balance < amount) {
        throw new Error("Insufficient funds.");
    }

    const batch = db.batch();

    // Debit sender
    const senderRef = db.doc(`users/${sender.uid}`);
    batch.update(senderRef, { balance: firebase.firestore.FieldValue.increment(-amount) });

    // Credit receiver only if they are an internal user (don't have a special UID prefix)
    const isInternal = receiver.uid && !receiver.uid.startsWith('EXT-') && !receiver.uid.startsWith('INTL-');
    if (isInternal) {
        const receiverRef = db.doc(`users/${receiver.uid}`);
        batch.update(receiverRef, { balance: firebase.firestore.FieldValue.increment(amount) });
    }
    
    await batch.commit();

    // Create transaction records for both parties
    const commonDetails = {
        amount,
        description,
        status: 'completed' as const,
        receiverAccountNumber: receiver.accountNumber,
        receiverName: receiver.fullName
    };

    const transaction = await createTransaction({
        ...commonDetails,
        senderId: sender.uid,
        senderName: sender.fullName,
        receiverId: receiver.uid,
        type: 'transfer',
        // FIX: Add timestamp property to satisfy the Transaction type.
        // The createTransaction function will use a server timestamp if this is undefined.
        timestamp: undefined,
    });

    return transaction;
};

// FIX: Refactored to use Firebase v8 API.
export const adminUpdateBalance = async (
    user: UserProfile, 
    amount: number, 
    type: 'credit' | 'debit', 
    description: string,
    senderName?: string,
    customTimestamp?: firebase.firestore.Timestamp
) => {
    const batch = db.batch();
    const userRef = db.doc(`users/${user.uid}`);
    // FIX: Make balance calculation more robust to handle potential non-numeric values from Firestore.
    const currentBalance = Number(user.balance) || 0;
    const newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
    
    if(newBalance < 0) throw new Error("Debit amount exceeds user balance.");

    batch.update(userRef, { balance: newBalance });
    await batch.commit();

     await createTransaction({
        amount,
        description,
        status: 'completed',
        type,
        senderId: 'admin',
        senderName: senderName || 'Westcoast Trust Bank Admin',
        receiverId: user.uid,
        receiverName: user.fullName,
        receiverAccountNumber: user.accountNumber,
        timestamp: customTimestamp,
    });
};

// FIX: Refactored to use Firebase v8 API.
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const usersCollection = db.collection('users');
    const userSnapshot = await usersCollection.get();
    return userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
};

// FIX: Refactored to use Firebase v8 API.
export const getUserTransactions = async (uid: string): Promise<Transaction[]> => {
    const transactionsRef = db.collection("transactions");
    const q = transactionsRef.where("senderId", "==", uid).orderBy("timestamp", "desc");
    const q2 = transactionsRef.where("receiverId", "==", uid).orderBy("timestamp", "desc");
    
    const [senderSnapshot, receiverSnapshot] = await Promise.all([q.get(), q2.get()]);

    const transactionsMap = new Map<string, Transaction>();
    senderSnapshot.forEach((doc) => transactionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Transaction));
    receiverSnapshot.forEach((doc) => transactionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Transaction));

    const uniqueTransactions = Array.from(transactionsMap.values());
    // FIX: Made sort function null-safe to prevent errors in Safari.
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

    // Delete user's transactions
    const transactionsRef = db.collection("transactions");
    const sentQuery = transactionsRef.where("senderId", "==", uid);
    const receivedQuery = transactionsRef.where("receiverId", "==", uid);

    const [sentSnapshot, receivedSnapshot] = await Promise.all([sentQuery.get(), receivedQuery.get()]);
    sentSnapshot.forEach(doc => batch.delete(doc.ref));
    receivedSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete user's chat history
    const messagesRef = db.collection(`chats/${uid}/messages`);
    const messagesSnapshot = await messagesRef.get();
    messagesSnapshot.forEach(doc => batch.delete(doc.ref));
    
    // Delete user document
    batch.delete(userRef);

    await batch.commit();
    // NOTE: This does not delete the Firebase Auth user, as it requires Admin SDK.
};

export const adminUpdateTransaction = async (transactionId: string, data: Partial<Transaction>): Promise<void> => {
    if (!transactionId) return;
    const txRef = db.doc(`transactions/${transactionId}`);
    await txRef.update(data);
};

export const getChatMessages = (userId: string, callback: (messages: any[]) => void) => {
    return db.collection(`chats/${userId}/messages`)
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(messages);
        });
};

export const sendChatMessage = async (userId: string, message: { text: string; senderId: string; senderName: string; }) => {
    if (!userId || !message.text) return;
    await db.collection(`chats/${userId}/messages`).add({
        ...message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
};

export const wipeChatHistory = async (userId:string) => {
    const messagesRef = db.collection(`chats/${userId}/messages`);
    const snapshot = await messagesRef.get();
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
};

export const generateAndSendOtp = async (uid: string, email: string, name: string): Promise<void> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRef = db.doc(`otps/${uid}`);
    const expiresAt = firebase.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000); // 5 minutes

    await otpRef.set({
        otp,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        verified: false
    });

    // Use EmailJS to send the email
    const templateParams = {
        otp_code: otp,
        to_email: email,
        to_name: name,
        from_email: 'support@westcoasttrusts.com'
    };

    await (window as any).emailjs.send(
        'service_ddqz3a6', // Service ID
        'template_zsv0alp', // Template ID
        templateParams,
        'VYfq3eW-NMpJkm35M' // Public Key
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

    // OTP is valid
    await otpRef.update({ verified: true });
    return { valid: true, message: 'OTP verified successfully.' };
};

export const deleteOtp = async (uid: string): Promise<void> => {
    const otpRef = db.doc(`otps/${uid}`);
    await otpRef.delete();
};


// FIX: Export auth and db objects directly for v8 compatibility.
// Other functions like signInWithEmailAndPassword are now methods on the auth object.
export { 
  auth, 
  db
};

// FIX: Export User type from firebase namespace.
type User = firebase.User;
export type { User };