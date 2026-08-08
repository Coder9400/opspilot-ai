import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ── Feature cards data ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🔍',
    title: 'AI Requirement Extraction',
    desc: 'Automatically parse and extract key requirements from raw customer enquiries. No more manually reading through long emails.',
  },
  {
    icon: '🚨',
    title: 'Missing Information Detection',
    desc: 'AI identifies gaps in the enquiry — budget, timeline, specifications — and flags what to ask before you respond.',
  },
  {
    icon: '📊',
    title: 'Priority Classification',
    desc: 'Instantly classify enquiries as High, Medium, or Low priority based on context, urgency signals, and business value.',
  },
  {
    icon: '✍️',
    title: 'AI Response & Quotation',
    desc: 'Generate professional responses and detailed quotations in seconds. Tailored to each enquiry, ready for your review.',
  },
  {
    icon: '🔔',
    title: 'Follow-up Tracking',
    desc: 'Never lose track of a lead again. Automated follow-up reminders ensure no enquiry falls through the cracks.',
  },
  {
    icon: '✅',
    title: 'Human Approval Gate',
    desc: 'Every AI action requires your explicit approval before anything is sent. You stay in control, always.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Capture Enquiry',
    desc: 'Paste or submit a customer enquiry into OPSPILOT AI from email, web form, or any channel.',
  },
  {
    n: 2,
    title: 'AI Analyses',
    desc: 'The AI extracts requirements, flags missing info, classifies priority, and prepares a response.',
  },
  {
    n: 3,
    title: 'Review Recommendations',
    desc: 'You see the AI\'s analysis, suggested response, and quotation — all in one clear view.',
  },
  {
    n: 4,
    title: 'Approve & Act',
    desc: 'With one click you approve. Nothing is sent without your sign-off. The AI handles the rest.',
  },
]

const HITL_CHECKS = [
  {
    icon: '🤖',
    iconClass: '',
    title: 'AI prepares recommendations',
    desc: 'Responses, quotations, follow-up plans — all AI-generated.',
  },
  {
    icon: '👀',
    iconClass: '',
    title: 'You review everything',
    desc: 'See exactly what the AI intends to do before anything happens.',
  },
  {
    icon: '✅',
    iconClass: 'success',
    title: 'You approve or edit',
    desc: 'Approve with one click, or edit freely. Your word is final.',
  },
  {
    icon: '🚀',
    iconClass: 'success',
    title: 'Action is taken',
    desc: 'Only after your approval does OPSPILOT AI act on your behalf.',
  },
]

/* ── Dashboard preview data ─────────────────────────────────── */
const PREVIEW_ROWS = [
  { name: 'Meridian Retail', subject: 'ERP Integration', priority: 'high', status: 'pending' },
  { name: 'BlueSky Logistics', subject: 'WMS Platform', priority: 'high', status: 'new' },
  { name: 'Sunridge Café', subject: 'POS Software', priority: 'medium', status: 'new' },
  { name: 'NextGen Architects', subject: 'Project Mgmt', priority: 'medium', status: 'approved' },
]

