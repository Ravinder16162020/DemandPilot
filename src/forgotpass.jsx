import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './forgotpass.module.css'

function ForgotPass() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

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
    navigate('/otp')
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.background} aria-hidden="true">
          <div className={styles.grid} />
          <div className={styles.orbA} />
          <div className={styles.orbB} />
          <svg className={styles.waveLayer} viewBox="0 0 1600 900" preserveAspectRatio="none">
            <defs>
              <linearGradient id="forgot-wave" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#0a2eff" stopOpacity="0" />
                <stop offset="50%" stopColor="#0a2eff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M-100 230 C 180 120 420 130 680 250 S 1180 370 1700 220" fill="none" stroke="url(#forgot-wave)" strokeWidth="2" />
            <path d="M-150 610 C 250 500 420 740 790 620 S 1230 500 1750 640" fill="none" stroke="url(#forgot-wave)" strokeWidth="2" />
          </svg>
        </div>

        <section className={styles.card}>
          <div className={styles.cardTop}>
            <div className={styles.iconWrap}>
              <span className={`${styles.icon} material-symbols-outlined`}>lock_reset</span>
            </div>
            <h1>Reset Your Password</h1>
            <p>
              Enter your email address and we&apos;ll send you a link to restore access to your account.
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field} htmlFor="email">
              <span>Work Email</span>
              <div className={styles.inputWrap}>
                <span className={`${styles.icon} material-symbols-outlined`}>mail</span>
                <input
                  autoFocus
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <button className={styles.primaryButton} type="submit">
              Send Reset Link
              <span className={`${styles.icon} material-symbols-outlined`}>arrow_forward</span>
            </button>
          </form>

          <div className={styles.backLinkWrap}>
            <Link to="/" className={styles.backLink}>
              <span className={`${styles.icon} material-symbols-outlined`}>arrow_back</span>
              Back to Sign In
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ForgotPass