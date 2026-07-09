import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import CopilotPanel from './CopilotPanel'
import styles from './Forecasts.module.css'

const API_BASE_URL = 'http://localhost:4000/api'

const summaryCards = [
  { label: 'Avg. Forecast Accuracy', value: '94.2%', meta: '+1.2%', metaClass: 'good' },
  { label: 'Total Models Evaluated', value: '1,240', meta: 'analytics', metaClass: 'icon' },
  { label: 'SKUs Optimized', value: '850', meta: 'of 1,000', metaClass: 'muted' },
  { label: 'Active Experiments', value: '12', meta: 'pulse', metaClass: 'pulse' },
]

const models = [
  { sku: 'SKU-20941', category: 'Industrial/Electrical', model: 'Linear Regression', mape: '5.6%', rmse: '14.2', status: 'Best' },
  { sku: 'SKU-11202', category: 'Precision/Gear', model: 'XGBoost', mape: '8.7%', rmse: '24.1', status: 'Average' },
  { sku: 'SKU-88210', category: 'Raw Material/Metal', model: 'Moving Average', mape: '18.4%', rmse: '62.8', status: 'Poor' },
  { sku: 'SKU-44093', category: 'Finished Goods/Casing', model: 'Moving Average', mape: '7.4%', rmse: '18.6', status: 'Average' },
]

const insights = [
  {
    title: 'Demo-Safe Model Routing',
    text: 'Prophet is experimental on Windows in this demo, so stable models are prioritized for consistent behavior.',
  },
  {
    title: 'Residual Analysis',
    text: 'Moving average is failing to capture the upward trend in Raw Materials due to high volatility.',
  },
  {
    title: 'Anomaly Detection',
    text: '3 spikes in SKU-11202 were marked as outliers and excluded from RMSE calculation.',
  },
]

const modelOptions = [
  { key: 'moving_average', label: 'Moving Average', note: 'Stable baseline', tone: 'ready' },
  { key: 'linear_regression', label: 'Linear Regression', note: 'Stable on current datasets', tone: 'ready' },
  { key: 'xgboost', label: 'XGBoost', note: 'Stable with enough history', tone: 'ready' },
  {
    key: 'prophet',
    label: 'Prophet',
    note: 'Experimental on Windows. Disabled by default unless ENABLE_PROPHET=true.',
    tone: 'experimental',
  },
]

