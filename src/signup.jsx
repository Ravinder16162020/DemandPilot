import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import styles from './signup.module.css'

const AUTH_KEY = 'demandpilot-authenticated'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otp, setOtp] = useState(['', '', '', ''])
  const [resendTimer, setResendTimer] = useState(0)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [isShowingVerified, setIsShowingVerified] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const otpRefs = useRef([])

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Google Login Success:', tokenResponse)
        
        // Send the token to backend for verification
        const response = await fetch('http://localhost:4000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: tokenResponse.access_token }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log('Backend authentication successful:', data)
          // Set authentication
          localStorage.setItem(AUTH_KEY, 'true')
          // Store user info if needed
          localStorage.setItem('user', JSON.stringify(data.user))
          setError('')
          navigate('/dashboard', { replace: true })
        } else {
          console.error('Backend authentication failed:', data)
          setError('Google authentication failed. Please try again.')
        }
      } catch (error) {
        console.error('Google login error:', error)
        setError('An error occurred during Google login. Please try again.')
      }
    },
    onError: (error) => {
      console.log('Google Login Error:', error)
      setError('Google login failed. Please try again.')
    },
  })

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
    if (!isOtpStep || resendTimer <= 0) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          window.clearInterval(timerId)
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [isOtpStep, resendTimer])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isOtpVerified) {
      return
    }

    if (!password || !confirmPassword) {
      setError('Please enter password and confirm password')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Account created successfully:', data)
        setError('')
        // Redirect to login page after successful signup
        navigate('/login')
      } else {
        console.error('Signup failed:', data)
        setError(data.message || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('An error occurred during signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyClick = async () => {
    if (!name || !email) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/otp/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('OTP sent successfully:', data)
        setIsOtpStep(true)
        setIsOtpVerified(false)
        setIsShowingVerified(false)
        setOtp(['', '', '', ''])
        setResendTimer(30)
        setOtpSent(true)
        setTimeout(() => {
          otpRefs.current[0]?.focus()
        }, 0)
      } else {
        console.error('Failed to send OTP:', data)
        setError(data.message || 'Failed to send OTP. Please try again.')
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/otp/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('OTP resent successfully:', data)
        setOtp(['', '', '', ''])
        setIsShowingVerified(false)
        setResendTimer(30)
        setTimeout(() => {
          otpRefs.current[0]?.focus()
        }, 0)
      } else {
        console.error('Failed to resend OTP:', data)
        setError(data.message || 'Failed to resend OTP. Please try again.')
      }
    } catch (error) {
      console.error('Error resending OTP:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isOtpComplete = otp.every((digit) => digit !== '')

  const handleOtpVerify = async () => {
    if (!isOtpComplete) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:4000/api/otp/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp: otp.join('') }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('OTP verified successfully:', data)
        setIsShowingVerified(true)
        setResendTimer(0)

        window.setTimeout(() => {
          setIsOtpVerified(true)
        }, 700)
      } else {
        console.error('OTP verification failed:', data)
        setError(data.message || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', ''])
        setTimeout(() => {
          otpRefs.current[0]?.focus()
        }, 0)
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const updatedOtp = [...otp]
    updatedOtp[index] = digit
    setOtp(updatedOtp)

    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-verify when 4th digit is entered
    if (digit && index === 3) {
      setTimeout(() => {
        handleOtpVerify()
      }, 100)
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <svg className={styles.waveLayer} viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <linearGradient id="signup-wave" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0a2eff" stopOpacity="0" />
              <stop offset="50%" stopColor="#0a2eff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-100 230 C 180 120 420 130 680 250 S 1180 370 1700 220" fill="none" stroke="url(#signup-wave)" strokeWidth="2" />
          <path d="M-150 610 C 250 500 420 740 790 620 S 1230 500 1750 640" fill="none" stroke="url(#signup-wave)" strokeWidth="2" />
        </svg>
      </div>

      <section className={styles.shell}>
        <div className={styles.card}>
          <div className={styles.brandArea}>
            <h1>Create Your Account</h1>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {!isOtpVerified ? (
              <label className={styles.field}>
                <span>Full Name</span>
                <input 
                  placeholder="John Doe" 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isOtpStep}
                />
              </label>
            ) : (
              <label className={styles.field}>
                <span>Password</span>
                <div className={styles.passwordInputWrap}>
                  <input 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((previous) => !previous)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </label>
            )}

            <label className={`${styles.field} ${isOtpStep ? styles.hiddenField : ''}`}>
              <span>Work Email</span>
              <input 
                placeholder="name@company.com" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isOtpStep}
              />
            </label>

            {!isOtpStep ? (
              <button 
                className={styles.primaryButton} 
                onClick={handleVerifyClick} 
                type="button"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Verify'}
              </button>
            ) : null}

            {isOtpStep && !isOtpVerified ? (
              <div className={styles.otpSection}>
                <p className={styles.otpTitle}>
                  {otpSent ? 'Enter the 4-digit code sent to your email' : 'Send OTP'}
                </p>
                <div className={styles.otpRow}>
                  {otp.map((digit, index) => (
                    <input
                      aria-label={`OTP digit ${index + 1}`}
                      className={styles.otpInput}
                      inputMode="numeric"
                      key={`otp-${index}`}
                      maxLength={1}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      pattern="[0-9]*"
                      ref={(element) => {
                        otpRefs.current[index] = element
                      }}
                      type="text"
                      value={digit}
                      disabled={loading}
                    />
                  ))}
                </div>
                <div className={styles.resendRow}>
                  <button
                    className={styles.resendButton}
                    disabled={resendTimer > 0 || loading}
                    onClick={handleResendOtp}
                    type="button"
                  >
                    {loading ? 'Sending...' : 'Resend OTP?'}
                  </button>
                  <span className={styles.resendTimer}>{resendTimer > 0 ? `${resendTimer}s` : ''}</span>
                </div>

                {(isOtpComplete || isShowingVerified) ? (
                  <button
                    className={styles.primaryButton}
                    disabled={isShowingVerified || loading}
                    onClick={handleOtpVerify}
                    type="button"
                  >
                    {isShowingVerified ? 'Verified' : loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                ) : null}
              </div>
            ) : null}

            {isOtpVerified ? (
              <label className={styles.field}>
                <span>Confirm Password</span>
                <div className={styles.passwordInputWrap}>
                  <input 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </label>
            ) : null}

            {isOtpVerified ? (
              <button className={styles.primaryButton} type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            ) : null}

            {error && <p className={styles.errorText}>{error}</p>}

            <div className={styles.divider}>
              <span>Or</span>
            </div>

            <button className={styles.googleButton} onClick={googleLogin} type="button">
              <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className={styles.loginRow}>
            <p>
              Already have an account?
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroBadge}>
            <span className={`${styles.icon} material-symbols-outlined`}>insights</span>
          </div>
          <p className={styles.kicker}>DemandPilot AI</p>
          <h2>Create your supply chain command center.</h2>
          <p className={styles.heroCopy}>
            Get instant visibility into stock risks, demand trends, and recommendations from day one.
          </p>

          <div className={styles.heroStats}>
            <article>
              <strong>2,146</strong>
              <span>Active SKUs monitored</span>
            </article>
            <article>
              <strong>96%</strong>
              <span>Forecast confidence score</span>
            </article>
            <article>
              <strong>24/7</strong>
              <span>Automated alert coverage</span>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Signup
