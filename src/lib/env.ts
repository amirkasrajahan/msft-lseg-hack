import { z } from 'zod';

const envSchema = z.object({
  // `.env` currently holds the key as `openai-api-key`; accept it as a fallback.
  AZURE_OPENAI_API_KEY: z.string().min(1),
  AZURE_OPENAI_ENDPOINT: z.string().url(),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-12-01-preview'),
  AZURE_OPENAI_CHAT_DEPLOYMENT: z.string().default('gpt-6.1-sol'),
  AZURE_OPENAI_EMBEDDING_DEPLOYMENT: z.string().default('text-embedding-3-large'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Lazy so mock mode (USE_MOCKS=1) works with no credentials at all. */
export function getEnv(): Env {
  cached ??= envSchema.parse({
    ...process.env,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY ?? process.env['openai-api-key'],
    AZURE_OPENAI_ENDPOINT:
      process.env.AZURE_OPENAI_ENDPOINT ?? 'https://app-uoaihack2ix6ak.azurewebsites.net',
  });
  return cached;
}

export const useMocks = () => process.env.USE_MOCKS === '1';
