import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// GET /api/quotations — all quotations for authenticated user's enquiries
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quotations = await prisma.quotation.findMany({
      where: { enquiry: { userId: req.user!.id } },
      include: { enquiry: { select: { customerName: true, status: true, priority: true } } },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { quotations });
  } catch (err) {
    next(err);
  }
});

// GET /api/quotations/:id — single quotation
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id as string },
      include: { enquiry: true },
    });
    if (!quotation) throw new NotFoundError('Quotation');
    if (quotation.enquiry.userId !== req.user!.id) throw new ForbiddenError();
    sendSuccess(res, { quotation });
  } catch (err) {
    next(err);
  }
});

export default router;
