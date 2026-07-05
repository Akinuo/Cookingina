import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import { useToast } from './hooks/useToast'
import { Sidebar, MobileNav, Topbar } from './components/layout/Sidebar'
import ToastContainer from './components/ui/ToastContainer'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import AIRecipePage from './pages/AIRecipePage'
import AIAssistPage from './pages/AIAssistPage'
import PriceCheckerPage from './pages/PriceCheckerPage'
import CookbookPage from './pages/CookbookPage'
import CommunityPage from './pages/CommunityPage'
import ProfilePage from './pages/ProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import { FavoritesPage, MealPlannerPage } from './pages/OtherPages'
import './styles/global.css'

const PAGE_TITLES = {
  home:         'Discover',
  'ai-recipes': 'AI Recipe Guide',
  'ai-assist':  'Cooking Assistant',
  prices:       'Price Checker',
  cookbook:     'My Cookbook',
  favorites:    'Favorites',
  community:    'Community',
  'meal-plan':  'Meal Planner',
  profile:      'My Profile',
  'user-profile':'Profile',
}

function AppShell() {
  const { user, loading } = useAuth()
  const { toasts, success: toastSuccess, like: toastLike, follow: toastFollow } = useToast()
  const [page, setPage]         = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewingUid, setViewingUid]   = useState(null)

  // Real-time notification handler
  const handleNotification = useCallback((notif) => {
    if (notif.type === 'like') {
      toastLike(`❤️ ${notif.fromName} liked your post!`)
    } else if (notif.type === 'follow') {
      toastFollow(`👤 ${notif.fromName} started following you!`)
    } else if (notif.type === 'comment') {
      toastSuccess(`💬 ${notif.fromName} commented on your post!`)
    }
  }, [toastLike, toastFollow, toastSuccess])

  useNotifications(user?.uid, handleNotification)

  if (loading) {
    return (
      <div className="loading-page">
        <div style={{ fontSize:'3.5rem', marginBottom:8 }}>🍳</div>
        <span className="spinner spinner-lg"/>
        <p className="text-muted text-sm" style={{ marginTop:12 }}>Loading CookingINA…</p>
      </div>
    )
  }

  if (!user) return <AuthPage/>

  const navigate = (p, uid = null) => {
    setPage(p)
    setViewingUid(uid)
    setSidebarOpen(false)
  }

  const openUserProfile = (uid) => navigate('user-profile', uid)

  const renderPage = () => {
    switch (page) {
      case 'home':         return <HomePage onNavigate={navigate}/>
      case 'ai-recipes':   return <AIRecipePage/>
      case 'ai-assist':    return <AIAssistPage/>
      case 'prices':       return <PriceCheckerPage/>
      case 'cookbook':     return <CookbookPage/>
      case 'favorites':    return <FavoritesPage onNavigate={navigate}/>
      case 'community':    return <CommunityPage onUserClick={openUserProfile}/>
      case 'meal-plan':    return <MealPlannerPage/>
      case 'profile':      return <ProfilePage onNavigate={navigate}/>
      case 'user-profile': return <UserProfilePage targetUid={viewingUid} onBack={() => navigate('community')}/>
      default:             return <HomePage onNavigate={navigate}/>
    }
  }

  return (
    <div className="app-shell">
      {/* Global notification toasts */}
      <ToastContainer toasts={toasts}/>

      <Sidebar
        page={page}
        onNavigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-area">
        <Topbar
          onMenuOpen={() => setSidebarOpen(true)}
          title={PAGE_TITLES[page] || 'CookingINA'}
          onProfile={() => navigate('profile')}
          page={page}
        />
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
      <MobileNav page={page} onNavigate={navigate}/>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell/>
    </AuthProvider>
  )
}
