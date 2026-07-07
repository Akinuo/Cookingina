import { useState, useEffect } from 'react'
import { X, Clock, Heart, BookmarkPlus, Globe, UtensilsCrossed, Star } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getRecipeStats, getUserRating, submitRating } from '../../services/ratings'
import RatingInput from './RatingInput'

function YoutubeIcon({ size=16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

const TABS_LOCAL  = ['ingredients','steps','nutrition','tips']
const TABS_MEALDB = ['ingredients','steps','tips']

export default function RecipeDetail({ recipe, onClose, onLike, onSave, liked, saved }) {
  const { user } = useAuth()
  const isMealDB = recipe?.source==='mealdb'
  const tabs     = isMealDB ? TABS_MEALDB : TABS_LOCAL
  const [activeTab, setActiveTab] = useState('ingredients')
  const [ratingStats, setRatingStats] = useState(null)
  const [myRating, setMyRating]       = useState(0)
  const [ratingBusy, setRatingBusy]   = useState(false)

  useEffect(() => {
    if (!recipe?.id) return
    let cancelled = false
    getRecipeStats(recipe.id).then(s => { if (!cancelled) setRatingStats(s) }).catch(() => {})
    getUserRating(recipe.id, user?.uid).then(r => { if (!cancelled) setMyRating(r?.stars || 0) }).catch(() => {})
    return () => { cancelled = true }
  }, [recipe?.id, user?.uid])

  const handleRate = async (stars) => {
    if (!user?.uid || !recipe?.id || ratingBusy) return
    setRatingBusy(true)
    const prevStats = ratingStats
    const prevMine  = myRating
    setMyRating(stars) // optimistic
    try {
      await submitRating(recipe.id, user.uid, stars)
      const fresh = await getRecipeStats(recipe.id)
      setRatingStats(fresh)
    } catch {
      setMyRating(prevMine)
      setRatingStats(prevStats)
    } finally {
      setRatingBusy(false)
    }
  }

  if (!recipe) return null

  const totalTime = (recipe.prep_time||0) + (recipe.cook_time||0)

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal modal-lg detail-modal">
        {/* Hero */}
        <div className="detail-hero">
          {recipe.image
            ? <img src={recipe.image} alt={recipe.title} className="detail-hero-img"/>
            : <div className="detail-hero-placeholder"><UtensilsCrossed size={56} strokeWidth={1}/></div>
          }
          <div className="detail-hero-actions">
            <button className="icon-btn" onClick={() => onLike?.(recipe.id)} style={{ width:36,height:36,color:liked?'var(--red)':undefined }}>
              <Heart size={15} fill={liked?'currentColor':'none'}/>
            </button>
            <button className="icon-btn" onClick={() => onSave?.(recipe.id)} style={{ width:36,height:36,color:saved?'var(--brand)':undefined }}>
              <BookmarkPlus size={15}/>
            </button>
            <button className="icon-btn" onClick={onClose} style={{ width:36,height:36 }}>
              <X size={15}/>
            </button>
          </div>
          {recipe.category && <span className="detail-hero-badge">{recipe.category}</span>}
          {isMealDB && <span className="detail-source-badge"><Globe size={10}/> TheMealDB</span>}
        </div>

        {/* Body */}
        <div className="detail-body">
          <h2 className="detail-title">{recipe.title}</h2>
          <div className="detail-meta-tags">
            {recipe.region     && <span className="tag">{recipe.region}</span>}
            {recipe.difficulty && <span className={`tag ${recipe.difficulty==='Easy'?'diff-easy':recipe.difficulty==='Hard'?'diff-hard':'diff-medium'}`}>{recipe.difficulty}</span>}
            {recipe.tags?.filter(t => !['mealdb','filipino'].includes(t)).slice(0,3).map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
          {recipe.description && <p className="text-sm" style={{ color:'var(--ink-3)', lineHeight:1.65, marginTop:8, marginBottom:0 }}>{recipe.description}</p>}

          {/* Ratings */}
          <div className="detail-ratings-row">
            <div className="detail-ratings-agg">
              {ratingStats?.count ? (
                <>
                  <Star size={15} fill="#D97706" stroke="#D97706"/>
                  <span className="detail-ratings-avg">{ratingStats.avg.toFixed(1)}</span>
                  <span className="text-xs text-muted">({ratingStats.count} rating{ratingStats.count===1?'':'s'})</span>
                </>
              ) : (
                <span className="text-xs text-muted">No ratings yet — be the first to rate this recipe!</span>
              )}
            </div>
            {user ? (
              <div className="detail-ratings-input">
                <span className="text-xxs text-muted" style={{ marginRight:2 }}>{myRating ? 'Your rating:' : 'Rate this:'}</span>
                <RatingInput value={myRating} onRate={handleRate} disabled={ratingBusy}/>
              </div>
            ) : null}
          </div>

          {/* Stats */}
          <div className="detail-stats-grid">
            {totalTime>0    && <div className="info-stat"><span className="info-stat-val">{totalTime}<span style={{fontSize:'0.65rem',fontWeight:500,color:'var(--ink-4)'}}>m</span></span><span className="info-stat-lbl">Total</span></div>}
            {recipe.prep_time>0 && <div className="info-stat"><span className="info-stat-val">{recipe.prep_time}<span style={{fontSize:'0.65rem',fontWeight:500,color:'var(--ink-4)'}}>m</span></span><span className="info-stat-lbl">Prep</span></div>}
            {recipe.cook_time>0 && <div className="info-stat"><span className="info-stat-val">{recipe.cook_time}<span style={{fontSize:'0.65rem',fontWeight:500,color:'var(--ink-4)'}}>m</span></span><span className="info-stat-lbl">Cook</span></div>}
            {recipe.servings>0  && <div className="info-stat"><span className="info-stat-val">{recipe.servings}</span><span className="info-stat-lbl">Serves</span></div>}
            {recipe.total_cost_php && <div className="info-stat"><span className="info-stat-val" style={{fontSize:'0.875rem'}}>₱{recipe.total_cost_php}</span><span className="info-stat-lbl">Est. Cost</span></div>}
          </div>

          {recipe.youtube && (
            <a href={recipe.youtube} target="_blank" rel="noopener noreferrer" className="detail-youtube-btn">
              <YoutubeIcon size={16}/> Watch on YouTube
            </a>
          )}

          {/* Tabs */}
          <div className="detail-tabs">
            {tabs.map(tab => (
              <button key={tab} className={`detail-tab${activeTab===tab?' active':''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Ingredients */}
          {activeTab==='ingredients' && (
            <div className="animate-fade">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <h3 className="section-title" style={{ fontSize:'0.9375rem' }}>Ingredients</h3>
                {recipe.total_cost_php && <span className="tag tag-brand">~₱{recipe.total_cost_php}</span>}
              </div>
              {recipe.ingredients?.length>0 ? (
                <div className="ingredients-list">
                  {recipe.ingredients.map((ing,i) => (
                    <div key={i} className="ingredient-row">
                      {(ing.amount||ing.unit) && <span className="ingredient-amt">{ing.amount}{ing.unit?` ${ing.unit}`:''}</span>}
                      <span style={{ flex:1, fontSize:'0.875rem', color:'var(--ink-2)' }}>{ing.name}</span>
                      {ing.cost_php && <span className="ingredient-cost">~₱{ing.cost_php}</span>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm" style={{ color:'var(--ink-4)' }}>No ingredient details available.</p>}
            </div>
          )}

          {/* Steps */}
          {activeTab==='steps' && (
            <div className="animate-fade">
              <h3 className="section-title mb-4" style={{ fontSize:'0.9375rem' }}>Cooking Steps</h3>
              {recipe.steps?.length>0 ? (
                <div className="steps-list">
                  {recipe.steps.map((s,i) => (
                    <div key={i} className="step-row">
                      <div className="step-num">{s.step||i+1}</div>
                      <div style={{ flex:1 }}>
                        <div className="step-text">{s.instruction}</div>
                        {s.time_minutes && <div className="step-time"><Clock size={10}/> {s.time_minutes} min</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm" style={{ color:'var(--ink-4)' }}>No step details available.</p>}
            </div>
          )}

          {/* Nutrition */}
          {activeTab==='nutrition' && (
            <div className="animate-fade">
              <h3 className="section-title mb-4" style={{ fontSize:'0.9375rem' }}>Nutrition per Serving</h3>
              {recipe.nutrition ? (
                <div className="nutrition-grid">
                  <div className="nutrition-card"><div className="nutrition-val" style={{ color:'var(--brand)' }}>{recipe.nutrition.calories}</div><div className="nutrition-lbl">kcal</div></div>
                  <div className="nutrition-card"><div className="nutrition-val" style={{ color:'var(--green)' }}>{recipe.nutrition.protein_g}g</div><div className="nutrition-lbl">protein</div></div>
                  <div className="nutrition-card"><div className="nutrition-val" style={{ color:'#1a6bb5' }}>{recipe.nutrition.carbs_g}g</div><div className="nutrition-lbl">carbs</div></div>
                  <div className="nutrition-card"><div className="nutrition-val">{recipe.nutrition.fat_g}g</div><div className="nutrition-lbl">fat</div></div>
                  {recipe.nutrition.fiber_g!=null && <div className="nutrition-card"><div className="nutrition-val" style={{ color:'var(--green-lt)' }}>{recipe.nutrition.fiber_g}g</div><div className="nutrition-lbl">fiber</div></div>}
                </div>
              ) : (
                <div style={{ background:'var(--surface-2)', borderRadius:'var(--r-md)', padding:20, textAlign:'center', border:'1px solid var(--border)' }}>
                  <p className="text-sm" style={{ color:'var(--ink-4)' }}>Nutrition data not available{isMealDB?' — TheMealDB does not provide nutritional information.':'.'}</p>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {activeTab==='tips' && (
            <div className="animate-fade">
              <h3 className="section-title mb-4" style={{ fontSize:'0.9375rem' }}>Tips &amp; Notes</h3>
              <div style={{ background:'var(--brand-pale)', border:'1px solid rgba(184,92,56,0.15)', borderRadius:'var(--r-md)', padding:'16px 18px', fontSize:'0.9rem', lineHeight:1.75, color:'var(--ink-2)' }}>
                {recipe.tips || "Cook with care and patience — that's the foundation of every great Filipino dish."}
              </div>
              {recipe.youtube && (
                <div className="mt-4">
                  <a href={recipe.youtube} target="_blank" rel="noopener noreferrer" className="detail-youtube-btn">
                    <YoutubeIcon size={15}/> Watch cooking video
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
