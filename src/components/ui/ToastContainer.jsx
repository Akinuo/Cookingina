import { CheckCircle, XCircle, AlertTriangle, Info, Heart, UserPlus } from 'lucide-react'

const ICONS = {
  success:  CheckCircle,
  error:    XCircle,
  warning:  AlertTriangle,
  default:  Info,
  like:     Heart,
  follow:   UserPlus,
}

export default function ToastContainer({ toasts }) {
  if (!toasts?.length) return null
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = ICONS[t.type] || ICONS.default
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={15} />
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
