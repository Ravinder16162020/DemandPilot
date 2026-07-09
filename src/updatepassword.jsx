import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './updatepassword.module.css'

function UpdatePassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fontLinks = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
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

  const handleSubmit = (event) => {
    event.preventDefault()

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <svg className={styles.waveLayer} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="update-wave" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0a2eff" stopOpacity="0" />
              <stop offset="50%" stopColor="#0a2eff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-100 230 C 180 120 420 130 680 250 S 1180 370 1700 220" fill="none" stroke="url(#update-wave)" strokeWidth="2" />
          <path d="M-150 610 C 250 500 420 740 790 620 S 1230 500 1750 640" fill="none" stroke="url(#update-wave)" strokeWidth="2" />
        </svg>
      </div>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h1>Set New Password</h1>
            <p>Create a secure password for your account</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>New Password</span>
              <div className={styles.inputWrap}>
                <input
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                />
                <button
                  aria-label="Toggle password visibility"
                  className={styles.toggleButton}
                  onClick={() => setShowNewPassword((value) => !value)}
                  type="button"
                >
                  <span className={`${styles.icon} material-symbols-outlined`}>{showNewPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>

            <label className={styles.field}>
              <span>Confirm Password</span>
              <div className={styles.inputWrap}>
                <input
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                />
                <button
                  aria-label="Toggle confirm password visibility"
                  className={styles.toggleButton}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  type="button"
                >
                  <span className={`${styles.icon} material-symbols-outlined`}>{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </label>

            {error && <p className={styles.errorText}>{error}</p>}

            <button className={styles.primaryButton} type="submit">Update Password</button>
          </form>

          <div className={styles.returnRow}>
            <Link to="/">
              <span className={`${styles.icon} material-symbols-outlined`}>arrow_back</span>
              Return to sign in
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default UpdatePassword