const BASE = 'https://www.themealdb.com/api/json/v1/1'

/**
 * Fetch all Filipino meals from MealDB (filter by area = Filipino).
 * Returns a flat list: [{ idMeal, strMeal, strMealThumb }]
 */
export async function fetchFilipinoMeals() {
  const res  = await fetch(`${BASE}/filter.php?a=Filipino`)
  if (!res.ok) throw new Error(`MealDB error ${res.status}`)
  const data = await res.json()
  return data.meals || []
}

/**
 * Fetch full recipe details for a single meal by ID.
 * Returns the complete meal object or null.
 */
export async function fetchMealById(id) {
  const res  = await fetch(`${BASE}/lookup.php?i=${id}`)
  if (!res.ok) return null
  const data = await res.json()
  return data.meals?.[0] || null
}

/**
 * Fetch full details for multiple meal IDs in parallel.
 * Limits concurrency to avoid hammering the free API.
 */
export async function fetchMealDetails(ids) {
  const results = await Promise.allSettled(ids.map(id => fetchMealById(id)))
  return results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
}

/**
 * Convert a raw MealDB meal object into our app's recipe shape.
 * MealDB stores ingredients as strIngredient1…strIngredient20 and
 * measurements as strMeasure1…strMeasure20.
 */
export function normalizeMealDBRecipe(meal) {
  // Extract ingredients + measures
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name   = meal[`strIngredient${i}`]?.trim()
    const amount = meal[`strMeasure${i}`]?.trim()
    if (name) {
      ingredients.push({ name, amount: amount || '', unit: '', cost_php: null })
    }
  }

  // Split instructions into steps
  const rawSteps = (meal.strInstructions || '')
    .split(/\r?\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)

  const steps = rawSteps.map((instruction, i) => ({
    step: i + 1,
    instruction: instruction.replace(/^STEP\s*\d+[\.:]\s*/i, '').trim(),
    time_minutes: null,
  }))

  // Tags from MealDB
  const tags = (meal.strTags || '')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)

  return {
    id:          `mealdb-${meal.idMeal}`,
    mealdbId:    meal.idMeal,
    slug:        meal.strMeal.toLowerCase().replace(/\s+/g, '-'),
    title:       meal.strMeal,
    image:       meal.strMealThumb,
    category:    meal.strCategory || 'Filipino',
    region:      meal.strArea || 'Filipino',
    source:      'mealdb',
    description: `${meal.strArea || 'Filipino'} ${meal.strCategory || 'dish'} — from TheMealDB community database.`,
    difficulty:  'Medium',      // MealDB doesn't provide difficulty
    prep_time:   0,
    cook_time:   0,
    servings:    4,
    ingredients,
    steps,
    nutrition:   null,          // MealDB doesn't provide nutrition
    total_cost_php: null,
    tags:        ['mealdb', 'filipino', ...tags],
    youtube:     meal.strYoutube || null,
    rating:      null,
    reviews:     null,
    emoji:       '🍽️',
  }
}
