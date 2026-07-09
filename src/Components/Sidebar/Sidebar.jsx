import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'
import uploadSidebarIcon from '../../assets/UploadSidebarIcon.svg'
import alertsIcon from '../../assets/Alertsicon.svg'
import aiIcon from '../../assets/Aiicon.svg'
import demandPilotIcon from '../../assets/DemandPiloticon.svg'

const AUTH_KEY = 'demandpilot-authenticated'

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { label: 'Inventory', icon: 'inventory_2', path: '/inventory' },
  { label: 'Uploads', imageIcon: uploadSidebarIcon, path: '/uploads' },
  { label: 'Forecasts', icon: 'trending_up', path: '/forecasts' },
  { label: 'Alerts', imageIcon: alertsIcon, path: '/alerts' },
  { label: 'Supply Chain', icon: 'local_shipping', path: '/supply-chain' },
  { label: 'DemandPilot', imageIcon: aiIcon, path: '/demand-pilot' },
]

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth > 960 : true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 960px)')

    const updateDeviceMode = () => {
      setIsDesktop(!mediaQuery.matches)
      if (mediaQuery.matches) {
        setIsHovered(false)
      }
    }

    updateDeviceMode()
    mediaQuery.addEventListener('change', updateDeviceMode)

    return () => {
      mediaQuery.removeEventListener('change', updateDeviceMode)
    }
  }, [])

  const isCollapsed = isDesktop && !isHovered

  const sidebarClassName = [
    styles.sidebar,
    isOpen ? styles.open : '',
    isCollapsed ? styles.collapsed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {isOpen && <button aria-label="Close sidebar" className={styles.backdrop} onClick={onClose} type="button" />}

      <aside className={sidebarClassName} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        <div>
          <div className={styles.sidebarHeader}>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>
                <img alt="" aria-hidden="true" className={styles.brandImage} src={demandPilotIcon} />
              </div>
              <div className={styles.brandText}>
                <h2 className={styles.brandTitle}>DemandPilot</h2>
              </div>
            </div>
          </div>

          <nav className={styles.menu}>
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                onClick={onClose}
                to={item.path}
              >
                {item.imageIcon ? (
                  <img alt="" aria-hidden="true" className={styles.iconImage} src={item.imageIcon} />
                ) : (
                  <span className={`${styles.icon} material-symbols-outlined`}>{item.icon}</span>
                )}
                <span className={styles.menuLabel}>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <NavLink
            className={({ isActive }) => `${styles.settingsButton} ${isActive ? styles.settingsButtonActive : ''}`}
            onClick={onClose}
            to="/settings"
          >
            <span aria-hidden="true" className={styles.profileAvatar}>A</span>
            <span className={styles.settingsLabel}>Profile</span>
          </NavLink>

          <button
            className={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem(AUTH_KEY)
              sessionStorage.removeItem(AUTH_KEY)
              onClose()
              navigate('/', { replace: true })
            }}
            type="button"
          >
            <span className={`${styles.icon} material-symbols-outlined`}>logout</span>
            <span className={styles.logoutLabel}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
