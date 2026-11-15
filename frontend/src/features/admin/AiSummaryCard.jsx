import { useMutation } from '@tanstack/react-query'
import { Bot, Sparkles } from 'lucide-react'
import { generateAnalyticsSummary } from '../../api/ai'
import Button from '../../components/ui/Button'
import { errorMessage } from '../../lib/errors'

export default function AiSummaryCard() {
  const generate = useMutation({ mutationFn: generateAnalyticsSummary })
  const result = generate.data

  return (
    <section
      aria-labelledby="ai-summary-heading"
      className="rounded-card border border-card-border bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ai-summary-heading" className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Bot className="size-4 text-primary" aria-hidden="true" />
            AI summary
          </h2>
          <p className="mt-1 text-xs text-muted">
            A short read of the numbers below, with suggested next steps. Cached for 10 minutes.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={generate.isPending}
          onClick={() => generate.mutate()}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {result ? 'Regenerate' : 'Generate'}
        </Button>
      </div>

      {generate.isError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {errorMessage(generate.error, 'Could not generate a summary right now.')}
        </p>
      )}

      {!result && !generate.isPending && !generate.isError && (
        <p className="mt-3 text-sm text-muted">
          Generate a summary to spot what needs attention without reading every chart.
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {result.source === 'rules' && (
            <p className="rounded-btn bg-tile px-3 py-2 text-xs text-ink">
              {result.message ?? 'Rule-based summary, because AI is unavailable right now.'}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Findings</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-ink">
                {result.findings.map((finding, index) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Recommended actions
              </h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-ink">
                {result.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {result.source === 'ai' && (
              <span className="font-medium">AI-generated. It can be wrong; check the numbers.</span>
            )}
            {result.cached && <span>· Cached result</span>}
          </div>
        </div>
      )}
    </section>
  )
}
