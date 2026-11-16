import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CalendarCheck, Send, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import AssistantMessage from './AssistantMessage'
import { assistantSuggestions, useAssistant } from './useAssistant'

const hiddenPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/assistant']

function hiddenOn(pathname) {
  return hiddenPaths.includes(pathname) || pathname.startsWith('/admin')
}

export default function AssistantWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const { messages, pending, error, send, retry, reset } = useAssistant()
  const launcherRef = useRef(null)
  const inputRef = useRef(null)
  const wasOpen = useRef(false)
  const userId = user?.id ?? null

  useEffect(() => {
    reset()
  }, [userId, reset])

  useEffect(() => {
    if (open) {
      wasOpen.current = true
      inputRef.current?.focus()
    } else if (wasOpen.current) {
      launcherRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (user?.role !== 'student' || hiddenOn(location.pathname)) {
    return null
  }

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'there'

  const submit = () => {
    if (send(text)) {
      setText('')
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const newChat = () => {
    reset()
    setText('')
    inputRef.current?.focus()
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-label="Open EventHub assistant"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-ink text-white shadow-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-6 sm:bottom-6"
      >
        <CalendarCheck className="size-6" aria-hidden="true" />
      </button>

      {open && (
        <section
          aria-label="EventHub Assistant"
          className="fixed right-4 bottom-24 z-40 flex h-[520px] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-card-border bg-white shadow-xl motion-safe:animate-[assistant-panel-in_160ms_ease-out] sm:right-6 sm:bottom-28"
        >
          <header className="flex items-center gap-2 border-b border-card-border px-3 py-2.5">
            <span
              className="flex size-8 items-center justify-center rounded-[8px] bg-ink text-white"
              aria-hidden="true"
            >
              <CalendarCheck className="size-4" />
            </span>
            <h2 className="flex-1 text-sm font-semibold text-ink">EventHub Assistant</h2>
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={newChat}
              disabled={messages.length === 0}
            >
              New chat
            </Button>
            <button
              type="button"
              aria-label="Close assistant"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-tile hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ink">
                  Hi {firstName}! Ask me about upcoming campus events.
                </p>
                <div className="flex flex-wrap gap-2">
                  {assistantSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full bg-tile px-3 py-1.5 text-left text-xs font-medium text-ink transition hover:bg-tab-active"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <AssistantMessage key={message.id} message={message} />
            ))}

            {pending && (
              <p role="status" className="text-sm text-muted">
                Assistant is typing…
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-btn border border-danger-border bg-white px-3 py-2 text-sm text-danger"
              >
                <p>{error.message}</p>
                {error.retryable && (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={retry}>
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="border-t border-card-border px-3 py-2.5"
          >
            <label htmlFor="assistant-widget-input" className="sr-only">
              Your message
            </label>
            <textarea
              id="assistant-widget-input"
              ref={inputRef}
              rows={1}
              maxLength={500}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about upcoming events"
              className="max-h-24 min-h-10 w-full resize-none rounded-input border border-input-border bg-white px-3 py-2 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[11px] text-muted">{text.length}/500</span>
              <Button
                type="submit"
                size="sm"
                loading={pending}
                disabled={text.trim() === ''}
                aria-label="Send question"
              >
                <Send className="size-4" aria-hidden="true" />
                Send
              </Button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
