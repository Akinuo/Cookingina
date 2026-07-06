import { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, Trash2, Edit3, X, Save, Eye, Sparkles, Clock, Users, ImagePlus } from 'lucide-react'
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { uploadRecipeImage } from '../services/cloudinary'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ToastContainer from '../components/ui/ToastContainer'
import {
  IconDessert, IconSoup, IconNoodles, IconRice, IconSeafood, IconBreakfast,
  IconSnack, IconMainDish, IconMeat, IconVegetables, IconAllDishes,
} from '../components/icons/FoodIcons'

async function getRecipeFromName_(name) {
  const { askCookingAssistant } = await import('../services/ai')
  return askCookingAssistant(`Give me a complete Filipino recipe for: ${name}. Include title, description, ingredients with measurements, numbered steps, nutrition per serving, and a cooking tip.`)
}

const CAT_LIST  = ['Filipino Classic','Soup','Noodles','Rice','Pork','Beef','Chicken','Seafood','Vegetable','Dessert','Snack','Breakfast','Other']
const DIFF_LIST = ['Easy','Medium','Hard']
const EMPTY     = { title:'', description:'', category:'Filipino Classic', difficulty:'Easy', prep_time:'', cook_time:'', servings:'', ingredients:'', steps:'', notes:'', total_cost_php:'', image:'' }

const CAT_ICON = { Dessert:IconDessert, Soup:IconSoup, Noodles:IconNoodles, Rice:IconRice, Seafood:IconSeafood, Breakfast:IconBreakfast, Snack:IconSnack, 'Filipino Classic':IconMainDish, Pork:IconMeat, Beef:IconMeat, Chicken:IconMainDish, Vegetable:IconVegetables, Other:IconAllDishes }

