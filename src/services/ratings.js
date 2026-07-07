import { doc, getDoc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'

/**
 * One-time read of a recipe's live aggregate rating.
 * Returns { avg, count } or null if nobody has rated it yet.
 */
export async function getRecipeStats(recipeId) {
  if (!recipeId) return null
  const snap = await getDoc(doc(db, 'recipeStats', recipeId))
  return snap.exists() ? snap.data() : null
}

/**
 * One-time read of what a specific user rated this recipe, if anything.
 * Returns { stars } or null.
 */
export async function getUserRating(recipeId, uid) {
  if (!recipeId || !uid) return null
  const snap = await getDoc(doc(db, 'recipeRatings', recipeId, 'entries', uid))
  return snap.exists() ? snap.data() : null
}

/**
 * Submit or update a user's 1–5 star rating for a recipe, atomically
 * recomputing the recipe's aggregate stats in the same transaction.
 *
 * This does the "recompute the average" math on the client inside a
 * Firestore transaction rather than via a Cloud Function trigger, since
 * Cloud Functions require the Blaze plan. A transaction is still safe
 * against concurrent ratings from different users — Firestore retries it
 * automatically if the stats doc changes underneath it before commit.
 */
export async function submitRating(recipeId, uid, stars) {
  if (!recipeId || !uid) throw new Error('Missing recipeId or uid')
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('Rating must be 1–5')

  const statsRef = doc(db, 'recipeStats', recipeId)
  const entryRef = doc(db, 'recipeRatings', recipeId, 'entries', uid)

  await runTransaction(db, async (tx) => {
    const [statsSnap, entrySnap] = await Promise.all([tx.get(statsRef), tx.get(entryRef)])

    const oldAvg    = statsSnap.exists() ? statsSnap.data().avg   : 0
    const oldCount  = statsSnap.exists() ? statsSnap.data().count : 0
    const prevStars = entrySnap.exists() ? entrySnap.data().stars : null

    let newCount, newAvg
    if (prevStars == null) {
      // First time this user has rated this recipe
      newCount = oldCount + 1
      newAvg   = (oldAvg * oldCount + stars) / newCount
    } else {
      // Changing an existing rating — count stays the same, just re-average
      newCount = oldCount || 1
      newAvg   = (oldAvg * oldCount - prevStars + stars) / newCount
    }
    newAvg = Math.max(1, Math.min(5, newAvg))

    tx.set(statsRef, { avg: newAvg, count: newCount })
    tx.set(entryRef, { stars, updatedAt: Date.now() })
  })
}
