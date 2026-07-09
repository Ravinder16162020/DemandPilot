import styles from './RunProvenance.module.css'

function formatTimestamp(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

function formatModelLabel(value) {
  if (!value) return 'N/A'
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function RunProvenance({ runSummary }) {
  if (!runSummary?.job_id) {
    return null
  }

  const requestedModel = formatModelLabel(runSummary.requested_model)
  const executedModel = formatModelLabel(runSummary.forecast_model)
  const fallbackUsed = Boolean(runSummary.fallback_used)
  const fallbackReason = runSummary.fallback_reason || 'N/A'

  return (
    <div className={styles.container}>
      {fallbackUsed && (
        <div className={styles.fallbackBadge}>
          <span className={styles.fallbackTitle}>Fallback applied</span>
          <span className={styles.fallbackText}>Requested {requestedModel}, executed {executedModel}</span>
        </div>
      )}

      <div className={styles.badge}>
      <div className={styles.metaRow}>
        <span className={styles.label}>Run ID</span>
        <span className={styles.value}>{runSummary.job_id}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Source</span>
        <span className={styles.value}>{runSummary.data_source || 'postgres'}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Status</span>
        <span className={styles.value}>{runSummary.status || 'COMPLETED'}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Last Run</span>
        <span className={styles.value}>{formatTimestamp(runSummary.last_pipeline_at)}</span>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.label}>Requested Model</span>
        <span className={styles.value}>{requestedModel}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Executed Model</span>
        <span className={styles.value}>{executedModel}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Fallback</span>
        <span className={styles.value}>{fallbackUsed ? 'Yes' : 'No'}</span>
      </div>
      <div className={styles.metaRow}>
        <span className={styles.label}>Fallback Reason</span>
        <span className={styles.value} title={fallbackReason}>{fallbackReason}</span>
      </div>
      </div>
    </div>
  )
}

export default RunProvenance
