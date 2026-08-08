# OPSPILOT API Contract

## Base URL

/api

## Authentication

### Register
POST /api/auth/register

### Login
POST /api/auth/login

---

## Enquiries

### Create enquiry
POST /api/enquiries

### Get all enquiries
GET /api/enquiries

### Get enquiry
GET /api/enquiries/:id

### Analyze enquiry with AI
POST /api/enquiries/:id/analyze

---

## Quotation

### Generate quotation
POST /api/enquiries/:id/quotation

### Get quotation
GET /api/enquiries/:id/quotation

---

## Approval

### Approve AI-generated action
POST /api/enquiries/:id/approve

---

## Follow-ups

### Get follow-ups
GET /api/enquiries/:id/followups

### Create follow-up
POST /api/enquiries/:id/followups