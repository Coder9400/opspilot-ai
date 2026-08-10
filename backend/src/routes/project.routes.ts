import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { ProjectController } from '../controllers/project.controller';

const router = Router();
router.use(authenticate);

// GET  /api/projects/stats  — must be before /:id to avoid routing conflict
router.get('/stats', ProjectController.stats);

// GET  /api/projects
router.get('/', ProjectController.list);

// POST /api/projects
router.post('/', ProjectController.create);

// GET  /api/projects/:id
router.get('/:id', ProjectController.getOne);

// PUT  /api/projects/:id
router.put('/:id', ProjectController.update);

// DELETE /api/projects/:id
router.delete('/:id', ProjectController.remove);

export default router;
