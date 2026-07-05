import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// Firebase is used ONLY for:
//   - Authentication (Google Sign-In)
//   - Firestore (database)
//   - Hosting (deployment)
//
// Image uploads are handled by Cloudinary (src/services/cloudinary.js)
// NOT Firebase Storage — Firebase Storage requires the paid Blaze plan.

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'YOUR_API_KEY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'cookingina.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'cookingina',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'cookingina.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || 'YOUR_APP_ID',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db   = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Enable offline persistence so the app works without internet
enableIndexedDbPersistence(db).catch(() => {
  // Fails silently if multiple tabs are open — that's fine
})

export default app
