# OPSPILOT AI — API Contract

> **For Frontend Developers**  
> Base URL: `http://localhost:5000`  
> All authenticated requests require: `Authorization: Bearer <jwt_token>`  
> All responses follow: `{ success: true, data: {} }` or `{ success: false, error: { code, message } }`

---

## Authentication

---

### POST /api/auth/register

Register a new user account.

**Authentication:** None

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPass@123"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| name | string | ✅ | min 2, max 100 chars |
| email | string | ✅ | valid email |
| password | string | ✅ | min 8, max 128 chars |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors:**
- `409 CONFLICT` — Email already registered
- `400 VALIDATION_ERROR` — Invalid input

---

### POST /api/auth/login

**Authentication:** None

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "MyPass@123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "..." },
    "token": "eyJ..."
  }
}
```

**Errors:**
- `401 AUTH_ERROR` — Invalid credentials

---

### GET /api/auth/me

Get the currently authenticated user.

**Authentication:** ✅ Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

## Enquiries

---

### POST /api/enquiries

Create a new enquiry from raw text/email/document content.

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "sourceType": "TEXT",
  "content": "Hi, I need a website for my restaurant. Budget around 50,000 INR. Contact: john@example.com"
}
```

| Field | Type | Required | Options |
|-------|------|----------|---------|
| sourceType | string | ❌ | `TEXT` \| `EMAIL` \| `DOCUMENT` (default: `TEXT`) |
| content | string | ✅ | min 10 chars |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "enquiry": {
      "id": "cm...",
      "userId": "cm...",
      "rawContent": "Hi, I need a website...",
      "sourceType": "TEXT",
      "customerName": null,
      "customerEmail": null,
      "customerPhone": null,
      "requirements": null,
      "budget": null,
      "currency": "INR",
      "timeline": null,
      "priority": "MEDIUM",
      "status": "NEW",
      "missingQuestions": null,
      "aiSummary": null,
      "generatedResponse": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

---

### GET /api/enquiries

List authenticated user's enquiries with optional filters.

**Authentication:** ✅ Required

**Query Parameters:**
| Param | Type | Options |
|-------|------|---------|
| status | string | `NEW` \| `ANALYZING` \| `REVIEW` \| `APPROVED` \| `COMPLETED` |
| priority | string | `LOW` \| `MEDIUM` \| `HIGH` |
| page | number | default: 1 |
| limit | number | default: 10, max: 100 |

**Example:** `GET /api/enquiries?status=REVIEW&priority=HIGH&page=1&limit=10`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enquiries": [
      {
        "id": "...",
        "customerName": "Aditya Kumar",
        "status": "REVIEW",
        "priority": "HIGH",
        "aiSummary": "...",
        "createdAt": "...",
        "_count": { "quotations": 1, "followUps": 3, "approvals": 2 }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### GET /api/enquiries/:id

Get complete enquiry details including quotations, follow-ups, and approvals.

**Authentication:** ✅ Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enquiry": {
      "id": "...",
      "userId": "...",
      "rawContent": "URGENT! We need an ERP system...",
      "sourceType": "TEXT",
      "customerName": "Aditya Kumar",
      "customerEmail": "aditya@manufact.in",
      "customerPhone": "9123456789",
      "requirements": ["ERP system", "Inventory management"],
      "budget": 350000,
      "currency": "INR",
      "timeline": "As soon as possible",
      "priority": "HIGH",
      "status": "REVIEW",
      "missingQuestions": ["How many concurrent users?"],
      "aiSummary": "CRITICAL: Manufacturing unit facing...",
      "generatedResponse": "Dear Aditya Kumar...",
      "createdAt": "...",
      "updatedAt": "...",
      "quotations": [ { "id": "...", "title": "...", "total": 413000, "status": "PENDING_APPROVAL" } ],
      "followUps": [ { "id": "...", "title": "...", "status": "PENDING", "dueDate": "..." } ],
      "approvals": [ { "id": "...", "actionType": "SEND_QUOTATION", "status": "PENDING" } ]
    }
  }
}
```

**Errors:**
- `404 NOT_FOUND` — Enquiry not found
- `403 FORBIDDEN` — Not your enquiry

---

### POST /api/enquiries/:id/analyze

Run AI analysis on the raw enquiry content.

**Authentication:** ✅ Required

**Request Body:** None

**Flow:** `NEW → ANALYZING → REVIEW`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enquiry": { "...updated enquiry fields..." },
    "analysis": {
      "customerName": "Aditya Kumar",
      "customerEmail": "aditya@manufact.in",
      "customerPhone": "9123456789",
      "requirements": ["ERP system", "Inventory management"],
      "budget": 350000,
      "currency": "INR",
      "timeline": "As soon as possible",
      "priority": "HIGH",
      "missingQuestions": ["How many concurrent users?"],
      "summary": "CRITICAL: Manufacturing unit..."
    }
  }
}
```

