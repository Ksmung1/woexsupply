// ../MlUtils/deleteItem.js
import { doc, deleteDoc } from "firebase/firestore";

/**
 * Delete a document from Firestore.
 *
 * @param {Object} params
 * @param {string} params.collectionName - Firestore collection name
 * @param {string} params.id - Document id to delete
 * @param {import('firebase/firestore').Firestore} params.db - Firestore instance
 * @returns {Promise<boolean>} true if deleted, false on error
 */
export const deleteItem = async ({ collectionName, id, db }) => {
  if (!collectionName || !id || !db) {
    console.error("deleteItem: missing required params", { collectionName, id, db });
    return false;
  }

  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("deleteItem error:", err);
    return false;
  }
};