function Forecasts() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [runSummary, setRunSummary] = useState(null)
  const [selectedContext, setSelectedContext] = useState({})

  useEffect(() => {
    const fetchRunSummary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/kpis`)
        const payload = await response.json()

        if (!payload?.run_job_id) {
          setRunSummary(null)
          return
        }

        setRunSummary({
          job_id: payload.run_job_id,
          requested_model: payload.requested_model || null,
          forecast_model: payload.forecast_model || null,
          fallback_used: Boolean(payload.fallback_used),
          fallback_reason: payload.fallback_reason || null,
        })
      } catch (error) {
        console.error('Unable to load run summary for forecasts view:', error)
      }
    }

    fetchRunSummary()
  }, [])

  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ].map((href) => {
      const existing = document.querySelector(`link[href="${href}"]`)
      if (existing) return null

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      return link
    })

    return () => {
      links.forEach((link) => {
        if (link?.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [])

  return (
    <div className={styles.page}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              aria-label="Open sidebar"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <span className={`${styles.icon} material-symbols-outlined`}>menu</span>
            </button>

            <h2>Architect Inventory</h2>

            <nav className={styles.topLinks}>
              <button className={styles.topLinkActive} type="button">Models</button>
              <button type="button">Inventory</button>
              <button type="button">Supply Chain</button>
              <button type="button">Analytics</button>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>notifications</span>
            </button>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>settings</span>
            </button>
            <img
              alt="User Profile"
              className={styles.avatar}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1KmoiapuiZPf_uskYIlohQIf5tSM-EiCB6ug6QCEjEVuduJkm8BA4HmXsziDUWo4ekw_LCuXjxPZinoCK9yIjIfIHm4TQWwT7hMwrTbP9bR8sMuHFvD9KOKm8oFiEibm_KowYyt7dUJgSd0N1QmHRzb1tM8_-43F3m0h6D5fWsrn32GaRIsjlx5KsmOnhnrT9ExpT3_wlYZzNpwTltYXpWugyRgrPk99CRqXlt3Ptt-D00jngH3Req4FW8qWxgrHXsWuiDF4YtDA"
            />
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.headerRow}>
            <div>
              <span className={styles.kicker}>Operational Intelligence</span>
              <h1>DemandPilot Forecasting</h1>
            </div>
            <div className={styles.dateChip}>
              <span className={`${styles.icon} material-symbols-outlined`}>calendar_today</span>
              <span>Last 30 Days</span>
            </div>
          </div>

          <section className={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <article key={card.label} className={styles.summaryCard}>
                <p>{card.label}</p>
                <div className={styles.summaryValueRow}>
                  <h3>{card.value}</h3>
                  {card.metaClass === 'good' && <span className={styles.goodMeta}>{card.meta}</span>}
                  {card.metaClass === 'icon' && <span className={`${styles.iconMeta} material-symbols-outlined`}>{card.meta}</span>}
                  {card.metaClass === 'muted' && <span className={styles.mutedMeta}>{card.meta}</span>}
                  {card.metaClass === 'pulse' && <i className={styles.pulseDot} />}
                </div>
              </article>
            ))}
          </section>

          <section className={styles.modelAvailabilityCard}>
            <div className={styles.modelAvailabilityHead}>
              <h2>Model Selection Availability</h2>
              <p>Current demo-safe model status used by pipeline runs.</p>
            </div>
            <div className={styles.modelAvailabilityList}>
              {modelOptions.map((model) => (
                <div key={model.key} className={styles.modelAvailabilityItem}>
                  <div>
                    <strong>{model.label}</strong>
                    <p>{model.note}</p>
                  </div>
                  <span
                    className={`${styles.modelAvailabilityBadge} ${model.tone === 'experimental' ? styles.badgeExperimental : styles.badgeReady}`}
                  >
                    {model.tone === 'experimental' ? 'Experimental' : 'Ready'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.middleGrid}>
            <article className={styles.tableCard}>
              <div className={styles.tableHead}>
                <h2>Model Comparison</h2>
                <button type="button">
                  View Detailed Report
                  <span className={`${styles.icon} material-symbols-outlined`}>arrow_forward</span>
                </button>
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>SKU / Category</th>
                      <th>Model Name</th>
                      <th className={styles.alignRight}>MAPE (%)</th>
                      <th className={styles.alignRight}>RMSE</th>
                      <th className={styles.alignRight}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((row) => (
                      <tr
                        key={row.sku}
                        onClick={() => setSelectedContext({ sku_id: row.sku, model_name: row.model })}
                      >
                        <td>
                          <div className={styles.skuMain}>{row.sku}</div>
                          <div className={styles.skuSub}>{row.category}</div>
                        </td>
                        <td>{row.model}</td>
                        <td className={styles.alignRight}>{row.mape}</td>
                        <td className={styles.alignRight}>{row.rmse}</td>
                        <td className={styles.alignRight}>
                          <span className={`${styles.statusBadge} ${styles[`status${row.status.toLowerCase()}`]}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className={styles.rightPanel}>
              <article className={styles.insightsCard}>
                <div className={styles.insightsHead}>
                  <span className={`${styles.icon} material-symbols-outlined`}>auto_awesome</span>
                  <h2>AI Selection Insights</h2>
                </div>
                <div className={styles.insightsList}>
                  {insights.map((item) => (
                    <div key={item.title} className={styles.insightItem}>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.healthCard}>
                <h4>System Health</h4>
                <div className={styles.healthRow}>
                  <div className={styles.healthTrack}>
                    <div className={styles.healthProgress} />
                  </div>
                  <span>88%</span>
                </div>
                <p>Computing 1.2M nodes per second.</p>
              </article>
            </div>
          </section>

          <section className={styles.chartCard}>
            <div className={styles.chartHead}>
              <div>
                <h2>Forecast Preview</h2>
                <p>SKU-20941: Historical vs. Predicted Demand (6 Month Horizon)</p>
              </div>
              <div className={styles.chartLegend}>
                <span><i className={styles.actualDot} />Actual</span>
                <span><i className={styles.forecastDot} />Forecast</span>
              </div>
            </div>

            <div className={styles.chartArea}>
              <svg viewBox="0 0 1000 300" preserveAspectRatio="none">
                <line x1="0" y1="50" x2="1000" y2="50" stroke="#f3f4f5" strokeWidth="1" />
                <line x1="0" y1="125" x2="1000" y2="125" stroke="#f3f4f5" strokeWidth="1" />
                <line x1="0" y1="200" x2="1000" y2="200" stroke="#f3f4f5" strokeWidth="1" />

                <path d="M 500 210 L 600 180 L 700 220 L 800 190 L 900 240 L 1000 210 L 1000 150 L 900 180 L 800 140 L 700 160 L 600 130 L 500 170 Z" fill="rgba(10, 46, 255, 0.05)" />
                <path d="M 0 250 L 100 230 L 200 260 L 300 220 L 400 240 L 500 190" fill="none" stroke="#c5c5da" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                <path d="M 500 190 L 600 155 L 700 190 L 800 165 L 900 210 L 1000 180" fill="none" stroke="#0a2eff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                <circle cx="500" cy="190" r="5" fill="#0a2eff" />
                <circle cx="500" cy="190" r="10" fill="rgba(10, 46, 255, 0.1)" />
              </svg>

              <div className={styles.chartLabels}>
                <span>Oct 23</span>
                <span>Nov 23</span>
                <span>Dec 23</span>
                <span>Jan 24</span>
                <span>Feb 24</span>
                <span className={styles.forecastLabel}>Mar 24 (Proj)</span>
                <span className={styles.forecastLabel}>Apr 24 (Proj)</span>
              </div>
            </div>
          </section>

          <CopilotPanel
            route="/forecasts"
            filters={{ view: 'models' }}
            runId={runSummary?.job_id || null}
            selectedContext={selectedContext}
            visibleContext={{
              page: 'forecasts',
              visible_model_rows: models.length,
            }}
          />
        </section>
      </main>
    </div>
  )
}

export default Forecasts
