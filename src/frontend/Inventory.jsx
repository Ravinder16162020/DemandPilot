import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './Inventory.module.css'

function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const links = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
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

            <div className={styles.searchBox}>
              <span className={`${styles.icon} material-symbols-outlined`}>search</span>
              <input placeholder="Search SKU, Region, or Store..." type="text" />
            </div>

            <div className={styles.topFilters}>
              <button type="button">Region</button>
              <button type="button">Store</button>
              <button type="button">Category</button>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <button aria-label="Tune" className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>tune</span>
            </button>
            <button aria-label="Account" className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>account_circle</span>
            </button>
            <img
              alt="Administrator profile"
              className={styles.avatar}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRatUulAE43Josoth02Av0HhSFMu7bMtF_0KhC3JlIJ4FBUcNFJ42xPBctPk_Q8F7BR2DJg01dkRlJWee0HS7zPab2YQFJS_v3u20z_RHsUB3b24gqIcOIH7MDhyKeDEPG4IiX0mw8_IN8eEmFfW9CyfLSAox6vPxDLpYZ-fjCdAAbCX0mzM-29WGnl7zsu6Ff1_CWeN6CpAj6_rfs_WrzWE8DSatVg844Kdlm99vGgArJN8R6QNoTbGgx14gmMnxUvJpvFLjnlSY"
            />
          </div>
        </header>

        <section className={styles.content}>
          <section className={styles.hero}>
            <div>
              <p className={styles.kicker}>SKU Critical Review</p>
              <h1>HyperX Cloud II - Red</h1>
              <div className={styles.heroMeta}>
                <span className={styles.riskBadge}>
                  <span className={`${styles.icon} material-symbols-outlined`}>warning</span>
                  Critical Risk: Out of stock in 4 days
                </span>
                <span className={styles.productId}>Product ID: HX-CL2-RD-004</span>
              </div>
            </div>

            <div className={styles.heroActions}>
              <button className={styles.secondaryBtn} type="button">Export Analysis</button>
              <button className={styles.primaryBtn} type="button">Sync ERP</button>
            </div>
          </section>

          <section className={styles.grid}>
          <div className={styles.leftCol}>
            <article className={styles.card}>
              <h3>Risk Diagnostic</h3>

              <div className={styles.riskItem}>
                <div className={styles.riskIconPrimary}>
                  <span className={`${styles.icon} material-symbols-outlined`}>local_shipping</span>
                </div>
                <div>
                  <h4>Supply Chain Delay</h4>
                  <p>Primary supplier (Z-Tech) reporting 12-day logistics lag due to port congestion.</p>
                </div>
              </div>

              <div className={styles.riskItem}>
                <div className={styles.riskIconTertiary}>
                  <span className={`${styles.icon} material-symbols-outlined`}>trending_up</span>
                </div>
                <div>
                  <h4>Demand Volatility</h4>
                  <p>24% increase in Regional Category sales following recent gaming tournament sponsorship.</p>
                </div>
              </div>
            </article>

            <article className={styles.card}>
              <h3>Reorder Simulation</h3>

              <div className={styles.sliderBlock}>
                <label htmlFor="multiplier">Safety Stock Multiplier <strong>1.5x</strong></label>
                <input id="multiplier" type="range" />
              </div>

              <div className={styles.sliderBlock}>
                <label htmlFor="lead-time">Lead Time Buffer <strong>7 Days</strong></label>
                <input id="lead-time" type="range" />
              </div>

              <div className={styles.metricList}>
                <p><span>Calculated Reorder</span><strong>450 Units</strong></p>
                <p><span>Projected Cost</span><strong>$22,450.00</strong></p>
              </div>
            </article>
          </div>

          <article className={`${styles.card} ${styles.chartCard}`}>
            <div className={styles.cardHead}>
              <div>
                <h3>Stock Level Projection</h3>
                <p>Simulation: <span>+20% Demand Surge</span></p>
              </div>
              <div className={styles.segmented}>
                <button type="button">Baseline</button>
                <button className={styles.segmentedActive} type="button">Aggressive</button>
              </div>
            </div>

            <div className={styles.chartArea}>
              <svg className={styles.chartSvg} preserveAspectRatio="none" viewBox="0 0 800 320">
                <defs>
                  <linearGradient id="inventory-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0a2eff" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <g stroke="#e5e7eb" strokeWidth="1">
                  <line x1="0" x2="800" y1="64" y2="64" />
                  <line x1="0" x2="800" y1="128" y2="128" />
                  <line x1="0" x2="800" y1="192" y2="192" />
                  <line x1="0" x2="800" y1="256" y2="256" />
                </g>

                <path d="M20 90 C120 110 180 150 260 190 C340 230 430 250 520 270 C590 286 660 294 760 304" fill="none" opacity="0.5" stroke="#6b7280" strokeDasharray="5 6" strokeWidth="2" />
                <path d="M20 70 C120 110 180 180 260 230 C340 282 430 290 520 302 C590 308 660 312 760 314" fill="none" stroke="#0a2eff" strokeWidth="3" />
                <path d="M20 70 C120 110 180 180 260 230 C340 282 430 290 520 302 C590 308 660 312 760 314 L760 320 L20 320 Z" fill="url(#inventory-grad)" />

                <circle cx="260" cy="230" fill="#ba1a1a" r="6" />
                <text fill="#ba1a1a" fontSize="12" fontWeight="700" x="274" y="222">STOCKOUT POINT (DAY 4)</text>
              </svg>
            </div>

            <div className={styles.bottomStats}>
              <div>
                <p>Current Stock</p>
                <h4>112 <span>Units</span></h4>
              </div>
              <div>
                <p>WOS (Current)</p>
                <h4 className={styles.errorValue}>0.6 <span>Weeks</span></h4>
              </div>
              <div>
                <p>WOS (Target)</p>
                <h4>4.0 <span>Weeks</span></h4>
              </div>
            </div>
          </article>

          <div className={styles.rightCol}>
            <article className={styles.card}>
              <h3>Strategic Action</h3>

              <div className={styles.recommendation}>
                <div className={styles.recommendationHead}>
                  <span className={`${styles.icon} material-symbols-outlined`}>auto_awesome</span>
                  <strong>Pilot Recommendation</strong>
                </div>
                <p>Prioritize internal transfer from Store-04 (Chicago) to save $1.2k in freight and bridge the supply gap until Day 14.</p>
              </div>

              <div className={styles.actionButtons}>
                <Link className={styles.actionPrimary} to="/inventory/recommendations">
                  <span>
                    <small>Action 01</small>
                    Approve Reorder
                  </span>
                  <span className={`${styles.icon} material-symbols-outlined`}>arrow_forward</span>
                </Link>

                <button className={styles.actionSecondary} type="button">
                  <span>
                    <small>Action 02</small>
                    Transfer from Store-04
                  </span>
                  <span className={`${styles.icon} material-symbols-outlined`}>move_up</span>
                </button>
              </div>
            </article>

            <article className={styles.impactCard}>
              <div>
                <h3>Financial Impact</h3>
                <div className={styles.impactStats}>
                  <div>
                    <p>Capital Unlocked</p>
                    <h4>$8,240</h4>
                    <small>Via optimized transfer vs. air freight</small>
                  </div>
                  <div>
                    <p>Projected ROI</p>
                    <h4>18.4%</h4>
                    <small>Expected margin preservation</small>
                  </div>
                </div>
              </div>

              <div className={styles.optimizedRow}>
                <i />
                <span>System Optimized</span>
              </div>
            </article>
          </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default Inventory
