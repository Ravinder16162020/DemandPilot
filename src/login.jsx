import { useEffect, useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import styles from './login.module.css'

const AUTH_KEY = 'demandpilot-authenticated'
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Google Login Success:', tokenResponse)
        
        // Send the token to backend for verification
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
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
          if (remember) {
            localStorage.setItem(AUTH_KEY, 'true')
          } else {
            sessionStorage.setItem(AUTH_KEY, 'true')
          }
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
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
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

  if (localStorage.getItem(AUTH_KEY) === 'true') {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const passwordValue = password.trim()

    if (!normalizedEmail || !passwordValue) {
      setError('Please enter email and password')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password: passwordValue }),
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Login successful:', data)
        if (remember) {
          localStorage.setItem(AUTH_KEY, 'true')
        } else {
          sessionStorage.setItem(AUTH_KEY, 'true')
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        setError('')
        navigate('/dashboard', { replace: true })
      } else {
        console.error('Login failed:', data)
        setError(data.message || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred during login. Please try again.')
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
            <linearGradient id="login-wave" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#0a2eff" stopOpacity="0" />
              <stop offset="50%" stopColor="#0a2eff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a2eff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-100 230 C 180 120 420 130 680 250 S 1180 370 1700 220" fill="none" stroke="url(#login-wave)" strokeWidth="2" />
          <path d="M-150 610 C 250 500 420 740 790 620 S 1230 500 1750 640" fill="none" stroke="url(#login-wave)" strokeWidth="2" />
        </svg>
      </div>

      <section className={styles.shell}>
        <div className={styles.heroPanel}>
          <div className={styles.heroBadge}>
            <span className={`${styles.icon} material-symbols-outlined`}>insights</span>
          </div>
          <p className={styles.kicker}>DemandPilot AI</p>
          <h1>Log in to your supply chain command center.</h1>
          <p className={styles.heroCopy}>
            Monitor stock risks, act on recommendations, and keep your existing dashboard workflow intact after sign-in.
          </p>

          <div className={styles.heroStats}>
            <article>
              <strong>1,284</strong>
              <span>SKUs at risk</span>
            </article>
            <article>
              <strong>48h</strong>
              <span>Predicted stockout window</span>
            </article>
            <article>
              <strong>4.2</strong>
              <span>DemandPilot version</span>
            </article>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Welcome back</h2>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field} htmlFor="email">
              <span>Email</span>
              <div className={styles.inputWrap}>
                <span className={`${styles.icon} material-symbols-outlined`}>mail</span>
                <input
                  autoComplete="email"
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ctshackathon@gmail.com"
                  type="email"
                  value={email}
                />
              </div>
            </label>

            <label className={styles.field} htmlFor="password">
              <div className={styles.labelRow}>
                <span>Password</span>
                <Link to="/forgot-password">Forgot?</Link>
              </div>
              <div className={styles.inputWrap}>
                <span className={`${styles.icon} material-symbols-outlined`}>lock</span>
                <input
                  autoComplete="current-password"
                  id="password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your security key"
                  type="password"
                  value={password}
                />
              </div>
            </label>

            <label className={styles.rememberRow}>
              <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
              <span>Remember this station</span>
            </label>

            {error && <p className={styles.errorText}>{error}</p>}

            <button className={styles.primaryButton} type="submit">
              Sign In
              <span className={`${styles.icon} material-symbols-outlined`}>arrow_forward</span>
            </button>

            <div className={styles.divider}>
              <span>or</span>
            </div>

            <button className={styles.secondaryButton} onClick={googleLogin} type="button">
              <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className={styles.signupRow}>
            <span>Don’t have an Account ?</span>
            <button className={styles.signupButton} onClick={() => navigate('/signup')} type="button">Sign Up</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login


