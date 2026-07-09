import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import RunProvenance from './RunProvenance'
import CopilotPanel from './CopilotPanel'
import styles from './RecommendationPanel.module.css'

const API_BASE_URL = 'http://localhost:4000/api'

const summaryCards = [
  {
    label: 'Total Risk Exposure',
    value: '₹18.4L',
    note: '12% increase from last week',
    tone: 'critical',
    icon: 'trending_down',
  },
  {
    label: 'Pending Actions',
    value: '04',
    note: 'Critical within 48h',
    tone: 'warning',
    icon: 'pending_actions',
  },
  {
    label: 'System Health',
    value: '98.4%',
    note: 'Predictive accuracy within 30 days',
    tone: 'good',
    icon: 'monitor_heart',
  },
]

function RecommendationPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [runSummary, setRunSummary] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [selectedContext, setSelectedContext] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        setError(null)

        const kpisRes = await fetch(`${API_BASE_URL}/dashboard/kpis`)
        const kpisData = await kpisRes.json()

        if (!kpisData?.run_job_id) {
          setRunSummary(null)
          setRecommendations([])
          return
        }

        setRunSummary({
          job_id: kpisData.run_job_id,
          status: 'COMPLETED',
          data_source: kpisData.data_source || 'postgres',
          last_pipeline_at: kpisData.last_pipeline_at || null,
          requested_model: kpisData.requested_model || null,
          forecast_model: kpisData.forecast_model || null,
          fallback_used: Boolean(kpisData.fallback_used),
          fallback_reason: kpisData.fallback_reason || null,
        })

        const runParam = `runId=${encodeURIComponent(kpisData.run_job_id)}`
        const res = await fetch(`${API_BASE_URL}/dashboard/recommendations?limit=10&${runParam}`)
        const data = await res.json()
        setRecommendations(data.items || [])
      } catch (err) {
        console.error('Error fetching recommendations:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])

  useEffect(() => {
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ]

    const createdLinks = fontLinks.map((href) => {
      const existing = document.querySelector(`link[href="${href}"]`)
      if (existing) return null

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
      return link
    })

    return () => {
      createdLinks.forEach((link) => {
        if (link?.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [])

  return (
    <div className={styles.page}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button aria-label="Open sidebar" className={styles.menuToggle} onClick={() => setSidebarOpen(true)} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>menu</span>
            </button>

            <div className={styles.searchBox}>
              <span className={`${styles.icon} material-symbols-outlined`}>search</span>
              <input placeholder="Search architecture..." type="text" />
            </div>

            <nav className={styles.topLinks}>
              <a href="#">Dashboard</a>
              <a className={styles.activeLink} href="#">Inventory</a>
              <a href="#">Forecast</a>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>notifications</span>
            </button>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>help_outline</span>
            </button>
            <button className={styles.primaryButton} type="button">Create Reorder</button>
            <img
              alt="User profile"
              className={styles.avatar}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHscGLcjcmFW_-2CHoeQhuex7FjukKXtWx4lZk-5LiO6zCVsutFIk7RpRjEdwcvGU1382TqOboBs0l_-omQuB6qXjPrGaunhuHMxtenAB6aHDvDUqSYL7a9Fxq_dbxWcsIeJi_w_sSnF2EcvB08MGy-mSimrne-LSfLcD8K1TmuHqF9eVwJHTnzP6HYCUPqhz0t8zwxPY8bgOR-sJlH8D2pA3oRVG_LV3syeN4833TPICng72kR_voBL_abGkZ2w3wBBMzGghJkeM"
            />
          </div>
        </header>

        <section className={styles.content}>
          <div className={styles.hero}>
            <div>
              <p className={styles.kicker}>Operational Intelligence</p>
              <h1>AI Reorder Recommendations</h1>
              <p className={styles.heroCopy}>Top prioritized actions to optimize stock and prevent revenue loss across your retail ecosystem.</p>
              <RunProvenance runSummary={runSummary} />
            </div>
          </div>

          <section className={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <article key={card.label} className={`${styles.summaryCard} ${styles[`summary${card.tone}`]}`}>
                <div className={styles.summaryHeader}>
                  <span className={styles.summaryLabel}>{card.label}</span>
                  <span className={`${styles.icon} material-symbols-outlined`}>{card.icon}</span>
                </div>
                <div className={styles.summaryValue}>{card.value}</div>
                <p>{card.note}</p>
              </article>
            ))}
          </section>

          <section className={styles.recommendationList}>
            {loading ? (
              <p>Loading recommendations...</p>
            ) : error ? (
              <p className={styles.error}>Error: {error}</p>
            ) : recommendations.length === 0 ? (
              <p>No recommendations at this time.</p>
            ) : (
              recommendations.map((item, index) => (
                <article
                  key={`${item.run_job_id}-${item.sku_id}`}
                  className={`${styles.recommendationCard} ${index === recommendations.length - 1 ? styles.recommendationMuted : ''}`}
                  onClick={() => setSelectedContext({ store_id: item.store_id, sku_id: item.sku_id, urgency: item.urgency })}
                >
                  <div className={styles.recommendationIdentity}>
                    <div className={styles.recommendationCodes}>
                      <span className={styles.sku}>{item.sku_id}</span>
                      <span className={`${styles.riskBadge} ${item.urgency === 'HIGH' ? styles.riskcritical : styles.riskwarning}`}>
                        {item.urgency} Priority
                      </span>
                    </div>
                    <p>{item.store_name}</p>
                  </div>

                  <div className={styles.recommendationMain}>
                    <h2>
                      Order <span>{item.suggested_order_qty} units</span>
                    </h2>
                    <div className={styles.detailRow}>
                      <span className={`${styles.icon} material-symbols-outlined`}>info</span>
                      <p>{item.reason_text}</p>
                    </div>
                  </div>

                  <div className={styles.recommendationMeta}>
                    <div>
                      <span>Status</span>
                      <strong>{item.status}</strong>
                    </div>
                    <div>
                      <span>Created</span>
                      <strong className={styles.dueIn}>{new Date(item.created_at).toLocaleDateString()}</strong>
                    </div>
                    <button className={styles.chevronButton} type="button" aria-label={`Open recommendation for ${item.sku_id}`}>
                      <span className={`${styles.icon} material-symbols-outlined`}>chevron_right</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>

          <div className={styles.footerAction}>
            <button className={styles.loadMoreButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>keyboard_double_arrow_down</span>
              Load More Recommendations
            </button>
          </div>
        </section>

        <CopilotPanel
          route="/inventory/recommendations"
          filters={{ urgency: 'all', status: 'open' }}
          runId={runSummary?.job_id || null}
          selectedContext={selectedContext}
          visibleContext={{
            page: 'recommendations',
            visible_recommendation_count: recommendations.length,
          }}
        />
      </main>
    </div>
  )
}

export default RecommendationPanel