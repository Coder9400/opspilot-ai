import { prisma } from '../config/prisma';
import { CreateEnquiryInput, EnquiryFilterInput } from '../validators/enquiry.validator';
import { AIService } from '../ai/ai.service';
import { NotFoundError, ForbiddenError, AIError } from '../utils/errors';
import { EnquiryAnalysis } from '../ai/ai.types';
import { Prisma } from '@prisma/client';

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildEnquiryContext(enquiry: {
  rawContent: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  requirements: Prisma.JsonValue | null;
  budget: number | null;
  currency: string | null;
  timeline: string | null;
  priority: string | null;
  missingQuestions: Prisma.JsonValue | null;
  aiSummary: string | null;
}) {
  return {
    rawContent: enquiry.rawContent,
    customerName: enquiry.customerName,
    customerEmail: enquiry.customerEmail,
    customerPhone: enquiry.customerPhone,
    requirements: Array.isArray(enquiry.requirements)
      ? (enquiry.requirements as string[])
      : undefined,
    budget: enquiry.budget,
    currency: enquiry.currency,
    timeline: enquiry.timeline,
    priority: enquiry.priority,
    missingQuestions: Array.isArray(enquiry.missingQuestions)
      ? (enquiry.missingQuestions as string[])
      : undefined,
    aiSummary: enquiry.aiSummary,
  };
}

// ─── Enquiry Service ──────────────────────────────────────────────────────────

export const EnquiryService = {
  // ── Create ────────────────────────────────────────────────────────────────

  async create(userId: string, input: CreateEnquiryInput) {
    return prisma.enquiry.create({
      data: {
        userId,
        rawContent: input.content,
        sourceType: input.sourceType,
        status: 'NEW',
      },
    });
  },

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(userId: string, filter: EnquiryFilterInput) {
    const { status, priority, page, limit } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.EnquiryWhereInput = { userId };
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [total, enquiries] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { quotations: true, followUps: true, approvals: true },
          },
        },
      }),
    ]);

    return {
      enquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ── Get By ID ─────────────────────────────────────────────────────────────

  async findById(id: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        quotations: { orderBy: { createdAt: 'desc' } },
        followUps: { orderBy: { dueDate: 'asc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    return enquiry;
  },

  // ── Analyze ───────────────────────────────────────────────────────────────

  async analyze(id: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    // Mark as analyzing
    await prisma.enquiry.update({ where: { id }, data: { status: 'ANALYZING' } });

    let analysis: EnquiryAnalysis;
    try {
      analysis = await AIService.analyzeEnquiry(enquiry.rawContent);
    } catch (err) {
      // Restore safe status on AI failure
      await prisma.enquiry.update({ where: { id }, data: { status: 'NEW' } });
      throw err;
    }

    // Validate priority
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(analysis.priority)) {
      await prisma.enquiry.update({ where: { id }, data: { status: 'NEW' } });
      throw new AIError(`AI returned an invalid priority: "${analysis.priority}"`);
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: {
        customerName: analysis.customerName,
        customerEmail: analysis.customerEmail,
        customerPhone: analysis.customerPhone,
        requirements: analysis.requirements,
        budget: analysis.budget,
        currency: analysis.currency,
        timeline: analysis.timeline,
        priority: analysis.priority,
        missingQuestions: analysis.missingQuestions,
        aiSummary: analysis.summary,
        status: 'REVIEW',
      },
    });

    return { enquiry: updated, analysis };
  },

  // ── Generate Response ─────────────────────────────────────────────────────

  async generateResponse(id: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(enquiry);
    const result = await AIService.generateResponse(context);

    // Store the generated response on the enquiry
    await prisma.enquiry.update({
      where: { id },
      data: { generatedResponse: result.response },
    });

    // Create an approval record for sending this response
    const existingApproval = await prisma.approval.findFirst({
      where: { enquiryId: id, actionType: 'SEND_RESPONSE', status: 'PENDING' },
    });

    if (!existingApproval) {
      await prisma.approval.create({
        data: {
          enquiryId: id,
          actionType: 'SEND_RESPONSE',
          status: 'PENDING',
        },
      });
    }

    return { response: result.response };
  },

  // ── Generate Quotation ────────────────────────────────────────────────────

  async generateQuotation(id: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(enquiry);
    const result = await AIService.generateQuotation(context);

    if (!result.items || !Array.isArray(result.items) || result.items.length === 0) {
      throw new AIError('AI generated an invalid quotation: items array is empty or missing');
    }

    const quotation = await prisma.quotation.create({
      data: {
        enquiryId: id,
        title: result.title,
        description: result.description,
        items: result.items as unknown as Prisma.InputJsonValue,
        subtotal: result.subtotal,
        tax: result.tax,
        total: result.total,
        currency: result.currency || 'INR',
        validityDays: result.validityDays || 30,
        notes: result.notes,
        status: 'PENDING_APPROVAL', // Always starts as pending — human must approve
      },
    });

    // Create a pending approval for this quotation
    await prisma.approval.create({
      data: {
        enquiryId: id,
        quotationId: quotation.id,
        actionType: 'SEND_QUOTATION',
        status: 'PENDING',
      },
    });

    return quotation;
  },

  // ── Generate Follow-Ups ───────────────────────────────────────────────────

  async generateFollowUps(id: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    const context = buildEnquiryContext(enquiry);
    const result = await AIService.generateFollowUps(context);

    const now = new Date();
    const followUps = await Promise.all(
      result.followUps.map((fu) => {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (fu.daysFromNow || 1));
        return prisma.followUp.create({
          data: {
            enquiryId: id,
            title: fu.title,
            description: fu.description,
            dueDate,
            status: 'PENDING',
          },
        });
      })
    );

    return { followUps };
  },
};
