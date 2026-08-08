import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/followups — all follow-ups for authenticated user
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const statusParam = req.query.status as string | undefined;
    const allowedStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'];
    const statusFilter =
      statusParam && allowedStatuses.includes(statusParam)
        ? (statusParam as 'PENDING' | 'COMPLETED' | 'CANCELLED')
        : undefined;

    const followUps = await prisma.followUp.findMany({
      where: {
        enquiry: { userId: req.user!.id },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        enquiry: { select: { customerName: true, priority: true, status: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    sendSuccess(res, { followUps });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/followups/:id — update follow-up status
router.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const followUpWithEnquiry = await prisma.followUp.findUnique({
      where: { id: req.params.id as string },
      include: { enquiry: { select: { userId: true } } },
    });
    if (!followUpWithEnquiry) throw new NotFoundError('Follow-up');
    if (followUpWithEnquiry.enquiry.userId !== req.user!.id) throw new ForbiddenError();

    const { status } = req.body as { status: 'PENDING' | 'COMPLETED' | 'CANCELLED' };
    const updated = await prisma.followUp.update({
      where: { id: req.params.id as string },
      data: { status },
    });
    sendSuccess(res, { followUp: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
