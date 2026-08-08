import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding OPSPILOT database...\n');

  // ── Demo User ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@opspilot.ai' },
    update: { name: 'Rajan Mehta', passwordHash },
    create: {
      name: 'Rajan Mehta',
      email: 'demo@opspilot.ai',
      passwordHash,
    },
  });
  console.log(`✅ Demo user: ${user.email} (password: Demo@1234)`);

  // ── 1. LOW Priority — Exploratory enquiry (missing info) ─────────────────
  const eq1 = await prisma.enquiry.create({
    data: {
      userId: user.id,
      rawContent:
        'Hi, I was just wondering if you do website design. I have a small bakery and might need a website at some point. No rush at all, just exploring options. Thanks.',
      sourceType: 'TEXT',
      customerName: null,
      customerEmail: null,
      requirements: ['Website design', 'Small business website'],
      priority: 'LOW',
      status: 'REVIEW',
      aiSummary:
        'Exploratory enquiry from a small bakery owner. No timeline, budget, or contact details provided. Multiple clarifications needed.',
      missingQuestions: [
        'What is your name and email address?',
        'What is your approximate budget for the website?',
        'When do you need the website by?',
        'What features do you need (menu, online ordering, contact form)?',
      ],
    },
  });
  console.log(`✅ Enquiry 1 (LOW — exploratory bakery enquiry): ${eq1.id}`);

  // ── 2. MEDIUM Priority — Clear requirements with some gaps ────────────────
  const eq2 = await prisma.enquiry.create({
    data: {
      userId: user.id,
      rawContent:
        'Hello, I need a mobile app for my retail store to manage inventory and track daily sales. My budget is around 80,000 INR and I need it within 3 months. Please contact me at priya@retailpro.in or +91 98765 43210.',
      sourceType: 'EMAIL',
      customerName: 'Priya Sharma',
      customerEmail: 'priya@retailpro.in',
      customerPhone: '+91 98765 43210',
      requirements: ['Mobile app', 'Inventory management', 'Sales tracking', 'Retail POS'],
      budget: 80000,
      currency: 'INR',
      timeline: '3 months',
      priority: 'MEDIUM',
      status: 'REVIEW',
      aiSummary:
        'Retail store owner requires a mobile app for inventory management and daily sales tracking. Budget: INR 80,000. Timeline: 3 months.',
      missingQuestions: [
        'iOS, Android, or both platforms?',
        'How many users/staff will use the app?',
        'Do you need cloud data sync across devices?',
      ],
    },
  });

  await prisma.followUp.createMany({
    data: [
      {
        enquiryId: eq2.id,
        title: 'Clarify platform requirements (iOS/Android/Both)',
        description:
          'Contact Priya at priya@retailpro.in to confirm platform preference and user count.',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        enquiryId: eq2.id,
        title: 'Send detailed requirements questionnaire',
        description:
          'Send a technical requirements form covering POS integration, barcode scanning, and reporting needs.',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    ],
  });
  console.log(`✅ Enquiry 2 (MEDIUM — retail mobile app): ${eq2.id}`);

  // ── 3. HIGH Priority — Urgent with full details + quotation + approval ────
  const eq3 = await prisma.enquiry.create({
    data: {
      userId: user.id,
      rawContent:
        'URGENT! Our manufacturing unit needs a complete ERP system immediately. Our current system crashed 2 days ago and we are losing critical production data daily. We need inventory management, production tracking, purchase orders, and basic accounting. Budget: 3,50,000 INR. Contact: Aditya Kumar, aditya@manufact.in, 9123456789. We need this running ASAP.',
      sourceType: 'TEXT',
      customerName: 'Aditya Kumar',
      customerEmail: 'aditya@manufact.in',
      customerPhone: '9123456789',
      requirements: [
        'ERP system',
        'Inventory management',
        'Production tracking',
        'Purchase order management',
        'Basic accounting module',
        'Data recovery from crashed system',
      ],
      budget: 350000,
      currency: 'INR',
      timeline: 'As soon as possible',
      priority: 'HIGH',
      status: 'REVIEW',
      aiSummary:
        'CRITICAL: Manufacturing unit facing operational crisis due to system failure. Full ERP required immediately. Budget INR 3,50,000. Multiple modules needed. Escalate immediately.',
      missingQuestions: [
        'How many concurrent users will access the system?',
        'What is the current system/software that crashed?',
        'What data formats are available for migration?',
      ],
      generatedResponse: `Dear Aditya Kumar,

Thank you for reaching out to us. We fully understand the critical nature of your situation and have escalated your enquiry to our highest priority queue.

We understand you need:
• Complete ERP system for your manufacturing unit
• Inventory management
• Production tracking
• Purchase order management
• Basic accounting module
• Data recovery from your crashed system

Your budget of INR 3,50,000 has been noted and we have prepared a preliminary proposal.

Our emergency response team will call you at 9123456789 within the next 2 hours to discuss an accelerated deployment plan.

Please note: We will need to assess your existing data for recovery — please keep a backup of any available files.

We are committed to getting your operations back on track as quickly as possible.

Warm regards,
The OPSPILOT Business Team`,
    },
  });

  // Quotation for eq3
  const quotation3 = await prisma.quotation.create({
    data: {
      enquiryId: eq3.id,
      title: 'Emergency ERP Implementation Proposal — Aditya Kumar Manufacturing',
      description:
        'Complete ERP system implementation for manufacturing unit with emergency deployment and data recovery services.',
      items: [
        { description: 'ERP Software License (Annual)', quantity: 1, unitPrice: 120000, total: 120000 },
        { description: 'Emergency Implementation & Configuration', quantity: 1, unitPrice: 85000, total: 85000 },
        { description: 'Data Recovery & Migration Services', quantity: 1, unitPrice: 60000, total: 60000 },
        { description: 'User Training (5 sessions)', quantity: 5, unitPrice: 8000, total: 40000 },
        { description: 'Annual Support & Maintenance Contract', quantity: 1, unitPrice: 45000, total: 45000 },
      ],
      subtotal: 350000,
      tax: 63000,
      total: 413000,
      currency: 'INR',
      validityDays: 7,
      notes:
        'Emergency deployment timeline. 24/7 support during critical go-live period. ' +
        'Payment terms: 40% advance on order confirmation, 40% on system go-live, 20% after training completion. ' +
        'Data recovery is subject to availability of backup files.',
      status: 'PENDING_APPROVAL',
    },
  });

  // Approval pending for quotation
  await prisma.approval.create({
    data: {
      enquiryId: eq3.id,
      quotationId: quotation3.id,
      actionType: 'SEND_QUOTATION',
      status: 'PENDING',
      comments: 'Awaiting manager review before sending to Aditya Kumar',
    },
  });

  // Approval pending for response
  await prisma.approval.create({
    data: {
      enquiryId: eq3.id,
      actionType: 'SEND_RESPONSE',
      status: 'PENDING',
    },
  });

  await prisma.followUp.createMany({
    data: [
      {
        enquiryId: eq3.id,
        title: 'URGENT: Call Aditya Kumar immediately',
        description: 'Call 9123456789. Discuss emergency ERP deployment options and data recovery timeline.',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        enquiryId: eq3.id,
        title: 'Get manager approval on quotation',
        description: 'Show INR 4,13,000 quotation to manager for approval before sending to client.',
        dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      {
        enquiryId: eq3.id,
        title: 'Schedule emergency site assessment',
        description: 'Visit manufacturing unit to assess current infrastructure and crashed system.',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    ],
  });
  console.log(`✅ Enquiry 3 (HIGH — urgent ERP): ${eq3.id}`);

  // ── 4. MEDIUM Priority — with missing critical info ─────────────────────
  const eq4 = await prisma.enquiry.create({
    data: {
      userId: user.id,
      rawContent:
        'I want something for my business. Can you help? I need software for managing things. My business is doing okay but I want to grow. Can you call me?',
      sourceType: 'TEXT',
      priority: 'LOW',
      status: 'REVIEW',
      aiSummary:
        'Very vague enquiry with no specific requirements, budget, or contact details. Multiple critical clarifications are needed before any work can proceed.',
      missingQuestions: [
        'What is your name and contact information?',
        'What type of business do you operate?',
        'What specific problem are you trying to solve?',
        'What is your approximate budget?',
        'What is your desired timeline?',
      ],
    },
  });
  console.log(`✅ Enquiry 4 (LOW — vague missing-info): ${eq4.id}`);

  // ── 5. COMPLETED workflow example ─────────────────────────────────────────
  const eq5 = await prisma.enquiry.create({
    data: {
      userId: user.id,
      rawContent:
        'Hello, I need an e-commerce website for my handmade jewellery business. I want product listings, shopping cart, payment gateway (Razorpay), and order management. Budget: 1,20,000 INR. Timeline: 6 weeks. Contact: Meera Joshi, meera@jewels.co.in, +91 97654 32109.',
      sourceType: 'EMAIL',
      customerName: 'Meera Joshi',
      customerEmail: 'meera@jewels.co.in',
      customerPhone: '+91 97654 32109',
      requirements: [
        'E-commerce website',
        'Product listing management',
        'Shopping cart',
        'Razorpay payment integration',
        'Order management system',
      ],
      budget: 120000,
      currency: 'INR',
      timeline: '6 weeks',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      aiSummary:
        'Clear e-commerce requirement for jewellery business. Specific tech stack (Razorpay) and timeline mentioned. Well-defined scope.',
      missingQuestions: [],
    },
  });

  const quotation5 = await prisma.quotation.create({
    data: {
      enquiryId: eq5.id,
      title: 'E-Commerce Website — Meera Joshi Jewellery',
      description: 'Complete e-commerce solution for handmade jewellery business.',
      items: [
        { description: 'E-Commerce Website Design & Development', quantity: 1, unitPrice: 55000, total: 55000 },
        { description: 'Product Catalogue & CMS Setup', quantity: 1, unitPrice: 20000, total: 20000 },
        { description: 'Razorpay Payment Gateway Integration', quantity: 1, unitPrice: 15000, total: 15000 },
        { description: 'Order Management System', quantity: 1, unitPrice: 20000, total: 20000 },
        { description: 'Training & Handover', quantity: 1, unitPrice: 10000, total: 10000 },
      ],
      subtotal: 120000,
      tax: 21600,
      total: 141600,
      currency: 'INR',
      validityDays: 30,
      notes: 'Payment: 50% advance, 50% on completion. Includes 3 months post-launch support.',
      status: 'APPROVED',
    },
  });

  await prisma.approval.create({
    data: {
      enquiryId: eq5.id,
      quotationId: quotation5.id,
      actionType: 'SEND_QUOTATION',
      status: 'APPROVED',
      approvedBy: user.id,
      comments: 'Approved and sent to client. Project confirmed.',
    },
  });

  await prisma.followUp.createMany({
    data: [
      {
        enquiryId: eq5.id,
        title: 'Collect advance payment',
        description: 'Collect 50% advance (INR 70,800) from Meera Joshi.',
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
      },
      {
        enquiryId: eq5.id,
        title: 'Project kick-off call',
        description: 'Schedule kick-off call with Meera to finalise design preferences.',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
      },
    ],
  });
  console.log(`✅ Enquiry 5 (COMPLETED — e-commerce project): ${eq5.id}`);

  console.log('\n════════════════════════════════════');
  console.log('✅ Seed completed successfully!');
  console.log('════════════════════════════════════');
  console.log('📧 Demo login credentials:');
  console.log('   Email:    demo@opspilot.ai');
  console.log('   Password: Demo@1234');
  console.log('════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
