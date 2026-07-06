import { useState, useRef } from 'react'
import { Sparkles, Plus, RotateCcw, Lightbulb, AlertCircle, Clock, Users } from 'lucide-react'
import { generateRecipe } from '../services/ai'
import { IconChefHat } from '../components/icons/FoodIcons'

const QUICK_ADD = [
  'Chicken','Pork','Beef','Bangus','Shrimp',
  'Garlic','Onion','Tomato','Potato','Cabbage',
  'Soy Sauce','Vinegar','Coconut Milk','Eggs','Rice',
  'Ginger','Lemongrass','Kangkong','Eggplant','Pechay',
]
const CUISINES  = ['Any Filipino','Tagalog','Ilocano','Bicolano','Cebuano','Visayan','Mindanaoan']
const DIETS     = ['None','Budget-friendly','Low-carb','High-protein','Vegetarian','Pork-free']
const COOKWARE  = ['Any','Kaldero (pot)','Kawali (wok)','Palayok (clay pot)','Pressure cooker','Air fryer']

export default function AIRecipePage() {
  const [ingredients, setIngredients] = useState([])
  const [input, setInput]     = useState('')
  const [cuisine, setCuisine] = useState('Any Filipino')
  const [diet, setDiet]       = useState('None')
  const [cookware, setCookware] = useState('Any')
  const [servings, setServings] = useState(4)
  const [budget, setBudget]   = useState('')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe]   = useState(null)
  const [error, setError]     = useState('')
  const inputRef = useRef(null)

  const addIng = (val) => {
    const c = val.trim()
    if (c && !ingredients.includes(c)) setIngredients(p => [...p, c])
    setInput('')
    inputRef.current?.focus()
  }
  const removeIng = (item) => setIngredients(p => p.filter(i => i !== item))
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addIng(input) }
    if (e.key === 'Backspace' && input === '' && ingredients.length > 0)
      removeIng(ingredients[ingredients.length - 1])
  }

  const handleGenerate = async () => {
    if (!ingredients.length) return
    setLoading(true); setError(''); setRecipe(null)
    try {
      const prefs = { cuisine, diet, cookware, servings, budget: budget ? `₱${budget}` : undefined }
      const result = await generateRecipe(ingredients, prefs)
      setRecipe(result)
    } catch (e) {
      setError(e.message || 'AI generation failed. Check your VITE_GROQ_API_KEY in .env')
    } finally { setLoading(false) }
  }

  const handleReset = () => { setIngredients([]); setRecipe(null); setError(''); setInput('') }

  return (
    <div className="ai-recipe-page">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-icon" style={{ background:'linear-gradient(135deg,var(--brand),var(--brand-dk))' }}>
          <Sparkles size={22} color="white" />
        </div>
        <div>
          <h1 className="page-title">AI Recipe Guide</h1>
          <p className="text-sm text-muted">Powered by Llama 3.3 70B Versatile</p>
        </div>
      </div>

      {/* Two-column layout — stacks on mobile */}
      <div className="ai-recipe-layout">

        {/* ── LEFT: Input panel ── */}
        <div className="ai-recipe-inputs">

          {/* Ingredient input */}
          <div className="card card-elevated">
            <div className="card-body">
              <div className="input-label" style={{ marginBottom:8 }}>Your Ingredients</div>
              <div className="ing-tag-input" onClick={() => inputRef.current?.focus()}>
                {ingredients.map(ing => (
                  <span key={ing} className="ing-chip">
                    {ing}
                    <span className="ing-chip-remove" onClick={() => removeIng(ing)}>×</span>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  className="ing-tag-real-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={ingredients.length ? 'Add more…' : 'Type + Enter…'}
                />
              </div>

              {/* Quick add */}
              <div style={{ marginTop:12 }}>
                <div className="input-label" style={{ marginBottom:6 }}>Quick Add</div>
                <div className="quick-add-grid">
                  {QUICK_ADD.filter(q => !ingredients.includes(q)).map(q => (
                    <button key={q} className="quick-add-btn" onClick={() => addIng(q)}>
                      <Plus size={10} /> {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card card-elevated">
            <div className="card-body">
              <div className="input-label" style={{ marginBottom:10 }}>Preferences</div>
              <div className="prefs-grid">
                <div className="input-wrap">
                  <label className="input-label">Cuisine</label>
                  <select className="input-field" value={cuisine} onChange={e => setCuisine(e.target.value)}>
                    {CUISINES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-wrap">
                  <label className="input-label">Dietary</label>
                  <select className="input-field" value={diet} onChange={e => setDiet(e.target.value)}>
                    {DIETS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="input-wrap">
                  <label className="input-label">Cookware</label>
                  <select className="input-field" value={cookware} onChange={e => setCookware(e.target.value)}>
                    {COOKWARE.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="prefs-row-2">
                  <div className="input-wrap">
                    <label className="input-label">Servings</label>
                    <input className="input-field" type="number" min={1} max={20} value={servings}
                      onChange={e => setServings(+e.target.value)} />
                  </div>
                  <div className="input-wrap">
                    <label className="input-label">Budget (₱)</label>
                    <input className="input-field" type="number" placeholder="Optional" value={budget}
                      onChange={e => setBudget(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button className="btn btn-primary btn-full"
            onClick={handleGenerate}
            disabled={loading || ingredients.length === 0}
            style={{ padding:'13px', fontSize:'0.95rem', justifyContent:'center' }}>
            {loading
              ? <><span className="spinner spinner-sm spinner-white" /> Generating recipe…</>
              : <><Sparkles size={17} /> Generate Recipe ({ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''})</>
            }
          </button>

          {(ingredients.length > 0 || recipe) && (
            <button className="btn btn-secondary btn-full" onClick={handleReset}>
              <RotateCcw size={14} /> Reset
            </button>
          )}

          {/* Tip */}
          <div className="ai-tip-box">
            <Lightbulb size={14} style={{ color:'var(--brand)', flexShrink:0 }} />
            <span>Add 3–8 ingredients. The AI generates authentic Filipino recipes with measurements, steps, nutrition, and ₱ cost estimates.</span>
          </div>
        </div>

        {/* ── RIGHT: Result panel ── */}
        <div className="ai-recipe-result">
          {/* Error */}
          {error && (
            <div className="ai-error-box">
              <AlertCircle size={15} style={{ flexShrink:0 }} />
              <div><strong>Error:</strong> {error}</div>
            </div>
          )}

          {/* Empty state */}
          {!recipe && !loading && !error && (
            <div className="empty-state">
              <IconChefHat size={44} strokeWidth={1.3} className="empty-state-icon-svg"/>
              <h3>Ready to cook!</h3>
              <p>Add your ingredients on the left and click Generate. The AI will suggest an authentic Filipino recipe just for you.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="empty-state">
              <span className="spinner spinner-lg" style={{ display:'block', margin:'0 auto 16px' }} />
              <h3>Generating your recipe…</h3>
              <p>Llama 3.3 70B is crafting an authentic Filipino dish. This takes about 5–10 seconds.</p>
            </div>
          )}

          {/* Recipe result */}
          {recipe && !loading && (
            <div className="card card-elevated animate-fade" style={{ overflow:'hidden' }}>
              {/* AI badge header */}
              <div style={{ background:'linear-gradient(135deg,var(--brand),var(--brand-dk))', padding:'8px 18px', display:'flex', alignItems:'center', gap:8 }}>
                <Sparkles size={13} color="white" />
                <span style={{ color:'white', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  AI Generated · Llama 3.3 70B
                </span>
              </div>

              <div className="card-body" style={{ gap:16 }}>
                {/* Title */}
                <div>
                  <h2 style={{ fontFamily:'var(--font-serif)', fontSize:'clamp(1.1rem,3vw,1.5rem)', fontWeight:700, marginBottom:5 }}>
                    {recipe.title}
                  </h2>
                  {recipe.description && (
                    <p className="text-sm text-muted" style={{ lineHeight:1.6 }}>{recipe.description}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="recipe-stats-grid">
                  {[
                    { lbl:'Prep',       val:`${recipe.prep_time||0}m` },
                    { lbl:'Cook',       val:`${recipe.cook_time||0}m` },
                    { lbl:'Serves',     val:recipe.servings },
                    { lbl:'Difficulty', val:recipe.difficulty },
                    { lbl:'Est. Cost',  val:recipe.total_cost_php ? `₱${recipe.total_cost_php}` : '—' },
                  ].map(s => (
                    <div key={s.lbl} className="info-stat">
                      <span className="info-stat-val" style={{ fontSize:'0.9rem' }}>{s.val}</span>
                      <span className="info-stat-lbl">{s.lbl}</span>
                    </div>
                  ))}
                </div>

                {/* Ingredients */}
                {recipe.ingredients?.length > 0 && (
                  <div>
                    <div className="section-title mb-2" style={{ fontSize:'0.9rem' }}>Ingredients</div>
                    <div className="ingredients-list">
                      {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="ingredient-row">
                          <span className="ingredient-amt">{ing.amount} {ing.unit}</span>
                          <span style={{ flex:1, fontSize:'0.85rem' }}>{ing.name}</span>
                          {ing.cost_php && <span className="ingredient-cost">~₱{ing.cost_php}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {recipe.steps?.length > 0 && (
                  <div>
                    <div className="section-title mb-2" style={{ fontSize:'0.9rem' }}>Steps</div>
                    <div className="steps-list">
                      {recipe.steps.map((s, i) => (
                        <div key={i} className="step-row">
                          <div className="step-num">{s.step || i+1}</div>
                          <div>
                            <div className="step-text">{s.instruction}</div>
                            {s.time_minutes && (
                              <div className="step-time"><Clock size={10} />{s.time_minutes} min</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nutrition */}
                {recipe.nutrition && (
                  <div>
                    <div className="section-title mb-2" style={{ fontSize:'0.9rem' }}>Nutrition / Serving</div>
                    <div className="nutrition-grid">
                      <div className="nutrition-card"><div className="nutrition-val" style={{ color:'var(--brand)' }}>{recipe.nutrition.calories}</div><div className="nutrition-lbl">kcal</div></div>
                      <div className="nutrition-card"><div className="nutrition-val" style={{ color:'var(--green)' }}>{recipe.nutrition.protein_g}g</div><div className="nutrition-lbl">protein</div></div>
                      <div className="nutrition-card"><div className="nutrition-val" style={{ color:'#0D6EFD' }}>{recipe.nutrition.carbs_g}g</div><div className="nutrition-lbl">carbs</div></div>
                      <div className="nutrition-card"><div className="nutrition-val">{recipe.nutrition.fat_g}g</div><div className="nutrition-lbl">fat</div></div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {recipe.tips && (
                  <div className="ai-tip-box" style={{ background:'var(--brand-pale)' }}>
                    <Lightbulb size={14} style={{ color:'var(--brand)', flexShrink:0, marginTop:1 }}/>
                    <span><strong>Tip:</strong> {recipe.tips}</span>
                  </div>
                )}

                <p className="text-xxs text-muted text-center">
                  Generated by Llama 3.3 70B via Groq · Always verify cooking times · Prices are estimates
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
