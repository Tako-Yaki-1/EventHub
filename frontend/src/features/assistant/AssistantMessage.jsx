import EventCard from '../events/EventCard'

const aiLabel = 'AI-generated. It can be wrong, so check the event page.'
const fallbackLabel = 'AI is unavailable right now, here are matching events.'

export default function AssistantMessage({ message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm break-words whitespace-pre-line text-white">
          {message.text}
        </p>
      </div>
    )
  }

  const result = message.result

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] space-y-2">
        <div className="space-y-2 rounded-2xl rounded-bl-sm bg-welcome px-3 py-2 text-sm text-ink">
          {result.source === 'fallback' && (
            <p className="font-medium">{result.message ?? fallbackLabel}</p>
          )}

          {result.answer && (
            <p className="leading-relaxed break-words whitespace-pre-line">{result.answer}</p>
          )}

          <p className="text-xs text-muted">
            {result.source === 'ai' ? aiLabel : 'Matching events, not an AI answer.'}
          </p>

          {result.events?.length > 0 && (
            <div className="space-y-2">
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
        </div>
      </div>
    </div>
  )
}
