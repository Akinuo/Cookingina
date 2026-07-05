import { Clock, Users, Heart, BookmarkPlus, UtensilsCrossed } from 'lucide-react'

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= Math.round(rating) ? 'star' : 'star star-empty'}>★</span>
      ))}
      <span className="rating-label">{rating?.toFixed(1)}</span>
    </div>
  )
}

function DiffTag({ difficulty }) {
  const cls = difficulty==='Easy'?'diff-easy':difficulty==='Hard'?'diff-hard':'diff-medium'
  return <span className={`tag ${cls}`}>{difficulty}</span>
}

export default function RecipeCard({ recipe, onClick, onLike, onSave, liked, saved }) {
  const totalTime = (recipe.prep_time||0) + (recipe.cook_time||0)

  return (
    <div className="recipe-card" onClick={onClick}>
      {/* Image */}
      <div className="recipe-card-img">
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} loading="lazy"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}/>
          : null
        }
        <div className="recipe-card-no-img" style={{ display: recipe.image ? 'none' : 'flex' }}>
          <UtensilsCrossed size={40} strokeWidth={1}/>
        </div>

        {recipe.category && <span className="recipe-card-badge">{recipe.category}</span>}
        {recipe.source==='mealdb' && <span className="recipe-mealdb-badge">MealDB</span>}

        <div className="recipe-card-actions" onClick={e => e.stopPropagation()}>
          <button className={`icon-btn${liked?' liked':''}`} onClick={() => onLike?.(recipe.id)}>
            <Heart size={13} fill={liked?'currentColor':'none'}/>
          </button>
          <button className="icon-btn" onClick={() => onSave?.(recipe.id)}
            style={{ color:saved?'var(--brand)':undefined }}>
            <BookmarkPlus size={13} fill={saved?'currentColor':'none'}/>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="recipe-card-body">
        <div className="recipe-card-title line-clamp-2">{recipe.title}</div>
        {recipe.region && <div className="recipe-card-region">{recipe.region}</div>}

        <div className="recipe-card-meta">
          {totalTime > 0 && <span className="meta-item"><Clock size={11} strokeWidth={2}/> {totalTime} min</span>}
          {recipe.servings > 0 && <span className="meta-item"><Users size={11} strokeWidth={2}/> {recipe.servings}</span>}
          {recipe.total_cost_php && <span className="meta-item cost">₱{recipe.total_cost_php}</span>}
        </div>

        <div className="recipe-card-footer">
          <DiffTag difficulty={recipe.difficulty||'Medium'}/>
          {recipe.rating && <Stars rating={recipe.rating}/>}
        </div>
      </div>
    </div>
  )
}
