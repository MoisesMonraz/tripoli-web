"use client";

import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const COLLECTION_NAME = "article_translations";

/**
 * Get cached translation from Firestore
 * @param {string} slug - Article slug
 * @returns {Promise<Object|null>} Cached translated article or null
 */
export async function getCachedTranslation(slug) {
  try {
    const docRef = doc(db, COLLECTION_NAME, slug);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Return the cached article
      return data.article || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting cached translation:", error);
    return null;
  }
}

/**
 * Save translation to Firestore
 * @param {string} slug - Article slug
 * @param {Object} translatedArticle - The translated article object
 * @returns {Promise<boolean>} Success status
 */
export async function saveCachedTranslation(slug, translatedArticle) {
  try {
    const docRef = doc(db, COLLECTION_NAME, slug);
    await setDoc(docRef, {
      article: translatedArticle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error saving translation to cache:", error);
    return false;
  }
}

/**
 * Update existing translation in Firestore
 * @param {string} slug - Article slug
 * @param {Object} translatedArticle - The translated article object
 * @returns {Promise<boolean>} Success status
 */
export async function updateCachedTranslation(slug, translatedArticle) {
  try {
    const docRef = doc(db, COLLECTION_NAME, slug);
    await setDoc(docRef, {
      article: translatedArticle,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating translation cache:", error);
    return false;
  }
}

/**
 * Check if a translation exists in cache
 * @param {string} slug - Article slug
 * @returns {Promise<boolean>}
 */
export async function hasTranslationCache(slug) {
  try {
    const docRef = doc(db, COLLECTION_NAME, slug);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking translation cache:", error);
    return false;
  }
}

/**
 * Delete a specific translation from cache
 * Use this to force re-translation of an article
 * @param {string} slug - Article slug
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCachedTranslation(slug) {
  try {
    const { deleteDoc } = await import("firebase/firestore");
    const docRef = doc(db, COLLECTION_NAME, slug);
    await deleteDoc(docRef);
    console.log(`Deleted translation cache for: ${slug}`);
    return true;
  } catch (error) {
    console.error("Error deleting translation cache:", error);
    return false;
  }
}

/**
 * Delete ALL translations from cache
 * Use with caution - will force re-translation of all articles
 * @returns {Promise<{success: boolean, deleted: number}>}
 */
export async function clearAllTranslationCache() {
  try {
    const { collection, getDocs, deleteDoc } = await import("firebase/firestore");
    const collectionRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(collectionRef);

    let deleted = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
      deleted++;
      console.log(`Deleted: ${docSnap.id}`);
    }

    console.log(`Cleared ${deleted} translations from cache`);
    return { success: true, deleted };
  } catch (error) {
    console.error("Error clearing translation cache:", error);
    return { success: false, deleted: 0 };
  }
}
