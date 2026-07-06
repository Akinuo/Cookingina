import { useState, useEffect } from 'react'
import { doc, getDoc, collection, query, where, orderBy, getDocs, onSnapshot,
         updateDoc, arrayUnion, arrayRemove, increment, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'
import { ArrowLeft, Users, BookOpen, Heart, UserCheck, UserPlus, Globe } from 'lucide-react'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return d.toLocaleDateString('en-PH', { month:'short', day:'numeric' })
}

function Avatar({ name, photo, size = 72 }) {
  const initials = (name||'U').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  if (photo) return <img src={photo} alt={name} style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', display:'block' }}/>
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:'linear-gradient(135deg,var(--brand-lt),var(--brand-dk))', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.36, fontWeight:700 }}>
      {initials}
    </div>
  )
}

export default function UserProfilePage({ targetUid, onBack }) {
  const { user, profile: myProfile, updateProfile: updateMyProfile } = useAuth()
  const { toasts, success, error: toastErr } = useToast()

  const [targetProfile, setTargetProfile] = useState(null)
  const [posts, setPosts]       = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingPosts, setLoadingPosts]     = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isMe = user?.uid === targetUid

  // Load target profile (live)
  useEffect(() => {
    if (!targetUid) return
    setLoadingProfile(true)
    const unsub = onSnapshot(doc(db, 'users', targetUid), snap => {
      if (snap.exists()) setTargetProfile({ uid: snap.id, ...snap.data() })
      setLoadingProfile(false)
    })
    return unsub
  }, [targetUid])

  // Check if I already follow this user
  useEffect(() => {
    if (!myProfile || !targetUid) return
    setFollowing((myProfile.followingList || []).includes(targetUid))
  }, [myProfile, targetUid])

  // Load their public posts
  useEffect(() => {
    if (!targetUid) return
    setLoadingPosts(true)
    const q = query(collection(db, 'posts'), where('uid', '==', targetUid), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingPosts(false)
    })
    return unsub
  }, [targetUid])

  // Follow / Unfollow
  const handleFollow = async () => {
    if (!user || isMe) return
    setFollowLoading(true)
    try {
      const myRef     = doc(db, 'users', user.uid)
      const theirRef  = doc(db, 'users', targetUid)

      if (following) {
        // Unfollow
        await updateDoc(myRef,   { followingList: arrayRemove(targetUid), following: increment(-1) })
        await updateDoc(theirRef,{ followedBy:    arrayRemove(user.uid),  followers: increment(-1) })
        await updateMyProfile({ following: (myProfile.following || 1) - 1 })
        setFollowing(false)
        success(`Unfollowed ${targetProfile?.displayName}`)
      } else {
        // Follow
        await updateDoc(myRef,   { followingList: arrayUnion(targetUid), following: increment(1) })
        await updateDoc(theirRef,{ followedBy:    arrayUnion(user.uid),  followers: increment(1) })
        await updateMyProfile({ following: (myProfile.following || 0) + 1 })

        // Send notification to followed user
        await addDoc(collection(db, 'notifications', targetUid, 'items'), {
          type:      'follow',
          fromUid:   user.uid,
          fromName:  myProfile?.displayName || 'Someone',
          fromPhoto: myProfile?.photoURL    || '',
          read:      false,
          createdAt: serverTimestamp(),
        })

        setFollowing(true)
        success(`Following ${targetProfile?.displayName}! 🎉`)
      }
    } catch(e) {
      toastErr(e.message || 'Failed to update follow.')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loadingProfile) return (
    <div className="empty-state">
      <span className="spinner spinner-lg" style={{ display:'block', margin:'0 auto 14px' }}/>
      <p>Loading profile…</p>
    </div>
  )

  if (!targetProfile) return (
    <div className="empty-state">
      <Users size={40} strokeWidth={1.3} className="empty-state-icon-svg"/>
      <h3>User not found</h3>
      <p>This profile doesn't exist or has been removed.</p>
      <button className="btn btn-secondary mt-3" onClick={onBack}><ArrowLeft size={15}/> Go back</button>
    </div>
  )

  return (
    <div className="user-profile-page">
      <ToastContainer toasts={toasts}/>

      {/* Back button */}
      <button className="btn btn-ghost btn-sm mb-4" onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6 }}>
        <ArrowLeft size={16}/> Back
      </button>

      {/* Profile card */}
      <div className="card card-elevated user-profile-card mb-5">
        {/* Cover */}
        <div className="user-profile-cover"/>

        <div className="user-profile-body">
          {/* Avatar + Follow */}
          <div className="user-profile-top">
            <div className="user-profile-avatar-wrap">
              <Avatar name={targetProfile.displayName} photo={targetProfile.photoURL} size={80}/>
            </div>
            {!isMe && (
              <button
                className={`btn ${following ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading
                  ? <span className="spinner spinner-sm"/>
                  : following
                    ? <><UserCheck size={14}/> Following</>
                    : <><UserPlus size={14}/> Follow</>
                }
              </button>
            )}
            {isMe && (
              <span className="tag" style={{ fontSize:'0.72rem' }}>You</span>
            )}
          </div>

          {/* Name + handle + bio */}
          <div className="user-profile-info">
            <h2 className="user-profile-name">{targetProfile.displayName || 'Anonymous Cook'}</h2>
            <div className="user-profile-handle">@{(targetProfile.email||'').split('@')[0]}</div>
            {targetProfile.bio && (
              <p className="user-profile-bio">{targetProfile.bio}</p>
            )}
          </div>

          {/* Stats — only show public stats */}
          <div className="user-profile-stats">
            <div className="user-stat-item">
              <span className="user-stat-val">{posts.length}</span>
              <span className="user-stat-lbl">Posts</span>
            </div>
            <div className="user-stat-item">
              <span className="user-stat-val">{targetProfile.followers || 0}</span>
              <span className="user-stat-lbl">Followers</span>
            </div>
            <div className="user-stat-item">
              <span className="user-stat-val">{targetProfile.following || 0}</span>
              <span className="user-stat-lbl">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Their posts */}
      <div className="section-title mb-4" style={{ fontSize:'1rem' }}>
        {isMe ? 'Your Posts' : `${targetProfile.displayName?.split(' ')[0]}'s Posts`}
      </div>

      {loadingPosts && (
        <div className="empty-state" style={{ padding:'32px 0' }}>
          <span className="spinner spinner-md" style={{ display:'block', margin:'0 auto 12px' }}/>
          <p className="text-muted text-sm">Loading posts…</p>
        </div>
      )}

      {!loadingPosts && posts.length === 0 && (
        <div className="empty-state" style={{ padding:'32px 0' }}>
          <BookOpen size={36} strokeWidth={1.3} className="empty-state-icon-svg" style={{ marginBottom:'var(--space-2)' }}/>
          <h3>No posts yet</h3>
          <p>{isMe ? 'Share your first recipe with the community!' : `${targetProfile.displayName?.split(' ')[0]} hasn't posted anything yet.`}</p>
        </div>
      )}

      <div className="user-posts-grid">
        {posts.map(post => (
          <div key={post.id} className="user-post-thumb card">
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={post.text?.slice(0,40)} className="user-post-thumb-img" loading="lazy"/>
            ) : (
              <div className="user-post-thumb-emoji">{post.emoji || '🍳'}</div>
            )}
            <div className="user-post-thumb-overlay">
              <span className="user-post-thumb-likes"><Heart size={11} fill="currentColor" strokeWidth={0}/> {post.likes || 0}</span>
              {post.recipe && <span className="user-post-thumb-tag">{post.recipe}</span>}
            </div>
            <div className="user-post-thumb-text line-clamp-2">{post.text}</div>
            <div className="user-post-thumb-time">{timeAgo(post.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
