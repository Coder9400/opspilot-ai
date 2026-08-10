import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ProjectService } from '../services/project.service';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import { ValidationError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const ProjectController = {
  // GET /api/projects
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await ProjectService.listProjects(req.user!.id);
      sendSuccess(res, { projects });
    } catch (err) { next(err); }
  },

  // GET /api/projects/stats
  async stats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await ProjectService.getProjectStats(req.user!.id);
      sendSuccess(res, { stats });
    } catch (err) { next(err); }
  },

  // POST /api/projects
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid project data', parsed.error.flatten());
      }
      const project = await ProjectService.createProject(req.user!.id, parsed.data);
      sendSuccess(res, { project }, 201 as number);
    } catch (err) { next(err); }
  },

  // GET /api/projects/:id
  async getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProject(req.user!.id, req.params['id'] as string);
      sendSuccess(res, { project });
    } catch (err) { next(err); }
  },

  // PUT /api/projects/:id
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Invalid project update data', parsed.error.flatten());
      }
      const project = await ProjectService.updateProject(req.user!.id, req.params['id'] as string, parsed.data);
      sendSuccess(res, { project });
    } catch (err) { next(err); }
  },

  // DELETE /api/projects/:id
  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProjectService.deleteProject(req.user!.id, req.params['id'] as string);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },
};
