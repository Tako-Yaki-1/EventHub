import { useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import AssistantMessage from './AssistantMessage'
import { assistantSuggestions, useAssistant } from './useAssistant'

export default function Assistant() {
  const [question, setQuestion] = useState('')
  const { messages, pending, error, send, retry } = useAssistant()

  const submit = (value) => {
    if (send(value)) {
      setQuestion('')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">Ask AI</h1>
        <p className="mt-1 text-sm text-muted">
          Ask about upcoming campus events. The assistant only sees published events.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit(question)
        }}
        className="rounded-card border border-card-border bg-white p-4"
      >
        <label htmlFor="assistant-question" className="mb-1.5 block text-sm font-medium text-ink">
          Your question
        </label>
        <textarea
          id="assistant-question"
          rows={3}
          maxLength={500}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What events are this week?"
          className="w-full resize-y rounded-input border border-input-border bg-white px-3 py-2 text-sm text-ink placeholder:text-placeholder focus:border-primary focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="submit" loading={pending} disabled={question.trim() === ''}>
            <Sparkles className="size-4" aria-hidden="true" />
            Ask
          </Button>
          <span className="text-xs text-muted">{question.length}/500</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {assistantSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => submit(suggestion)}
              className="rounded-full bg-tile px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-tab-active"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>

      <div className="space-y-3" aria-live="polite" aria-label="Conversation">
        {messages.map((message) => (
          <AssistantMessage key={message.id} message={message} />
        ))}

        {pending && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted">
            <Bot className="size-4" aria-hidden="true" />
            Thinking about your question…
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
    </div>
  )
}
