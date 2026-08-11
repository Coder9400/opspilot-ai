import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as procurement from '../controllers/procurement.controller';

// ─── Procurement Routes ────────────────────────────────────────────────────────

const procurementRouter = Router();
procurementRouter.use(authenticate);

// Procurement Requests
procurementRouter.post('/',                                      procurement.createRequest);
procurementRouter.get('/',                                       procurement.listRequests);
procurementRouter.get('/:id',                                    procurement.getRequest);
procurementRouter.put('/:id',                                    procurement.updateRequest);
procurementRouter.post('/:id/analyze',                           procurement.analyzeRequest);
procurementRouter.post('/:id/reanalyze',                         procurement.reanalyzeRequest);
procurementRouter.get('/:id/questions',                          procurement.getQuestions);
procurementRouter.get('/:id/requirements',                       procurement.getRequirements);
procurementRouter.post('/:id/questions/:questionId/answer',      procurement.answerQuestion);
procurementRouter.post('/:id/generate-rfq',                      procurement.generateRFQ);

// ─── RFQ Routes ───────────────────────────────────────────────────────────────

const rfqRouter = Router();
rfqRouter.use(authenticate);

rfqRouter.get('/',        procurement.listRFQs);
rfqRouter.get('/:id',     procurement.getRFQ);
rfqRouter.put('/:id',     procurement.updateRFQ);
rfqRouter.post('/:id/approve', procurement.approveRFQ);

export { procurementRouter, rfqRouter };
