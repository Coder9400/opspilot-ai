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

export type AIProviderType = 'mistral' | 'mock';

export const env = {
  SUPABASE_URL: requireEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: requireEnv('SUPABASE_ANON_KEY'),
  MISTRAL_API_KEY: optionalEnv('MISTRAL_API_KEY', ''),
  AI_PROVIDER: optionalEnv('AI_PROVIDER', 'mistral') as AIProviderType,
  PORT: parseInt(optionalEnv('PORT', '4000'), 10),
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:5173'),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',
};
