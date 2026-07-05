const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

const MODELS = {
  main: 'llama-3.3-70b-versatile',
  fast: 'llama-3.1-8b-instant',
  guard: 'llama-guard-3-8b'
}

async function groqCall(model, messages, maxTokens = 2000) {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY not set in .env')
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.5 })
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error?.message || `Groq error ${res.status}`)
  }
  const d = await res.json()
  return d.choices?.[0]?.message?.content || ''
}

// ─── Robust JSON extractor ────────────────────────────────────
// Handles: ```json ... ```, raw JSON, JSON embedded in prose
function extractJSON(raw) {
  if (!raw) throw new Error('Empty response from AI')

  // 1. Strip markdown fences
  let clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  // 2. Try parsing directly
  try { return JSON.parse(clean) } catch (_) {}

  // 3. Find first { or [ and last } or ]
  const objStart = clean.indexOf('{')
  const arrStart = clean.indexOf('[')
  let start = -1
  let isArr = false

  if (objStart === -1 && arrStart === -1) throw new Error('No JSON found in AI response')

  if (objStart === -1) { start = arrStart; isArr = true }
  else if (arrStart === -1) { start = objStart; isArr = false }
  else if (arrStart < objStart) { start = arrStart; isArr = true }
  else { start = objStart; isArr = false }

  const end = isArr ? clean.lastIndexOf(']') : clean.lastIndexOf('}')
  if (end === -1) throw new Error('Malformed JSON in AI response')

  const jsonStr = clean.slice(start, end + 1)
  try { return JSON.parse(jsonStr) } catch (e) {
    // 4. Last resort: fix common issues (trailing commas, unescaped quotes)
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, '$1')        // trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // unquoted keys
    return JSON.parse(fixed)
  }
}

// ─── Recipe Generation (70B) ─────────────────────────────────
export async function generateRecipe(ingredients, preferences = {}) {
  const sys = `You are CookingINA, an expert Filipino culinary AI.
Generate a complete Filipino recipe as a single valid JSON object.
IMPORTANT: Return ONLY the JSON object. No explanation, no markdown, no extra text.
Required fields:
{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "Easy|Medium|Hard",
  "prep_time": number,
  "cook_time": number,
  "servings": number,
  "ingredients": [{"name":"string","amount":number,"unit":"g|kg|ml|L|cups|tbsp|tsp|pcs","cost_php":number}],
  "steps": [{"step":number,"instruction":"string","time_minutes":number}],
  "nutrition": {"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number},
  "total_cost_php": number,
  "tips": "string",
  "tags": ["string"]
}`

  const prompt = `Filipino recipe using: ${ingredients.join(', ')}.
Style: ${preferences.cuisine || 'Any Filipino'}, Diet: ${preferences.diet || 'None'}, Cookware: ${preferences.cookware || 'Any'}, Servings: ${preferences.servings || 4}${preferences.budget ? `, Budget: ${preferences.budget}` : ''}.
Use authentic Filipino techniques. All cost estimates in Philippine Pesos.`

  const raw = await groqCall(MODELS.main, [
    { role: 'system', content: sys },
    { role: 'user', content: prompt }
  ], 3000)

  return extractJSON(raw)
}

// ─── AI Cooking Assistant (Fast 8B) ─────────────────────────
export async function askCookingAssistant(question, context = '') {
  const sys = `You are Ina, a friendly Filipino cooking assistant. Answer questions about Filipino cuisine, cooking techniques, ingredients, and recipes concisely and warmly. Use occasional Filipino words naturally.`
  return groqCall(MODELS.fast, [
    { role: 'system', content: sys },
    ...(context ? [{ role: 'assistant', content: context }] : []),
    { role: 'user', content: question }
  ], 900)
}

// ─── Price Check (Fast 8B) ────────────────────────────────────
export async function checkIngredientPrices(items) {
  const sys = `You are a Philippine market price expert for CookingINA.
Return ONLY a valid JSON array. No explanation, no markdown, no extra text.
Format exactly:
[{"item":"string","price_min":number,"price_max":number,"unit":"string","market_type":"wet market|supermarket|both","trend":"stable|up|down","availability":"common|seasonal|rare"}]`

  const raw = await groqCall(MODELS.fast, [
    { role: 'system', content: sys },
    { role: 'user', content: `Philippine market price estimates for these items: ${items.join(', ')}` }
  ], 1800)

  return extractJSON(raw)
}

// ─── Content Moderation ───────────────────────────────────────
export async function moderateContent(text) {
  try {
    const result = await groqCall(MODELS.guard, [{ role: 'user', content: text }], 50)
    return { safe: result.toLowerCase().includes('safe'), result }
  } catch {
    return { safe: true, result: 'moderation_unavailable' }
  }
}

// ─── Budget Meal Planner ──────────────────────────────────────
export async function planBudgetMeals(budget, days, family_size) {
  const sys = `You are a Filipino budget meal planner.
Return ONLY a valid JSON object. No markdown, no explanation.
Format:
{"total_cost_php":number,"meals":[{"day":number,"breakfast":{"name":"string","cost_php":number},"lunch":{"name":"string","cost_php":number},"dinner":{"name":"string","cost_php":number}}],"shopping_list":[{"item":"string","amount":"string","cost_php":number}],"tips":["string"]}`

  const raw = await groqCall(MODELS.main, [
    { role: 'system', content: sys },
    { role: 'user', content: `Budget: ₱${budget} for ${days} days, ${family_size} people. Filipino meals.` }
  ], 2500)

  return extractJSON(raw)
}

// ─── AI Fill for Cookbook ─────────────────────────────────────
export async function getRecipeDetails(name) {
  return askCookingAssistant(
    `Give me a complete recipe for "${name}". Include: description, ingredients with measurements (g/kg/ml/cups/tbsp/tsp/pcs), numbered steps, and a cooking tip.`
  )
}
