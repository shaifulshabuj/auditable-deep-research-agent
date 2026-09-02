import { Env, VectorProvenanceMetadata } from '../types';

export interface VectorRecord {
  id: string;
  values: number[];
  namespace?: string;
  metadata: Record<string, string | number | boolean>;
}

export interface VectorMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// In-memory fallback vector store for tests/local simulation
const memoryVectorStore = new Map<string, { values: number[]; metadata: Record<string, unknown>; namespace?: string }>();

/**
 * Upsert chunks with provenance metadata into Vectorize
 */
export async function upsertVectors(
  records: VectorRecord[],
  env: Env
): Promise<void> {
  if (records.length === 0) return;

  if (env.VECTORIZE) {
    try {
      await env.VECTORIZE.upsert(
        records.map((r) => ({
          id: r.id,
          values: r.values,
          namespace: r.namespace,
          metadata: r.metadata,
        }))
      );
      return;
    } catch (error) {
      console.warn('Vectorize upsert failed, storing in local fallback:', error);
    }
  }

  // Fallback storage
  for (const record of records) {
    memoryVectorStore.set(record.id, {
      values: record.values,
      metadata: record.metadata,
      namespace: record.namespace,
    });
  }
}

/**
 * Semantic vector search using cosine similarity
 */
export async function queryVectors(
  queryVector: number[],
  env: Env,
  options: {
    topK?: number;
    namespace?: string;
    filter?: Record<string, unknown>;
  } = {}
): Promise<VectorMatch[]> {
  const topK = options.topK || 5;

  if (env.VECTORIZE) {
    try {
      const response = await env.VECTORIZE.query(queryVector, {
        topK,
        namespace: options.namespace,
        returnMetadata: 'all',
        filter: options.filter as any,
      });

      if (response && response.matches) {
        return response.matches.map((m) => ({
          id: m.id,
          score: m.score,
          metadata: m.metadata as Record<string, unknown>,
        }));
      }
    } catch (error) {
      console.warn('Vectorize query failed, falling back to local search:', error);
    }
  }

  // Local fallback cosine similarity search
  const matches: VectorMatch[] = [];

  for (const [id, record] of memoryVectorStore.entries()) {
    if (options.namespace && record.namespace !== options.namespace) {
      continue;
    }

    if (options.filter) {
      let matchesFilter = true;
      for (const [key, value] of Object.entries(options.filter)) {
        if (record.metadata?.[key] !== value) {
          matchesFilter = false;
          break;
        }
      }
      if (!matchesFilter) continue;
    }

    const score = cosineSimilarity(queryVector, record.values);
    matches.push({
      id,
      score,
      metadata: record.metadata,
    });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, topK);
}

/**
 * Retrieve vector metadata by IDs
 */
export async function getVectorsByIds(
  ids: string[],
  env: Env
): Promise<VectorMatch[]> {
  if (ids.length === 0) return [];

  if (env.VECTORIZE) {
    try {
      const results = await env.VECTORIZE.getByIds(ids);
      return results.map((r) => ({
        id: r.id,
        score: 1.0,
        metadata: r.metadata as Record<string, unknown>,
      }));
    } catch (error) {
      console.warn('Vectorize getByIds failed, checking local memory:', error);
    }
  }

  const results: VectorMatch[] = [];
  for (const id of ids) {
    const item = memoryVectorStore.get(id);
    if (item) {
      results.push({
        id,
        score: 1.0,
        metadata: item.metadata,
      });
    }
  }
  return results;
}

/**
 * Cosine similarity between two float vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
