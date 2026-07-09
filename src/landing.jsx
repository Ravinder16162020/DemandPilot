import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import demandPilotWhiteIcon from './assets/DemandPilotWhiteicon.svg';
import styles from './landing.module.css';

const LOGS = [
  'Analyzing SKU DP-291 history...',
  'Correlating weather & events...',
  'Running Monte Carlo sims...',
  'Optimizing reorder threshold...',
  'Model updated — Conf: 96%',
  'Triggering auto-reorder...',
  'Saved $48,200 this cycle ✓'
];

const AI_TEXTS = [
  'Demand for SKU-291 projected to rise 18% in Q3 due to summer seasonality and promotional overlap in the Northeast corridor.',
  'Risk classification: LOW. Inventory buffer sufficient for 14 days at projected velocity. Recommend maintaining current reorder point.',
  'Competitor stockout detected — opportunity window open. Suggest boosting safety stock by 15% for the next 3 weeks.'
];

const STREAM_DATA = [
  { icon: '⚠️', title: 'Stockout Risk', desc: 'SKU-992 (Q3 Core)', bg: 'rgba(255,61,110,0.05)', bc: 'rgba(255,61,110,0.1)' },
  { icon: '🔄', title: 'Auto-Reorder', desc: '500 units to DAL-1', bg: 'rgba(0,185,107,0.05)', bc: 'rgba(0,185,107,0.12)' },
  { icon: '📈', title: 'Demand Surge', desc: '+18% in Northeast', bg: 'rgba(0,71,255,0.04)', bc: 'rgba(0,71,255,0.09)' },
  { icon: '⏱', title: 'Logistics Delay', desc: 'Port congestion alert', bg: 'rgba(255,170,0,0.05)', bc: 'rgba(255,170,0,0.12)' },
  { icon: '✅', title: 'PO Approved', desc: 'Vendor #402 — $12,400', bg: 'rgba(0,185,107,0.05)', bc: 'rgba(0,185,107,0.12)' }
];

