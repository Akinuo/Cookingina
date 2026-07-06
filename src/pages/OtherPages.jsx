import { useState } from 'react'
import { Heart, Sparkles, ShoppingCart, Calendar, Plus, RotateCcw, AlertCircle } from 'lucide-react'
import { planBudgetMeals } from '../services/ai'
import { FILIPINO_RECIPES } from '../data/recipes'
import RecipeCard from '../components/recipe/RecipeCard'
import RecipeDetail from '../components/recipe/RecipeDetail'
import ToastContainer from '../components/ui/ToastContainer'
import { useToast } from '../hooks/useToast'
import { IconHeartEmpty, IconCalendarPlan, IconShoppingCart, IconWarningTriangle, IconLightbulb } from '../components/icons/FoodIcons'

/* ─── Favorites Page ─────────────────────────────────────────── */
export function FavoritesPage({ onNavigate }) {
  const [saved, setSaved]       = useState(new Set(['adobo-001','sinigang-001','leche-001','lumpia-001','tapsilog-001']))
  const [selected, setSelected] = useState(null)
  const savedRecipes = FILIPINO_RECIPES.filter(r => saved.has(r.id))
  const toggle = id => setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'linear-gradient(135deg,#E85555,#C43030)',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Heart size={24} color="white" />
        </div>
        <div>
          <h1 className="page-title">Favorites</h1>
          <p className="text-sm text-muted">{savedRecipes.length} saved recipe{savedRecipes.length!==1?'s':''}</p>
        </div>
      </div>

      {savedRecipes.length === 0 ? (
        <div className="empty-state">
          <IconHeartEmpty size={40} strokeWidth={1.3} className="empty-state-icon-svg" style={{ color:'#C43030' }}/>
          <h3>No favorites yet</h3>
          <p>Browse Discover and tap the bookmark icon to save recipes here.</p>
          <button className="btn btn-primary mt-3" onClick={() => onNavigate?.('home')}><Sparkles size={15}/> Browse Recipes</button>
        </div>
      ) : (
        <div className="recipe-grid">
          {savedRecipes.map(r => (
            <RecipeCard key={r.id} recipe={r} onClick={() => setSelected(r)}
              onSave={toggle} onLike={() => {}} saved={saved.has(r.id)} liked={false} />
          ))}
        </div>
      )}
      {selected && <RecipeDetail recipe={selected} onClose={() => setSelected(null)} onSave={toggle} onLike={() => {}} saved={saved.has(selected.id)} liked={false} />}
    </div>
  )
}

