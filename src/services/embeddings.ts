import { Env } from '../types';

export const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate 768-dimensional embeddings using Cloudflare Workers AI
 * Falls back to a deterministic semantic pseudo-embedding if AI binding is unavailable
 */
export async function generateEmbeddings(
  texts: string[],
  env: Env
): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Truncate overly long text strings to avoid token overflow
  const cleanTexts = texts.map((t) => t.slice(0, 2000));

  if (env.AI) {
    try {
      const response = await env.AI.run(EMBEDDING_MODEL, {
        text: cleanTexts,
      });

      if (response && 'data' in response && Array.isArray(response.data)) {
        return response.data as number[][];
      }
    } catch (error) {
      console.warn('Workers AI embedding failed, falling back to local generator:', error);
    }
  }

  // Fallback: Deterministic embedding generator (useful for local dev/testing without active AI binding)
  return cleanTexts.map((text) => generateDeterministicEmbedding(text, EMBEDDING_DIMENSIONS));
}

/**
 * Generate a single embedding vector
 */
export async function generateEmbedding(
  text: string,
  env: Env
): Promise<number[]> {
  const vectors = await generateEmbeddings([text], env);
  return vectors[0] || new Array(EMBEDDING_DIMENSIONS).fill(0);
}

/**
 * Deterministic pseudo-embedding for testing and local runtime
 */
export function generateDeterministicEmbedding(text: string, dimensions = 768): number[] {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();

  // Multi-pass hash distribution
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (charCode * 31 + i * 17) % dimensions;
    vector[index] += Math.sin(charCode * (i + 1));
  }

  // Normalize to unit length (L2 norm) for cosine distance
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  } else {
    vector[0] = 1.0;
  }

  return vector;
}