**Errors:**
- `502 AI_ERROR` — AI provider failed (status restored to NEW)
- `403 FORBIDDEN` — Not your enquiry

---

### POST /api/enquiries/:id/generate-response

Generate a professional customer response using AI.

**Authentication:** ✅ Required

**Request Body:** None

**Response 200:**
```json
{
  "success": true,
  "data": {
    "response": "Dear Aditya Kumar,\n\nThank you for reaching out..."
  }
}
```

> Also creates a `SEND_RESPONSE` approval record in PENDING status.

---

### POST /api/enquiries/:id/generate-quotation

Generate a draft quotation using AI.

**Authentication:** ✅ Required

**Request Body:** None

**Response 201:**
```json
{
  "success": true,
  "data": {
    "quotation": {
      "id": "...",
      "enquiryId": "...",
      "title": "ERP Implementation Proposal — Aditya Kumar",
      "description": "Complete ERP system...",
      "items": [
        { "description": "ERP License", "quantity": 1, "unitPrice": 120000, "total": 120000 }
      ],
      "subtotal": 350000,
      "tax": 63000,
      "total": 413000,
      "currency": "INR",
      "validityDays": 30,
      "notes": "Payment: 50% advance...",
      "status": "PENDING_APPROVAL",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

> ⚠️ Quotation status is always `PENDING_APPROVAL`. It cannot be approved automatically.

---

### POST /api/enquiries/:id/generate-followups

Generate follow-up tasks using AI.

**Authentication:** ✅ Required

**Request Body:** None

**Response 201:**
```json
{
  "success": true,
  "data": {
    "followUps": [
      {
        "id": "...",
        "enquiryId": "...",
        "title": "Call client immediately",
        "description": "Discuss emergency deployment options",
        "dueDate": "2025-01-02T00:00:00.000Z",
        "status": "PENDING"
      }
    ]
  }
}
```

---

## Approval Workflow

---

### GET /api/enquiries/:id/approval

Get approval status for an enquiry.

**Authentication:** ✅ Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enquiryId": "...",
    "enquiryStatus": "REVIEW",
    "approvals": [
      {
        "id": "...",
        "actionType": "SEND_QUOTATION",
        "status": "PENDING",
        "comments": null,
        "approvedBy": null,
        "createdAt": "..."
      }
    ],
    "latestQuotation": { "id": "...", "total": 413000, "status": "PENDING_APPROVAL" },
    "pendingApprovals": [ { "...pending approval objects..." } ]
  }
}
```

---

### POST /api/enquiries/:id/approve

Approve an action. This is the mandatory human approval gate.

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "actionType": "SEND_QUOTATION",
  "comments": "Reviewed and approved after manager sign-off"
}
```

| Field | Type | Required | Options |
|-------|------|----------|---------|
| actionType | string | ✅ | `SEND_RESPONSE` \| `SEND_QUOTATION` \| `COMPLETE_WORKFLOW` |
| comments | string | ❌ | max 2000 chars |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "approval": {
      "id": "...",
      "actionType": "SEND_QUOTATION",
      "status": "APPROVED",
      "comments": "Reviewed and approved after manager sign-off",
      "approvedBy": "cm...",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "message": "Quotation approved. Ready to send to customer (simulated — no email sent)."
  }
}
```

**Side effects by actionType:**
- `SEND_RESPONSE` → Enquiry status → `APPROVED`
- `SEND_QUOTATION` → Quotation status → `APPROVED`, Enquiry status → `APPROVED`
- `COMPLETE_WORKFLOW` → Enquiry status → `COMPLETED`

---