/* ─── Meal Planner Page ──────────────────────────────────────── */
export function MealPlannerPage() {
  const { toasts, success, error: toastErr } = useToast()
  const [budget, setBudget]   = useState(500)
  const [days, setDays]       = useState(3)
  const [family, setFamily]   = useState(4)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan]       = useState(null)
  const [err, setErr]         = useState('')

  const generate = async () => {
    setLoading(true); setErr(''); setPlan(null)
    try {
      const result = await planBudgetMeals(budget, days, family)
      setPlan(result)
      success('Meal plan generated!')
    } catch (e) {
      setErr(e.message || 'Failed to generate meal plan. Check your Groq API key.')
    } finally { setLoading(false) }
  }

  const perPersonPerDay = Math.round(budget / Math.max(days,1) / Math.max(family,1))

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width:48,height:48,borderRadius:'var(--r-md)',background:'linear-gradient(135deg,#2D6A6A,#1A4A4A)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <ShoppingCart size={24} color="white" />
        </div>
        <div>
          <h1 className="page-title">Budget Meal Planner</h1>
          <p className="text-sm text-muted">AI Filipino meal planning with ₱ cost breakdown</p>
        </div>
      </div>

      {/* Config card */}
      <div className="card card-elevated mb-5" style={{ maxWidth:560 }}>
        <div className="card-body" style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {/* Budget / Days / Family — responsive grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12 }}>
            <div className="input-wrap">
              <label className="input-label">Total Budget (₱)</label>
              <input className="input-field" type="number" min={100} max={10000} step={50}
                value={budget} onChange={e => setBudget(+e.target.value)} />
            </div>
            <div className="input-wrap">
              <label className="input-label">Days</label>
              <select className="input-field" value={days} onChange={e => setDays(+e.target.value)}>
                {[1,2,3,5,7].map(d => <option key={d} value={d}>{d} day{d>1?'s':''}</option>)}
              </select>
            </div>
            <div className="input-wrap">
              <label className="input-label">Family Size</label>
              <select className="input-field" value={family} onChange={e => setFamily(+e.target.value)}>
                {[1,2,3,4,5,6,8,10].map(n => <option key={n} value={n}>{n} person{n>1?'s':''}</option>)}
              </select>
            </div>
          </div>

          {/* Budget summary */}
          <div style={{ background:'var(--brand-pale)', borderRadius:'var(--r-sm)', padding:'10px 14px', fontSize:'clamp(0.78rem,2vw,0.875rem)', lineHeight:1.5, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span>Budget per person per day: <strong style={{ color:'var(--brand)' }}>₱{perPersonPerDay}</strong></span>
            {perPersonPerDay < 50 && (
              <span style={{ color:'var(--red)', fontSize:'0.75rem', display:'inline-flex', alignItems:'center', gap:4 }}>
                <IconWarningTriangle size={12}/> Very tight — consider increasing budget
              </span>
            )}
          </div>

          <button className="btn btn-primary btn-full" onClick={generate} disabled={loading}
            style={{ justifyContent:'center',padding:'12px' }}>
            {loading ? <span className="spinner spinner-sm spinner-white"/> : <Calendar size={16}/>}
            {loading ? 'Generating meal plan…' : 'Generate Meal Plan with AI'}
          </button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div style={{ display:'flex',gap:10,padding:'14px 18px',background:'rgba(192,57,43,0.06)',border:'1px solid rgba(192,57,43,0.25)',color:'var(--red)',borderRadius:'var(--r-sm)',fontSize:'0.875rem',marginBottom:16 }}>
          <AlertCircle size={16} style={{ flexShrink:0,marginTop:1 }}/>
          <div><strong>Error:</strong> {err}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="empty-state">
          <span className="spinner spinner-lg" style={{ display:'block',margin:'0 auto 16px'}}/>
          <h3>Planning your meals…</h3>
          <p>Llama 3.3 70B is creating a Filipino meal plan within your ₱{budget} budget for {family} people over {days} days.</p>
        </div>
      )}

      {/* Plan result */}
      {plan && !loading && (
        <div className="animate-fade">

          {/* Title row */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:16 }}>
            <div className="section-title" style={{ fontSize:'clamp(1rem,2.5vw,1.3rem)' }}>
              Your {days}-Day Meal Plan
            </div>
            <div style={{ display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
              <span className="tag tag-brand" style={{ fontSize:'clamp(0.72rem,1.8vw,0.82rem)' }}>
                Est. Total: ₱{plan.total_cost_php}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPlan(null)}>
                <RotateCcw size={13}/> Regenerate
              </button>
            </div>
          </div>

          {/* Day cards */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {plan.meals?.map(day => (
              <div key={day.day} className="card card-elevated" style={{ overflow:'hidden' }}>
                {/* Day header */}
                <div style={{ padding:'10px clamp(12px,3vw,18px)', background:'linear-gradient(90deg,var(--brand-pale),transparent)', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:'var(--font-serif)',fontWeight:700,color:'var(--brand)',fontSize:'clamp(0.95rem,2vw,1.1rem)' }}>
                    Day {day.day}
                  </span>
                </div>

                {/* Meal columns — flex wraps on narrow screens */}
                <div style={{ padding:'clamp(10px,2.5vw,16px)', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap:'clamp(8px,2vw,12px)' }}>
                  {['breakfast','lunch','dinner'].map(meal => day[meal] && (
                    <div key={meal} style={{ background:'var(--surface-2)',borderRadius:'var(--r-sm)',padding:'clamp(10px,2vw,14px)',minWidth:0 }}>
                      <div style={{ fontSize:'clamp(0.6rem,1.4vw,0.68rem)',textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--ink-3)',fontWeight:700,marginBottom:5 }}>
                        {meal}
                      </div>
                      <div style={{ fontWeight:600,fontSize:'clamp(0.8rem,2vw,0.9rem)',lineHeight:1.35,wordBreak:'break-word',marginBottom:5 }}>
                        {day[meal].name}
                      </div>
                      {day[meal].cost_php != null && (
                        <div style={{ color:'var(--brand)',fontWeight:700,fontSize:'clamp(0.78rem,1.8vw,0.875rem)' }}>
                          ₱{day[meal].cost_php}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Shopping list */}
          {plan.shopping_list?.length > 0 && (
            <div className="card card-elevated mt-4">
              <div className="card-body">
                <div className="section-title mb-4" style={{ fontSize:'clamp(0.95rem,2vw,1.1rem)',display:'flex',alignItems:'center',gap:8 }}>
                  <IconShoppingCart size={18} strokeWidth={1.6} style={{ color:'var(--brand)' }}/> Shopping List
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {plan.shopping_list.map((item, i) => (
                    <div key={i} style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      padding:'clamp(8px,2vw,12px) clamp(10px,2.5vw,16px)',
                      background:'var(--surface-2)',
                      borderRadius:'var(--r-sm)',
                      gap:12,
                      minWidth:0,
                    }}>
                      <div style={{ display:'flex',alignItems:'baseline',gap:6,minWidth:0,flex:1 }}>
                        <span style={{ fontWeight:600,fontSize:'clamp(0.8rem,2vw,0.875rem)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                          {item.item}
                        </span>
                        {item.amount && (
                          <span className="text-muted" style={{ fontSize:'clamp(0.68rem,1.5vw,0.75rem)',flexShrink:0 }}>
                            {item.amount}
                          </span>
                        )}
                      </div>
                      {item.cost_php != null && (
                        <span style={{ color:'var(--brand)',fontWeight:700,fontSize:'clamp(0.8rem,2vw,0.875rem)',flexShrink:0,whiteSpace:'nowrap' }}>
                          ₱{item.cost_php}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total row */}
                <div style={{ marginTop:12,padding:'10px clamp(10px,2.5vw,16px)',background:'var(--brand-pale)',borderRadius:'var(--r-sm)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                  <span style={{ fontWeight:700,fontSize:'0.875rem' }}>Estimated Total</span>
                  <span style={{ fontWeight:700,color:'var(--brand)',fontSize:'1rem' }}>₱{plan.total_cost_php}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {plan.tips?.length > 0 && (
            <div className="card card-elevated mt-4" style={{ background:'var(--brand-pale)',border:'1px solid rgba(196,98,45,0.15)' }}>
              <div className="card-body">
                <div className="section-title mb-3" style={{ fontSize:'0.95rem', display:'flex', alignItems:'center', gap:6 }}>
                  <IconLightbulb size={16} strokeWidth={1.6} style={{ color:'var(--brand)' }}/> Budget Tips
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {plan.tips.map((tip, i) => (
                    <div key={i} style={{ display:'flex',gap:8,fontSize:'clamp(0.8rem,2vw,0.875rem)',lineHeight:1.6 }}>
                      <span style={{ color:'var(--brand)',flexShrink:0 }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-xxs text-muted text-center mt-4" style={{ lineHeight:1.6 }}>
            Generated by Llama 3.3 70B · Prices are estimates based on Philippine market data ·
            Adjust based on your local palengke · Always buy fresh!
          </p>
        </div>
      )}

      {/* Empty state */}
      {!plan && !loading && !err && (
        <div className="empty-state">
          <IconCalendarPlan size={40} strokeWidth={1.3} className="empty-state-icon-svg" style={{ color:'#2D6A6A' }}/>
          <h3>Plan your Filipino meals</h3>
          <p>Set your budget, number of days, and family size. The AI will create a complete Filipino meal plan with a shopping list and ₱ cost breakdown.</p>
        </div>
      )}
    </div>
  )
}
