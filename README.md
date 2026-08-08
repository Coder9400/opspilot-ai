# OPSPILOT AI — Small Business Workflow Autopilot

OPSPILOT AI is a full-stack, AI-powered CRM designed specifically for Indian small and medium businesses (SMBs). It automates the tedious parts of managing customer enquiries, generating professional quotations, and following up, acting as an AI co-pilot for sales and operations teams.

## 🚀 Key Features

* **AI Enquiry Analysis:** Automatically extracts requirements, budgets, timelines, and priority levels from raw customer text or emails.
* **Smart Quotation Generation:** Uses AI to generate itemized, professional quotations with accurate Indian pricing formats (INR), subtotal, tax calculations (e.g., 18% GST), and payment terms.
* **AI Drafted Responses:** Drafts polite, context-aware email responses to customers based on their specific requirements and missing information.
* **Received Quotation Processing:** Upload vendor or supplier PDF quotations and have the AI extract the structured data (items, totals, taxes) directly into the database.
* **Follow-up Automation:** Automatically schedules and generates actionable follow-up tasks based on enquiry priority.
* **Human-in-the-Loop Approval:** No AI-generated content is sent to customers without explicit human review and approval.
* **Company Workspaces:** Multi-tenant architecture allowing users to create their own isolated company workspaces.
* **Shared Quotation Links:** Secure, read-only web links for customers to view their approved quotations without needing an account.

## 🛠️ Technology Stack

**Frontend:**
* React 18 (Vite)
* React Router for navigation
* Custom Vanilla CSS (Design system optimized for modern, sleek aesthetics)
* Context API for Authentication & State Management

**Backend:**
* Node.js & Express.js (TypeScript)
* Supabase (PostgreSQL Database, Row Level Security, Authentication)
* Mistral AI API (via `@mistralai/mistralai`)
* Zod (for strict schema validation)
* Multer & pdf-parse (for processing uploaded PDF quotations)

## 📁 Project Structure

```text
opspilot-ai/
├── backend/
│   ├── src/
│   │   ├── ai/          # AI Service integrations (Mistral)
│   │   ├── config/      # Environment & Supabase DB connections
│   │   ├── controllers/ # Express route controllers
│   │   ├── middlewares/ # Auth & error handling middlewares
│   │   ├── routes/      # Express API routes
│   │   ├── services/    # Core business logic (Enquiries, Companies, etc.)
│   │   └── utils/       # Error classes, response formatters
│   ├── migrations/      # SQL files for Supabase DB schema
│   └── .env             # Backend environment variables (Supabase keys, Mistral key)
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components (Sidebar, Buttons, Modals)
    │   ├── context/     # React Context (AuthProvider)
    │   ├── pages/       # Route components (Dashboard, Enquiries, Settings, etc.)
    │   ├── routes/      # AppRoutes (Protected and Public routes)
    │   └── services/    # API client services wrapping fetch()
    └── .env             # Frontend environment variables
```

## ⚙️ Setup & Installation

### Prerequisites
* Node.js (v18 or higher)
* A [Supabase](https://supabase.com/) project
* A [Mistral AI](https://mistral.ai/) API key

### 1. Database Setup
1. Open your Supabase project dashboard.
2. Navigate to the SQL Editor.
3. Run the SQL script found in `backend/migrations/001_fix_roles_and_schema.sql` to create the necessary tables, policies, and constraints.

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
Fill in your `.env` variables:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MISTRAL_API_KEY=your_mistral_api_key
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```
Fill in your `.env` variables:
```env
VITE_API_BASE_URL=http://localhost:5000
```
Start the frontend:
```bash
npm run dev
```

## 🔐 Security & Architecture

* **Authentication:** Handled entirely by Supabase Auth (JWT). The frontend stores the token and passes it as a Bearer token to the Express backend.
* **Multi-tenancy:** The database uses Row Level Security (RLS) bound to `company_id`. A user can only see data belonging to their associated company workspace.
* **Validation:** All API endpoints are heavily typed with TypeScript and payload-validated at runtime using Zod to prevent injection or bad data.

## 🤝 Contributing

1. Ensure the PostgreSQL schema constraint matches the codebase (e.g., `role` in `company_members` strictly uses lowercase `owner`, `admin`, `member`).
2. Run the E2E API tests located in `backend/test-api.js` before submitting major backend changes.

---
*Built to empower small businesses with accessible, practical AI.*
