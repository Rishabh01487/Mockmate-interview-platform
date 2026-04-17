import React from 'react';
import { CATEGORIES } from './data/questions';

// ---- SVG Icon Library ----
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
      </svg>
    ),
    arrow: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
    cpu: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="6" height="6"/><rect x="2" y="2" width="20" height="20" rx="2"/>
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
      </svg>
    ),
    database: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      </svg>
    ),
    network: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
        <path d="M12 3c-2 3-2 15 0 18M3 12c3-2 15-2 18 0"/>
      </svg>
    ),
    code: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    layers: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
    web: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/>
        <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>
        <path d="M9 17s1 1 3 1 3-1 3-1"/>
      </svg>
    ),
    chart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    timer: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  };

  const categoryIcons = {
    dsa: icons.cpu, os: icons.layers, dbms: icons.database, cn: icons.network,
    oop: icons.code, systemdesign: icons.network, webdev: icons.web, corecs: icons.book,
  };

  const icon = icons[name] || categoryIcons[name] || icons.code;

  return (
    <svg style={{ width: size, height: size, flexShrink: 0 }} className={className}>
      {icon.props.children}
    </svg>
  );
};

// ---- Navbar ----
const Navbar = ({ onStartInterview, onOpenRoom }) => (
  <nav className="navbar" role="navigation" aria-label="Main navigation">
    <div className="nav-brand">
      <div className="nav-brand-icon">
        <Icon name="logo" size={16} />
      </div>
      <span className="nav-brand-name">MockMate</span>
    </div>
    <ul className="nav-links">
      <li><a href="#features">Features</a></li>
      <li><a href="#how-it-works">How It Works</a></li>
      <li><button className="nav-link-btn" onClick={onOpenRoom}>Interview Room</button></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
    <button className="nav-cta" id="nav-start-btn" onClick={onStartInterview} aria-label="Start a mock interview">
      Start Interview <Icon name="arrow" size={14} />
    </button>
  </nav>
);

// ---- Hero ----
const Hero = ({ onStartInterview, onOpenRoom }) => (
  <section className="hero" id="home" aria-label="Hero section">
    <div className="hero-content">
      <div className="hero-eyebrow">
        <span className="hero-eyebrow-dot" aria-hidden="true"></span>
        CS Engineering Interview Platform
      </div>
      <h1 className="hero-title">
        Ace Your <br />
        <span className="hero-title-muted">CS Interviews</span>
      </h1>
      <p className="hero-description">
        Practice 80+ curated questions across DSA, OS, DBMS, Computer Networks, OOP,
        System Design, and more — or host a live proctored interview room.
      </p>
      <div className="hero-actions">
        <button className="btn-hero-primary" id="hero-start-btn" onClick={onStartInterview}>
          Start Practicing <Icon name="arrow" size={15} />
        </button>
        <button className="btn-hero-secondary" id="hero-room-btn" onClick={onOpenRoom}>
          <Icon name="layers" size={14} /> Interview Room
        </button>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">80+</span>
          <span className="hero-stat-label">Questions</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">8</span>
          <span className="hero-stat-label">CS Domains</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">3</span>
          <span className="hero-stat-label">Difficulty Levels</span>
        </div>
      </div>
    </div>

    <div className="hero-visual" aria-hidden="true">
      <div className="hero-card">
        <div className="hero-card-header">
          <span className="hc-dot hc-dot-1"></span>
          <span className="hc-dot hc-dot-2"></span>
          <span className="hc-dot hc-dot-3"></span>
          <span className="hero-card-title">Mock Interview Session</span>
        </div>
        <div className="hero-card-question">
          <div className="hero-card-question-label">Question 3 of 5 · DSA · Medium</div>
          <div className="hero-card-question-text">
            What is Dynamic Programming? Explain the difference between memoization and tabulation.
          </div>
        </div>
        <div className="hero-card-tags">
          <span className="hero-tag">dynamic-programming</span>
          <span className="hero-tag">memoization</span>
          <span className="hero-tag">tabulation</span>
        </div>
        <div className="hero-card-bar">
          <div className="hero-card-bar-fill"></div>
        </div>
        <div className="hero-card-bar-label">Session Progress — 60%</div>
      </div>
    </div>
  </section>
);

// ---- Categories Strip ----
const CategoriesStrip = () => (
  <div className="categories-strip">
    <div className="categories-strip-label">Coverage across all core CS domains</div>
    <div className="categories-strip-grid">
      {CATEGORIES.map(cat => (
        <div className="category-chip" key={cat.id}>
          <Icon name={cat.id} size={13} />
          {cat.label}
        </div>
      ))}
    </div>
  </div>
);

// ---- Features ----
const FEATURES = [
  { icon: 'cpu', title: 'CS Engineering Focus', desc: 'Questions designed for B.Tech / BE CS students — covering your entire syllabus and beyond.' },
  { icon: 'ai', title: 'Structured Feedback', desc: 'Get guided key-point feedback after each answer to understand exactly where you can improve.' },
  { icon: 'chart', title: 'Difficulty Levels', desc: 'Select Easy, Medium or Hard questions to progressively challenge yourself as you improve.' },
  { icon: 'timer', title: 'Timed Practice', desc: 'Interview-realistic time limits per question to train you to think and respond under pressure.' },
  { icon: 'layers', title: '8 Core Domains', desc: 'DSA, OS, DBMS, CN, OOP, System Design, Web Dev and Core CS Theory — all in one place.' },
  { icon: 'chart', title: 'Session Review', desc: 'At the end of each session, review all your answers alongside model key points and scores.' },
];

