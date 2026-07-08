import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Sparkles, TrendingUp, SlidersHorizontal, X, RefreshCw, Globe, UtensilsCrossed } from 'lucide-react'
import RecipeCard from '../components/recipe/RecipeCard'
import RecipeDetail from '../components/recipe/RecipeDetail'
import { FILIPINO_RECIPES, CATEGORIES } from '../data/recipes'
import { fetchFilipinoMeals, fetchMealDetails, normalizeMealDBRecipe } from '../services/mealdb'
import {
  IconAllDishes, IconMainDish, IconSoup, IconNoodles,
  IconRice, IconSnack, IconDessert, IconBreakfast,
} from '../components/icons/FoodIcons'

const DIFFICULTIES = ['Easy','Medium','Hard']

const CAT_ICONS = {
  all: IconAllDishes, mainDish: IconMainDish, soup: IconSoup, noodles: IconNoodles,
  rice: IconRice, snack: IconSnack, dessert: IconDessert, breakfast: IconBreakfast,
}

const CALORIE_OPTIONS = [
  { id:'all',     label:'Any calories' },
  { id:'under300', label:'Under 300 kcal' },
  { id:'under500', label:'Under 500 kcal' },
  { id:'500plus',  label:'500+ kcal' },
]

function matchesCalorieFilter(recipe, filter) {
  if (filter === 'all') return true
  const cal = recipe.nutrition?.calories
  if (cal == null) return false // MealDB recipes have no nutrition data — can't verify, so excluded rather than guessed
  if (filter === 'under300') return cal < 300
  if (filter === 'under500') return cal < 500
  if (filter === '500plus')  return cal >= 500
  return true
}

function matchesProteinFilter(recipe, highProtein) {
  if (!highProtein) return true
  const p = recipe.nutrition?.protein_g
  return p != null && p >= 20
}

// Normalizes an ingredient/search term for loose matching (lowercase, no
// accents/punctuation) so "Sili" matches "sili" and small typos like
// trailing 's' still line up.
function normTerm(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '')
}

function ingredientMatchCount(recipe, haveList) {
  if (!recipe.ingredients?.length || !haveList.length) return { have: 0, total: recipe.ingredients?.length || 0 }
  const haveNorm = haveList.map(normTerm)
  let have = 0
  for (const ing of recipe.ingredients) {
    const n = normTerm(ing.name)
    if (haveNorm.some(h => h && (n.includes(h) || h.includes(n)))) have++
  }
  return { have, total: recipe.ingredients.length }
}

