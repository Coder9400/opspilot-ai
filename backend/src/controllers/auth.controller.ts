import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { sendSuccess } from '../utils/response';
import { ValidationError } from '../utils/errors';

export const AuthController = {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Registration failed — invalid input', parsed.error.flatten());
      }
      const result = await AuthService.register(parsed.data);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Login failed — invalid input', parsed.error.flatten());
      }
      const result = await AuthService.login(parsed.data);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.headers.authorization?.slice(7) ?? '';
      const user = await AuthService.me(req.user!.id, token);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  },
};
