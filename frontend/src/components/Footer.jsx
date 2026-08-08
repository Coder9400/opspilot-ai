import { Link } from 'react-router-dom'

const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { label: 'Overview', href: '#product' },
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Workflow',
    links: [
      { label: 'Enquiries', href: '/enquiries' },
      { label: 'Quotations', href: '/quotations' },
      { label: 'Follow-ups', href: '/followups' },
      { label: 'Approvals', href: '/approvals' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Contact', href: '#about' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-grid">
          {/* Brand Info */}
          <div className="lp-footer-brand">
            <Link to="/" className="lp-footer-logo">
              <div className="auth-logo-icon" style={{ width: 32, height: 32, fontSize: 13 }}>OP</div>
              <span>OPSPILOT AI</span>
            </Link>
            <p className="lp-footer-tagline">
              AI-powered workflow automation for modern businesses. Turn customer enquiries into structured, reviewable business actions.
            </p>
          </div>

          {/* Navigation Columns */}
          <div className="lp-footer-cols">
            {FOOTER_SECTIONS.map((sec) => (
              <div key={sec.title} className="lp-footer-col">
                <h4>{sec.title}</h4>
                <ul>
                  {sec.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link to={link.href}>{link.label}</Link>
                      ) : (
                        <a href={link.href}>{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} OPSPILOT AI. All rights reserved.</span>
          <span>Enterprise SaaS Workflow Automation</span>
        </div>
      </div>
    </footer>
  )
}