### POST /api/enquiries/:id/reject

Reject an action. Returns enquiry to REVIEW status.

**Authentication:** ✅ Required

**Request Body:** Same as approve

**Response 200:**
```json
{
  "success": true,
  "data": {
    "approval": { "...approval with status REJECTED..." },
    "message": "Action rejected. Enquiry returned to REVIEW status for revision."
  }
}
```

---

## Quotations

---

### GET /api/quotations

List all quotations for authenticated user.

**Authentication:** ✅ Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "quotations": [
      {
        "id": "...",
        "title": "ERP Proposal",
        "total": 413000,
        "currency": "INR",
        "status": "PENDING_APPROVAL",
        "enquiry": { "customerName": "Aditya Kumar", "priority": "HIGH" }
      }
    ]
  }
}
```

---

### GET /api/quotations/:id

**Authentication:** ✅ Required

**Response 200:** Full quotation object including enquiry.

---

## Follow-Ups

---

### GET /api/followups

**Authentication:** ✅ Required

**Query Parameters:** `status=PENDING|COMPLETED|CANCELLED`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "followUps": [
      {
        "id": "...",
        "title": "Call client",
        "dueDate": "2025-01-02T00:00:00.000Z",
        "status": "PENDING",
        "enquiry": { "customerName": "Aditya Kumar", "priority": "HIGH" }
      }
    ]
  }
}
```

---

### PATCH /api/followups/:id

Update follow-up status.

**Authentication:** ✅ Required

**Request Body:**
```json
{ "status": "COMPLETED" }
```

**Response 200:** Updated follow-up object.

---

## Dashboard

---

### GET /api/dashboard/summary

Get all workflow statistics for the authenticated user.

**Authentication:** ✅ Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "enquiries": {
      "total": 5,
      "byStatus": {
        "new": 1,
        "analyzing": 0,
        "review": 3,
        "approved": 0,
        "completed": 1
      },
      "byPriority": {
        "high": 1,
        "medium": 2,
        "low": 2
      }
    },
    "approvals": {
      "pending": 2
    },
    "quotations": {
      "total": 3,
      "approved": 1,
      "pendingApproval": 2
    },
    "followUps": {
      "pending": 5,
      "completed": 2,
      "total": 7
    },
    "recentHighPriority": [
      {
        "id": "...",
        "customerName": "Aditya Kumar",
        "aiSummary": "CRITICAL: Manufacturing unit...",
        "status": "REVIEW",
        "priority": "HIGH",
        "createdAt": "..."
      }
    ]
  }
}
```

---

## Health Check

### GET /health

**Authentication:** None

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "OPSPILOT backend is running",
    "version": "1.0.0",
    "environment": "development",
    "aiProvider": "mock",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Error Reference

| HTTP Code | Error Code | When it Occurs |
|-----------|-----------|----------------|
| 400 | `VALIDATION_ERROR` | Invalid request body or query params |
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `AUTH_ERROR` | Missing, expired, or invalid JWT |
| 403 | `FORBIDDEN` | Attempting to access another user's data |
| 404 | `NOT_FOUND` | Resource ID doesn't exist |
| 409 | `CONFLICT` | Duplicate email on register |
| 502 | `AI_ERROR` | AI provider unavailable or returned invalid output |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Demo Quick-Start

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test@1234"}'

# Save the token from the response

# 2. Create enquiry
TOKEN="eyJ..."
curl -X POST http://localhost:5000/api/enquiries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceType":"TEXT","content":"I need a mobile app for my gym to track member attendance, payments, and class schedules. Budget around 1,50,000 INR within 2 months. Contact: Rahul Verma, rahul@fitpro.in, 9876543210"}'

# Save the enquiry ID

# 3. Analyze
ID="cm..."
curl -X POST http://localhost:5000/api/enquiries/$ID/analyze \
  -H "Authorization: Bearer $TOKEN"

# 4. Generate quotation
curl -X POST http://localhost:5000/api/enquiries/$ID/generate-quotation \
  -H "Authorization: Bearer $TOKEN"

# 5. Approve
curl -X POST http://localhost:5000/api/enquiries/$ID/approve \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"actionType":"SEND_QUOTATION","comments":"Approved by manager"}'

# 6. Dashboard
curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```