const FeaturesSection = () => (
  <section className="features-section" id="features" aria-label="Features">
    <div className="section-header">
      <span className="section-eyebrow">Why MockMate</span>
      <h2 className="section-title">Built for CS engineers,<br />by CS engineers</h2>
      <p className="section-subtitle">Everything you need to systematically prepare for technical interviews in one focused platform.</p>
    </div>
    <div className="features-grid">
      {FEATURES.map((f, i) => (
        <div className="feature-card" key={i}>
          <div className="feature-icon-wrap">
            <Icon name={f.icon} size={18} />
          </div>
          <div className="feature-title">{f.title}</div>
          <div className="feature-desc">{f.desc}</div>
        </div>
      ))}
    </div>
  </section>
);

// ---- How It Works ----
const STEPS = [
  { n: '01', title: 'Pick a Domain', desc: 'Choose from 8 CS categories — DSA, OS, DBMS, CN, OOP, System Design, Web Dev, or Core CS.' },
  { n: '02', title: 'Set Difficulty', desc: 'Select Easy, Medium, or Hard to match your current preparation level.' },
  { n: '03', title: 'Answer Questions', desc: 'Read each question, write your answer in your own words within the time limit.' },
  { n: '04', title: 'Review & Improve', desc: 'See structured key-point feedback and a session summary to guide your next practice round.' },
];

const HowItWorks = () => (
  <section className="how-it-works" id="how-it-works" aria-label="How it works">
    <div className="how-it-works-inner">
      <div className="section-header">
        <span className="section-eyebrow">Process</span>
        <h2 className="section-title">Four steps to interview-ready</h2>
      </div>
      <div className="steps-list">
        {STEPS.map((s, i) => (
          <div className="step-item" key={i}>
            <div className="step-number">Step {s.n}</div>
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---- CTA ----
const CTASection = ({ onStartInterview }) => (
  <section className="cta-section" aria-label="Call to action">
    <div className="cta-inner">
      <h2 className="cta-title">Ready to start practicing?</h2>
      <p className="cta-desc">
        No sign-up required. Jump into a mock interview session right now and start building real interview confidence.
      </p>
      <div className="cta-actions">
        <button className="btn-hero-primary" id="cta-start-btn" onClick={onStartInterview}>
          Start Now — It's Free <Icon name="arrow" size={15} />
        </button>
      </div>
    </div>
  </section>
);

// ---- Testimonials ----
const TESTIMONIALS = [
  { initials: 'RK', name: 'Raj Kumar', role: 'SDE at Flipkart', text: 'MockMate\'s DSA and System Design questions were spot on. I practiced every day for a month and cleared Flipkart\'s technical rounds comfortably.' },
  { initials: 'PS', name: 'Priya Sharma', role: 'Backend Engineer at Razorpay', text: 'The DBMS and OS questions were exactly like the ones asked in my campus placements. The key-point feedback helped me fill gaps I didn\'t know I had.' },
  { initials: 'AK', name: 'Arjun Kumar', role: 'SDE-2 at Swiggy', text: 'Genuinely the best CS interview prep I\'ve seen. The question quality across CN and OOP domains is excellent — not just surface-level.' },
];

const Testimonials = () => (
  <section className="testimonials" aria-label="Testimonials">
    <div className="testimonials-inner">
      <div className="section-header">
        <span className="section-eyebrow">From Our Users</span>
        <h2 className="section-title">What engineers say</h2>
      </div>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((t, i) => (
          <div className="testimonial-card" key={i}>
            <div className="testimonial-stars">
              {[...Array(5)].map((_, j) => <Icon key={j} name="star" size={12} className="testimonial-star" />)}
            </div>
            <p className="testimonial-quote">"{t.text}"</p>
            <div className="testimonial-author">
              <div className="testimonial-avatar">{t.initials}</div>
              <div>
                <div className="testimonial-name">{t.name}</div>
                <div className="testimonial-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---- Footer ----
const Footer = () => (
  <footer className="footer" id="contact" aria-label="Footer">
    <div className="footer-content">
      <div className="footer-brand-col">
        <div className="footer-brand">
          <div className="footer-brand-icon"><Icon name="logo" size={12} /></div>
          MockMate
        </div>
        <p className="footer-desc">AI-powered mock interview platform for Computer Science engineering students.</p>
      </div>
      <div>
        <div className="footer-col-title">Product</div>
        <ul className="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#home">Start Interview</a></li>
        </ul>
      </div>
      <div>
        <div className="footer-col-title">Domains</div>
        <ul className="footer-links">
          <li><a href="#home">DSA</a></li>
          <li><a href="#home">Operating Systems</a></li>
          <li><a href="#home">DBMS</a></li>
          <li><a href="#home">System Design</a></li>
        </ul>
      </div>
      <div>
        <div className="footer-col-title">Resources</div>
        <ul className="footer-links">
          <li><a href="#home">Interview Tips</a></li>
          <li><a href="#home">CS Roadmap</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#home">Privacy Policy</a></li>
        </ul>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} MockMate. All rights reserved.</p>
      <div className="footer-badge">
        <span className="footer-badge-dot" aria-hidden="true"></span>
        All systems operational
      </div>
    </div>
  </footer>
);

// ---- HomePage (default export) ----
const HomePage = ({ onStartInterview, onOpenRoom }) => (
  <div className="home-container">
    <Navbar onStartInterview={onStartInterview} onOpenRoom={onOpenRoom} />
    <Hero onStartInterview={onStartInterview} onOpenRoom={onOpenRoom} />
    <CategoriesStrip />
    <FeaturesSection />
    <HowItWorks />
    <CTASection onStartInterview={onStartInterview} />
    <Testimonials />
    <Footer />
  </div>
);

export default HomePage;
