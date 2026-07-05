import { useState } from 'react'
import { TrendingUp, RefreshCw, AlertCircle, Info, Search } from 'lucide-react'
import { checkIngredientPrices } from '../services/ai'
import { PRICE_CATEGORIES } from '../data/recipes'

const TREND = {
  up:     { sym:'↑', color:'var(--danger)', label:'Rising' },
  down:   { sym:'↓', color:'var(--leaf)',   label:'Falling' },
  stable: { sym:'→', color:'var(--muted)',  label:'Stable' },
}
const AVAIL_COLOR = { common:'var(--leaf)', seasonal:'#856404', rare:'var(--danger)' }

export default function PriceCheckerPage() {
  const [activeId, setActiveId]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [prices, setPrices]       = useState([])
  const [error, setError]         = useState('')
  const [updated, setUpdated]     = useState(null)
  const [search, setSearch]       = useState('')

  const fetchPrices = async (cat) => {
    setActiveId(cat.id); setLoading(true); setPrices([]); setError('')
    try {
      const raw = await checkIngredientPrices(cat.items)
      setPrices(Array.isArray(raw) ? raw : [])
      setUpdated(new Date())
    } catch (e) {
      setError(e.message || 'Failed to fetch prices. Check your Groq API key.')
    } finally { setLoading(false) }
  }

  const activeCat = PRICE_CATEGORIES.find(c => c.id === activeId)
  const filtered  = prices.filter(p => !search || p.item?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="price-page">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-icon" style={{ background:'linear-gradient(135deg,var(--leaf-lt),var(--leaf))' }}>
          <TrendingUp size={22} color="white" />
        </div>
        <div>
          <h1 className="page-title">Price Checker</h1>
          <p className="text-sm text-muted">AI-estimated Philippine market prices · DTI &amp; wet market based</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer-box">
        <Info size={15} style={{ color:'var(--leaf)', flexShrink:0, marginTop:1 }} />
        <p>
          <strong>Disclaimer:</strong> Prices are <em>AI estimates</em> based on DTI price monitoring data and typical Philippine wet market/supermarket prices.
          Actual prices <strong>vary significantly</strong> by location, season, store type, and market conditions.
          Always verify at your local palengke or supermarket. These are reference estimates only.
        </p>
      </div>

      {/* Category grid */}
      <div style={{ marginBottom:16 }}>
        <div className="input-label" style={{ marginBottom:10 }}>Select a Grocery Category</div>
        <div className="price-cat-grid">
          {PRICE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`price-cat-btn${activeId === cat.id ? ' active' : ''}`}
              onClick={() => fetchPrices(cat)}
              disabled={loading}
            >
              <span className="price-cat-emoji">{cat.emoji}</span>
              <span className="price-cat-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="empty-state" style={{ padding:'40px 0' }}>
          <span className="spinner spinner-lg" style={{ display:'block', margin:'0 auto 14px' }} />
          <p className="text-muted">Asking Llama 3.1 8B for current price estimates…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ai-error-box">
          <AlertCircle size={15} style={{ flexShrink:0 }} />
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}

      {/* Price table */}
      {!loading && prices.length > 0 && activeCat && (
        <div className="card card-elevated" style={{ padding:0, overflow:'hidden' }}>
          {/* Table header */}
          <div className="price-table-header">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'1.2rem' }}>{activeCat.emoji}</span>
              <strong style={{ fontFamily:'var(--font-display)', fontSize:'1rem' }}>{activeCat.label}</strong>
              <span className="text-xs text-muted">{prices.length} items</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              {updated && <span className="text-xxs text-muted">{updated.toLocaleTimeString()}</span>}
              <div className="search-bar" style={{ height:32, maxWidth:160, paddingLeft:10, paddingRight:10 }}>
                <Search size={13} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter…" style={{ fontSize:'0.78rem' }} />
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => fetchPrices(activeCat)}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </div>

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Est. Price (₱)</th>
                  <th>Unit</th>
                  <th className="price-col-hide">Where to Buy</th>
                  <th>Trend</th>
                  <th className="price-col-hide">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const trend = TREND[row.trend] || TREND.stable
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight:500 }}>{row.item}</td>
                      <td><span className="price-val">₱{row.price_min}–{row.price_max}</span></td>
                      <td className="text-muted text-xs">{row.unit}</td>
                      <td className="price-col-hide text-xs text-muted">{row.market_type}</td>
                      <td>
                        <span style={{ color:trend.color, fontWeight:700, fontSize:'0.85rem' }} title={trend.label}>
                          {trend.sym} {trend.label}
                        </span>
                      </td>
                      <td className="price-col-hide">
                        <span className="tag" style={{ color:AVAIL_COLOR[row.availability]||'var(--muted)', fontSize:'0.65rem' }}>
                          {row.availability}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="price-table-footer">
            <span className="text-xxs text-muted">💡 Wet market prices are ~20–40% lower than supermarkets.</span>
            <span className="text-xxs text-muted">⚠️ AI estimates · Prices vary by location &amp; season</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && prices.length === 0 && !activeId && (
        <div className="empty-state">
          <span className="empty-state-icon">🏪</span>
          <h3>Pumili ng kategorya</h3>
          <p>Select a grocery category above to get AI-estimated Philippine market prices based on DTI monitoring and wet market data.</p>
        </div>
      )}
    </div>
  )
}
