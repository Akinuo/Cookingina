import { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Share2, Plus, X, Send, Trash2, ImagePlus, Camera } from 'lucide-react'
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, increment, query, orderBy, serverTimestamp, onSnapshot
} from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadPostImage } from '../services/cloudinary'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'
import { IconChefHat } from '../components/icons/FoodIcons'

const FOOD_EMOJIS = ['🍳','🍗','🍲','🥜','🍜','🍚','🥟','🍖','🥩','🐟','🍮','🌶️','🥗','🥘','🧆','🫕','🍱','🥞','🫙','🍝']

function timeAgo(ts) {
  if (!ts) return 'Just now'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60)    return 'Just now'
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  if (s < 604800)return `${Math.floor(s/86400)}d ago`
  return d.toLocaleDateString('en-PH', { month:'short', day:'numeric' })
}

function Avatar({ name, photo, size = 40 }) {
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  if (photo) return (
    <img src={photo} alt={name}
      style={{ width:size, height:size, borderRadius:'50%', objectFit:'cover', flexShrink:0, display:'block' }} />
  )
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'linear-gradient(135deg,var(--brand-lt),var(--brand-dk))',
      color:'white', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.36, fontWeight:700, flexShrink:0, letterSpacing:'-0.02em',
    }}>{initials}</div>
  )
}

