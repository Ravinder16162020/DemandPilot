import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './Supplychain.module.css'

function Supplychain() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
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
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className={styles.brand}>DemandPilot</span>
            <nav className={styles.topNav}>
              <a className={styles.topNavActive} href="#hero">Dashboard</a>
              <a href="#global-overview">Intelligence</a>
              <a href="#procurement">Logistics</a>
              <a href="#automation">Procurement</a>
            </nav>
          </div>

          <div className={styles.topbarRight}>
            <button aria-label="Notifications" className={styles.iconButton} type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button aria-label="Settings" className={styles.iconButton} type="button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className={styles.avatarWrap}>
              <img
                alt="User Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdDyHUfy7Zi2oNIaHgeAFtSC0YXtGtPm06JduYaJpYhLS24LeWmBHjOxHQLzsA5elfVVshwBk_2AFv4J2yIPDH_Z3pQkN5c32-O3A0yvKUpaSYxEJD4VBv0zNtDPYxD01qDp4OY_hEzYAgY9gk3Xa_M77Xr6LzRWm_rTiOAXxBnV62iG-eOYiGxt9szXjz9Irg9YoNhtcXUadbFyvv4nyvin1-T8JlpFixNJMGtaJX8x8LP5G44PjRFoKbH493bvAE2IN0RAZXBg4"
              />
            </div>
          </div>
        </header>

        <section className={styles.hero} id="hero">
          <div className={styles.heroPattern} />
          <div className={styles.heroGraphic}>
            <svg viewBox="0 0 800 600" aria-hidden="true">
              <circle cx="100" cy="100" r="3" />
              <circle cx="400" cy="300" r="3" />
              <circle cx="700" cy="500" r="3" />
              <path d="M100 100 L400 300 L700 500" />
            </svg>
          </div>
          <div className={styles.heroContent}>
            <h1>AI-Powered Supply Chain. Zero Blind Spots.</h1>
            <p>From supplier to shelf, monitor, predict, and optimize every link in real time.</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton}>
                View Live Flow <span className="material-symbols-outlined">trending_flat</span>
              </button>
              <button type="button" className={styles.secondaryButton}>Optimize Supply Chain</button>
            </div>
          </div>
        </section>

        <section className={styles.section} id="global-overview">
          <div className={styles.sectionHeader}>
            <div>
              <h2>Global Overview</h2>
              <p>NETWORK NODE STATUS: OPERATIONAL</p>
            </div>
            <div className={styles.metricsRow}>
              <div>
                <span>On-Time Delivery</span>
                <strong>87%</strong>
              </div>
              <div>
                <span>Active Shipments</span>
                <strong>142</strong>
              </div>
              <div>
                <span>Delayed Orders</span>
                <strong>14</strong>
              </div>
              <div>
                <span>Risk Index</span>
                <strong>24/100</strong>
              </div>
            </div>
          </div>

          <div className={styles.overviewGrid}>
            <div className={styles.mapCard}>
              <img
                alt="World Map Network"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVUytXcHqeZWf66sM4guJeqFb0ApQM2_B5QdabyJKpeRylWL0d2A4g1vzsHsQC0eYivAPmpsgSZK70R1T7XkmCdvd_9CP89kg9TjghcD2iJ4lVraefij1jbNtmxB0Xo3jjKZcKOvgaHWl9lhOO4RZjeUwK48D0JNzWsEFaUwFfEpSM_ohj2iZqJAT-2yXMZXZxcZ5oDdnnZDeQFO0S70cwq5IeUAH8I8QEBsFtiQcddWIDhrOc07yORKzwBAzyizx9KqnqE_pKLqM"
              />
              <div className={styles.mapMarker} style={{ top: '30%', left: '24%' }}>
                <span className={styles.ping} />
                <span className={styles.dot} />
                <div className={styles.tooltip}>
                  <strong>Shanghai Hub</strong>
                  <span>Throughput: 12.4k units/h</span>
                  <em>Status: Optimal</em>
                </div>
              </div>
              <div className={styles.mapMarker} style={{ top: '48%', left: '68%' }}>
                <span className={styles.pulse} />
                <span className={styles.dotDanger} />
                <div className={styles.tooltip}>
                  <strong>Rotterdam Terminal</strong>
                  <span>Congestion: +42%</span>
                  <em>Status: Delayed</em>
                </div>
              </div>
            </div>

            <div className={styles.riskCard}>
              <h3>Risk Heatmap</h3>
              <div className={styles.heatmap}>
                <span className={styles.heatLow} />
                <span className={styles.heatMidLow} />
                <span className={styles.heatMid} />
                <span className={styles.heatHigh} />
                <span className={styles.heatCritical} />
                <span className={styles.heatLowDim} />
                <span className={styles.heatLowMidDim} />
                <span className={styles.heatLow} />
                <span className={styles.heatLowDim} />
                <span className={styles.heatMidLowDim} />
              </div>
              <h4>Active AI Alerts</h4>
              <div className={styles.alertStack}>
                <div className={styles.alertDanger}>
                  <p>Supplier delay risk increased by 42%</p>
                  <div>
                    <span>CONFIDENCE: 94%</span>
                    <button type="button">Mitigate</button>
                  </div>
                </div>
                <div className={styles.alertWarning}>
                  <p>Fuel cost variance in Route B7</p>
                  <div>
                    <span>CONFIDENCE: 82%</span>
                    <button type="button">View Data</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionMuted} id="procurement">
          <div className={styles.sectionInner}>
            <div className={styles.sectionTitleBlock}>
              <h2>Procurement Intelligence</h2>
              <p>AI-driven supplier optimization and cost reduction</p>
            </div>

            <div className={styles.procurementGrid}>
              <div className={styles.tableCard}>
                <div className={styles.tableCardHeader}>
                  <h3>Active Comparison</h3>
                  <span>LIVE BENCHMARK</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Avg. Lead Time</th>
                      <th>Reliability</th>
                      <th>Cost/Unit</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Loomis Logistics</td>
                      <td>4.2d</td>
                      <td><span className={styles.good}>98.2%</span></td>
                      <td>$12.40</td>
                      <td><button type="button">Select</button></td>
                    </tr>
                    <tr>
                      <td>Global Nexus Corp</td>
                      <td>9.4d</td>
                      <td><span className={styles.warn}>84.5%</span></td>
                      <td>$10.15</td>
                      <td><button type="button">Select</button></td>
                    </tr>
                    <tr>
                      <td>Apex Materials</td>
                      <td>5.1d</td>
                      <td><span className={styles.good}>95.0%</span></td>
                      <td>$11.80</td>
                      <td><button type="button">Select</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.insightsCol}>
                <div className={styles.strategyCard}>
                  <div className={styles.strategyHeader}>
                    <span className="material-symbols-outlined">psychology</span>
                    <div>
                      <h4>Strategic Shift Recommendation</h4>
                      <p>Shift 20% volume to Supplier B to reduce delays by 18% based on current freight congestion patterns.</p>
                    </div>
                  </div>
                  <button type="button">Execute Strategy</button>
                </div>

                <div className={styles.inventoryCard}>
                  <h4>Inventory Health</h4>
                  <div className={styles.inventoryRow}>
                    <span>Safety Stock Levels</span>
                    <strong>Stable</strong>
                  </div>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressBar} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.logisticsGrid}>
            <div>
              <h2>Logistics Hub</h2>
              <div className={styles.shipmentStack}>
                <div className={styles.shipmentCard}>
                  <div className={styles.shipmentIconBlue}>
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div className={styles.shipmentBody}>
                    <div className={styles.shipmentRow}>
                      <span>Shipment #DP-1024</span>
                      <strong>ETA: 14:00 Today</strong>
                    </div>
                    <div className={styles.shipmentTrack}>
                      <div className={styles.shipmentFill} />
                      <span className={styles.shipmentDot} />
                    </div>
                  </div>
                </div>

                <div className={styles.shipmentCardMuted}>
                  <div className={styles.shipmentIconMuted}>
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div className={styles.shipmentBody}>
                    <div className={styles.shipmentRow}>
                      <span>Shipment #DP-1025</span>
                      <strong>ETA: Tomorrow</strong>
                    </div>
                    <div className={styles.shipmentTrackMuted}>
                      <div className={styles.shipmentFillMuted} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2>Warehouse Efficiency</h2>
              <div className={styles.warehouseGrid}>
                <div className={styles.warehouseStatCard}>
                  <p>Utilization</p>
                  <strong>78%</strong>
                  <span>+2% from last week</span>
                </div>
                <div className={styles.warehouseStatCard}>
                  <p>Picking Perf.</p>
                  <strong>94.2</strong>
                  <span>Target reached</span>
                </div>
                <div className={styles.warehouseHeatmapCard}>
                  <img
                    alt="Warehouse Heatmap"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR3q_3GVcx5VGZ0vsMqTaBasnesPvSDOnwiUWg3DjoS4wtOWE6Rg_RyznNU_tVWwajGT7ACz56QwC1lVxc2luswDBmO_fz0DP3Ugq63s6grrAskzGbLf5PXOSO8lJmhb_RQo0d1uv7dQ743FqZOc_ICxWuDVtFTNutBJpB94LqR7lKgv6JHHrlvn-0fwm0llkNWXJt0NW62plDtKJ6Ygv5pOLLUyhLi-52G2cQ1_uHK7L1ahBcmpjPSD7qLO3djutbFSz-88kW_U4"
                  />
                  <div className={styles.flowBadge}>Flow Analysis</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionMuted} id="automation">
          <div className={styles.automationCard}>
            <div className={styles.tabs}>
              <button type="button" className={styles.tabActive}>Automation Triggers</button>
              <button type="button">Smart Routing</button>
              <button type="button">Lead Time Trends</button>
            </div>

            <div className={styles.automationGrid}>
              <div>
                <h4>Auto-Reorder Protocols</h4>
                <div className={styles.toggleList}>
                  <div className={styles.toggleRow}>
                    <div>
                      <p>Critical Threshold Reorder</p>
                      <span>Trigger when SKU drops below 15% safety stock</span>
                    </div>
                    <div className={styles.toggleOn}><span /></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <div>
                      <p>Predictive Pre-Ordering</p>
                      <span>Order based on 30-day forecast demand spikes</span>
                    </div>
                    <div className={styles.toggleOff}><span /></div>
                  </div>
                </div>
              </div>

              <div className={styles.savingsCard}>
                <div className={styles.savingsHeader}>
                  <h4>Cost Savings Over Time</h4>
                  <span>TOTAL: $1.2M SAVED</span>
                </div>
                <div className={styles.barChart}>
                  <span className={styles.bar1} />
                  <span className={styles.bar2} />
                  <span className={styles.bar3} />
                  <span className={styles.bar4} />
                  <span className={styles.bar5} />
                  <span className={styles.bar6} />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

export default Supplychain
