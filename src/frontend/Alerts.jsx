import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './Alerts.module.css'

const alerts = [
  {
    id: 1,
    sku: 'SKU-4821',
    location: 'Downtown Retail',
    title: 'Stockout Risk',
    description: '92% stockout risk predicted within 48 hours. Demand spike in regional cluster detected.',
    severity: 'critical',
    icon: 'error',
    timestamp: '2 hrs ago',
    borderColor: '#ba1a1a',
    bgColor: '#ffdad6',
    iconColor: '#ba1a1a',
    statusBg: '#ffdad6',
    statusColor: '#93000a',
  },
  {
    id: 2,
    sku: 'SKU-9920',
    location: 'Northside Plaza',
    title: 'Demand Spike',
    description: 'Unexpected sales growth (15% WoW) may lead to low stock levels by next Tuesday.',
    severity: 'warning',
    icon: 'warning',
    timestamp: '5 hrs ago',
    borderColor: '#f59e0b',
    bgColor: '#fef3c7',
    iconColor: '#d97706',
    statusBg: '#fde68a',
    statusColor: '#92400e',
  },
  {
    id: 3,
    sku: 'SKU-3112',
    location: 'Eastside Logistics',
    title: 'Overstock Warning',
    description: 'Current supply exceeds demand forecast by 40%. Recommend markdown or transfer.',
    severity: 'normal',
    icon: 'inventory',
    timestamp: '8 hrs ago',
    borderColor: '#4edea3',
    bgColor: '#d1fae5',
    iconColor: '#006343',
    statusBg: '#bbf7d0',
    statusColor: '#065f46',
  },
  {
    id: 4,
    sku: 'SKU-1025',
    location: 'Central Hub',
    title: 'Supplier Delay',
    description: 'Shipment #2940 delayed by 5 days. Affecting 4 dependent store orders.',
    severity: 'critical',
    icon: 'sync_problem',
    timestamp: '12 hrs ago',
    borderColor: '#ba1a1a',
    bgColor: '#ffdad6',
    iconColor: '#ba1a1a',
    statusBg: '#ffdad6',
    statusColor: '#93000a',
  },
]

const filters = ['all', 'critical', 'warning', 'normal']

