import { useState, useRef, useEffect } from 'react'
import { Send, ChefHat, RotateCcw } from 'lucide-react'
import { askCookingAssistant } from '../services/ai'

const SUGGESTIONS = [
  'How do I make the perfect sinigang broth?',
  'What\'s the difference between adobo and kaldereta?',
  'How can I make crispy lechon kawali skin?',
  'What substitutes can I use for tamarind?',
  'How do I know when my pork is tender enough?',
  'Can I make kare-kare without oxtail?',
  'What is the best fish for sinigang?',
  'How to prevent lumpia from getting soggy?',
]

const INIT_MSG = { role: 'ai', content: 'Kumusta! I\'m Ina, your Filipino cooking assistant! 🍳 Ask me anything about Filipino cuisine — recipes, techniques, substitutions, or cooking tips. Ano ang lutuin natin today? 😊' }

export default function AIAssistPage() {
  const [messages, setMessages] = useState([INIT_MSG])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)
  const textRef   = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)
    try {
      const context = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Ina'}: ${m.content}`).join('\n')
      const answer = await askCookingAssistant(q, context)
      setMessages(m => [...m, { role: 'ai', content: answer }])
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', content: `Sorry, I couldn't connect to the AI right now. Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => setMessages([INIT_MSG])

  return (
    <div>
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg,#7B4F9E,#5A2D82)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat size={24} color="white" />
          </div>
          <div>
            <h1 className="page-title">Cooking Assistant</h1>
            <p className="text-sm text-muted">Chat with Ina, powered by Llama 3.1 8B Instant</p>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={reset}><RotateCcw size={14} /> New Chat</button>
      </div>

      <div className="ai-chat-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 20, alignItems: 'start' }}>
        {/* Chat window */}
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.role === 'ai' && (
                  <div className="chat-avatar" style={{ background: 'linear-gradient(135deg,var(--clay),var(--clay-dk))' }}>INA</div>
                )}
                <div className="chat-bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg ai">
                <div className="chat-avatar" style={{ background: 'linear-gradient(135deg,var(--clay),var(--clay-dk))' }}>INA</div>
                <div className="chat-bubble">
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'var(--clay)', borderColor: 'rgba(196,98,45,0.2)' }} />
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>Thinking…</span>
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <textarea
              ref={textRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Filipino cooking… (Enter to send)"
              rows={1}
              disabled={loading}
              style={{ minHeight: 40 }}
            />
            <button className="chat-send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
              <Send size={17} />
            </button>
          </div>
        </div>

        {/* Suggestions sidebar */}
        <div className="ai-chat-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-elevated">
            <div className="card-body">
              <div className="section-title mb-3" style={{ fontSize: '0.9rem' }}>💡 Try asking…</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loading}
                    style={{ textAlign: 'left', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--char)', background: 'var(--parch)', cursor: 'pointer', lineHeight: 1.4, transition: 'all var(--transition)' }}
                    onMouseEnter={e => { e.target.style.borderColor = 'var(--clay)'; e.target.style.color = 'var(--clay)' }}
                    onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--char)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card card-elevated">
            <div className="card-body">
              <div className="text-xs font-600 mb-2" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About Ina</div>
              <p className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                Ina is powered by <strong>Llama 3.1 8B Instant</strong> for fast, conversational cooking help. She knows Filipino cuisine deeply — regional dishes, techniques, substitutions, and more.
              </p>
              <div className="divider" />
              <p className="text-xxs text-muted" style={{ lineHeight: 1.5 }}>
                ⚠️ AI responses may not always be 100% accurate. Always verify cooking temperatures and food safety guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
