import { useCallback, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { askAssistant } from '../../api/ai'
import { errorMessage } from '../../lib/errors'

export const assistantSuggestions = [
  'What events are this week?',
  'Recommend something for a software developer',
  'Which events are almost full?',
]

/**
 * Conversation state for the assistant. It lives only in React state, never
 * in localStorage, and is shared by the Ask AI page and the floating widget.
 */
export function useAssistant() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const nextId = useRef(0)

  const ask = useMutation({
    mutationFn: askAssistant,
    onSuccess: (data) => {
      setMessages((current) => [
        ...current,
        { id: ++nextId.current, role: 'assistant', result: data },
      ])
    },
    onError: (requestError, question) => {
      setError({
        message: requestError?.response
          ? errorMessage(requestError, 'The assistant could not answer. Please try again.')
          : 'Could not reach the assistant. Check your connection and try again.',
        retryable: !requestError?.response || requestError.response.status >= 500,
        question,
      })
    },
  })

  const run = (question, echo) => {
    setError(null)

    if (echo) {
      setMessages((current) => [
        ...current,
        { id: ++nextId.current, role: 'user', text: question },
      ])
    }

    ask.mutate(question)
  }

  const send = (value) => {
    const text = String(value ?? '').trim()

    if (text === '' || ask.isPending) {
      return false
    }

    run(text, true)

    return true
  }

  const retry = () => {
    if (!error?.question || ask.isPending) {
      return
    }

    run(error.question, false)
  }

  const reset = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    pending: ask.isPending,
    error,
    send,
    retry,
    reset,
  }
}