export default function Landing() {
  return (
    <div className="landing-page">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-badge">
            <span className="dot" />
            AI-Powered Workflow Automation
          </div>

          <h1 className="hero-title">
            Turn Customer Enquiries Into{' '}
            <span className="highlight">Actionable Workflows</span>
          </h1>

          <p className="hero-subtitle">
            OPSPILOT AI helps small businesses process customer enquiries, extract requirements,
            generate professional responses and quotations, and track follow-ups — with human
            oversight at every step.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started — It's Free
            </Link>
            <a href="#how-it-works" className="btn btn-outline btn-lg">
              See How It Works
            </a>
          </div>

          {/* Dashboard preview mockup */}
          <div className="dashboard-preview">
            <div className="dashboard-preview-frame">
              {/* Browser chrome */}
              <div className="preview-topbar">
                <div className="preview-dot" />
                <div className="preview-dot" />
                <div className="preview-dot" />
                <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--color-text-muted)' }}>
                  app.opspilot.ai/dashboard
                </span>
              </div>
              {/* App body */}
              <div className="preview-body">
                {/* Sidebar */}
                <div className="preview-sidebar">
                  <div className="preview-sidebar-logo">
                    <span style={{ background: '#6366f1', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>O</span>
                    OPSPILOT
                  </div>
                  {['Dashboard', 'Enquiries', 'Quotations', 'Follow-ups', 'Settings'].map((item, i) => (
                    <div key={item} className={`preview-sidebar-item${i === 0 ? ' active' : ''}`}>
                      {['⬛', '📋', '📄', '🔔', '⚙️'][i]} {item}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="preview-content">
                  {/* KPI row */}
                  <div className="preview-kpi-row">
                    {[
                      { label: 'Total Enquiries', value: '148' },
                      { label: 'High Priority', value: '12' },
                      { label: 'Pending Approval', value: '5' },
                      { label: 'Follow-ups Due', value: '8' },
                    ].map((kpi) => (
                      <div key={kpi.label} className="preview-kpi">
                        <div className="preview-kpi-label">{kpi.label}</div>
                        <div className="preview-kpi-value">{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Enquiries table */}
                  <div className="preview-table">
                    <div className="preview-table-header">
                      <span>Company</span>
                      <span>Priority</span>
                      <span>Status</span>
                      <span>Score</span>
                    </div>
                    {PREVIEW_ROWS.map((row) => (
                      <div key={row.name} className="preview-table-row">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 10, color: '#0f172a' }}>{row.name}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{row.subject}</div>
                        </div>
                        <span><span className={`preview-pill ${row.priority}`}>{row.priority}</span></span>
                        <span><span className={`preview-pill ${row.status}`}>{row.status}</span></span>
                        <span style={{ fontWeight: 700, color: '#6366f1', fontSize: 10 }}>94%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="text-center">
            <div className="section-label">Features</div>
            <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>
              Everything you need to handle enquiries
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              From first contact to closed deal, OPSPILOT AI automates the workflow while keeping
              you in the driver's seat.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="text-center">
            <div className="section-label">How it works</div>
            <h2 className="section-title" style={{ marginTop: 8, marginBottom: 16 }}>
              From enquiry to action in minutes
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>
              A simple 4-step process that transforms every customer enquiry into a structured,
              AI-powered workflow.
            </p>
          </div>
          <div className="steps-grid">
            {STEPS.map((step) => (
              <div key={step.n} className="step-card">
                <div className="step-number">{step.n}</div>
                <div className="step-title">{step.title}</div>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Human in the Loop ────────────────────────────────── */}
      <section className="hitl-section" id="human-approval">
        <div className="container">
          <div className="hitl-inner">
            {/* Left: visual */}
            <div className="hitl-visual">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    borderRadius: 6,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                  }}
                >
                  O
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Pending Your Approval</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    5 actions awaiting review
                  </div>
                </div>
              </div>
              {HITL_CHECKS.map((item) => (
                <div key={item.title} className="hitl-check-item">
                  <div className={`hitl-check-icon ${item.iconClass}`}>{item.icon}</div>
                  <div>
                    <div className="hitl-check-title">{item.title}</div>
                    <div className="hitl-check-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: copy */}
            <div>
              <div className="section-label">Human-in-the-Loop</div>
              <h2 className="section-title" style={{ marginTop: 8 }}>
                AI does the heavy lifting.
                <br />You make the decisions.
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: 16, lineHeight: 1.8 }}>
                OPSPILOT AI never takes action on your behalf without your explicit approval. Every
                suggested response, quotation, or follow-up is presented to you first — giving you
                full transparency and control over what gets sent to your customers.
              </p>
              <div className="hitl-points">
                {[
                  'Review AI suggestions before anything is sent externally',
                  'Edit or override any AI recommendation at any time',
                  'Full audit trail of every approved or rejected action',
                  'No emails, messages, or documents sent without your sign-off',
                ].map((point) => (
                  <div key={point} className="hitl-point">
                    <span className="hitl-point-dot" />
                    <p>{point}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32 }}>
                <Link to="/register" className="btn btn-primary">
                  Start for Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <h2 className="section-title">Ready to automate your enquiry workflow?</h2>
          <p className="section-subtitle">
            Join forward-thinking small businesses using OPSPILOT AI to respond faster,
            miss nothing, and close more deals — all with human oversight built in.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
