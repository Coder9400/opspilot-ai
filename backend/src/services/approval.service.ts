import { prisma } from '../config/prisma';
import { ApprovalActionInput } from '../validators/approval.validator';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export const ApprovalService = {
  // ── Get approval status for an enquiry ────────────────────────────────────

  async getApproval(enquiryId: string, userId: string) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        approvals: { orderBy: { createdAt: 'desc' } },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    return {
      enquiryId,
      enquiryStatus: enquiry.status,
      approvals: enquiry.approvals,
      latestQuotation: enquiry.quotations[0] ?? null,
      pendingApprovals: enquiry.approvals.filter((a) => a.status === 'PENDING'),
    };
  },

  // ── Approve an action ─────────────────────────────────────────────────────

  async approve(enquiryId: string, userId: string, input: ApprovalActionInput) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        approvals: {
          where: { actionType: input.actionType, status: 'PENDING' },
          take: 1,
        },
        quotations: {
          where: { status: 'PENDING_APPROVAL' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    // Find or create the approval record
    let approval = enquiry.approvals[0];
    if (!approval) {
      approval = await prisma.approval.create({
        data: {
          enquiryId,
          quotationId: enquiry.quotations[0]?.id ?? null,
          actionType: input.actionType,
          status: 'PENDING',
        },
      });
    }

    // Mark as approved
    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'APPROVED',
        approvedBy: userId,
        comments: input.comments,
      },
    });

    // Side effects based on action type
    if (input.actionType === 'SEND_QUOTATION' && enquiry.quotations[0]) {
      await prisma.quotation.update({
        where: { id: enquiry.quotations[0].id },
        data: { status: 'APPROVED' },
      });
    }

    const newEnquiryStatus =
      input.actionType === 'COMPLETE_WORKFLOW' ? 'COMPLETED' : 'APPROVED';

    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status: newEnquiryStatus },
    });

    return {
      approval: updatedApproval,
      message:
        input.actionType === 'SEND_RESPONSE'
          ? 'Response approved. Ready to send to customer (simulated — no email sent).'
          : input.actionType === 'SEND_QUOTATION'
          ? 'Quotation approved. Ready to send to customer (simulated — no email sent).'
          : 'Workflow marked as completed.',
    };
  },

  // ── Reject an action ──────────────────────────────────────────────────────

  async reject(enquiryId: string, userId: string, input: ApprovalActionInput) {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        approvals: {
          where: { actionType: input.actionType, status: 'PENDING' },
          take: 1,
        },
        quotations: {
          where: { status: 'PENDING_APPROVAL' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!enquiry) throw new NotFoundError('Enquiry');
    if (enquiry.userId !== userId) throw new ForbiddenError('You do not have access to this enquiry');

    let approval = enquiry.approvals[0];
    if (!approval) {
      approval = await prisma.approval.create({
        data: {
          enquiryId,
          quotationId: enquiry.quotations[0]?.id ?? null,
          actionType: input.actionType,
          status: 'PENDING',
        },
      });
    }

    const updatedApproval = await prisma.approval.update({
      where: { id: approval.id },
      data: {
        status: 'REJECTED',
        approvedBy: userId,
        comments: input.comments,
      },
    });

    if (input.actionType === 'SEND_QUOTATION' && enquiry.quotations[0]) {
      await prisma.quotation.update({
        where: { id: enquiry.quotations[0].id },
        data: { status: 'REJECTED' },
      });
    }

    // Return to REVIEW status so the user can make changes
    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status: 'REVIEW' },
    });

    return {
      approval: updatedApproval,
      message: 'Action rejected. Enquiry returned to REVIEW status for revision.',
    };
  },
};
