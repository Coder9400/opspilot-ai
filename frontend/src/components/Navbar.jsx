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
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" onClick={closeMenu}>
            <div className="logo-icon">O</div>
            <span className="logo-text">
              OPS<span>PILOT</span>&nbsp;AI
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="navbar-nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#human-approval">Human Approval</a>
          </div>

          {/* Desktop actions */}
          <div className="navbar-actions">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            {/* Mobile toggle */}
            <button
              className="navbar-mobile-toggle"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <a href="#features" onClick={closeMenu}>Features</a>
        <a href="#how-it-works" onClick={closeMenu}>How it works</a>
        <a href="#human-approval" onClick={closeMenu}>Human Approval</a>
        <div className="divider" />
        <Link to="/login" className="btn btn-ghost btn-sm" onClick={closeMenu}>Login</Link>
        <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>Get Started</Link>
      </div>
    </>
  )
}
