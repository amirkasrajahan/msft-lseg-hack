import { createAzure } from '@ai-sdk/azure';
import { embedMany, generateText, Output } from 'ai';
import type { z } from 'zod';
import { getEnv } from './env';

/**
 * Single place that knows about Azure. Everything else imports from here.
 * The portal mirrors the classic Azure URL shape:
 *   {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=...
 */
function provider() {
  const env = getEnv();
  return createAzure({
    baseURL: `${env.AZURE_OPENAI_ENDPOINT}/openai`,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.AZURE_OPENAI_API_VERSION,
    useDeploymentBasedUrls: true,
  });
}

/** Chat Completions model (the portal sample uses chat.completions, not Responses). */
export const chatModel = () => provider().chat(getEnv().AZURE_OPENAI_CHAT_DEPLOYMENT);

export const embeddingModel = () => provider().embedding(getEnv().AZURE_OPENAI_EMBEDDING_DEPLOYMENT);

/** Generate a value validated against a zod schema. Use for every non-chat LLM call. */
export async function generateStructured<S extends z.ZodType>(opts: {
  schema: S;
  system?: string;
  prompt: string;
}): Promise<z.infer<S>> {
  const { output } = await generateText({
    model: chatModel(),
    output: Output.object({ schema: opts.schema }),
    system: opts.system,
    prompt: opts.prompt,
  });
  return output as z.infer<S>;
}

export async function embedTexts(values: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: embeddingModel(), values });
  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