const Landing = () => {
  // Refs
  const progressRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const heroCardRef = useRef(null);
  const heroCardWrapRef = useRef(null);
  const navRef = useRef(null);
  const streamListRef = useRef(null);
  const terminalTextRef = useRef(null);
  const aiSummaryTextRef = useRef(null);
  const aiProgressRef = useRef(null);
  const savingsCounterRef = useRef(null);
  const sparklineRef = useRef(null);
  const syncBarRef = useRef(null);
  const globeCanvasRef = useRef(null);
  const ctaCanvasRef = useRef(null);
  const forecastLineRef = useRef(null);
  const forecastAreaRef = useRef(null);
  const actualLineRef = useRef(null);
  const actualAreaRef = useRef(null);
  const chartDotRef = useRef(null);
  const chartDotRingRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);

  // State
  const [streamQueue, setStreamQueue] = useState(() => [...STREAM_DATA]);
  const [savingsValue, setSavingsValue] = useState(1245892);
  const [activeStep, setActiveStep] = useState(0);
  const [metricValues, setMetricValues] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [terminalCharIndex, setTerminalCharIndex] = useState(0);
  const [aiIndex, setAiIndex] = useState(0);
  const [aiCharIndex, setAiCharIndex] = useState(0);

  // Scroll progress and nav scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (progressRef.current) {
        const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      if (navRef.current) {
        navRef.current.classList.toggle(styles.scrolled, window.scrollY > 50);
      }
      // Parallax orbs
      const sy = window.scrollY;
      if (orb1Ref.current) orb1Ref.current.style.transform = `translateY(${sy * 0.22}px)`;
      if (orb2Ref.current) orb2Ref.current.style.transform = `translateY(${sy * -0.14}px)`;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const fx = (e.clientX / window.innerWidth - 0.5);
      const fy = (e.clientY / window.innerHeight - 0.5);
      if (orb1Ref.current) orb1Ref.current.style.transform = `translate(${fx * 32}px, ${fy * 32}px)`;
      if (orb2Ref.current) orb2Ref.current.style.transform = `translate(${fx * -22}px, ${fy * -22}px)`;
      if (orb3Ref.current) orb3Ref.current.style.transform = `translate(${fx * 50}px, ${fy * 50}px)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // BG Canvas animation
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const pts = Array.from({ length: 65 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.1 + 0.3,
      o: Math.random() * 0.3 + 0.06
    }));

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,71,255,${(1 - d / 120) * 0.07})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,71,255,${p.o})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Hero card tilt effect
  useEffect(() => {
    const wrap = heroCardWrapRef.current;
    const card = heroCardRef.current;
    if (!wrap || !card) return;

    const handleMouseMove = (e) => {
      const r = card.getBoundingClientRect();
      const rx = (e.clientY - (r.top + r.height / 2)) / r.height * -14;
      const ry = (e.clientX - (r.left + r.width / 2)) / r.width * 14;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
      card.style.transition = 'transform 0.08s';
      card.style.boxShadow = `${-ry * 1.5}px ${rx * 1.5}px 56px rgba(0,71,255,0.14)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
      card.style.transition = 'transform 0.6s';
      card.style.boxShadow = '';
    };

    wrap.addEventListener('mousemove', handleMouseMove);
    wrap.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      wrap.removeEventListener('mousemove', handleMouseMove);
      wrap.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Chart initialization
  useEffect(() => {
    const fd = [
      { x: 0.04, y: 0.60 }, { x: 0.17, y: 0.40 }, { x: 0.29, y: 0.70 },
      { x: 0.42, y: 0.32 }, { x: 0.56, y: 0.50 }, { x: 0.69, y: 0.22 },
      { x: 0.82, y: 0.60 }, { x: 0.95, y: 0.36 }
    ];
    const ad = [
      { x: 0.04, y: 0.68 }, { x: 0.17, y: 0.48 }, { x: 0.29, y: 0.64 },
      { x: 0.42, y: 0.39 }, { x: 0.56, y: 0.57 }, { x: 0.69, y: 0.29 }, { x: 0.82, y: 0.67 }
    ];

    const bp = (data, W = 400, H = 140, close = false) => {
      const p = data.map(d => ({ px: d.x * W, py: d.y * H }));
      if (!p.length) return '';
      let d = `M ${p[0].px} ${p[0].py}`;
      for (let i = 1; i < p.length; i++) {
        const cx = (p[i - 1].px + p[i].px) / 2;
        d += ` C ${cx} ${p[i - 1].py}, ${cx} ${p[i].py}, ${p[i].px} ${p[i].py}`;
      }
      if (close) {
        d += ` L ${p[p.length - 1].px} ${H} L ${p[0].px} ${H} Z`;
      }
      return d;
    };

    if (forecastLineRef.current) forecastLineRef.current.setAttribute('d', bp(fd, 400, 140, false));
    if (forecastAreaRef.current) forecastAreaRef.current.setAttribute('d', bp(fd, 400, 140, true));
    if (actualLineRef.current) actualLineRef.current.setAttribute('d', bp(ad, 400, 140, false));
    if (actualAreaRef.current) actualAreaRef.current.setAttribute('d', bp(ad, 400, 140, true));
    
    const l = fd[fd.length - 1];
    if (chartDotRef.current) {
      chartDotRef.current.setAttribute('cx', l.x * 400);
      chartDotRef.current.setAttribute('cy', l.y * 140);
    }
    if (chartDotRingRef.current) {
      chartDotRingRef.current.setAttribute('cx', l.x * 400);
      chartDotRingRef.current.setAttribute('cy', l.y * 140);
    }
  }, []);

  // Terminal typing effect
  useEffect(() => {
    const typeLog = () => {
      const text = LOGS[terminalIndex];
      if (terminalCharIndex < text.length) {
        if (terminalTextRef.current) {
          terminalTextRef.current.textContent = text.substring(0, terminalCharIndex + 1);
        }
        setTerminalCharIndex(prev => prev + 1);
      } else {
        setTimeout(() => {
          setTerminalIndex(prev => (prev + 1) % LOGS.length);
          setTerminalCharIndex(0);
        }, 1800);
      }
    };
    const interval = setInterval(typeLog, 32);
    return () => clearInterval(interval);
  }, [terminalIndex, terminalCharIndex]);

  // Stream list rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamQueue(prev => {
        const n = { ...STREAM_DATA[Math.floor(Math.random() * STREAM_DATA.length)] };
        const newQueue = [n, ...prev];
        return newQueue.slice(0, 8);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // AI Summary typing effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const typeSummary = () => {
        const text = AI_TEXTS[aiIndex];
        if (aiCharIndex === 0 && aiProgressRef.current) {
          aiProgressRef.current.style.width = '0%';
          setTimeout(() => {
            if (aiProgressRef.current) aiProgressRef.current.style.width = '100%';
          }, 80);
        }
        if (aiCharIndex < text.length) {
          if (aiSummaryTextRef.current) {
            aiSummaryTextRef.current.textContent = text.substring(0, aiCharIndex + 1);
          }
          setAiCharIndex(prev => prev + 1);
        } else {
          setTimeout(() => {
            setAiIndex(prev => (prev + 1) % AI_TEXTS.length);
            setAiCharIndex(0);
          }, 3500);
        }
      };
      const interval = setInterval(typeSummary, 20);
      return () => clearInterval(interval);
    }, 800);
    return () => clearTimeout(timer);
  }, [aiIndex, aiCharIndex]);

  // Savings counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSavingsValue(prev => prev + Math.floor(Math.random() * 130 + 40));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sparkline bars
  useEffect(() => {
    if (!sparklineRef.current) return;
    sparklineRef.current.innerHTML = '';
    Array.from({ length: 20 }, () => Math.random() * 52 + 18).forEach(h => {
      const b = document.createElement('div');
      b.className = styles.sparklineBar;
      b.style.height = h + 'px';
      b.style.background = `rgba(0,71,255,${0.12 + h / 70 * 0.6})`;
      sparklineRef.current.appendChild(b);
    });
  }, []);

  // Sync bar animation
  useEffect(() => {
    let sw = 0;
    let animationId;
    const animate = () => {
      sw = (sw + 0.5) % 110;
      if (syncBarRef.current) syncBarRef.current.style.width = (sw > 100 ? 0 : sw) + '%';
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Globe canvas animation
  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 300;
    const gw = canvas.width, gh = canvas.height, cx = gw / 2, cy = gh / 2;
    const R = Math.min(gw, gh) * 0.38;
    let angle = 0;

    const nodes = [
      { lat: 40.7, lng: -74, c: '#00B96B' }, { lat: 34, lng: -118.2, c: '#FF3D6E' },
      { lat: 51.5, lng: -0.1, c: '#0047FF' }, { lat: 35.6, lng: 139.7, c: '#0047FF' },
      { lat: 1.3, lng: 103.8, c: '#00B96B' }, { lat: -33.9, lng: 151.2, c: '#FF3D6E' }
    ];

    const ll3 = (lat, lng, r) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lng + 180) * Math.PI / 180;
      return {
        x: -r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi),
        z: r * Math.sin(phi) * Math.sin(theta)
      };
    };

    const prj = (pt, a) => {
      const c = Math.cos(a), s = Math.sin(a);
      const rx = pt.x * c + pt.z * s;
      const ry = pt.y;
      const rz = -pt.x * s + pt.z * c;
      const sc = 500 / (500 + rz);
      return { x: cx + rx * sc, y: cy - ry * sc, v: rz < 0 };
    };

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, gw, gh);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,71,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = -180; lng <= 180; lng += 5) {
          const p = prj(ll3(lat, lng, R), angle);
          if (p.v) {
            if (lng === -180) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(0,71,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      for (let lng = -180; lng <= 180; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = prj(ll3(lat, lng, R), angle);
          if (p.v) {
            if (lat === -90) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = 'rgba(0,71,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      const pn = nodes.map(n => ({ ...prj(ll3(n.lat, n.lng, R), angle), c: n.c }));
      pn.forEach((n1, i) => pn.forEach((n2, j) => {
        if (j <= i || !n1.v || !n2.v) return;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.quadraticCurveTo((n1.x + n2.x) / 2, Math.min(n1.y, n2.y) - 16, n2.x, n2.y);
        ctx.strokeStyle = 'rgba(0,71,255,0.12)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }));

      pn.forEach(n => {
        if (!n.v) return;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = n.c;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = n.c + '44';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      angle += 0.005;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animationId);
  }, []);

  // CTA Canvas stars animation
  useEffect(() => {
    const canvas = ctaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resize();

    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2,
      o: Math.random(),
      s: Math.random() * 0.4 + 0.1
    }));

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.o += s.s * 0.012;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,200,255,${Math.abs(Math.sin(s.o)) * 0.6})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Intersection Observer for reveals
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.visible);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll(`.${styles.reveal}`).forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Intersection Observer for metrics counter
  useEffect(() => {
    const ms = document.querySelector(`.${styles.metricsStrip}`);
    if (!ms) return;
    
    const targets = [32, 27, 18, 94];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          targets.forEach((target, idx) => {
            let cur = 0;
            const step = target / 60;
            const interval = setInterval(() => {
              cur = Math.min(cur + step, target);
              setMetricValues(prev => ({ ...prev, [idx]: Math.round(cur) }));
              if (cur >= target) clearInterval(interval);
            }, 16);
          });
        }
      });
    }, { threshold: 0.3 });

    observer.observe(ms);
    return () => observer.disconnect();
  }, []);

  // Workflow steps intersection observer - set active step based on most visible step
  useEffect(() => {
    const steps = document.querySelectorAll(`.${styles.step}`);
    let lastActiveStep = 0;
    
    const observer = new IntersectionObserver((entries) => {
      // Find the entry with highest intersection ratio
      let maxRatio = 0;
      let mostVisibleStep = lastActiveStep;
      
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > maxRatio) {
          maxRatio = e.intersectionRatio;
          mostVisibleStep = parseInt(e.target.dataset.step);
        }
      });
      
      // Only update if changed to prevent flickering
      if (mostVisibleStep !== lastActiveStep) {
        lastActiveStep = mostVisibleStep;
        setActiveStep(mostVisibleStep);
      }
    }, { threshold: [0.25, 0.5, 0.65, 0.9], rootMargin: '-20% 0px -20% 0px' });

    steps.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Initial reveal - mark all elements as visible immediately without animation delay
  useEffect(() => {
    // Small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      document.querySelectorAll(`.${styles.reveal}`).forEach(el => {
        el.classList.add(styles.visible);
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Bento card spotlight effect
  const handleBentoMouseMove = useCallback((e, card) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
  }, []);

  return (
    <div className={styles.landing}>
      {/* Noise overlay */}
      <div className={styles.noise}></div>
      
      {/* Progress bar */}
      <div ref={progressRef} className={styles.progress}></div>
      
      {/* BG Canvas */}
      <canvas ref={bgCanvasRef} className={styles.bgCanvas}></canvas>

      {/* NAV */}
      <nav ref={navRef} className={styles.nav}>
        <div className={styles.navLogo}>
          <div className={styles.navLogoIcon}>
            <img className={styles.navLogoImage} src={demandPilotWhiteIcon} alt="DemandPilot" />
          </div>
          DemandPilot
        </div>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#impact">Impact</a>
        </div>
        <Link to="/signup" className={styles.navSignup}>Signup</Link>
        <Link to="/login" className={styles.navCta}>Login</Link>
      </nav>

      {/* HERO */}
      <section className={styles.hero} id="hero">
        <div ref={orb1Ref} className={`${styles.parallaxLayer} ${styles.orb1}`}></div>
        <div ref={orb2Ref} className={`${styles.parallaxLayer} ${styles.orb2}`}></div>
        <div ref={orb3Ref} className={`${styles.parallaxLayer} ${styles.orb3}`}></div>

        <div className={`${styles.heroInner} ${styles.container}`}>
          <div>
            <div className={`${styles.heroBadge} ${styles.reveal}`}>
              <div className={styles.heroBadgeDot}>✦</div>
              Enterprise AI Engine 2.0
            </div>
            <h1 className={`${styles.heroTitle} ${styles.reveal} ${styles.revealDelay1}`}>
              From<br />
              <span className={styles.strike}>reactive</span><br />
              to <span className={styles.grad}>predictive</span>
            </h1>
            <p className={`${styles.heroSub} ${styles.reveal} ${styles.revealDelay2}`}>
              Stop letting intuition dictate your inventory. DemandPilot uses enterprise ML to forecast demand with 96% accuracy — before stockouts happen.
            </p>
            <div className={`${styles.heroActions} ${styles.reveal} ${styles.revealDelay3}`}>
              <button className={styles.btnPrimary}>Start Free Trial <span>→</span></button>
              <button className={styles.btnOutline}>▷ &nbsp;Watch Demo</button>
            </div>
          </div>

          <div ref={heroCardWrapRef} className={`${styles.heroVisual} ${styles.reveal} ${styles.revealDelay2}`}>
            <div ref={heroCardRef} className={styles.heroCard}>
              <div className={styles.cardTopAccent}></div>
              <div className={styles.cardBgOrb}></div>
              <div className={styles.gridLines}></div>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Demand Intelligence</div>
                  <div className={styles.cardSub}>SKU: DP-291 — Core Collection</div>
                </div>
                <div className={styles.liveBadge}>
                  <div className={styles.liveDot}></div>Live
                </div>
              </div>
              <div className={styles.chartArea}>
                <svg className={styles.chartSvg} viewBox="0 0 400 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0047FF" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#0047FF" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00B96B" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#00B96B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path ref={forecastAreaRef} d="" fill="url(#gF)" />
                  <path ref={forecastLineRef} d="" fill="none" stroke="#0047FF" strokeWidth="2.5" strokeLinecap="round" />
                  <path ref={actualAreaRef} d="" fill="url(#gA)" />
                  <path ref={actualLineRef} d="" fill="none" stroke="#00B96B" strokeWidth="1.5" strokeDasharray="6,4" strokeLinecap="round" />
                  <circle ref={chartDotRef} r="5" fill="#0047FF">
                    <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle ref={chartDotRingRef} r="10" fill="none" stroke="#0047FF" strokeWidth="1" opacity="0.25">
                    <animate attributeName="r" values="7;15;7" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0;0.35" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
              <div className={styles.terminal}>
                <span className={styles.terminalPrompt}>▶</span>
                <span ref={terminalTextRef} className={styles.terminalText}>Analyzing SKU DP-291 history...</span>
              </div>
              <div style={{ display: 'flex', gap: '9px', marginTop: '13px' }}>
                <div style={{ flex: 1, padding: '11px', background: 'var(--green-bg)', border: '1px solid rgba(0,185,107,0.16)', borderRadius: '11px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confidence</div>
                  <div style={{ fontFamily: 'Poppins', fontSize: '21px', fontWeight: 900, color: 'var(--green)' }}>96%</div>
                </div>
                <div style={{ flex: 1, padding: '11px', background: 'var(--blue-pale)', border: '1px solid rgba(0,71,255,0.12)', borderRadius: '11px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Score</div>
                  <div style={{ fontFamily: 'Poppins', fontSize: '21px', fontWeight: 900, color: 'var(--blue)' }}>LOW</div>
                </div>
                <div style={{ flex: 1, padding: '11px', background: 'rgba(255,61,110,0.05)', border: '1px solid rgba(255,61,110,0.1)', borderRadius: '11px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Δ Demand</div>
                  <div style={{ fontFamily: 'Poppins', fontSize: '21px', fontWeight: 900, color: 'var(--accent)' }}>+18%</div>
                </div>
              </div>
            </div>

            <div className={`${styles.floatWidget} ${styles.w1}`}>
              <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Auto-Reorder</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>500 units → DAL-1</div>
              <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '3px', fontWeight: 600 }}>✓ Approved</div>
            </div>
            <div className={`${styles.floatWidget} ${styles.w2}`}>
              <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Savings This Month</div>
              <div style={{ fontFamily: 'Poppins', fontSize: '19px', fontWeight: 900, color: 'var(--green)' }}>$48,200</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Stockout prevention</div>
            </div>
            <div className={`${styles.floatWidget} ${styles.w3}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Alert: SKU-992</div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>High Risk — Action needed</div>
            </div>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine}></div>
          <span>Scroll</span>
        </div>
      </section>

      {/* TICKER */}
      <div className={styles.tickerWrap}>
        <div className={styles.ticker}>
          {[...Array(2)].map((_, setIdx) => (
            <React.Fragment key={setIdx}>
              {['React 18', 'PostgreSQL', 'Python ML', 'Enterprise Security', 'Gemini 2.5', 'Real-Time Analytics', 'Auto-Reorder Engine', '96% Accuracy'].map((item, i) => (
                <div key={`${setIdx}-${i}`} className={styles.tickerItem}>
                  <div className={styles.tickerDot}></div>{item}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className={`${styles.section}`} id="features" style={{ background: 'var(--bg)' }}>
        <div className={styles.container}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`}>Core Capabilities</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`}>
            Superhuman<br /><span style={{ color: 'var(--blue)' }}>Merchandising.</span>
          </h2>
          <p className={`${styles.reveal} ${styles.revealDelay2}`} style={{ fontSize: '15px', color: 'var(--muted)', maxWidth: '460px', lineHeight: '1.78' }}>
            Turn raw supply chain data into strategic foresight — automatically, continuously, at scale.
          </p>

          <div className={styles.bento}>
            {/* Predictive AI */}
            <div 
              className={`${styles.bentoCard} ${styles.c1} ${styles.reveal}`}
              onMouseMove={(e) => handleBentoMouseMove(e, e.currentTarget)}
            >
              <div className={styles.gridLines}></div>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '260px', height: '260px', background: 'radial-gradient(circle,rgba(0,71,255,0.055) 0%,transparent 70%)', pointerEvents: 'none' }}></div>
              <div className={styles.bentoIcon} style={{ background: 'var(--blue-pale)' }}>🧠</div>
              <div className={styles.bentoTitle}>Predictive AI Engine</div>
              <div className={styles.bentoDesc}>Our core ML model synthesizes millions of signals — sales velocity, seasonality, weather, social trends — to forecast demand with 96% accuracy across every SKU and location.</div>
              <div className={styles.barGroup}>
                {[38, 62, 44, 78, 52, 88, 68, 48, 82, 57].map((h, i) => (
                  <div key={i} className={styles.bar} style={{ height: h + '%' }}></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <span className={`${styles.tag} ${styles.tagBlue}`}>96% Accuracy</span>
                <span className={`${styles.tag} ${styles.tagGreen}`}>↑ 32% Faster</span>
              </div>
            </div>

            {/* Decision Stream */}
            <div className={`${styles.bentoCard} ${styles.c2} ${styles.reveal} ${styles.revealDelay1}`} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '22px 22px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'Poppins', fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Decision Stream</div>
                  <div className={styles.liveBadge}><div className={styles.liveDot}></div>Live</div>
                </div>
              </div>
              <div ref={streamListRef} className={styles.streamList} style={{ padding: '0 22px 22px' }}>
                {streamQueue.slice(0, 4).map((item, i) => (
                  <div key={i} className={styles.streamItem} style={{ background: item.bg, borderColor: item.bc }}>
                    <div className={styles.streamIcon} style={{ background: item.bg }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div className={styles.streamItemTitle}>{item.title}</div>
                      <div className={styles.streamItemSub}>{item.desc}</div>
                    </div>
                    <div className={styles.streamTime}>{i === 0 ? 'now' : (i * 3) + 's ago'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Globe */}
            <div className={`${styles.bentoCard} ${styles.c3} ${styles.reveal} ${styles.revealDelay2}`}>
              <div className={styles.bentoIcon} style={{ background: 'var(--green-bg)' }}>🌐</div>
              <div className={styles.bentoTitle}>Global Network</div>
              <div className={styles.bentoDesc}>Real-time routing across fulfillment nodes.</div>
              <canvas ref={globeCanvasRef} style={{ width: '100%', height: '150px', marginTop: '14px', borderRadius: '10px' }}></canvas>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '13px' }}>
                <div><div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>NYC</div><div style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '18px', color: 'var(--green)' }}>98%</div></div>
                <div><div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>LAX</div><div style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '18px', color: 'var(--accent)' }}>82%</div></div>
                <div><div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Transit</div><div style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: '18px', color: 'var(--text)' }}>14,200</div></div>
              </div>
            </div>

            {/* GenAI */}
            <div 
              className={`${styles.bentoCard} ${styles.c4} ${styles.reveal} ${styles.revealDelay1}`}
              onMouseMove={(e) => handleBentoMouseMove(e, e.currentTarget)}
            >
              <div className={styles.gridLines}></div>
              <div className={styles.bentoIcon} style={{ background: 'var(--green-bg)' }}>⚡</div>
              <div className={styles.bentoTitle}>GenAI Summaries</div>
              <div className={styles.bentoDesc}>Natural language explanations for every forecast — so your team understands the "why" behind every recommendation instantly.</div>
              <div style={{ marginTop: '18px', padding: '16px', background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '13px' }}>
                <div style={{ fontSize: '9px', color: 'var(--green)', fontWeight: 700, letterSpacing: '0.09em', marginBottom: '7px', textTransform: 'uppercase' }}>AI Insight — SKU-291</div>
                <div ref={aiSummaryTextRef} style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.75' }}></div>
                <div ref={aiProgressRef} style={{ height: '2px', width: '0%', background: 'var(--green)', borderRadius: '2px', marginTop: '11px', transition: 'width 3s ease' }}></div>
              </div>
            </div>

            {/* Alerts */}
            <div className={`${styles.bentoCard} ${styles.c5} ${styles.reveal} ${styles.revealDelay2}`}>
              <div className={styles.bentoIcon} style={{ background: 'rgba(255,61,110,0.07)' }}>🔔</div>
              <div className={styles.bentoTitle}>Real-Time Alerts</div>
              <div className={styles.bentoDesc}>Proactive notifications before stockouts occur.</div>
              <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '10px 13px', background: 'rgba(255,61,110,0.05)', border: '1px solid rgba(255,61,110,0.1)', borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{ fontSize: '15px' }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>SKU-992 Stockout Risk</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>Stock in 3 days at current rate</div>
                  </div>
                </div>
                <div style={{ padding: '10px 13px', background: 'var(--green-bg)', border: '1px solid rgba(0,185,107,0.14)', borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{ fontSize: '15px' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Auto-Reorder Sent</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>500 units to DAL-1 hub</div>
                  </div>
                </div>
                <div style={{ padding: '10px 13px', background: 'var(--blue-pale)', border: '1px solid rgba(0,71,255,0.1)', borderRadius: '11px', display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span style={{ fontSize: '15px' }}>📈</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>Demand Surge Detected</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>+18% in Northeast region</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div 
              className={`${styles.bentoCard} ${styles.c6} ${styles.reveal}`}
              style={{ background: 'linear-gradient(135deg,var(--blue-pale),#fff 65%)', borderColor: 'rgba(0,71,255,0.1)' }}
              onMouseMove={(e) => handleBentoMouseMove(e, e.currentTarget)}
            >
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', background: 'radial-gradient(circle,rgba(0,71,255,0.09) 0%,transparent 70%)', pointerEvents: 'none' }}></div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '12px' }}>Live Savings Detected</div>
              <div ref={savingsCounterRef} className={styles.bentoMetric} style={{ color: 'var(--blue)', marginBottom: '8px' }}>${savingsValue.toLocaleString()}</div>
              <div className={styles.bentoMetricLabel} style={{ marginBottom: '100px', marginTop: '8px' }}>Across your supply chain</div>
              <div ref={sparklineRef} className={styles.sparkline} style={{ marginTop: '0px', clear: 'both' }}></div>
              <div style={{ marginTop: '16px', padding: '13px', background: '#fff', borderRadius: '13px', border: '1px solid var(--card-border)', boxShadow: '0 2px 8px rgba(0,71,255,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' }}>
                  <span>Route Sync</span><span style={{ color: 'var(--blue)' }}>● Processing</span>
                </div>
                <div style={{ height: '3px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div ref={syncBarRef} style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg,var(--blue),#5B8FFF)', borderRadius: '3px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <div id="impact" style={{ padding: '0 40px', background: 'var(--bg)' }}>
        <div className={styles.container}>
          <div className={`${styles.metricsStrip} ${styles.reveal}`}>
            {['Faster Decisions', 'Lower Stockout Risk', 'Reduced Excess Inventory', 'Planning Confidence'].map((label, i) => (
              <div key={i} className={styles.metricCell}>
                <div className={styles.metricNum}>{metricValues[i]}%</div>
                <div className={styles.metricLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WORKFLOW */}
      <section className={styles.section} id="workflow" style={{ background: '#fff' }}>
        <div className={styles.container}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`}>How It Works</div>
          <div className={styles.workflow}>
            <div className={styles.workflowSticky}>
              <h2 className={`${styles.sectionTitle} ${styles.reveal}`}>The Speed<br /><span style={{ color: 'var(--blue)' }}>of Thought.</span></h2>
              <p className={`${styles.reveal} ${styles.revealDelay1}`} style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.82', maxWidth: '360px', marginBottom: '32px' }}>
                A completely frictionless pipeline from raw data ingestion to automated supply chain action — in milliseconds.
              </p>
              <div className={`${styles.reveal} ${styles.revealDelay2}`} style={{ padding: '20px', background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '18px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', marginBottom: '12px' }}>Pipeline Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {['Data Sync', 'AI Analysis', 'Risk Scoring', 'Output & Action'].map((step, i) => {
                    const isDone = i < activeStep;
                    const isRunning = i === activeStep;
                    return (
                      <div key={i} className={styles.pipeStep} style={{
                        background: isDone ? 'rgba(0,185,107,0.05)' : isRunning ? 'var(--blue-pale)' : '#fff',
                        borderColor: isDone ? 'rgba(0,185,107,0.18)' : isRunning ? 'rgba(0,71,255,0.18)' : 'var(--card-border)'
                      }}>
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                          background: isDone ? 'var(--green)' : isRunning ? 'var(--blue)' : 'var(--muted2)',
                          boxShadow: isRunning ? '0 0 0 3px rgba(0,71,255,0.12)' : 'none'
                        }}></div>
                        <span>0{i + 1} — {step}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: isDone ? 'var(--green)' : isRunning ? 'var(--blue)' : 'var(--muted2)' }}>
                          {isDone ? 'DONE' : isRunning ? 'RUNNING' : 'QUEUE'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className={styles.steps}>
              {[
                { num: '01', title: 'Connect Data Sources', desc: 'Securely sync your POS, Shopify, SAP, and ERP systems in under 5 minutes with pre-built connectors. Zero IT overhead required.' },
                { num: '02', title: 'AI Pattern Analysis', desc: 'Our ML models ingest historical data, seasonality, external signals, and competitor trends to detect demand patterns invisible to humans.' },
                { num: '03', title: 'Risk Scoring Engine', desc: 'Every SKU across every location is continuously evaluated and scored. High-risk items surface automatically with recommended actions.' },
                { num: '04', title: 'Actionable Output', desc: 'Daily dashboards, automated PO drafts, and one-click approvals. From data to decision in seconds, not hours.' }
              ].map((step, i) => (
                <div key={i} className={`${styles.step} ${activeStep === i ? styles.active : ''}`} data-step={i}>
                  <div className={styles.stepNum}>STEP {step.num}</div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDesc}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Demand<span>Pilot</span></div>
        <div className={styles.footerLinks}>
          <a href="#">Twitter</a><a href="#">LinkedIn</a><a href="#">GitHub</a><a href="#">Privacy</a>
        </div>
        <div className={styles.footerCopy}>© 2026 DemandPilot. Cognizant Hackathon.</div>
      </footer>
    </div>
  );
};

export default Landing;