export default function HomePage({ onNavigate }) {
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [source, setSource]     = useState('all')
  const [calorieFilter, setCalorieFilter] = useState('all')
  const [highProtein, setHighProtein]     = useState(false)
  const [haveIngredients, setHaveIngredients] = useState([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [selected, setSelected] = useState(null)
  const [liked, setLiked]       = useState(new Set())
  const [saved, setSaved]       = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [mealdbRecipes, setMealdbRecipes] = useState([])
  const [mealdbLoading, setMealdbLoading] = useState(false)
  const [mealdbError, setMealdbError]     = useState('')
  const [mealdbLoaded, setMealdbLoaded]   = useState(false)

  const loadMealDB = useCallback(async () => {
    setMealdbLoading(true); setMealdbError('')
    try {
      const list = await fetchFilipinoMeals()
      if (!list.length) throw new Error('No results from MealDB')
      const ids     = list.slice(0,20).map(m => m.idMeal)
      const details = await fetchMealDetails(ids)
      setMealdbRecipes(details.map(normalizeMealDBRecipe))
      setMealdbLoaded(true)
    } catch(e) { setMealdbError(e.message) }
    finally    { setMealdbLoading(false) }
  }, [])

  useEffect(() => { loadMealDB() }, [loadMealDB])

  const allRecipes = useMemo(() =>
    [...FILIPINO_RECIPES.map(r => ({ ...r, source:'local' })), ...mealdbRecipes],
  [mealdbRecipes])

  const filtered = useMemo(() => allRecipes.filter(r => {
    const q = search.toLowerCase().trim()
    return (!q || r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.tags?.some(t => t.toLowerCase().includes(q)))
      && (category==='all' || r.category?.toLowerCase().replace(/\s+/g,'')===category.replace(/\s+/g,''))
      && (difficulty==='all' || r.difficulty===difficulty)
      && (source==='all' || r.source===source)
      && matchesCalorieFilter(r, calorieFilter)
      && matchesProteinFilter(r, highProtein)
  }), [allRecipes, search, category, difficulty, source, calorieFilter, highProtein])

  // When the person has listed ingredients they have on hand, re-sort
  // (don't hard-filter — a recipe missing 1 of 8 ingredients is still
  // worth showing) by how many of the recipe's ingredients they already
  // have, most-matching first.
  const { sorted, matchMap } = useMemo(() => {
    if (!haveIngredients.length) return { sorted: filtered, matchMap: null }
    const map = new Map()
    const withScore = filtered.map(r => {
      const m = ingredientMatchCount(r, haveIngredients)
      map.set(r.id, m)
      return { r, score: m.total ? m.have / m.total : 0, have: m.have }
    })
    withScore.sort((a, b) => (b.score - a.score) || (b.have - a.have))
    return { sorted: withScore.map(x => x.r), matchMap: map }
  }, [filtered, haveIngredients])

  const addIngredient = () => {
    const v = ingredientInput.trim()
    if (v && !haveIngredients.some(i => i.toLowerCase()===v.toLowerCase())) {
      setHaveIngredients(list => [...list, v])
    }
    setIngredientInput('')
  }
  const removeIngredient = (i) => setHaveIngredients(list => list.filter((_,idx) => idx!==i))

  const toggleLike = id => setLiked(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const toggleSave = id => setSaved(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n })
  const hasFilters  = search || category!=='all' || difficulty!=='all' || source!=='all' || calorieFilter!=='all' || highProtein || haveIngredients.length>0
  const clearAll    = () => { setSearch(''); setCategory('all'); setDifficulty('all'); setSource('all'); setCalorieFilter('all'); setHighProtein(false); setHaveIngredients([]) }

  return (
    <div className="discover-page">
      {/* ── Hero ── */}
      <div className="hero-banner" style={{ marginBottom:'clamp(16px,3vw,24px)' }}>
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=70"
          alt="" className="hero-bg-img" aria-hidden="true"
        />
        <div className="hero-overlay"/>
        <div className="hero-banner-inner">
          <p className="hero-eyebrow">Filipino Cuisine</p>
          <h1 className="hero-title">Discover the Flavors<br/>of the Philippines</h1>
          <p className="hero-subtitle">
            Authentic recipes, AI-powered cooking guidance, and real-time market prices — all in one place.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-solid" onClick={() => onNavigate('ai-recipes')}>
              <Sparkles size={16} strokeWidth={2}/> Generate with AI
            </button>
            <button className="btn-hero-outline" onClick={() => onNavigate('prices')}>
              <TrendingUp size={16} strokeWidth={2}/> Price Checker
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="discover-stats" style={{ marginBottom:'clamp(14px,3vw,22px)' }}>
        {[
          { val: `${allRecipes.length}+`, lbl:'Recipes' },
          { val: mealdbLoading?'—':mealdbRecipes.length, lbl:'From MealDB' },
          { val:'Llama 70B', lbl:'AI Model' },
          { val:'DTI Data', lbl:'Price Source' },
        ].map(s => (
          <div key={s.lbl} className="stat-card">
            <span className="stat-val">{s.val}</span>
            <span className="stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>

      {/* ── MealDB status ── */}
      {mealdbLoading && (
        <div className="mealdb-status-bar loading">
          <span className="spinner spinner-sm"/>
          <span>Loading recipes from TheMealDB Filipino collection…</span>
        </div>
      )}
      {mealdbError && !mealdbLoading && (
        <div className="mealdb-status-bar error">
          <Globe size={14}/>
          <span>{mealdbError}</span>
          <button className="mealdb-retry-btn" onClick={loadMealDB}><RefreshCw size={12}/> Retry</button>
        </div>
      )}
      {mealdbLoaded && !mealdbLoading && (
        <div className="mealdb-status-bar success">
          <Globe size={14}/>
          <span>{mealdbRecipes.length} recipes from TheMealDB + {FILIPINO_RECIPES.length} from CookingINA</span>
        </div>
      )}

      {/* ── Filter bar ── */}
      <div className="discover-filter-bar">
        <div className="discover-search-row">
          <div className="search-bar discover-search-input">
            <Search size={15} strokeWidth={2}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…"/>
            {search && <button className="search-clear" onClick={() => setSearch('')}><X size={13}/></button>}
          </div>
          <button className={`filter-toggle-btn${showFilters?' active':''}`} onClick={() => setShowFilters(v=>!v)}>
            <SlidersHorizontal size={14} strokeWidth={2}/>
            <span>Filter</span>
            {(category!=='all'||difficulty!=='all'||source!=='all'||calorieFilter!=='all'||highProtein||haveIngredients.length>0) && <span className="filter-dot"/>}
          </button>
        </div>

        <div className="cat-scroll discover-cats">
          {CATEGORIES.map(cat => {
            const Icon = CAT_ICONS[cat.icon]
            return (
              <button key={cat.id} className={`cat-pill${category===cat.id?' active':''}`}
                onClick={() => setCategory(cat.id)}>
                {Icon && <Icon size={14} strokeWidth={1.8} className="cat-icon"/>}
                <span className="cat-label">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {showFilters && (
          <div className="discover-expanded-filters">
            <div className="filter-row-group">
              <span className="filter-group-label">Difficulty</span>
              <div className="filter-pill-group">
                {['all',...DIFFICULTIES].map(d => (
                  <button key={d} className={`filter-pill${difficulty===d?' active':''}`} onClick={() => setDifficulty(d)}>
                    {d==='all'?'All Levels':d}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row-group">
              <span className="filter-group-label">Source</span>
              <div className="filter-pill-group">
                {[{id:'all',label:'All'},{id:'local',label:'CookingINA'},{id:'mealdb',label:'MealDB'}].map(s => (
                  <button key={s.id} className={`filter-pill${source===s.id?' active':''}`} onClick={() => setSource(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row-group stacked">
              <span className="filter-group-label">Nutrition</span>
              <div className="filter-pill-group">
                {CALORIE_OPTIONS.map(o => (
                  <button key={o.id} className={`filter-pill${calorieFilter===o.id?' active':''}`} onClick={() => setCalorieFilter(o.id)}>
                    {o.label}
                  </button>
                ))}
                <button className={`filter-pill${highProtein?' active':''}`} onClick={() => setHighProtein(v=>!v)}>
                  High Protein (20g+)
                </button>
              </div>
              <p className="filter-group-hint">MealDB recipes don't have nutrition data, so they're excluded when a nutrition filter is on.</p>
            </div>
            <div className="filter-row-group stacked">
              <span className="filter-group-label">What's in your kitchen?</span>
              <div className="ingredient-chip-input">
                {haveIngredients.map((ing, i) => (
                  <span key={ing} className="ingredient-chip">
                    {ing}
                    <button onClick={() => removeIngredient(i)} aria-label={`Remove ${ing}`}><X size={11}/></button>
                  </span>
                ))}
                <input
                  value={ingredientInput}
                  onChange={e => setIngredientInput(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter' || e.key===',') { e.preventDefault(); addIngredient() } }}
                  onBlur={addIngredient}
                  placeholder={haveIngredients.length ? 'Add another…' : 'e.g. chicken, garlic, soy sauce'}
                />
              </div>
              <p className="filter-group-hint">Type an ingredient and press Enter. Recipes you can mostly already make will sort to the top.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Results row ── */}
      <div className="discover-results-row">
        <span className="text-sm" style={{ color:'var(--ink-3)' }}>
          <strong style={{ color:'var(--ink)' }}>{filtered.length}</strong> recipe{filtered.length!==1?'s':''}
          {category!=='all' && ` in ${CATEGORIES.find(c=>c.id===category)?.label}`}
          {difficulty!=='all' && ` · ${difficulty}`}
          {search && ` for "${search}"`}
          {haveIngredients.length>0 && ` · sorted by what you have`}
        </span>
        {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearAll}><X size={12}/> Clear</button>}
      </div>

      {/* ── Grid ── */}
      {sorted.length===0 ? (
        <div className="empty-state">
          <UtensilsCrossed size={40} style={{ margin:'0 auto 12px', opacity:0.25 }}/>
          <h3>No recipes found</h3>
          <p>Try different search terms, or use the AI Recipe Guide to generate a custom Filipino dish.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginTop:16 }}>
            <button className="btn btn-primary" onClick={() => onNavigate('ai-recipes')}>
              <Sparkles size={15}/> AI Recipe Guide
            </button>
            {hasFilters && <button className="btn btn-secondary" onClick={clearAll}>Clear Filters</button>}
          </div>
        </div>
      ) : (
        <div className="recipe-grid">
          {sorted.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe}
              onClick={() => setSelected(recipe)}
              onLike={toggleLike} onSave={toggleSave}
              liked={liked.has(recipe.id)} saved={saved.has(recipe.id)}
              matchInfo={matchMap?.get(recipe.id)}/>
          ))}
        </div>
      )}

      {/* Attribution */}
      {mealdbLoaded && (
        <div className="mealdb-attribution">
          <Globe size={12}/>
          Filipino recipes from <a href="https://www.themealdb.com" target="_blank" rel="noopener noreferrer">TheMealDB</a> via <code>filter.php?a=Filipino</code>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <RecipeDetail recipe={selected} onClose={() => setSelected(null)}
          onLike={toggleLike} onSave={toggleSave}
          liked={liked.has(selected.id)} saved={saved.has(selected.id)}/>
      )}
    </div>
  )
}
