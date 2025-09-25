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
