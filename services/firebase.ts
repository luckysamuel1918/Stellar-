// FIX: Import Firebase v8 compatibility modules to resolve module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
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
const storage = firebase.storage();
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
        pin, // Note: Storing a PIN directly is insecure. This is for demonstration only.
        balance: 1000, // Starting balance for new users for demo purposes
        isAdmin: email === 'admin@westcoasttrust.com', // Example admin setup
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
    batch.update(senderRef, { balance: sender.balance - amount });

    // Credit receiver
    const receiverRef = db.doc(`users/${receiver.uid}`);
    batch.update(receiverRef, { balance: receiver.balance + amount });
    
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
    const newBalance = type === 'credit' ? user.balance + amount : user.balance - amount;
    
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
    return uniqueTransactions.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (!uid) return;
    const userRef = db.doc(`users/${uid}`);
    await userRef.update(data);
};

export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
    if (!uid || !file) throw new Error("User ID and file are required.");
    const filePath = `profile_pictures/${uid}/${file.name}`;
    const fileRef = storage.ref(filePath);
    const snapshot = await fileRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return downloadURL;
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

// FIX: Export auth and db objects directly for v8 compatibility.
// Other functions like signInWithEmailAndPassword are now methods on the auth object.
export { 
  auth, 
  db
};

// FIX: Export User type from firebase namespace.
type User = firebase.User;
export type { User };