export default function CookbookPage() {
  const { user }              = useAuth()
  const { toasts, success, error: toastErr } = useToast()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [view, setView]       = useState(null)
  const [delId, setDelId]     = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Image upload
  const [imgFile, setImgFile]     = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [imgUploading, setImgUploading] = useState(false)
  const [imgPct, setImgPct]       = useState(0)
  const imgRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const q = query(collection(db,'cookbooks'), where('uid','==',user.uid), orderBy('createdAt','desc'))
      const snap = await getDocs(q)
      setRecipes(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    } catch { toastErr('Failed to load cookbook.') }
    finally   { setLoading(false) }
  }

  useEffect(() => { if (user) load() }, [user])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const openNew = () => { setForm(EMPTY); setEditId(null); setImgFile(null); setImgPreview(null); setShowForm(true) }
  const openEdit = (r) => {
    setForm({ title:r.title||'', description:r.description||'', category:r.category||'Filipino Classic', difficulty:r.difficulty||'Easy', prep_time:r.prep_time||'', cook_time:r.cook_time||'', servings:r.servings||'', ingredients:r.ingredients||'', steps:r.steps||'', notes:r.notes||'', total_cost_php:r.total_cost_php||'', image:r.image||'' })
    setImgFile(null); setImgPreview(r.image||null)
    setEditId(r.id); setShowForm(true)
  }

  const handleImgSelect = (e) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 10*1024*1024) { toastErr('Image must be under 10MB.'); return }
    setImgFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!form.title.trim()) { toastErr('Recipe title is required.'); return }
    setSaving(true)
    try {
      let imageUrl = form.image || ''
      if (imgFile) {
        setImgUploading(true)
        imageUrl = await uploadRecipeImage(imgFile, pct => setImgPct(pct))
        setImgUploading(false)
      }
      const payload = { ...form, image: imageUrl, uid: user.uid, updatedAt: serverTimestamp() }
      if (editId) {
        await updateDoc(doc(db,'cookbooks',editId), payload)
        success('Recipe updated!')
      } else {
        payload.createdAt = serverTimestamp()
        await addDoc(collection(db,'cookbooks'), payload)
        success('Recipe saved to cookbook!')
      }
      setShowForm(false); load()
    } catch(e) { toastErr(e.message||'Failed to save recipe.') }
    finally    { setSaving(false); setImgUploading(false) }
  }

  const del = async (id) => {
    try {
      await deleteDoc(doc(db,'cookbooks',id))
      setRecipes(r => r.filter(x => x.id!==id))
      setDelId(null); success('Recipe deleted.')
    } catch { toastErr('Failed to delete.') }
  }

  const aiFill = async () => {
    if (!form.title.trim()) { toastErr('Enter a recipe name first.'); return }
    setAiLoading(true)
    try {
      const raw = await getRecipeFromName_(form.title)
      const ingMatch  = raw.match(/ingredient[^:]*[:\*]+\s*([\s\S]+?)(?=instruction|step|method|$)/i)
      const stepMatch = raw.match(/(?:instruction|step|method)[^:]*[:\*]+\s*([\s\S]+?)(?=tip|note|nutrition|$)/i)
      const tipMatch  = raw.match(/(?:tip|note)[^:]*[:\*]+\s*([\s\S]+?)$/i)
      const descMatch = raw.match(/^[^\n]+\n+([^\n]{20,})/m)
      if (ingMatch)  setF('ingredients', ingMatch[1].trim())
      if (stepMatch) setF('steps', stepMatch[1].trim())
      if (tipMatch)  setF('notes', tipMatch[1].trim().slice(0,300))
      if (descMatch && !form.description) setF('description', descMatch[1].trim().slice(0,200))
      success('AI filled the recipe details!')
    } catch(e) { toastErr(e.message||'AI fill failed.') }
    finally    { setAiLoading(false) }
  }

  return (
    <div className="cookbook-page">
      <ToastContainer toasts={toasts}/>

      {/* ── Header ── */}
      <div className="cookbook-header">
        <div className="page-header-row">
          <div className="page-header-icon" style={{ background:'linear-gradient(135deg,#7B4F9E,#5A2D82)' }}>
            <BookOpen size={22} color="white"/>
          </div>
          <div>
            <h1 className="page-title">My Cookbook</h1>
            <p className="text-sm text-muted">{recipes.length} saved recipe{recipes.length!==1?'s':''}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16}/> New Recipe</button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="empty-state">
          <span className="spinner spinner-lg" style={{ display:'block', margin:'0 auto 12px' }}/>
          <p>Loading your cookbook…</p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && recipes.length===0 && (
        <div className="empty-state">
          <BookOpen size={40} strokeWidth={1.3} className="empty-state-icon-svg"/>
          <h3>Your cookbook is empty</h3>
          <p>Add your favorite Filipino recipes. Use <strong>AI Fill</strong> to auto-generate details from just a dish name!</p>
          <button className="btn btn-primary mt-3" onClick={openNew}><Plus size={15}/> Add First Recipe</button>
        </div>
      )}

      {/* ── Recipe grid ── */}
      {!loading && recipes.length>0 && (
        <div className="cookbook-grid">
          {recipes.map(r => (
            <div key={r.id} className="cookbook-card card card-elevated">
              {/* Card image / emoji */}
              <div className="cookbook-card-img">
                {r.image
                  ? <img src={r.image} alt={r.title} loading="lazy"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
                  : null}
                <div className="cookbook-card-emoji" style={{ display: r.image?'none':'flex' }}>
                  {(() => { const Icon = CAT_ICON[r.category] || IconAllDishes; return <Icon size={34} strokeWidth={1.3}/> })()}
                </div>
                {/* Actions overlay */}
                <div className="cookbook-card-actions">
                  <button className="icon-btn" onClick={() => setView(r)} title="View"><Eye size={13}/></button>
                  <button className="icon-btn" onClick={() => openEdit(r)} title="Edit"><Edit3 size={13}/></button>
                  <button className="icon-btn" onClick={() => setDelId(r.id)} title="Delete" style={{ color:'var(--red)' }}><Trash2 size={13}/></button>
                </div>
              </div>
              {/* Card body */}
              <div className="cookbook-card-body">
                <div className="cookbook-card-title line-clamp-2">{r.title}</div>
                {r.description && <p className="cookbook-card-desc line-clamp-2">{r.description}</p>}
                <div className="cookbook-card-meta">
                  {r.cook_time && <span className="meta-item"><Clock size={11}/>{r.cook_time}m</span>}
                  {r.servings  && <span className="meta-item"><Users size={11}/>{r.servings}</span>}
                  {r.total_cost_php && <span className="meta-item cost">₱{r.total_cost_php}</span>}
                </div>
                <div className="cookbook-card-footer">
                  <span className={`tag ${r.difficulty==='Easy'?'diff-easy':r.difficulty==='Hard'?'diff-hard':'diff-medium'}`}>{r.difficulty}</span>
                  <span className="tag">{r.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Form Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal modal-lg cookbook-form-modal">
            <div className="modal-header">
              <h2 className="modal-form-title">{editId?'Edit Recipe':'New Recipe'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={16}/></button>
            </div>

            {/* Title + AI Fill */}
            <div className="input-wrap" style={{ marginBottom:14 }}>
              <label className="input-label">Recipe Title *</label>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input-field" style={{ flex:1 }} value={form.title}
                  placeholder="e.g. Chicken Adobo sa Gata"
                  onChange={e => setF('title', e.target.value)}/>
                <button className="btn btn-secondary" onClick={aiFill} disabled={aiLoading} title="Auto-fill with AI">
                  {aiLoading ? <span className="spinner spinner-sm"/> : <Sparkles size={14}/>} AI Fill
                </button>
              </div>
            </div>

            {/* Recipe photo upload */}
            <div className="input-wrap" style={{ marginBottom:14 }}>
              <label className="input-label">Recipe Photo (optional)</label>
              {imgPreview ? (
                <div className="recipe-img-preview">
                  <img src={imgPreview} alt="preview"/>
                  <button className="recipe-img-remove" onClick={() => { setImgFile(null); setImgPreview(null); setF('image','') }}>
                    <X size={14}/>
                  </button>
                </div>
              ) : (
                <button className="new-post-img-upload-btn" onClick={() => imgRef.current?.click()}>
                  <ImagePlus size={18} style={{ color:'var(--brand)' }}/>
                  <span>Upload food photo</span>
                  <span className="new-post-img-hint">JPG, PNG, WEBP · max 10MB</span>
                </button>
              )}
              <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImgSelect}/>
              {imgUploading && (
                <div className="upload-progress-wrap" style={{ marginTop:8 }}>
                  <div className="upload-progress-bar" style={{ width:`${imgPct}%` }}/>
                  <span className="upload-progress-label">{imgPct}%</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="input-wrap" style={{ marginBottom:12 }}>
              <label className="input-label">Description</label>
              <input className="input-field" value={form.description} placeholder="What makes this dish special?"
                onChange={e => setF('description', e.target.value)}/>
            </div>

            {/* Category + Difficulty */}
            <div className="cookbook-form-2col" style={{ marginBottom:12 }}>
              <div className="input-wrap">
                <label className="input-label">Category</label>
                <select className="input-field" value={form.category} onChange={e => setF('category', e.target.value)}>
                  {CAT_LIST.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-wrap">
                <label className="input-label">Difficulty</label>
                <select className="input-field" value={form.difficulty} onChange={e => setF('difficulty', e.target.value)}>
                  {DIFF_LIST.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Time + Servings + Cost */}
            <div className="cookbook-form-4col" style={{ marginBottom:12 }}>
              {[['prep_time','Prep (min)','15'],['cook_time','Cook (min)','30'],['servings','Servings','4'],['total_cost_php','Est. Cost ₱','']].map(([k,l,ph]) => (
                <div key={k} className="input-wrap">
                  <label className="input-label">{l}</label>
                  <input className="input-field" type="number" min="0" placeholder={ph} value={form[k]}
                    onChange={e => setF(k, e.target.value)}/>
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div className="input-wrap" style={{ marginBottom:12 }}>
              <label className="input-label">Ingredients (one per line)</label>
              <textarea className="input-field" rows={5} value={form.ingredients}
                placeholder={"- 1 kg chicken, cut into pieces\n- ½ cup soy sauce\n- ¼ cup vinegar\n- 6 cloves garlic, minced"}
                onChange={e => setF('ingredients', e.target.value)}/>
            </div>

            {/* Steps */}
            <div className="input-wrap" style={{ marginBottom:12 }}>
              <label className="input-label">Cooking Steps</label>
              <textarea className="input-field" rows={6} value={form.steps}
                placeholder={"1. Marinate chicken in soy sauce and vinegar for 30 minutes.\n2. Heat oil in pan over medium-high heat…"}
                onChange={e => setF('steps', e.target.value)}/>
            </div>

            {/* Notes */}
            <div className="input-wrap" style={{ marginBottom:20 }}>
              <label className="input-label">Tips & Notes (optional)</label>
              <textarea className="input-field" rows={2} value={form.notes}
                placeholder="Cooking tips, substitutions, serving suggestions…"
                onChange={e => setF('notes', e.target.value)}/>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center' }} onClick={save} disabled={saving}>
                {saving ? <><span className="spinner spinner-sm spinner-white"/> {imgUploading?'Uploading…':'Saving…'}</> : <><Save size={15}/> {editId?'Update Recipe':'Save Recipe'}</>}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {view && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setView(null)}>
          <div className="modal modal-lg">
            {view.image && (
              <div className="cookbook-view-hero">
                <img src={view.image} alt={view.title}/>
              </div>
            )}
            <div className="modal-header" style={{ paddingTop: view.image?16:28 }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.2rem,3vw,1.6rem)', fontWeight:700 }}>{view.title}</h2>
                {view.description && <p className="text-sm text-muted mt-2">{view.description}</p>}
              </div>
              <button className="modal-close" onClick={() => setView(null)}><X size={16}/></button>
            </div>
            <div style={{ padding:'0 clamp(16px,4vw,28px) clamp(16px,4vw,28px)' }}>
              <div className="flex flex-wrap gap-2 mb-4">
                {view.cook_time && <span className="tag"><Clock size={11}/> {view.cook_time}m</span>}
                {view.servings  && <span className="tag"><Users size={11}/> {view.servings}</span>}
                {view.total_cost_php && <span className="tag tag-brand">₱{view.total_cost_php}</span>}
                <span className={`tag ${view.difficulty==='Easy'?'diff-easy':view.difficulty==='Hard'?'diff-hard':'diff-medium'}`}>{view.difficulty}</span>
                <span className="tag">{view.category}</span>
              </div>
              {view.ingredients && <>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:8 }}>Ingredients</h3>
                <div style={{ background:'var(--surface-2)', borderRadius:'var(--r-sm)', padding:'12px 16px', marginBottom:16, fontSize:'0.875rem', whiteSpace:'pre-wrap', lineHeight:1.8 }}>{view.ingredients}</div>
              </>}
              {view.steps && <>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:8 }}>Steps</h3>
                <div style={{ background:'var(--surface-2)', borderRadius:'var(--r-sm)', padding:'12px 16px', marginBottom:16, fontSize:'0.875rem', whiteSpace:'pre-wrap', lineHeight:1.8 }}>{view.steps}</div>
              </>}
              {view.notes && <>
                <h3 style={{ fontFamily:'var(--font-serif)', fontSize:'1rem', marginBottom:8 }}>Notes</h3>
                <div style={{ background:'var(--brand-pale)', borderRadius:'var(--r-sm)', padding:'12px 16px', fontSize:'0.875rem', lineHeight:1.7 }}>{view.notes}</div>
              </>}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button className="btn btn-primary" onClick={() => { setView(null); openEdit(view) }}><Edit3 size={14}/> Edit</button>
                <button className="btn btn-secondary" onClick={() => setView(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {delId && (
        <div className="modal-overlay">
          <div className="modal modal-sm" style={{ textAlign:'center' }}>
            <div className="delete-confirm-icon"><Trash2 size={26} strokeWidth={1.6}/></div>
            <h3 style={{ fontFamily:'var(--font-serif)', marginBottom:8 }}>Delete this recipe?</h3>
            <p className="text-sm text-muted mb-5">This action cannot be undone.</p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={() => del(delId)}>Yes, Delete</button>
              <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setDelId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
