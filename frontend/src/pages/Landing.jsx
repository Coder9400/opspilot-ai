import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const WORKFLOW_STRIP = [
  { name: 'ENQUIRY', type: 'ai' },
  { name: 'AI ANALYSIS', type: 'ai' },
  { name: 'RESPONSE', type: 'ai' },
  { name: 'QUOTATION', type: 'ai' },
  { name: 'FOLLOW-UP', type: 'ai' },
  { name: 'APPROVAL', type: 'human' },
]

const VALUE_POINTS = [
  { title: 'AI-assisted workflow', desc: 'Automated extraction & response prep' },
  { title: 'Human-in-the-loop approval', desc: 'No action sent without review' },
  { title: 'Faster response preparation', desc: 'Reduce turn-around time by hours' },
  { title: 'Centralized customer enquiries', desc: 'All leads in one workspace' },
]

const STEPS = [
  {
    num: '01',
    title: 'Capture',
    desc: 'Bring in customer enquiries from text, email-style content, or documents.',
  },
  {
    num: '02',
    title: 'Understand',
    desc: 'AI extracts customer details, requirements, budget, timeline, priority, and missing questions.',
  },
  {
    num: '03',
    title: 'Prepare',
    desc: 'Generate a suggested response and a basic quotation or proposal.',
  },
  {
    num: '04',
    title: 'Follow Up',
    desc: 'Create follow-up tasks and track their status.',
  },
  {
    num: '05',
    title: 'Approve',
    desc: 'Humans review and approve important external actions.',
  },
]

const FEATURES = [
  {
    icon: '🔍',
    title: 'AI Enquiry Analysis',
    desc: 'Extract customer requirements, budget, timeline, priority, and missing information.',
  },
  {
    icon: '✍️',
    title: 'AI Response Generation',
    desc: 'Create suggested customer responses that your team can review and refine.',
  },
  {
    icon: '📄',
    title: 'Smart Quotations',
    desc: 'Generate structured quotations and proposals from enquiry information.',
  },
  {
    icon: '🔔',
    title: 'Follow-up Automation',
    desc: 'Turn customer requirements into trackable follow-up tasks.',
  },
  {
    icon: '✅',
    title: 'Human Approval',
    desc: 'Keep humans in control before important external actions.',
  },
  {
    icon: '📊',
    title: 'Centralized Workflow',
    desc: 'Track enquiries, quotations, approvals, and follow-ups from one workspace.',
  },
]

const USE_CASES = [
  {
    title: 'Sales Teams',
    desc: 'Turn inbound enquiries into structured sales workflows.',
  },
  {
    title: 'Service Businesses',
    desc: 'Understand customer requirements and prepare responses faster.',
  },
  {
    title: 'Agencies',
    desc: 'Convert project enquiries into proposals, quotations, and follow-ups.',
  },
  {
    title: 'Small Businesses',
    desc: 'Automate repetitive workflow preparation without losing human oversight.',
  },
]

const TRUST_POINTS = [
  {
    title: 'Human approval',
    desc: 'Important external actions remain under human control.',
  },
  {
    title: 'Structured workflows',
    desc: 'Every enquiry moves through a clear workflow.',
  },
  {
    title: 'Safe AI assistance',
    desc: 'AI prepares recommendations rather than silently taking important actions.',
  },
]

