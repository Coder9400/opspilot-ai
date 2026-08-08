# OPSPILOT AI — Backend API Contract

> Base URL: `http://localhost:5000` (dev) · `VITE_API_BASE_URL` env var in frontend  
> All protected routes require: `Authorization: Bearer <supabase_access_token>`  
> Responses are **flat JSON** — no `{success, data}` wrapper on success.  
> Errors return `{success:false, message:"...", error:{code, message}}` with appropriate HTTP status.

---

## AUTH

### POST /api/auth/register
**No auth required**

Request body:
```json
{
  "fullName": "Jane Smith",
  "businessName": "Acme Corp",
  "email": "jane@acme.com",
  "password": "Password123!"
}
```

Success `201`:
```json
{
  "user": { "id": "uuid", "email": "jane@acme.com", "name": "Jane Smith", "fullName": "Jane Smith", "businessName": "Acme Corp" },
  "token": "<supabase_access_token>",
  "requiresEmailConfirmation": false
}
```

If email confirmation is enabled: `token` is `null` and `requiresEmailConfirmation: true`.

Errors: `409 Conflict` (email exists), `400 Validation`, `401 Auth`

---

### POST /api/auth/login
**No auth required**

Request body:
```json
{ "email": "jane@acme.com", "password": "Password123!" }
```

Success `200`:
```json
{
  "user": { "id": "uuid", "email": "jane@acme.com", "name": "Jane Smith", "fullName": "Jane Smith", "businessName": "Acme Corp" },
  "token": "<supabase_access_token>"
}
```

Errors: `401 Auth`

---

### GET /api/auth/me
**Auth required**

Success `200`:
```json
{
  "user": { "id": "uuid", "email": "jane@acme.com", "name": "Jane Smith", "fullName": "Jane Smith", "businessName": "Acme Corp" }
}
```

---

## ENQUIRIES

### GET /api/enquiries
**Auth required**

Query params: `?status=NEW&priority=HIGH&page=1&limit=20`