function Alerts() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')

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

  const visibleAlerts = useMemo(() => {
    if (selectedFilter === 'all') return alerts
    return alerts.filter((alert) => alert.severity === selectedFilter)
  }, [selectedFilter])

  return (
    <div className={styles.page}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button aria-label="Open sidebar" className={styles.menuToggle} onClick={() => setSidebarOpen(true)} type="button">
            <span className={`${styles.icon} material-symbols-outlined`}>menu</span>
          </button>
          <span className={styles.brand}>Architect Inventory</span>
          <nav className={styles.topLinks}>
            <a href="#">Dashboard</a>
            <a href="#">Analytics</a>
            <a href="#">Reports</a>
          </nav>
        </div>

        <div className={styles.topbarRight}>
          <label className={styles.searchBox}>
            <span className={`${styles.icon} material-symbols-outlined`}>search</span>
            <input placeholder="Search SKU or Store..." type="text" />
          </label>
          <button className={styles.iconButton} type="button" aria-label="Notifications">
            <span className={`${styles.icon} material-symbols-outlined`}>notifications</span>
          </button>
          <button className={styles.iconButton} type="button" aria-label="Settings">
            <span className={`${styles.icon} material-symbols-outlined`}>settings</span>
          </button>
          <img
            alt="User profile"
            className={styles.avatar}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9XGcKPyO5xSphvWWxJGKPtFW8RIybNYwjHf7cuaSV0oAv3gFDR68lKqtY1H8EsxlgJoWNRO5o15ltiTf2W_8VHV2Av_WGuMIPMHOD_DPAWpWEUVogCl950J7fZiIyYby-V7Vul1MV2bBf4R_LJIsX-icfzNirimgfA3S4Ai77CKYgdngajY6Q-V4Nv3g_h9wuFlStCtMCdZcmEX2hLmuM46yNGJVZ9fDwwvKDbkZJt6G_6eDfD1zudmky33wOviZ8wUwHSJryD2E"
          />
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.leftSection}>
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.kicker}>Monitoring System</span>
              <h1>Alert Center</h1>
            </div>
            <div className={styles.updatedAt}>
              <span className={`${styles.icon} material-symbols-outlined`}>update</span>
              <span>Last updated: Just now</span>
            </div>
          </div>

          <div className={styles.filterBar}>
            <div className={styles.filterPills}>
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterButton} ${selectedFilter === filter ? styles.filterButtonActive : ''}`}
                  onClick={() => setSelectedFilter(filter)}
                  type="button"
                >
                  {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.filterSelects}>
              <button className={styles.selectChip} type="button">
                <span>Store: All Stores</span>
                <span className={`${styles.icon} material-symbols-outlined`}>expand_more</span>
              </button>
              <button className={styles.selectChip} type="button">
                <span>Category: Electronics</span>
                <span className={`${styles.icon} material-symbols-outlined`}>expand_more</span>
              </button>
            </div>
          </div>

          <div className={styles.alertList}>
            {visibleAlerts.map((alert) => (
              <article
                key={alert.id}
                className={styles.alertCard}
                style={{ borderLeftColor: alert.borderColor }}
              >
                <div className={styles.alertMeta}>
                  <div className={styles.alertIcon} style={{ backgroundColor: alert.bgColor, color: alert.iconColor }}>
                    <span className={`${styles.icon} material-symbols-outlined`}>{alert.icon}</span>
                  </div>

                  <div className={styles.alertBody}>
                    <div className={styles.skuRow}>
                      <span className={styles.sku}>{alert.sku}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.location}>{alert.location}</span>
                    </div>
                    <h3>{alert.title}</h3>
                    <p>{alert.description}</p>
                    <div className={styles.statusRow}>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: alert.statusBg, color: alert.statusColor }}
                      >
                        {alert.severity === 'normal' ? 'Normal' : alert.severity === 'warning' ? 'Warning' : 'Critical'}
                      </span>
                      <span className={styles.timeStamp}>
                        <span className={`${styles.icon} material-symbols-outlined`}>schedule</span>
                        <span>{alert.timestamp}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button className={styles.actionButton} type="button">Action</button>
              </article>
            ))}
          </div>
        </section>

        <aside className={styles.rightSection}>
          <div className={styles.summaryCard}>
            <h3>Alert Summary</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.statCard}>
                <div>
                  <p>Total Active</p>
                  <strong>24</strong>
                </div>
                <div className={styles.statIconPrimary}>
                  <span className={`${styles.icon} material-symbols-outlined`}>notifications_active</span>
                </div>
              </div>

              <div className={styles.statCardCritical}>
                <div>
                  <p>Critical</p>
                  <strong>5</strong>
                </div>
                <div className={styles.statIconCritical}>
                  <span className={`${styles.icon} material-symbols-outlined`}>priority_high</span>
                </div>
              </div>

              <div className={styles.statCardWarning}>
                <div>
                  <p>Warning</p>
                  <strong>12</strong>
                </div>
                <div className={styles.statIconWarning}>
                  <span className={`${styles.icon} material-symbols-outlined`}>report_problem</span>
                </div>
              </div>
            </div>

            <div className={styles.resolutionBlock}>
              <div className={styles.resolutionRow}>
                <p>Resolution Rate</p>
                <span>84%</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} />
              </div>
              <p className={styles.resolutionNote}>18 of 24 alerts resolved in last 24h</p>
            </div>
          </div>

          <div className={styles.insightCard}>
            <div className={styles.chartWrap}>
              <div className={styles.chartGlow} />
              <img
                alt="Analytics chart"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCc7bR0iiySCHSYuJXQyJj936R12tJnuKCWoAbaFw6WzYVMJWUg2JEfi290TF0uwp7Hr2mYFj-tiu647yqJ_atD4XF_f6GlUca2u9wDGNEuzo_aQaUPFnVgCfRQ4DK2aUrtI4N_jcue4MyGxn5QzSvSMqyXqJ5Cw36mUOr0wjWHvFscI3wCklvaFX2GidpejPvvTycGeo4FJnxybkqZzI_shE-wqMEXZ8PNy8cJtDPQ_Lo8puVnqlJ_DtxPIind9-MfKGKth08abyo"
              />
            </div>
            <h4>AI Insights Optimized</h4>
            <p>Your current inventory precision is within 98% of target KPIs.</p>
            <button type="button">View System Audit</button>
          </div>
        </aside>
      </main>
    </div>
  )
}

export default Alerts
