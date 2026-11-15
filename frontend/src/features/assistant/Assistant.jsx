import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Sparkles } from 'lucide-react'
import { askAssistant } from '../../api/ai'
import Button from '../../components/ui/Button'
import EventCard from '../events/EventCard'
import { errorMessage } from '../../lib/errors'

const suggestions = [
  'What events are this week?',
  'Recommend something for a software developer',
  'Which events are almost full?',
]

export default function Assistant() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const ask = useMutation({
    mutationFn: askAssistant,
    onSuccess: (data) => {
      setResult(data)
      setError('')
    },
    onError: (requestError) => {
      setResult(null)
      setError(errorMessage(requestError, 'The assistant could not answer. Please try again.'))
    },
  })

  const submit = (value) => {
    const text = value.trim()

    if (text === '') return

    setQuestion(text)
    ask.mutate(text)
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
          <Button type="submit" loading={ask.isPending} disabled={question.trim() === ''}>
            <Sparkles className="size-4" aria-hidden="true" />
            Ask
          </Button>
          <span className="text-xs text-muted">{question.length}/500</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
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

      {ask.isPending && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Bot className="size-4" aria-hidden="true" />
          Thinking about your question…
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-btn border border-danger-border bg-white px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {result && !ask.isPending && (
        <section
          aria-label="Assistant answer"
          aria-live="polite"
          className="space-y-4 rounded-card border border-card-border bg-white p-4"
        >
          {result.source === 'fallback' && (
            <p className="rounded-btn bg-tile px-3 py-2 text-sm text-ink">
              {result.message ?? 'AI is unavailable right now, here are matching events.'}
            </p>
          )}

          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{result.answer}</p>

          {result.source === 'ai' && (
            <p className="text-xs font-medium text-muted">
              AI-generated. It can be wrong, so check the event page.
            </p>
          )}

          {result.events?.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">
                {result.source === 'fallback' ? 'Matching events' : 'Events mentioned'}
              </h2>
              {result.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {typeof result.remaining_tokens === 'number' && (
            <p className="text-xs text-muted">
              About {result.remaining_tokens.toLocaleString()} AI tokens left today.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
