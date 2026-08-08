import dotenv from 'dotenv';
dotenv.config();

// ─── Env config ──────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${key}\n` +
        `Please copy .env.example to .env and fill in the values.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export type AIProvider = 'gemini' | 'mock';

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),
  AI_PROVIDER: optionalEnv('AI_PROVIDER', 'mock') as AIProvider,
  AI_API_KEY: optionalEnv('AI_API_KEY', ''),
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:3000'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
};
