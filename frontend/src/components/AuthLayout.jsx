import { Link } from 'react-router-dom'

export default function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        
        {/* Left Brand Panel */}
        <div className="auth-brand">
          <div className="auth-brand-header">
            <div className="auth-logo-icon">OP</div>
            <span className="auth-logo-text">OPSPILOT AI</span>
          </div>
          
          <div className="auth-brand-content">
            <h2>Work smarter with AI.</h2>
            <p>Turn customer enquiries into intelligent workflows with AI.</p>
            
            <div className="auth-workflow-visual">
              <div className="auth-wf-item">Customer Enquiry</div>
              <div className="auth-wf-arrow">↓</div>
              <div className="auth-wf-item highlight">AI Analysis</div>
              <div className="auth-wf-arrow">↓</div>
              <div className="auth-wf-item">Response & Quotation</div>
              <div className="auth-wf-arrow">↓</div>
              <div className="auth-wf-item">Human Approval</div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-form-side">
          {/* Mobile top branding (visible only on mobile) */}
          <div className="auth-mobile-header">
            <div className="auth-logo-icon" style={{width: 32, height: 32, fontSize: 13}}>OP</div>
            <span className="auth-logo-text" style={{color: 'var(--text-primary)'}}>OPSPILOT AI</span>
          </div>

          <div className="auth-form-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="auth-form-content">
            {children}
          </div>

          <div className="auth-footer">
            {footerText} <Link to={footerLinkTo}>{footerLinkText}</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