export default function Landing() {
  return (
    <div className="landing-root">
      <Navbar />

      {/* ── 1. HERO SECTION ── */}
      <section className="hero-section" id="product">
        <div className="lp-container hero-grid">
          {/* Left Content */}
          <div className="hero-left">
            <div className="lp-badge">
              <span className="dot" /> AI-POWERED BUSINESS WORKFLOW
            </div>

            <h1 className="hero-title">
              Turn customer enquiries into <span className="highlight-purple">intelligent workflows</span>.
            </h1>

            <p className="hero-subtitle">
              OPSPILOT AI helps businesses analyze customer enquiries, extract requirements, generate responses and quotations, create follow-ups, and keep humans in control.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <a href="#how-it-works" className="btn btn-outline btn-lg">
                See How It Works
              </a>
            </div>

            <div className="hero-subtext">
              🔒 Built for modern business teams
            </div>
          </div>

          {/* Right Product Visualization Card */}
          <div className="hero-right">
            <div className="workspace-mockup-card">
              <div className="mockup-header">
                <span className="mockup-dot red" />
                <span className="mockup-dot yellow" />
                <span className="mockup-dot green" />
                <span className="mockup-title">OPSPILOT AI Workspace</span>
              </div>

              <div className="mockup-body">
                {/* Customer Enquiry Card */}
                <div className="mockup-item">
                  <div className="mockup-item-header">
                    <strong>Customer Enquiry</strong>
                    <span className="badge badge-high">High Priority</span>
                  </div>
                  <div className="mockup-item-content">
                    <p className="cust-name">Rahul Sharma</p>
                    <p className="cust-req">Restaurant website with online ordering</p>
                    <div className="cust-meta">
                      <span>Budget: <strong>₹60,000</strong></span>
                      <span>Timeline: <strong>6 weeks</strong></span>
                    </div>
                  </div>
                </div>

                {/* AI Processing Status */}
                <div className="mockup-item ai-card">
                  <div className="mockup-item-header">
                    <span className="ai-tag">✨ AI Processing Complete</span>
                  </div>
                  <ul className="ai-check-list">
                    <li>✓ Requirements extracted</li>
                    <li>✓ Missing questions identified</li>
                    <li>✓ Priority classified</li>
                  </ul>
                </div>

                {/* Output items & Approval Gate */}
                <div className="mockup-actions-grid">
                  <div className="output-chip">✉️ AI Response Ready</div>
                  <div className="output-chip">📄 Quotation Drafted</div>
                  <div className="output-chip">🔔 2 Follow-ups Created</div>
                </div>

                <div className="approval-gate-card">
                  <div className="approval-gate-header">
                    <span>⚠️ Human Approval</span>
                    <span className="status-badge-review">Review Required</span>
                  </div>
                  <p className="approval-text">Approval required before sending response and proposal to customer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HERO WORKFLOW STRIP ── */}
      <section className="workflow-strip-section" id="workflow">
        <div className="lp-container">
          <div className="strip-container">
            {WORKFLOW_STRIP.map((item, idx) => (
              <div key={item.name} className="strip-item-wrap">
                <div className={`strip-pill ${item.type}`}>
                  {item.name}
                </div>
                {idx < WORKFLOW_STRIP.length - 1 && (
                  <span className="strip-arrow">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. TRUST / VALUE STRIP ── */}
      <section className="value-strip-section">
        <div className="lp-container">
          <h3 className="value-strip-heading">
            One workflow. Less manual work. More customer conversations handled.
          </h3>

          <div className="value-grid">
            {VALUE_POINTS.map((pt) => (
              <div key={pt.title} className="value-card">
                <span className="value-icon">⚡</span>
                <h4>{pt.title}</h4>
                <p>{pt.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ── */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="lp-container">
          <div className="section-header-center">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2>From enquiry to action — in one workflow.</h2>
            <p>OPSPILOT AI turns unstructured customer requests into structured, reviewable business actions.</p>
          </div>

          <div className="steps-container">
            {STEPS.map((step) => (
              <div key={step.num} className="step-card">
                <span className="step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CORE FEATURES ── */}
      <section className="features-section" id="features">
        <div className="lp-container">
          <div className="section-header-center">
            <span className="section-eyebrow">FEATURES</span>
            <h2>Everything your team needs to move enquiries forward.</h2>
          </div>

          <div className="features-grid">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="feature-card">
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. AI WORKSPACE PREVIEW (Dark Section) ── */}
      <section className="workspace-preview-section">
        <div className="lp-container">
          <div className="section-header-center light-text">
            <span className="section-eyebrow purple">AI WORKSPACE</span>
            <h2>Your AI workflow, visible at every step.</h2>
          </div>

          <div className="dark-preview-frame">
            <div className="dark-preview-sidebar">
              <div className="preview-brand">OPSPILOT AI</div>
              <div className="preview-nav-item active">Overview</div>
              <div className="preview-nav-item">Enquiries</div>
              <div className="preview-nav-item">Quotations</div>
              <div className="preview-nav-item">Follow-ups</div>
              <div className="preview-nav-item">Approvals</div>
            </div>

            <div className="dark-preview-main">
              <div className="preview-header">
                <div>
                  <span className="preview-enq-id">Enquiry #ENQ-1024</span>
                  <h3>Rahul Sharma</h3>
                </div>
                <span className="badge-ai-complete">AI Analysis Complete</span>
              </div>

              <div className="preview-grid-cards">
                <div className="preview-card">
                  <h5>Customer Details</h5>
                  <p>Rahul Sharma (rahul@example.com)</p>
                </div>
                <div className="preview-card">
                  <h5>Requirements</h5>
                  <p>Restaurant website with online ordering</p>
                </div>
                <div className="preview-card">
                  <h5>Priority & Budget</h5>
                  <p>High Priority • ₹60,000 (6 weeks)</p>
                </div>
              </div>

              <div className="preview-output-box">
                <div className="box-title">Suggested Customer Response</div>
                <p className="box-desc">"Hi Rahul, thank you for reaching out! We can certainly build your restaurant website with online ordering within 6 weeks..."</p>
              </div>

              <div className="preview-quotation-box">
                <div className="quotation-header">
                  <span>Quotation Proposal (₹60,000)</span>
                  <span className="badge-pending-approval">PENDING APPROVAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. HUMAN-IN-THE-LOOP SECTION ── */}
      <section className="hitl-section">
        <div className="lp-container">
          <div className="section-header-center">
            <span className="section-eyebrow">HUMAN CONTROL</span>
            <h2>AI moves fast. Humans stay in control.</h2>
            <p>OPSPILOT AI prepares the work. Your team makes the final decision.</p>
          </div>

          <div className="hitl-flow-card">
            <div className="hitl-step purple">AI analyzes</div>
            <span className="hitl-arrow">↓</span>
            <div className="hitl-step purple">AI prepares response</div>
            <span className="hitl-arrow">↓</span>
            <div className="hitl-step purple">AI generates quotation</div>
            <span className="hitl-arrow">↓</span>
            <div className="hitl-step navy">Human reviews</div>
            <span className="hitl-arrow">↓</span>
            <div className="hitl-step navy highlight-border">Human approves</div>
            <span className="hitl-arrow">↓</span>
            <div className="hitl-step green">Action proceeds</div>
          </div>
        </div>
      </section>

      {/* ── 8. USE CASES ── */}
      <section className="use-cases-section">
        <div className="lp-container">
          <div className="section-header-center">
            <span className="section-eyebrow">USE CASES</span>
            <h2>Built for teams that handle customer enquiries.</h2>
          </div>

          <div className="use-cases-grid">
            {USE_CASES.map((uc) => (
              <div key={uc.title} className="use-case-card">
                <h3>{uc.title}</h3>
                <p>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. SECURITY / TRUST ── */}
      <section className="security-section">
        <div className="lp-container">
          <div className="section-header-center">
            <span className="section-eyebrow">TRUST</span>
            <h2>Automation with control.</h2>
          </div>

          <div className="trust-grid">
            {TRUST_POINTS.map((tp) => (
              <div key={tp.title} className="trust-card">
                <span className="trust-icon">🛡️</span>
                <h3>{tp.title}</h3>
                <p>{tp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA ── */}
      <section className="final-cta-section">
        <div className="lp-container">
          <div className="final-cta-box">
            <h2>Ready to make your enquiry workflow smarter?</h2>
            <p>Let OPSPILOT AI turn customer requests into structured, reviewable business actions.</p>
            <div className="final-cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg style-white">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
