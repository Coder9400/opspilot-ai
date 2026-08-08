# OPSPILOT AI — Backend

> **Small Business Workflow Autopilot** — Converts raw customer enquiries into structured, trackable workflows with AI analysis and mandatory human approval gates.

---

## Architecture

```
Raw Enquiry → AI Extraction → Structured Data → Missing-Question Detection
           → Priority Classification → Response Generation → Quotation
           → Follow-Up Tasks → HUMAN APPROVAL → Final Action
```

```
backend/
├── src/
│   ├── ai/                    # AI layer (provider-agnostic)
│   │   ├── providers/
│   │   │   ├── gemini.provider.ts   # Real Gemini 1.5 Flash implementation
│   │   │   └── mock.provider.ts     # Deterministic demo provider
│   │   ├── ai.service.ts            # Provider factory & facade
│   │   └── ai.types.ts              # Interfaces & types
│   ├── config/
│   │   ├── env.ts             # Typed environment variables
│   │   └── prisma.ts          # Singleton Prisma client
│   ├── controllers/           # Thin HTTP layer (validate → delegate → respond)
│   ├── middlewares/           # auth.middleware, error.middleware
│   ├── routes/                # Express routers
│   ├── services/              # Business logic
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # errors.ts, response.ts
│   ├── validators/            # Zod schemas
│   ├── app.ts                 # Express app setup
│   └── server.ts              # HTTP server entry point
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data
└── docs/
    └── API_CONTRACT.md        # Frontend integration contract
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict mode) |
| Framework | Express.js 4 |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| AI Provider | Google Gemini 1.5 Flash / Mock |
| Config | dotenv |

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### 2. Clone & Navigate

```bash
cd opspilot-ai/backend
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/opspilot_db
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d
AI_PROVIDER=mock          # Use 'gemini' for real AI
AI_API_KEY=               # Only needed for AI_PROVIDER=gemini
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Database Setup

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 6. Seed Demo Data

```bash
npm run prisma:seed
```

This creates:
- **Demo user**: `demo@opspilot.ai` / `Demo@1234`
- 5 synthetic enquiries (LOW, MEDIUM, HIGH, vague, COMPLETED)

### 7. Start Development Server

```bash
npm run dev
```

Server starts at: `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | Token expiry (default: `7d`) |
| `AI_PROVIDER` | ❌ | `mock` or `gemini` (default: `mock`) |
| `AI_API_KEY` | ❌* | Gemini API key (*required if `AI_PROVIDER=gemini`) |
| `PORT` | ❌ | Server port (default: `5000`) |
| `CLIENT_URL` | ❌ | Frontend URL for CORS (default: `http://localhost:3000`) |
| `NODE_ENV` | ❌ | `development` or `production` |

---

## Prisma Commands

```bash
npx prisma migrate dev --name <migration_name>  # Create & apply migration
npx prisma migrate reset --force                 # Reset database
npx prisma generate                              # Regenerate client
npx prisma studio                                # Open visual DB browser
npm run prisma:seed                              # Run seed script
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |

### Enquiries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/enquiries` | ✅ | Create enquiry |
| GET | `/api/enquiries` | ✅ | List enquiries (filter by status/priority) |
| GET | `/api/enquiries/:id` | ✅ | Get full enquiry details |
| POST | `/api/enquiries/:id/analyze` | ✅ | AI analysis |
| POST | `/api/enquiries/:id/generate-response` | ✅ | Generate customer response |
| POST | `/api/enquiries/:id/generate-quotation` | ✅ | Generate quotation |
| POST | `/api/enquiries/:id/generate-followups` | ✅ | Generate follow-up tasks |
| GET | `/api/enquiries/:id/approval` | ✅ | Get approval status |
| POST | `/api/enquiries/:id/approve` | ✅ | Approve action |
| POST | `/api/enquiries/:id/reject` | ✅ | Reject action |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/quotations` | ✅ | List all quotations |
| GET | `/api/quotations/:id` | ✅ | Get quotation |
| GET | `/api/followups` | ✅ | List all follow-ups |
| PATCH | `/api/followups/:id` | ✅ | Update follow-up status |
| GET | `/api/dashboard/summary` | ✅ | Dashboard statistics |
| GET | `/health` | ❌ | Health check |

---

## Authentication Flow

```
POST /api/auth/register  →  returns { user, token }
POST /api/auth/login     →  returns { user, token }

All protected routes:
Authorization: Bearer <token>
```

---

## AI Flow

```
1. POST /api/enquiries          — create with rawContent
2. POST /api/enquiries/:id/analyze        — AI extracts structure
3. POST /api/enquiries/:id/generate-response   — AI drafts response
4. POST /api/enquiries/:id/generate-quotation  — AI creates quotation (PENDING_APPROVAL)
5. POST /api/enquiries/:id/generate-followups  — AI creates task list
```

**AI Providers:**
- `AI_PROVIDER=mock` — Deterministic, rule-based. No API key needed. For demos.
- `AI_PROVIDER=gemini` — Real Gemini 1.5 Flash. Requires `AI_API_KEY`.

---

## Human Approval Flow

```
GET  /api/enquiries/:id/approval          — View pending approvals
POST /api/enquiries/:id/approve           — Approve action
POST /api/enquiries/:id/reject            — Reject action
```

Request body:
```json
{
  "actionType": "SEND_RESPONSE" | "SEND_QUOTATION" | "COMPLETE_WORKFLOW",
  "comments": "Optional review notes"
}
```

**Key constraint:** No external action fires automatically. Every AI-generated output requires explicit human approval before the status advances.

---

## Example API Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"MyPass@123"}'
```

### Create Enquiry
```bash
curl -X POST http://localhost:5000/api/enquiries \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sourceType":"TEXT","content":"I need a website for my restaurant..."}'
```

### Analyze Enquiry
```bash
curl -X POST http://localhost:5000/api/enquiries/<id>/analyze \
  -H "Authorization: Bearer <token>"
```

### Approve Action
```bash
curl -X POST http://localhost:5000/api/enquiries/<id>/approve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"actionType":"SEND_QUOTATION","comments":"Reviewed and approved"}'
```

---

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### Error Codes
| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_ERROR` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Ownership check failed |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `CONFLICT` | 409 | Duplicate record |
| `AI_ERROR` | 502 | AI provider failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Database Schema

| Model | Key Fields |
|-------|-----------|
| **User** | id, name, email, passwordHash |
| **Enquiry** | id, userId, rawContent, sourceType, customerName/Email/Phone, requirements (JSON), budget, priority (LOW/MEDIUM/HIGH), status (NEW→ANALYZING→REVIEW→APPROVED→COMPLETED) |
| **Quotation** | id, enquiryId, items (JSON), subtotal, tax, total, status (PENDING_APPROVAL→APPROVED/REJECTED) |
| **FollowUp** | id, enquiryId, title, dueDate, status (PENDING/COMPLETED/CANCELLED) |
| **Approval** | id, enquiryId, quotationId?, actionType, status (PENDING→APPROVED/REJECTED), approvedBy |

---

## Build for Production

```bash
npm run build
npm start
```
