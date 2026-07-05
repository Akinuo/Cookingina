import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, setDoc, onSnapshot, serverTimestamp, collection, query, where, getCountFromServer } from 'firebase/firestore'
import { auth, db, googleProvider } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener
      if (unsubProfile) { unsubProfile(); unsubProfile = null }

      if (firebaseUser) {
        setUser(firebaseUser)
        const ref = doc(db, 'users', firebaseUser.uid)

        // Live listener — profile updates instantly everywhere
        unsubProfile = onSnapshot(ref, async (snap) => {
          if (snap.exists()) {
            const data = snap.data()

            // Fetch real counts from Firestore
            try {
              const [cookbookSnap, savedCount] = await Promise.all([
                getCountFromServer(query(collection(db, 'cookbooks'), where('uid', '==', firebaseUser.uid))),
                Promise.resolve((data.savedRecipes || []).length),
              ])
              setProfile({
                ...data,
                recipesCount:   cookbookSnap.data().count,
                favoritesCount: savedCount,
              })
            } catch {
              setProfile(data)
            }
          } else {
            // First-time user — create profile
            const newProfile = {
              uid:          firebaseUser.uid,
              displayName:  firebaseUser.displayName || 'Anonymous Cook',
              email:        firebaseUser.email,
              photoURL:     firebaseUser.photoURL || '',
              bio:          '',
              followers:    0,
              following:    0,
              recipesCount: 0,
              joinedAt:     serverTimestamp(),
              savedRecipes: [],
              likedRecipes: [],
              followedBy:   [],
              followingList:[],
            }
            await setDoc(ref, newProfile)
            setProfile({ ...newProfile, favoritesCount: 0 })
          }
        })
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const signInGoogle = () => signInWithPopup(auth, googleProvider)
  const logout       = () => signOut(auth)

  const updateProfile = async (data) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    await setDoc(ref, data, { merge: true })
    // onSnapshot will auto-update — no manual setProfile needed
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInGoogle, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