export default function CommunityPage({ onUserClick }) {
  const { user, profile }      = useAuth()
  const { toasts, success, error: toastErr } = useToast()
  const [posts, setPosts]      = useState([])
  const [loading, setLoading]  = useState(true)
  const [showNew, setShowNew]  = useState(false)

  // New post form state
  const [newText, setNewText]       = useState('')
  const [newEmoji, setNewEmoji]     = useState('🍳')
  const [newRecipe, setNewRecipe]   = useState('')
  const [newImage, setNewImage]     = useState(null)   // File object
  const [newPreview, setNewPreview] = useState(null)   // Data URL preview
  const [uploadPct, setUploadPct]   = useState(0)
  const [posting, setPosting]       = useState(false)

  // Comments state
  const [commenting, setCommenting]   = useState(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments]       = useState({})

  const fileRef   = useRef(null)
  const unsubRef  = useRef(null)

  // Real-time posts feed
  useEffect(() => {
    setLoading(true)
    const q = query(collection(db,'posts'), orderBy('createdAt','desc'))
    unsubRef.current = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id:d.id, ...d.data() })))
      setLoading(false)
    }, err => { console.error(err); setLoading(false) })
    return () => unsubRef.current?.()
  }, [])

  // Image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toastErr('Only image files allowed.'); return }
    if (file.size > 10*1024*1024) { toastErr('Image must be under 10MB.'); return }
    setNewImage(file)
    const reader = new FileReader()
    reader.onload = ev => setNewPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const removeImage = () => { setNewImage(null); setNewPreview(null); if(fileRef.current) fileRef.current.value='' }

  // Create post
  const handlePost = async () => {
    if (!newText.trim() || posting) return
    setPosting(true); setUploadPct(0)
    try {
      let imageUrl = ''
      if (newImage) {
        imageUrl = await uploadPostImage(newImage, pct => setUploadPct(pct))
      }
      await addDoc(collection(db,'posts'), {
        uid:       user.uid,
        userName:  profile?.displayName || user.displayName || 'Anonymous Cook',
        userHandle:`@${(user.email||'').split('@')[0]}`,
        photoURL:  profile?.photoURL || user.photoURL || '',
        text:      newText.trim(),
        emoji:     newImage ? null : newEmoji,
        imageUrl:  imageUrl || '',
        recipe:    newRecipe.trim(),
        likes:     0, likedBy: [], comments: 0,
        createdAt: serverTimestamp(),
      })
      setNewText(''); setNewEmoji('🍳'); setNewRecipe(''); removeImage()
      setShowNew(false)
      success('Post shared! 🎉')
    } catch(e) { toastErr(e.message || 'Failed to post. Try again.') }
    finally    { setPosting(false); setUploadPct(0) }
  }

  // Like toggle — fires notification to post owner
  const toggleLike = async (post) => {
    const liked = (post.likedBy||[]).includes(user.uid)
    try {
      await updateDoc(doc(db,'posts',post.id), {
        likes:   increment(liked ? -1 : 1),
        likedBy: liked
          ? (post.likedBy||[]).filter(id => id!==user.uid)
          : [...(post.likedBy||[]), user.uid]
      })
      // Send notification to post owner (not to yourself)
      if (!liked && post.uid !== user.uid) {
        await addDoc(collection(db,'notifications', post.uid, 'items'), {
          type:      'like',
          fromUid:   user.uid,
          fromName:  profile?.displayName || 'Someone',
          fromPhoto: profile?.photoURL    || '',
          postId:    post.id,
          read:      false,
          createdAt: serverTimestamp(),
        })
      }
    } catch { toastErr('Could not update like.') }
  }

  // Load comments
  const loadComments = async (postId) => {
    if (comments[postId]) { setCommenting(postId); return }
    const snap = await getDocs(query(collection(db,'posts',postId,'comments'), orderBy('createdAt','asc')))
    setComments(c => ({ ...c, [postId]: snap.docs.map(d => ({ id:d.id, ...d.data() })) }))
    setCommenting(postId)
  }

  // Submit comment
  const submitComment = async (postId) => {
    if (!commentText.trim()) return
    try {
      const ref = await addDoc(collection(db,'posts',postId,'comments'), {
        uid: user.uid, userName: profile?.displayName||'Anonymous',
        photoURL: profile?.photoURL||'', text: commentText.trim(), createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db,'posts',postId), { comments: increment(1) })
      setComments(c => ({ ...c, [postId]: [...(c[postId]||[]), { id:ref.id, uid:user.uid, userName:profile?.displayName||'Anonymous', photoURL:profile?.photoURL||'', text:commentText.trim() }] }))
      setCommentText('')
      // Notify post owner
      const post = posts.find(p => p.id === postId)
      if (post && post.uid !== user.uid) {
        await addDoc(collection(db,'notifications', post.uid, 'items'), {
          type:'comment', fromUid:user.uid, fromName:profile?.displayName||'Someone',
          fromPhoto:profile?.photoURL||'', postId, read:false, createdAt:serverTimestamp(),
        })
      }
    } catch { toastErr('Failed to comment.') }
  }

  // Delete post
  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return
    try { await deleteDoc(doc(db,'posts',id)); success('Post deleted.') }
    catch { toastErr('Failed to delete.') }
  }

  // Web Share
  const handleShare = (post) => {
    const text = `${post.userName} on CookingINA: ${post.text}`
    navigator.share ? navigator.share({ title:'CookingINA', text, url: window.location.href })
                    : (navigator.clipboard?.writeText(text), success('Copied!'))
  }

  return (
    <div className="community-page">
      <ToastContainer toasts={toasts} />

      {/* ── Page header ─────────────────────────── */}
      <div className="community-header">
        <div>
          <h1 className="page-title">Community</h1>
          <p className="text-sm text-muted">Share recipes, tips &amp; Filipino food love 🇵🇭</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={16} /> Share Post
        </button>
      </div>

      {/* ── New Post Modal ───────────────────────── */}
      {showNew && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowNew(false)}>
          <div className="modal new-post-modal">
            {/* Modal header */}
            <div className="modal-header">
              <h3 className="new-post-title">Share with Community</h3>
              <button className="modal-close" onClick={() => setShowNew(false)}><X size={16}/></button>
            </div>

            {/* User row */}
            <div className="new-post-user-row">
              <Avatar name={profile?.displayName} photo={profile?.photoURL} size={42}/>
              <div>
                <div className="new-post-user-name">{profile?.displayName||'You'}</div>
                <div className="new-post-user-sub">Posting to CookingINA community</div>
              </div>
            </div>

            {/* Post text */}
            <div className="input-wrap" style={{ marginBottom:14 }}>
              <label className="input-label">What did you cook? *</label>
              <textarea className="input-field new-post-textarea"
                rows={4} value={newText}
                placeholder="Share your recipe, cooking tip, or Filipino food story… #cookingina #pinoyfood"
                onChange={e => setNewText(e.target.value)} />
            </div>

            {/* Photo upload area */}
            <div className="input-wrap" style={{ marginBottom:14 }}>
              <label className="input-label">Food Photo (optional)</label>
              {newPreview ? (
                <div className="new-post-img-preview">
                  <img src={newPreview} alt="preview"/>
                  <button className="new-post-img-remove" onClick={removeImage} title="Remove photo">
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <button className="new-post-img-upload-btn" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={20} style={{ color:'var(--brand)' }}/>
                  <span>Upload food photo</span>
                  <span className="new-post-img-hint">JPG, PNG or WEBP · max 10MB</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImageSelect}/>
            </div>

            {/* Emoji picker — only shown if no photo */}
            {!newPreview && (
              <div className="input-wrap" style={{ marginBottom:14 }}>
                <label className="input-label">Or pick an emoji instead</label>
                <div className="new-post-emoji-grid">
                  {FOOD_EMOJIS.map(e => (
                    <button key={e} className={`emoji-pick-btn${newEmoji===e?' selected':''}`}
                      onClick={() => setNewEmoji(e)}>{e}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe tag */}
            <div className="input-wrap" style={{ marginBottom:20 }}>
              <label className="input-label">Tag a recipe name (optional)</label>
              <input className="input-field" value={newRecipe}
                placeholder="e.g. Chicken Adobo, Sinigang…"
                onChange={e => setNewRecipe(e.target.value)}/>
            </div>

            {/* Upload progress */}
            {posting && newImage && uploadPct > 0 && uploadPct < 100 && (
              <div className="upload-progress-wrap">
                <div className="upload-progress-bar" style={{ width:`${uploadPct}%` }}/>
                <span className="upload-progress-label">{uploadPct}%</span>
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}
                onClick={handlePost} disabled={!newText.trim()||posting}>
                {posting ? <><span className="spinner spinner-sm spinner-white"/> {newImage?'Uploading…':'Posting…'}</>
                         : <><Share2 size={15}/> Share Post</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feed ────────────────────────────────── */}
      {loading && (
        <div className="empty-state">
          <span className="spinner spinner-lg" style={{ display:'block', margin:'0 auto 14px' }}/>
          <p className="text-muted">Loading community posts…</p>
        </div>
      )}

      {!loading && posts.length===0 && (
        <div className="empty-state">
          <IconChefHat size={40} strokeWidth={1.3} className="empty-state-icon-svg"/>
          <h3>Walang posts pa!</h3>
          <p>Be the first to share a recipe with the CookingINA community!</p>
          <button className="btn btn-primary mt-3" onClick={() => setShowNew(true)}>
            <Plus size={15}/> Share First Post
          </button>
        </div>
      )}

      <div className="community-feed">
        {posts.map(post => {
          const isLiked  = (post.likedBy||[]).includes(user.uid)
          const isOwner  = post.uid === user.uid
          const postCmts = comments[post.id] || []
          const showCmts = commenting === post.id

          return (
            <article key={post.id} className="post-card-new card card-elevated">
              {/* ── Post header ── */}
              <div className="post-header-new">
                <button className="avatar-link-btn" onClick={() => onUserClick?.(post.uid)} title="View profile">
                  <Avatar name={post.userName} photo={post.photoURL} size={40}/>
                </button>
                <div className="post-user-info">
                  <button className="post-username-link" onClick={() => onUserClick?.(post.uid)}>
                    <span className="post-user-name-new">{post.userName}</span>
                  </button>
                  <span className="post-user-meta">{post.userHandle} · {timeAgo(post.createdAt)}</span>
                </div>
                <div className="post-header-right">
                  {post.recipe && <span className="tag tag-brand post-recipe-tag">{post.recipe}</span>}
                  {isOwner && (
                    <button className="post-delete-btn" onClick={() => deletePost(post.id)} title="Delete post">
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Post text ── */}
              <div className="post-text-body">
                <p className="post-text-new">{post.text}</p>
              </div>

              {/* ── Food photo or emoji ── */}
              {post.imageUrl ? (
                <div className="post-img-container">
                  <img src={post.imageUrl} alt="food" className="post-food-img"
                    onError={e => { e.target.parentElement.innerHTML = `<div class="post-emoji-fallback">${post.emoji||'🍳'}</div>` }}/>
                </div>
              ) : (
                <div className="post-emoji-display">{post.emoji||'🍳'}</div>
              )}

              {/* ── Action bar ── */}
              <div className="post-actions-new">
                <button className={`post-action-btn-new${isLiked?' liked':''}`} onClick={() => toggleLike(post)}>
                  <Heart size={16} fill={isLiked?'currentColor':'none'}/>
                  <span>{post.likes||0}</span>
                </button>
                <button className="post-action-btn-new" onClick={() => showCmts ? setCommenting(null) : loadComments(post.id)}>
                  <MessageCircle size={16}/>
                  <span>{post.comments||0}</span>
                </button>
                <button className="post-action-btn-new post-share-btn" onClick={() => handleShare(post)}>
                  <Share2 size={16}/>
                  <span>Share</span>
                </button>
              </div>

              {/* ── Comments ── */}
              {showCmts && (
                <div className="post-comments-section">
                  {postCmts.length > 0 && (
                    <div className="comments-list">
                      {postCmts.map(c => (
                        <div key={c.id} className="comment-row">
                          <Avatar name={c.userName} photo={c.photoURL} size={28}/>
                          <div className="comment-bubble">
                            <span className="comment-username">{c.userName}</span>
                            <span className="comment-text">{c.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="comment-input-row">
                    <Avatar name={profile?.displayName} photo={profile?.photoURL} size={30}/>
                    <input className="input-field comment-input"
                      placeholder="Write a comment…"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && submitComment(post.id)}/>
                    <button className="chat-send-btn comment-send-btn" onClick={() => submitComment(post.id)}>
                      <Send size={14}/>
                    </button>
                  </div>
                </div>
              )}
            </article>
          )
        })}

        {!loading && posts.length > 0 && (
          <p className="feed-end-label">You&apos;re all caught up! 🍳</p>
        )}
      </div>
    </div>
  )
}
