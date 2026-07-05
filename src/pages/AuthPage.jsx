import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Sparkles, TrendingUp, BookOpen, Users, UtensilsCrossed } from 'lucide-react'

const FEATURES = [
  { icon: Sparkles,   text: 'AI recipe generation powered by Llama 3.3 70B' },
  { icon: TrendingUp, text: 'Philippine market price estimates (DTI-based)' },
  { icon: BookOpen,   text: 'Personal digital cookbook with cloud sync' },
  { icon: Users,      text: 'Community feed — share and discover recipes' },
]

export default function AuthPage() {
  const { signInGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInGoogle() }
    catch { setError('Sign-in failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <img
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=60"
        alt="" className="auth-bg" aria-hidden="true"
      />
      <div className="auth-card">
        <div className="auth-logo-mark">
          <UtensilsCrossed size={26} strokeWidth={1.75}/>
        </div>
        <h1 className="auth-brand">CookingINA</h1>
        <p className="auth-tagline">
          Your AI-powered Filipino kitchen companion — authentic recipes, real market prices, and community.
        </p>

        <div className="auth-features">
          {FEATURES.map(({ icon:Icon, text }) => (
            <div key={text} className="auth-feature">
              <div className="auth-feature-icon"><Icon size={14} strokeWidth={2}/></div>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="auth-divider">or continue with</div>

        {error && (
          <div style={{ background:'#fff5f4', border:'1px solid rgba(192,57,43,0.25)', color:'var(--red)', padding:'10px 14px', borderRadius:'var(--r-md)', fontSize:'0.875rem', marginBottom:14 }}>
            {error}
          </div>
        )}

        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          {loading ? <span className="spinner spinner-sm"/> : <GoogleIcon/>}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p style={{ marginTop:18, fontSize:'0.7rem', color:'var(--ink-4)', lineHeight:1.6 }}>
          By continuing, you agree to use CookingINA responsibly. AI-generated recipes and price estimates are for reference only.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
