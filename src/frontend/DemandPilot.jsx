import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './DemandPilot.module.css'

function DemandPilot() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

            <span className={styles.brand}>Copilot Intelligence</span>

            <div className={styles.searchBox}>
              <span className={`${styles.icon} material-symbols-outlined`}>search</span>
              <input placeholder="Search system..." type="text" />
            </div>
          </div>

          <div className={styles.topbarRight}>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>notifications</span>
            </button>
            <button className={styles.iconButton} type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>help_outline</span>
            </button>
            <div className={styles.profileWrap}>
              <div className={styles.profileText}>
                <p className={styles.profileName}>Alex Morgan</p>
                <p className={styles.profileRole}>Supply Lead</p>
              </div>
              <img
                alt="User Profile"
                className={styles.avatar}
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4BKfNuL_FEWYXrVDn81qYBPpzUcuhBz1piaUAplFIBqYQ_j8AHbBIHfC4ZHuoNMLM5eij6E-FCr-uG9jbq1lFDgFEQgchaw5I-FWcyurChjMnIPvfJRmSmTu0yfbt6mPuRCDHckzZjFBdVoSX_u8GaNSrpaWlPZayf1zHRuaJtmgcHE9MCK7C0pY-i6MB-q3oD85wJ6Lp6lChLlBnecXSJXKwLB_fLelk6fnOmaumIFBTaEv36P9Fo4WHC-0nwezSjPqIS3bixkI"
              />
            </div>
          </div>
        </header>

        <section className={styles.chatHeader}>
          <div className={styles.kicker}>Intelligence Assistant</div>
          <h1>AI Copilot</h1>
          <p>Ask anything about your inventory, stock risks, or forecasts.</p>
        </section>

        <section className={styles.chatCanvas}>
          <div className={styles.chatInner}>
            <div className={styles.userBubbleWrap}>
              <div className={styles.userBubble}>
                <p>Analyze my highest stockout risks for the upcoming Spring promotion period.</p>
                <span>10:42 AM</span>
              </div>
            </div>

            <div className={styles.assistantRow}>
              <div className={styles.assistantAvatar}>
                <span className={`${styles.icon} material-symbols-outlined`}>bolt</span>
              </div>

              <div className={styles.responseCard}>
                <div className={styles.responseHeader}>
                  <h2>Demand Analysis Report</h2>
                  <span className={styles.liveBadge}>Real-time</span>
                </div>

                <div className={styles.insightGrid}>
                  <article className={styles.insightCard}>
                    <div className={styles.labelRow}>
                      <span className={`${styles.icon} material-symbols-outlined`}>search</span>
                      <span>Insight</span>
                    </div>
                    <p>SKU-4821 shows high stockout risk</p>
                  </article>

                  <article className={styles.insightCard}>
                    <div className={styles.labelRow}>
                      <span className={`${styles.icon} material-symbols-outlined`}>analytics</span>
                      <span>Reason</span>
                    </div>
                    <p>Demand increased by 2.4x due to promotion</p>
                  </article>

                  <article className={styles.insightCard}>
                    <div className={styles.labelRow}>
                      <span className={`${styles.icon} material-symbols-outlined`}>check_circle</span>
                      <span>Action</span>
                    </div>
                    <p>Order 150 units within 48 hours</p>
                  </article>
                </div>

                <div className={styles.responseActions}>
                  <div className={styles.actionGroup}>
                    <button type="button">
                      <span className={`${styles.icon} material-symbols-outlined`}>shopping_cart_checkout</span>
                      Execute Purchase
                    </button>
                    <button type="button">
                      <span className={`${styles.icon} material-symbols-outlined`}>share</span>
                      Share with Team
                    </button>
                  </div>

                  <div className={styles.feedbackGroup}>
                    <button type="button">
                      <span className={`${styles.icon} material-symbols-outlined`}>thumb_up</span>
                    </button>
                    <button type="button">
                      <span className={`${styles.icon} material-symbols-outlined`}>thumb_down</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.chipRow}>
              <button type="button">
                <span className={`${styles.icon} material-symbols-outlined`}>warning</span>
                Top stockout risks
              </button>
              <button type="button">
                <span className={`${styles.icon} material-symbols-outlined`}>lightbulb</span>
                Show recommendations
              </button>
              <button type="button">
                <span className={`${styles.icon} material-symbols-outlined`}>query_stats</span>
                Forecast by SKU
              </button>
            </div>
          </div>
        </section>

        <div className={styles.inputArea}>
          <div className={styles.inputShell}>
            <button type="button">
              <span className={`${styles.icon} material-symbols-outlined`}>attach_file</span>
            </button>
            <input placeholder="Ask about stock risks, forecasts, or recommendations..." type="text" />
            <div className={styles.inputActions}>
              <button type="button">
                <span className={`${styles.icon} material-symbols-outlined`}>mic</span>
              </button>
              <button className={styles.sendButton} type="button">
                <span className={`${styles.icon} material-symbols-outlined`}>send</span>
              </button>
            </div>
          </div>
          <p>DemandPilot AI can make mistakes. Verify critical supply decisions.</p>
        </div>
      </main>
    </div>
  )
}

export default DemandPilot