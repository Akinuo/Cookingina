import { useId } from 'react'
import { Clock, Users, Heart, BookmarkPlus, UtensilsCrossed } from 'lucide-react'

function StarIcon({ fill = 0 }) {
  // fill: 0–1, how much of the star is filled (supports half-stars)
  const uid = useId()
  const clipId = `star-clip-${uid}`
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" className="star-svg">
      <defs>
        <clipPath id={clipId}><rect x="0" y="0" width={24 * fill} height="24"/></clipPath>
      </defs>
      <path d="M12 2.8l2.7 6.4 6.9.6-5.2 4.6 1.6 6.8L12 17.6l-6 3.6 1.6-6.8-5.2-4.6 6.9-.6L12 2.8z"
        fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className="star-outline"/>
      <path d="M12 2.8l2.7 6.4 6.9.6-5.2 4.6 1.6 6.8L12 17.6l-6 3.6 1.6-6.8-5.2-4.6 6.9-.6L12 2.8z"
        fill="currentColor" clipPath={`url(#${clipId})`} className="star-fill"/>
    </svg>
  )
}

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(i => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return <StarIcon key={i} fill={fill}/>
      })}
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
