/**
 * OPSPILOT AI – Demo Data
 *
 * Replace these with real API responses when the backend is connected.
 * Each object shape mirrors what the API service layer will return.
 */

export const demoUser = {
  id: 'u-001',
  fullName: 'Sarah Johnson',
  email: 'sarah@techventures.co',
  company: 'TechVentures Ltd',
  role: 'Owner',
  avatarInitials: 'SJ',
}

export const demoStats = {
  totalEnquiries: 148,
  highPriority: 12,
  pendingApproval: 5,
  followUpsDue: 8,
}

export const demoEnquiries = [
  {
    id: 'enq-001',
    company: 'Meridian Retail Group',
    contact: 'James Osei',
    subject: 'Custom ERP Integration Quote',
    priority: 'high',
    status: 'pending_approval',
    received: '2026-08-07',
    aiScore: 94,
  },
  {
    id: 'enq-002',
    company: 'BlueSky Logistics',
    contact: 'Priya Nair',
    subject: 'Warehouse Management System',
    priority: 'high',
    status: 'in_progress',
    received: '2026-08-07',
    aiScore: 88,
  },
  {
    id: 'enq-003',
    company: 'Sunridge Café Chain',
    contact: 'Tom Adeyemi',
    subject: 'POS & Inventory Software',
    priority: 'medium',
    status: 'new',
    received: '2026-08-06',
    aiScore: 76,
  },
  {
    id: 'enq-004',
    company: 'NextGen Architects',
    contact: 'Lisa Chen',
    subject: 'Project Management Platform',
    priority: 'medium',
    status: 'awaiting_info',
    received: '2026-08-06',
    aiScore: 62,
  },
  {
    id: 'enq-005',
    company: 'Peak Fitness Studios',
    contact: 'Marcus Webb',
    subject: 'Membership & Booking App',
    priority: 'low',
    status: 'approved',
    received: '2026-08-05',
    aiScore: 91,
  },
  {
    id: 'enq-006',
    company: 'Horizon Dental Clinic',
    contact: 'Dr. Amara Patel',
    subject: 'Patient Management System',
    priority: 'low',
    status: 'approved',
    received: '2026-08-04',
    aiScore: 85,
  },
]

export const demoPendingApprovals = [
  {
    id: 'appr-001',
    enquiryId: 'enq-001',
    company: 'Meridian Retail Group',
    type: 'Quotation',
    description:
      'AI-generated quotation for ERP integration project: ₦4.2M for 6-month implementation. Includes data migration, staff training, and 1-year support.',
    priority: 'high',
    createdAt: '2026-08-07T14:30:00Z',
  },
  {
    id: 'appr-002',
    enquiryId: 'enq-002',
    company: 'BlueSky Logistics',
    type: 'Response',
    description:
      'AI-generated initial response requesting clarification on warehouse size, number of SKUs, and current system. Ready to send via email.',
    priority: 'high',
    createdAt: '2026-08-07T11:15:00Z',
  },
  {
    id: 'appr-003',
    enquiryId: 'enq-003',
    company: 'Sunridge Café Chain',
    type: 'Follow-up',
    description:
      'Schedule a discovery call to discuss POS requirements across 12 café locations. AI suggests Tuesday 10 AM or Thursday 2 PM.',
    priority: 'medium',
    createdAt: '2026-08-06T16:00:00Z',
  },
]

export const demoFollowUps = [
  {
    id: 'fu-001',
    company: 'NextGen Architects',
    contact: 'Lisa Chen',
    subject: 'Chase missing technical requirements',
    dueDate: '2026-08-08',
    status: 'overdue',
  },
  {
    id: 'fu-002',
    company: 'Peak Fitness Studios',
    contact: 'Marcus Webb',
    subject: 'Send revised pricing proposal',
    dueDate: '2026-08-08',
    status: 'today',
  },
  {
    id: 'fu-003',
    company: 'Horizon Dental Clinic',
    contact: 'Dr. Amara Patel',
    subject: 'Demo call confirmation',
    dueDate: '2026-08-09',
    status: 'upcoming',
  },
  {
    id: 'fu-004',
    company: 'BlueSky Logistics',
    contact: 'Priya Nair',
    subject: 'Follow up on proposal sent',
    dueDate: '2026-08-10',
    status: 'upcoming',
  },
]
