import { useState, useRef } from 'react'
import { Camera, Edit3, Save, X, BookOpen, Heart, Users, Star, Clock, LogOut, UtensilsCrossed, ChefHat, ArrowRight } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../services/firebase'
import { uploadAvatar } from '../services/cloudinary'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'
import { FILIPINO_RECIPES } from '../data/recipes'

const STAT_ITEMS = [
  { icon:BookOpen, label:'Recipes',   key:'recipesCount',   color:'var(--brand)' },
  { icon:Heart,    label:'Favorites', key:'favoritesCount', color:'var(--red)' },
  { icon:Users,    label:'Followers', key:'followers',      color:'var(--green)' },
  { icon:Star,     label:'Following', key:'following',      color:'var(--amber)' },
]

export default function ProfilePage({ onNavigate }) {
  const { user, profile, logout, updateProfile:updateCtxProfile } = useAuth()
  const { toasts, success, error:toastErr } = useToast()
  const [editing, setEditing]     = useState(false)
  const [form, setForm]           = useState({ displayName:profile?.displayName||'', bio:profile?.bio||'' })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const fileRef = useRef(null)

  const initials = (n) => (n||'U').split(' ').map(c=>c[0]).join('').slice(0,2).toUpperCase()

  const handleSave = async () => {
    if (!form.displayName.trim()) { toastErr('Name cannot be empty.'); return }
    setSaving(true)
    try {
      await updateDoc(doc(db,'users',user.uid), { displayName:form.displayName.trim(), bio:form.bio.trim() })
      await updateProfile(auth.currentUser, { displayName:form.displayName.trim() })
      await updateCtxProfile({ displayName:form.displayName.trim(), bio:form.bio.trim() })
      setEditing(false); success('Profile updated.')
    } catch { toastErr('Failed to update profile.') }
    finally   { setSaving(false) }
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true); setUploadPct(0)
    try {
      const url = await uploadAvatar(file, pct => setUploadPct(pct))
      await updateDoc(doc(db,'users',user.uid), { photoURL:url })
      await updateProfile(auth.currentUser, { photoURL:url })
      await updateCtxProfile({ photoURL:url })
      success('Photo updated.')
    } catch(err) { toastErr(err.message||'Upload failed.') }
    finally      { setUploading(false); setUploadPct(0) }
  }

  const stats = {
    recipesCount:   profile?.recipesCount   || 0,
    favoritesCount: profile?.favoritesCount || (profile?.savedRecipes||[]).length || 0,
    followers:      profile?.followers      || 0,
    following:      profile?.following      || 0,
  }

  const QUICK_LINKS = [
    { label:'My Cookbook',  page:'cookbook',   icon:BookOpen },
    { label:'AI Recipes',   page:'ai-recipes', icon:UtensilsCrossed },
    { label:'Price Checker',page:'prices',     icon:ChefHat },
    { label:'Community',    page:'community',  icon:Users },
  ]

  return (
    <div style={{ maxWidth:680, margin:'0 auto' }}>
      <ToastContainer toasts={toasts}/>

      {/* Profile card */}
      <div className="card card-elevated mb-5" style={{ overflow:'visible' }}>
        {/* Cover */}
        <div style={{ height:'clamp(90px,15vw,130px)', background:'linear-gradient(135deg,#2C1810 0%,#8C3F22 100%)', borderRadius:'var(--r-lg) var(--r-lg) 0 0', position:'relative' }}>
          {!editing ? (
            <button className="btn btn-sm" onClick={() => setEditing(true)}
              style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', backdropFilter:'blur(4px)' }}>
              <Edit3 size={13} strokeWidth={2}/> Edit Profile
            </button>
          ) : (
            <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:6 }}>
              <button className="btn btn-sm" onClick={handleSave} disabled={saving}
                style={{ background:'#fff', color:'var(--brand)', fontWeight:700 }}>
                {saving ? <span className="spinner spinner-sm"/> : <Save size={13}/>} Save
              </button>
              <button className="btn btn-sm" onClick={() => setEditing(false)}
                style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)' }}>
                <X size={13}/>
              </button>
            </div>
          )}
        </div>

        <div style={{ padding:'clamp(12px,3vw,24px)', paddingTop:0 }}>
          {/* Avatar + name */}
          <div style={{ display:'flex', alignItems:'flex-end', gap:'clamp(12px,2vw,18px)', marginTop:'clamp(-28px,-5vw,-42px)', marginBottom:'clamp(14px,2.5vw,22px)', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:'clamp(68px,12vw,88px)', height:'clamp(68px,12vw,88px)', borderRadius:'50%', border:'4px solid var(--surface)', background:'var(--brand-lt)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', boxShadow:'var(--shadow-md)' }}>
                {profile?.photoURL
                  ? <img src={profile.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <span style={{ color:'#fff', fontSize:'clamp(1.2rem,3vw,1.6rem)', fontWeight:700 }}>{initials(profile?.displayName)}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                style={{ position:'absolute', bottom:2, right:2, width:26, height:26, borderRadius:'50%', background:'var(--brand)', border:'2px solid var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                {uploading ? <span className="spinner spinner-sm spinner-white" style={{ width:12, height:12 }}/> : <Camera size={12} color="#fff"/>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar}/>
              {uploading && uploadPct>0 && uploadPct<100 && (
                <div style={{ position:'absolute', bottom:-10, left:0, right:0, height:3, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${uploadPct}%`, background:'var(--brand)', transition:'width 0.2s' }}/>
                </div>
              )}
            </div>

            <div style={{ flex:1, minWidth:0, paddingTop:'clamp(30px,6vw,50px)' }}>
              {editing ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <input className="input-field" value={form.displayName} placeholder="Display name"
                    style={{ fontWeight:700, fontSize:'1rem' }}
                    onChange={e => setForm(f=>({...f,displayName:e.target.value}))}/>
                  <input className="input-field" value={form.bio} placeholder="Short bio (e.g. Home cook from Cebu)"
                    onChange={e => setForm(f=>({...f,bio:e.target.value}))}/>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.1rem,3vw,1.4rem)', fontWeight:700, letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {profile?.displayName || 'Filipino Cook'}
                  </div>
                  <div className="text-xs" style={{ color:'var(--ink-4)', marginTop:2 }}>@{(user?.email||'').split('@')[0]}</div>
                  {profile?.bio
                    ? <div className="text-sm mt-2" style={{ color:'var(--ink-2)', lineHeight:1.6 }}>{profile.bio}</div>
                    : <div className="text-sm mt-2" style={{ color:'var(--ink-4)', fontStyle:'italic' }}>No bio yet — click Edit Profile to add one.</div>
                  }
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'clamp(6px,1.5vw,12px)', marginBottom:'clamp(14px,2.5vw,20px)' }}>
            {STAT_ITEMS.map(({ icon:Icon, label, key, color }) => (
              <div key={key} style={{ textAlign:'center', padding:'clamp(10px,2vw,16px) 4px', background:'var(--surface-2)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <Icon size={15} style={{ color, margin:'0 auto 5px' }} strokeWidth={2}/>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1rem,2.5vw,1.25rem)', fontWeight:700, color }}>{stats[key]}</div>
                <div style={{ fontSize:'clamp(0.55rem,1.2vw,0.65rem)', color:'var(--ink-4)', textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:600, marginTop:1 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div style={{ display:'flex', alignItems:'center', gap:var_space(3), padding:'10px 14px', background:'var(--surface-2)', borderRadius:'var(--r-md)', fontSize:'0.875rem', color:'var(--ink-3)', border:'1px solid var(--border)' }}>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</span>
            <span className="tag tag-green">Verified</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(clamp(130px,25vw,160px),1fr))', gap:'clamp(8px,2vw,12px)', marginBottom:'clamp(18px,3vw,26px)' }}>
        {QUICK_LINKS.map(({ label, page, icon:Icon }) => (
          <button key={page} onClick={() => onNavigate?.(page)}
            style={{ padding:'clamp(14px,2.5vw,20px) 12px', background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', textAlign:'center', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all var(--t)', boxShadow:'var(--shadow-xs)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--brand)'; e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='var(--shadow-xs)'; e.currentTarget.style.transform=''; }}>
            <Icon size={clamp_icon()} style={{ color:'var(--brand)' }} strokeWidth={1.75}/>
            <span style={{ fontSize:'clamp(0.75rem,1.5vw,0.8125rem)', fontWeight:600, color:'var(--ink-2)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="card card-elevated mb-5">
        <div className="card-body">
          <h3 className="section-title mb-4" style={{ fontSize:'1rem' }}>Popular Recipes</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(clamp(130px,22vw,160px),1fr))', gap:10 }}>
            {FILIPINO_RECIPES.slice(0,6).map(r => (
              <div key={r.id} style={{ background:'var(--surface-2)', borderRadius:'var(--r-md)', overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)', transition:'all var(--t)' }}
                onClick={() => onNavigate?.('home')}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-sm)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform=''; }}>
                <div style={{ height:70, overflow:'hidden', background:'var(--surface-3)' }}>
                  {r.image
                    ? <img src={r.image} alt={r.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} loading="lazy"/>
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <UtensilsCrossed size={24} style={{ color:'var(--border-dk)', opacity:0.4 }}/>
                      </div>
                  }
                </div>
                <div style={{ padding:'8px 10px' }}>
                  <div style={{ fontWeight:600, fontSize:'clamp(0.7rem,1.5vw,0.78rem)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-serif)' }}>{r.title}</div>
                  {r.total_cost_php && <div style={{ fontSize:'0.65rem', color:'var(--brand)', fontWeight:600, marginTop:2 }}>₱{r.total_cost_php}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="card card-elevated" style={{ padding:'clamp(14px,3vw,20px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <div className="font-600 text-sm">{user?.displayName || 'Account'}</div>
            <div className="text-xs" style={{ color:'var(--ink-4)', marginTop:1 }}>{user?.email}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}
            style={{ color:'var(--red)', borderColor:'rgba(192,57,43,0.3)' }}>
            <LogOut size={14} strokeWidth={2}/> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper stubs to avoid template literal issues inside JSX
function var_space(n) { return `var(--space-${n})` }
function clamp_icon()  { return 22 }