Success `200`:
```json
{
  "enquiries": [
    {
      "id": "uuid",
      "content": "Raw enquiry text...",
      "customer": "ABC Manufacturing",
      "sourceType": "TEXT",
      "status": "NEW",
      "priority": "MEDIUM",
      "analysis": null,
      "generatedResponse": null,
      "createdAt": "2026-08-08T05:00:00Z",
      "updatedAt": "2026-08-08T05:00:00Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### POST /api/enquiries
**Auth required**

Request body:
```json
{
  "sourceType": "TEXT",
  "content": "ABC Manufacturing needs 50 laptops...",
  "customer": "ABC Manufacturing"
}
```

Success `201`:
```json
{
  "enquiry": {
    "id": "uuid",
    "content": "ABC Manufacturing needs 50 laptops...",
    "customer": "ABC Manufacturing",
    "sourceType": "TEXT",
    "status": "NEW",
    "priority": "MEDIUM",
    "analysis": null,
    "generatedResponse": null,
    "createdAt": "2026-08-08T05:00:00Z",
    "updatedAt": "2026-08-08T05:00:00Z"
  }
}
```

> **Frontend note**: After create, navigate to `/enquiries/${enquiry.id || enquiry.enquiry?.id}`

---

### GET /api/enquiries/:id
**Auth required** · **Ownership enforced**

Success `200`:
```json
{
  "enquiry": {
    "id": "uuid",
    "content": "ABC Manufacturing needs 50 laptops...",
    "customer": "ABC Manufacturing",
    "sourceType": "TEXT",
    "status": "REVIEW",
    "priority": "HIGH",
    "analysis": {
      "requirements": ["50 x Windows 11 laptops", "16GB RAM minimum"],
      "budget": "INR 500000",
      "timeline": "15 days",
      "priority": "HIGH",
      "missingQuestions": ["What is the preferred brand?", "SSD or HDD?"],
      "summary": "Bulk laptop procurement for ABC Manufacturing...",
      "intent": "Procurement",
      "recommendation": "Source from multiple vendors..."
    },
    "generatedResponse": "Dear ABC Manufacturing team, Thank you for your enquiry...",
    "quotations": [...],
    "followUps": [...],
    "approvals": [...],
    "createdAt": "...", "updatedAt": "..."
  }
}
```

Errors: `404 Not Found`, `403 Forbidden`

---

### POST /api/enquiries/:id/analyze
**Auth required** · **Ownership enforced**

No body required.

Success `200`:
```json
{
  "enquiry": { "...full enquiry with status=REVIEW..." },
  "analysis": {
    "requirements": ["50 x Windows 11 laptops"],
    "budget": "INR 500000",
    "timeline": "15 days",
    "priority": "HIGH",
    "missingQuestions": ["Preferred brand?"],
    "summary": "Bulk laptop procurement..."
  }
}
```

Errors: `502 AI Provider Error`, `404`, `403`

---

### POST /api/enquiries/:id/generate-response
**Auth required** · **Ownership enforced**

No body required.

Success `200`:
```json
{ "response": "Dear customer, Thank you for your enquiry..." }
```

Side effect: Creates a `PENDING` approval record, sets enquiry status to `PENDING_APPROVAL`.

---

### POST /api/enquiries/:id/generate-quotation
**Auth required** · **Ownership enforced**

No body required.

Success `201`:
```json
{
  "quotation": {
    "id": "uuid",
    "enquiryId": "uuid",
    "title": "Laptop Procurement Quotation",
    "description": "50 x Windows 11 laptops...",
    "items": [
      { "description": "HP ProBook 450 G10", "quantity": 50, "unitPrice": 9500, "subtotal": 475000 }
    ],
    "subtotal": 475000,
    "tax": 25000,
    "total": 500000,
    "currency": "INR",
    "validityDays": 30,
    "notes": "Prices valid for 30 days",
    "status": "PENDING_APPROVAL",
    "createdAt": "..."
  }
}
```

Side effect: Creates a `PENDING` approval record, sets enquiry status to `PENDING_APPROVAL`.

---

### POST /api/enquiries/:id/generate-followups
**Auth required** · **Ownership enforced**

No body required.

Success `201`:
```json
{
  "followUps": [
    { "id": "uuid", "enquiryId": "uuid", "title": "Follow up on delivery", "description": "...", "dueDate": "2026-08-23T...", "status": "PENDING" }
  ]
}
```

---

### GET /api/enquiries/:id/approval
**Auth required** · **Ownership enforced**

Success `200`:
```json
{
  "approval": { "id": "uuid", "enquiryId": "uuid", "actionType": "SEND_QUOTATION", "status": "PENDING", "comments": null },
  "enquiryId": "uuid",
  "enquiryStatus": "PENDING_APPROVAL",
  "approvals": [...],
  "pendingApprovals": [...],
  "latestQuotation": { "...quotation object..." }
}
```

---

### POST /api/enquiries/:id/approve
**Auth required** · **Ownership enforced**

Request body:
```json
{
  "actionType": "SEND_QUOTATION",
  "comments": "Approved — looks good"
}
```

`actionType` one of: `SEND_RESPONSE`, `SEND_QUOTATION`, `COMPLETE_WORKFLOW`  
Default: `SEND_QUOTATION`

Success `200`:
```json
{
  "approval": { "id": "uuid", "status": "APPROVED", "approvedBy": "uuid", "comments": "Approved", "updatedAt": "..." },
  "message": "Quotation approved. Ready to send to customer (simulated — no email sent)."
}
```

---

### POST /api/enquiries/:id/reject
**Auth required** · **Ownership enforced**

Request body (all optional):
```json
{ "comments": "Pricing too high, regenerate" }
```

Success `200`:
```json
{
  "approval": { "id": "uuid", "status": "REJECTED", "comments": "Pricing too high", "updatedAt": "..." },
  "message": "Action rejected. Enquiry returned to REVIEW status for revision."
}
```

---

## QUOTATIONS

### GET /api/quotations
**Auth required**

Success `200`:
```json
{
  "quotations": [
    { "id": "uuid", "enquiryId": "uuid", "title": "...", "total": 500000, "status": "PENDING_APPROVAL", "createdAt": "..." }
  ]
}
```

---

### GET /api/quotations/:id
**Auth required** · **Ownership enforced**

Success `200`:
```json
{ "quotation": { "...full quotation with enquiries relation..." } }
```

---

## FOLLOW-UPS

### GET /api/followups
**Auth required**

Query: `?status=PENDING`

Success `200`:
```json
{
  "followUps": [ { "id": "uuid", "title": "Follow up on delivery", "dueDate": "...", "status": "PENDING" } ],
  "followups": [ "...same array..." ]
}
```

---

### PATCH /api/followups/:id
**Auth required** · **Ownership enforced**

Request body:
```json
{ "status": "COMPLETED" }
```

Status values: `PENDING`, `COMPLETED`, `CANCELLED`

Success `200`:
```json
{ "followUp": { "id": "uuid", "status": "COMPLETED", "updatedAt": "..." } }
```

---

## DASHBOARD

### GET /api/dashboard/summary
**Auth required**

Success `200`:
```json
{
  "totalEnquiries": 5,
  "highPriority": 2,
  "pendingApprovals": 1,
  "followupsDue": 3,
  "enquiries": {
    "total": 5,
    "byStatus": { "new": 2, "analyzing": 0, "review": 1, "pendingApproval": 1, "approved": 1, "completed": 0 },
    "byPriority": { "high": 2, "medium": 2, "low": 1 }
  },
  "approvals": { "pending": 1 },
  "quotations": { "total": 2, "approved": 1, "pendingApproval": 1 },
  "followUps": { "pending": 3, "completed": 1, "total": 4 },
  "recentHighPriority": [ { "id": "uuid", "customerName": "ABC Mfg", "status": "REVIEW", "priority": "HIGH", "createdAt": "..." } ]
}
```

---

## HEALTH

### GET /health
**No auth required**

Success `200`:
```json
{
  "message": "OPSPILOT backend is running",
  "version": "1.0.0",
  "environment": "development",
  "aiProvider": "mistral",
  "database": "supabase",
  "timestamp": "2026-08-08T05:00:00Z"
}
```

---

## ENQUIRY STATUS FLOW

```
NEW → ANALYZING → REVIEW → PENDING_APPROVAL → APPROVED → COMPLETED
                    ↑____________(reject)_______________|
```

## PRIORITY VALUES
`LOW` | `MEDIUM` | `HIGH`

## ERROR FORMAT
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": { "code": "ERROR_CODE", "message": "Same message" }
}
```

HTTP status codes: `400` Validation, `401` Unauthorized, `403` Forbidden, `404` Not Found, `409` Conflict, `502` AI Error, `500` Internal
