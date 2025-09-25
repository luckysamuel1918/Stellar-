const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const logger = functions.logger;

/**
 * Deletes a collection and all its subcollections recursively.
 * @param {string} collectionPath The path of the collection to delete.
 * @param {number} batchSize The number of documents to delete per batch.
 */
async function deleteCollection(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // No documents left, we are done.
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick to avoid stack depth limits.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

/**
 * Callable Cloud Function for an admin to delete a user.
 * Deletes the user from Firebase Authentication, which in turn triggers
 * the cleanupUser function to delete associated Firestore data.
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an authenticated user.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Check if the calling user is an admin.
  const callerUid = context.auth.uid;
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || !callerDoc.data().isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an administrative user to perform this action.'
    );
  }

  // Validate the UID passed from the client.
  const uidToDelete = data.uid;
  if (!uidToDelete || typeof uidToDelete !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a "uid" argument specifying the user to delete.'
    );
  }

  try {
    logger.info(`Admin ${callerUid} is deleting user ${uidToDelete}`);
    await admin.auth().deleteUser(uidToDelete);
    logger.info(`Successfully deleted user ${uidToDelete} from Firebase Auth.`);
    // The onDelete trigger (cleanupUser) will handle Firestore data deletion.
    return { result: `Successfully deleted user ${uidToDelete}.` };
  } catch (error) {
    logger.error(`Error deleting user ${uidToDelete}:`, error);
    if (error.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User to delete not found.');
    }
    throw new functions.https.HttpsError('internal', 'Unable to delete user.');
  }
});


/**
 * Cloud Function that triggers on Firebase Authentication user deletion.
 * Cleans up all associated user data from Firestore.
 */
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;
  logger.info(`Starting cleanup for deleted user: ${uid}`);

  const batch = db.batch();

  // 1. Delete user document from 'users' collection
  const userRef = db.collection("users").doc(uid);
  batch.delete(userRef);

  // 2. Delete OTP document from 'otps' collection
  const otpRef = db.collection("otps").doc(uid);
  batch.delete(otpRef);

  try {
    // Commit batch deletions for user and OTP documents
    await batch.commit();
    logger.info(`Deleted user and OTP documents for user: ${uid}`);
  } catch (error) {
    logger.error(`Error in batch delete for user and OTP for ${uid}:`, error);
  }

  // 3. Delete user's loans from the 'loans' collection
  try {
    const loansQuery = db.collection('loans').where('userId', '==', uid);
    const loansSnapshot = await loansQuery.get();
    if (!loansSnapshot.empty) {
      const loanBatch = db.batch();
      loansSnapshot.docs.forEach(doc => {
        loanBatch.delete(doc.ref);
      });
      await loanBatch.commit();
      logger.info(`Deleted ${loansSnapshot.size} loan(s) for user: ${uid}`);
    }
  } catch(error) {
    logger.error(`Error deleting loans for user ${uid}:`, error);
  }

  // 4. Delete user's chat history subcollection
  const chatCollectionPath = `chats/${uid}/messages`;
  try {
    logger.info(`Starting chat history deletion for user: ${uid} at path: ${chatCollectionPath}`);
    await deleteCollection(chatCollectionPath, 100); // Using a batch size of 100
    logger.info(`Successfully deleted chat history for user: ${uid}`);
  } catch(error) {
    logger.error(`Error deleting chat history for user ${uid}:`, error);
  }

  // Note: We are not deleting transactions to maintain a historical record for auditing.
});