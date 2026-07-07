import {
  ChefHat, LayoutGrid, Sparkles, TrendingUp, BookOpen,
  Users, Heart, ShoppingBasket, Menu, X, UserCircle, UtensilsCrossed
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import NotificationBell from '../ui/NotificationBell'

const NAV = [
  { id:'home',       label:'Discover',           icon:LayoutGrid },
  { id:'ai-recipes', label:'AI Recipe Guide',    icon:Sparkles },
  { id:'ai-assist',  label:'Cooking Assistant',  icon:ChefHat },
  { id:'prices',     label:'Price Checker',      icon:TrendingUp },
  { id:'cookbook',   label:'My Cookbook',        icon:BookOpen },
  { id:'favorites',  label:'Favorites',          icon:Heart },
  { id:'community',  label:'Community',          icon:Users },
  { id:'meal-plan',  label:'Meal Planner',       icon:ShoppingBasket },
]

const MOBILE_NAV = [
  { id:'home',       label:'Discover',  icon:LayoutGrid },
  { id:'ai-recipes', label:'AI',        icon:Sparkles },
  { id:'prices',     label:'Prices',    icon:TrendingUp },
  { id:'community',  label:'Community', icon:Users },
  { id:'profile',    label:'Profile',   icon:UserCircle },
]

export function Sidebar({ page, onNavigate, open, onClose }) {
  const { profile } = useAuth()
  const initials = (profile?.displayName || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <>
      <div className={`sidebar-overlay${open?' show':''}`} onClick={onClose}/>
      <aside className={`sidebar${open?' open':''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div className="sb-logo">
              <UtensilsCrossed size={18} strokeWidth={1.75}/>
              CookingINA
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:2 }}>
              <div className="sb-bell-only-desktop">
                <NotificationBell onNavigate={onNavigate} align="left"/>
              </div>
              <button onClick={onClose} className="sb-close-btn"
                style={{ color:'var(--ink-3)', padding:4, display:'none', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-sm)', background:'none', border:'none', cursor:'pointer' }}>
                <X size={17}/>
              </button>
            </div>
          </div>
          <div className="sb-tagline">Filipino Recipe Platform</div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <div className="sb-section-label">Menu</div>
          {NAV.map(({ id, label, icon:Icon }) => (
            <button key={id}
              className={`nav-item${page===id?' active':''}`}
              onClick={() => { onNavigate(id); onClose() }}>
              <Icon className="nav-icon" size={16} strokeWidth={1.75}/>
              {label}
            </button>
          ))}
        </nav>

        {/* Profile footer */}
        <div className="sb-footer">
          <button
            className={`user-card${page==='profile'?' active':''}`}
            onClick={() => { onNavigate('profile'); onClose() }}
            style={{ background: page==='profile'?'var(--brand-pale)':'transparent' }}>
            <div className="user-avatar" style={{ overflow:'hidden' }}>
              {profile?.photoURL
                ? <img src={profile.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                : initials}
            </div>
            <div className="user-info">
              <div className="user-name">{profile?.displayName || 'My Profile'}</div>
              <div className="user-handle">View profile</div>
            </div>
            <UserCircle size={14} style={{ color:'var(--ink-4)', flexShrink:0 }}/>
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileNav({ page, onNavigate }) {
  return (
    <nav className="bottom-nav">
      {MOBILE_NAV.map(({ id, label, icon:Icon }) => (
        <button key={id}
          className={`bnav-item${page===id?' active':''}`}
          onClick={() => onNavigate(id)}>
          <Icon size={21} strokeWidth={1.75}/>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export function Topbar({ onMenuOpen, title, onProfile, onNavigate, page }) {
  const { profile } = useAuth()
  const initials = (profile?.displayName || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  return (
    <header className="topbar">
      <button onClick={onMenuOpen} aria-label="Menu" className="topbar-menu-btn">
        <Menu size={22} strokeWidth={1.75}/>
      </button>
      <div className="topbar-brand">
        <UtensilsCrossed size={17} strokeWidth={1.75} style={{ color:'var(--brand)', flexShrink:0 }}/>
        <span className="topbar-brand-name">CookingINA</span>
        <span className="topbar-sep">·</span>
        <span className="topbar-page-title">{title}</span>
      </div>
      <NotificationBell onNavigate={onNavigate} align="right"/>
      <button onClick={onProfile} aria-label="Profile" className="topbar-avatar-btn">
        <div className="topbar-avatar" style={{ background: page==='profile'?'var(--brand)':'var(--brand-lt)' }}>
          {profile?.photoURL
            ? <img src={profile.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
            : initials}
        </div>
      </button>
    </header>
  )
}
