import React, { useState, useEffect } from 'react';

const HomePage = ({ onStartInterview }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="brand-icon">🤖</span>
          <span className="brand-name">MockMate</span>
        </div>
        <ul className="nav-links">
          <li><a href="#home" className="active">Home</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <button className="nav-cta" onClick={onStartInterview}>Start Interview</button>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-text">✨ AI-Powered Interview Preparation</span>
          </div>
          <h1 className="hero-title">
            Master Your
            <span className="title-accent"> Interview Skills</span>
          </h1>
          <p className="hero-description">
            Get real-time feedback from AI on your technical and behavioral interview answers. 
            Practice, learn, and improve your chances of landing your dream job.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={onStartInterview}>
              Start Free Interview <span className="btn-arrow">→</span>
            </button>
            <button className="btn btn-secondary">
              Learn More
            </button>
          </div>
          <div className="stats-container">
            <div className="stat">
              <span className="stat-number">50k+</span>
              <span className="stat-label">Users Trained</span>
            </div>
            <div className="stat">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Questions</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">
            <div className="code-icon">🎯</div>
            <div className="floating-elements">
              <span className="float-element">Technical</span>
              <span className="float-element">Behavioral</span>
              <span className="float-element">Feedback</span>
            </div>
          </div>
        </div>
      </section>

      {/* Current Time Widget */}
      <div className="time-widget">
        <div className="time-card">
          <div className="time-icon">📅</div>
          <div className="time-info">
            <div className="current-time">{formatTime(currentTime)}</div>
            <div className="current-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-badge">Why Use MockMate</span>
          <h2>Powerful Features to Ace Your Interviews</h2>
          <p>Everything you need to succeed in your interview journey</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Feedback</h3>
            <p>Get instant, intelligent feedback on your answers with detailed insights and improvement suggestions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <h3>Technical Questions</h3>
            <p>Practice with 500+ real technical interview questions covering React, JavaScript, and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Behavioral Interviews</h3>
            <p>Master STAR method responses with questions on problem-solving, teamwork, and leadership.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Performance Tracking</h3>
            <p>Track your progress with detailed analytics and identify weak areas to focus on.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Timed Sessions</h3>
            <p>Practice under realistic time constraints to improve your response speed and clarity.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Interview Tips</h3>
            <p>Access expert tips and best practices to help you stand out from other candidates.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <span className="section-badge">Simple Process</span>
          <h2>How MockMate Works</h2>
          <p>Get started in minutes</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Choose Interview Type</h3>
            <p>Select between technical or behavioral interview questions</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Read & Answer</h3>
            <p>Read the question carefully and type your response</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get AI Feedback</h3>
            <p>Receive instant, personalized feedback from our AI</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Improve & Retry</h3>
            <p>Review feedback and practice more questions</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section" id="services">
        <div className="cta-container">
          <h2>Ready to Excel in Your Interviews?</h2>
          <p>Join thousands of job seekers who have improved their interview skills with MockMate.</p>
          <div className="cta-buttons">
            <button className="btn btn-primary-large" onClick={onStartInterview}>Start Your First Interview</button>
            <button className="btn btn-outline-light">View Sample Questions</button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="section-header">
          <span className="section-badge">Success Stories</span>
          <h2>What Users Say About MockMate</h2>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"InterviewAI helped me land my dream job at Google! The feedback was spot-on and really improved my confidence."</p>
            <p className="author">- Sarah Chen, Software Engineer</p>
          </div>
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"The behavioral interview questions were exactly what I needed. Practiced 50+ questions and nailed my interviews!"</p>
            <p className="author">- Mike Johnson, Product Manager</p>
          </div>
          <div className="testimonial-card">
            <div className="stars">⭐⭐⭐⭐⭐</div>
            <p>"Best interview prep tool I've used. The AI feedback is detailed and actionable. Highly recommend!"</p>
            <p className="author">- Priya Patel, Data Scientist</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-brand">
              <span className="brand-icon">🤖</span>
              <span className="brand-name">MockMate</span>
            </div>
            <p>Empower your career with intelligent interview preparation.</p>
            <div className="social-links">
              <a href="#" className="social-icon">📘</a>
              <a href="#" className="social-icon">🐦</a>
              <a href="#" className="social-icon">💼</a>
              <a href="#" className="social-icon">📧</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Questions</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Interview Tips</a></li>
              <li><a href="#">Support</a></li>
              <li><a href="#">Community</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} MockMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
