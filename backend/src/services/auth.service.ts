import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AuthError, ConflictError } from '../utils/errors';
import { AuthenticatedUser } from '../types';

const SALT_ROUNDS = 12;

// Never return passwordHash in API responses
type SafeUser = Omit<{ id: string; name: string; email: string; createdAt: Date; updatedAt: Date; passwordHash: string }, 'passwordHash'>;

function omitPassword(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
}): SafeUser {
  const { passwordHash: _ignored, ...safe } = user;
  return safe;
}

function signToken(user: { id: string; email: string; name: string }): string {
  const payload: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export const AuthService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });

    const token = signToken(user);
    return { user: omitPassword(user), token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Use constant-time comparison to prevent timing attacks
    const dummyHash =
      '$2a$12$invalidhashfortimingattackprevention00000000000000000000';
    const passwordHash = user?.passwordHash ?? dummyHash;
    const isValid = await bcrypt.compare(input.password, passwordHash);

    if (!user || !isValid) {
      throw new AuthError('Invalid email or password');
    }

    const token = signToken(user);
    return { user: omitPassword(user), token };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AuthError('User account not found');
    return omitPassword(user);
  },
};
