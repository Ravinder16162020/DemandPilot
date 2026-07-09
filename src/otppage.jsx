
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './otppage.module.css'

function OtpPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isVerified, setIsVerified] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const refs = useRef([])

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

  useEffect(() => {
    if (countdown === 0) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setCountdown((value) => (value > 0 ? value - 1 : 0))
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [countdown])

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)

    if (digit && index < refs.current.length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const isOtpComplete = otp.every((digit) => digit.length === 1)
    if (!isOtpComplete || isVerified) {
      return
    }

    setIsVerified(true)
    window.setTimeout(() => {
      navigate('/update-password')
    }, 700)
  }

  const handleResendOtp = () => {
    if (countdown > 0) {
      return
    }

    setCountdown(30)
  }

  return (
    <div className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <svg className={styles.waveLayer} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="otp-wave" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0a2eff" stopOpacity="0" />
              <stop offset="50%" stopColor="#0a2eff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-100 230 C 180 120 420 130 680 250 S 1180 370 1700 220" fill="none" stroke="url(#otp-wave)" strokeWidth="2" />
          <path d="M-150 610 C 250 500 420 740 790 620 S 1230 500 1750 640" fill="none" stroke="url(#otp-wave)" strokeWidth="2" />
        </svg>
      </div>

      <main className={styles.main}>
        <section className={styles.card}>
          <div className={styles.identity}>
            <div className={styles.iconCircle}>
              <span className={`${styles.icon} material-symbols-outlined`}>verified_user</span>
            </div>
            <h1>Verify Your Account</h1>
            <p>Enter the 4-digit code sent to your email</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.otpRow}>
              {otp.map((value, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    refs.current[index] = node
                  }}
                  autoFocus={index === 0}
                  className={styles.otpInput}
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  type="text"
                  value={value}
                />
              ))}
            </div>

            <div className={styles.actions}>
              <button className={styles.verifyButton} type="submit">
                {isVerified ? 'Verified' : 'Verify OTP'}
              </button>

              <div className={styles.resendRow}>
                <button className={styles.resendButton} disabled={countdown > 0} onClick={handleResendOtp} type="button">
                  Resend OTP?
                </button>
                <span className={styles.countdown}>{countdown > 0 ? `${countdown}s` : 'Ready'}</span>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default OtpPage