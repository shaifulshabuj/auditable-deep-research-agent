import { describe, it, expect } from 'vitest';
import { generateDeterministicEmbedding, generateEmbeddings } from '../src/services/embeddings';
import { upsertVectors, queryVectors, getVectorsByIds } from '../src/services/vectorize';
import { Env } from '../src/types';

describe('Vector Operations & Provenance Metadata', () => {
  const mockEnv: Env = {
    DB: null as any,
  };

  it('generates normalized 768-dimensional embeddings', async () => {
    const vectors = await generateEmbeddings(['Quantum computing algorithms in 2026'], mockEnv);
    expect(vectors).toHaveLength(1);
    expect(vectors[0]).toHaveLength(768);

    // Verify L2 norm is approx 1.0
    const norm = Math.sqrt(vectors[0].reduce((sum, val) => sum + val * val, 0));
    expect(norm).toBeCloseTo(1.0, 3);
  });

  it('upserts vectors and performs cosine search with session filtering', async () => {
    const vec1 = generateDeterministicEmbedding('Solid state batteries cathode chemistry');
    const vec2 = generateDeterministicEmbedding('Post quantum encryption Dilithium');

    await upsertVectors(
      [
        {
          id: 'chunk_battery_1',
          values: vec1,
          namespace: 'session_battery',
          metadata: { category: 'batteries', charStart: 0, charEnd: 500 },
        },
        {
          id: 'chunk_crypto_1',
          values: vec2,
          namespace: 'session_crypto',
          metadata: { category: 'crypto', charStart: 0, charEnd: 480 },
        },
      ],
      mockEnv
    );

    // Query for batteries in session_battery namespace
    const matches = await queryVectors(vec1, mockEnv, {
      topK: 2,
      namespace: 'session_battery',
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].id).toBe('chunk_battery_1');
    expect(matches[0].score).toBeCloseTo(1.0, 2);

    // Retrieve by IDs
    const retrieved = await getVectorsByIds(['chunk_battery_1'], mockEnv);
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].metadata?.category).toBe('batteries');
  });
});
