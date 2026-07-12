import { useMemo, useState } from 'react'
import styles from './CopilotPanel.module.css'

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const STARTER_PROMPTS = [
  'Explain this recommendation',
  'Show highest stockout risk items',
  'Compare with previous run',
  'Why is this urgent?',
  'What should I do next?'
]

function formatLabel(value) {
  if (!value) return 'N/A'
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function formatSourceContext(context) {
  if (!context) return 'No source context available'

  const route = context.route || 'unknown route'
  const filters = context.filters && Object.keys(context.filters).length > 0
    ? Object.entries(context.filters)
        .filter(([, val]) => val !== null && val !== '' && val !== 'all')
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ')
    : 'no active filters'

  const selected = context.selected_context && Object.keys(context.selected_context).length > 0
    ? Object.entries(context.selected_context)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ')
    : 'no selected entity'

  return `Route: ${route}. Filters: ${filters}. Selected: ${selected}.`
}

function CopilotPanel({ route, filters, datasetId, runId, selectedContext, visibleContext }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [response, setResponse] = useState(null)

  const chips = useMemo(() => {
    if (!response?.suggested_followups?.length) {
      return STARTER_PROMPTS
    }

    return response.suggested_followups
  }, [response])

  const askCopilot = async (promptText) => {
    const text = String(promptText || '').trim()
    if (!text || loading) return

    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE_URL}/copilot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: text,
          route,
          filters,
          dataset_id: datasetId || undefined,
          run_id: runId || undefined,
          selected_context: selectedContext || {},
          visible_context: visibleContext || {}
        })
      })

      const payload = await res.json()

      if (!res.ok) {
        throw new Error(payload?.error || 'Copilot request failed')
      }

      setResponse(payload)
      setQuestion('')
    } catch (err) {
      console.error('Copilot error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    await askCopilot(question)
  }

  return (
    <aside className={styles.panel} aria-label="DemandPilot grounded copilot">
      <div className={styles.header}>
        <h3>Grounded Inventory Copilot</h3>
        <p>Answers only from persisted DemandPilot data and current page context.</p>
      </div>

      <div className={styles.chips}>
        {chips.map((chip) => (
          <button
            key={chip}
            className={styles.chip}
            onClick={() => askCopilot(chip)}
            type="button"
            disabled={loading}
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className={styles.askForm}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask only grounded questions (status, why, next action, compare runs, model used)."
          rows={3}
        />
        <button type="submit" disabled={loading || !question.trim()}>
          {loading ? 'Thinking...' : 'Ask Copilot'}
        </button>
      </form>

      {error && <p className={styles.error}>Error: {error}</p>}

      {response && (
        <div className={styles.responseWrap}>
          <div className={styles.answerCard}>
            <div className={styles.answerHead}>
              <strong>Answer</strong>
              {response.refusal && <span className={styles.refusal}>Unsupported</span>}
            </div>
            <p>{response.answer}</p>
          </div>

          <div className={styles.metaCard}>
            <strong>Source Context</strong>
            <p>{formatSourceContext(response.source_context)}</p>
          </div>

          <div className={styles.metaCard}>
            <strong>Provenance</strong>
            <ul>
              <li>Run: {response.provenance?.run_id || 'N/A'}</li>
              <li>Requested model: {formatLabel(response.provenance?.requested_model)}</li>
              <li>Executed model: {formatLabel(response.provenance?.executed_model || response.provenance?.forecast_model)}</li>
              <li>Fallback used: {response.provenance?.fallback_used ? 'Yes' : 'No'}</li>
              <li>Fallback reason: {response.provenance?.fallback_reason || 'N/A'}</li>
            </ul>
          </div>

          <div className={styles.metaCard}>
            <strong>Evidence</strong>
            <pre>{JSON.stringify(response.evidence, null, 2)}</pre>
          </div>
        </div>
      )}
    </aside>
  )
}

export default CopilotPanel
