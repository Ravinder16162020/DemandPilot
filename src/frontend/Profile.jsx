import { useEffect, useState } from 'react'
import Sidebar from '../Components/Sidebar/Sidebar'
import styles from './Profile.module.css'

function Profile() {
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
        <div className={styles.bgLayer} aria-hidden="true">
          <div className={styles.gridPattern} />
          <svg className={styles.waveLayer} viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100,500 Q200,450 500,500 T1100,500" fill="none" stroke="#0A2EFF" strokeDasharray="4 8" strokeWidth="1" />
            <path d="M-100,300 Q250,350 500,300 T1100,300" fill="none" stroke="#0070EA" strokeDasharray="4 8" strokeWidth="1" />
          </svg>
        </div>

        <header className={styles.topbar}>
          <div>
            <span className={styles.kicker}>Account Management</span>
            <h1>Profile Settings</h1>
          </div>

          <div className={styles.topActions}>
            <button aria-label="Notifications" className={styles.iconButton} type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button aria-label="Help" className={styles.iconButton} type="button">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
          </div>
        </header>

        <section className={styles.contentWrap}>
          <div className={styles.grid}>
            <aside className={styles.profileColumn}>
              <article className={styles.profileCard}>
                <div className={styles.profileAccent} />
                <div className={styles.profileHead}>
                  <div className={styles.avatarWrap}>
                    <img
                      alt="Profile"
                      className={styles.avatar}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqDxJrGeZ89VoGlSYx-BfqOXyuAZw98a7R5RJsBH6KkZnIHx19zmBGYjt-ujMJJ9tlTMcLlBk-zbJVHc1BCFSfH3sQ6zMy7lJjr2IfK5hfh_T19DOlG1aNEe1_Y91FcKz8EpNxECH2RMymipWtkEzjkboH6dBLTF3K4IThuVMxX-HziA_Xj70S6GeCCyYntkxj2CQ-xLAauaH_UhhW5mEr898EAIXsxlOcAVHVvO2Iabvvct3PkA3tXN_GKaKbyf9axXPpXZCMfi0"
                    />
                    <button className={styles.cameraButton} type="button">
                      <span className="material-symbols-outlined">photo_camera</span>
                    </button>
                  </div>

                  <h2>Alex Chen</h2>
                  <p className={styles.email}>alex.chen@demandpilot.ai</p>

                  <div className={styles.roleBadge}>
                    <span className="material-symbols-outlined">verified</span>
                    Inventory Manager
                  </div>
                </div>

                <div className={styles.profileMeta}>
                  <div>
                    <span>Last Login</span>
                    <strong>2 hours ago</strong>
                  </div>
                  <div>
                    <span>Region</span>
                    <strong>Global Operations</strong>
                  </div>
                </div>
              </article>
            </aside>

            <div className={styles.formColumn}>
              <article className={styles.sectionCard}>
                <div className={styles.sectionHead}>
                  <h3>Account Information</h3>
                  <p>Update your personal details and professional identity within the platform.</p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>Full Name</span>
                    <input defaultValue="Alex Chen" type="text" />
                  </label>
                  <label className={styles.field}>
                    <span>Email Address</span>
                    <input defaultValue="alex.chen@demandpilot.ai" type="email" />
                  </label>
                  <label className={styles.field}>
                    <span>Phone Number</span>
                    <input defaultValue="+1 (555) 0123-4567" type="tel" />
                  </label>
                  <label className={styles.field}>
                    <span>Company Name</span>
                    <input defaultValue="DemandPilot Global" type="text" />
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>
                    <span>Role</span>
                    <select defaultValue="Inventory Manager">
                      <option>Inventory Manager</option>
                      <option>Supply Chain Analyst</option>
                      <option>Operations Director</option>
                      <option>Administrator</option>
                    </select>
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button className={styles.primaryButton} type="button">Save Changes</button>
                  <button className={styles.secondaryButton} type="button">Cancel</button>
                </div>
              </article>

              <article className={styles.sectionCard}>
                <div className={styles.securityRow}>
                  <div>
                    <h3>Account Security</h3>
                    <p>Ensure your account remains secure by updating credentials regularly.</p>
                  </div>
                  <button className={styles.primarySolidButton} type="button">
                    <span className="material-symbols-outlined">lock_reset</span>
                    Change Password
                  </button>
                </div>
              </article>

              <article className={styles.dangerCard}>
                <div className={styles.dangerRow}>
                  <div>
                    <h3>Danger Zone</h3>
                    <p>Permanently delete your account and all associated data. This action is irreversible.</p>
                  </div>
                  <button className={styles.dangerButton} type="button">Delete Account</button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Profile