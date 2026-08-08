import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { prisma } from '../config/prisma';

export const DashboardController = {
  async summary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;

      const [
        totalEnquiries,
        newEnquiries,
        analyzingEnquiries,
        reviewEnquiries,
        approvedEnquiries,
        completedWorkflows,
        highPriorityEnquiries,
        mediumPriorityEnquiries,
        lowPriorityEnquiries,
        pendingApprovals,
        totalQuotations,
        approvedQuotations,
        pendingFollowUps,
        completedFollowUps,
      ] = await Promise.all([
        // Enquiry counts
        prisma.enquiry.count({ where: { userId } }),
        prisma.enquiry.count({ where: { userId, status: 'NEW' } }),
        prisma.enquiry.count({ where: { userId, status: 'ANALYZING' } }),
        prisma.enquiry.count({ where: { userId, status: 'REVIEW' } }),
        prisma.enquiry.count({ where: { userId, status: 'APPROVED' } }),
        prisma.enquiry.count({ where: { userId, status: 'COMPLETED' } }),

        // Priority counts
        prisma.enquiry.count({ where: { userId, priority: 'HIGH' } }),
        prisma.enquiry.count({ where: { userId, priority: 'MEDIUM' } }),
        prisma.enquiry.count({ where: { userId, priority: 'LOW' } }),

        // Approvals
        prisma.approval.count({
          where: { enquiry: { userId }, status: 'PENDING' },
        }),

        // Quotations
        prisma.quotation.count({ where: { enquiry: { userId } } }),
        prisma.quotation.count({
          where: { enquiry: { userId }, status: 'APPROVED' },
        }),

        // Follow-ups
        prisma.followUp.count({
          where: { enquiry: { userId }, status: 'PENDING' },
        }),
        prisma.followUp.count({
          where: { enquiry: { userId }, status: 'COMPLETED' },
        }),
      ]);

      // Recent high-priority enquiries needing attention
      const recentHighPriority = await prisma.enquiry.findMany({
        where: { userId, priority: 'HIGH', status: { in: ['NEW', 'REVIEW'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          customerName: true,
          aiSummary: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      });

      sendSuccess(res, {
        enquiries: {
          total: totalEnquiries,
          byStatus: {
            new: newEnquiries,
            analyzing: analyzingEnquiries,
            review: reviewEnquiries,
            approved: approvedEnquiries,
            completed: completedWorkflows,
          },
          byPriority: {
            high: highPriorityEnquiries,
            medium: mediumPriorityEnquiries,
            low: lowPriorityEnquiries,
          },
        },
        approvals: {
          pending: pendingApprovals,
        },
        quotations: {
          total: totalQuotations,
          approved: approvedQuotations,
          pendingApproval: totalQuotations - approvedQuotations,
        },
        followUps: {
          pending: pendingFollowUps,
          completed: completedFollowUps,
          total: pendingFollowUps + completedFollowUps,
        },
        recentHighPriority,
      });
    } catch (err) {
      next(err);
    }
  },
};
