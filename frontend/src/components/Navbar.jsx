import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMobileOpen(false)

  return (
    <>
      <header className={`lp-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-navbar-inner">
          {/* Logo */}
          <Link to="/" className="lp-navbar-logo" onClick={closeMenu}>
            <div className="auth-logo-icon" style={{ width: 34, height: 34, fontSize: 14 }}>OP</div>
            <span className="lp-logo-text">OPSPILOT AI</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="lp-navbar-links">
            <a href="#product">Product</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#about">About</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="lp-navbar-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            
            {/* Mobile Hamburger Toggle */}
            <button
              className="lp-mobile-toggle"
              aria-label="Toggle Navigation"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <div className={`lp-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <a href="#product" onClick={closeMenu}>Product</a>
        <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
        <a href="#features" onClick={closeMenu}>Features</a>
        <a href="#workflow" onClick={closeMenu}>Workflow</a>
        <a href="#about" onClick={closeMenu}>About</a>
        <div className="lp-mobile-divider" />
        <Link to="/login" className="btn btn-outline btn-full" onClick={closeMenu}>Sign In</Link>
        <Link to="/register" className="btn btn-primary btn-full" onClick={closeMenu}>Get Started</Link>
      </div>
    </>
  )
}
