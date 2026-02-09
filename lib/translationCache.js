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
