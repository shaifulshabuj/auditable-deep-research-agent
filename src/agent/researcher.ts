import {
  Env,
  ResearchSession,
  SourceChunk,
  SourceDocument,
  SubQuestionItem,
  VectorProvenanceMetadata,
} from '../types';
import { D1Service } from '../services/d1';
import { chunkDocument, cleanExtractedText, executeWebSearch } from '../services/search';
import { generateEmbeddings } from '../services/embeddings';
import { upsertVectors, VectorRecord } from '../services/vectorize';

export interface ResearchWorkerOutput {
  sources: SourceDocument[];
  chunks: SourceChunk[];
}

export async function runResearchWorkerNode(
  session: ResearchSession,
  subQuestions: SubQuestionItem[],
  env: Env,
  d1Service: D1Service
): Promise<ResearchWorkerOutput> {
  const allSources: SourceDocument[] = [];
  const allChunks: SourceChunk[] = [];

  for (let i = 0; i < subQuestions.length; i++) {
    const sq = subQuestions[i];

    await d1Service.logAudit(
      session.id,
      'worker',
      `Executing search for sub-question (${i + 1}/${subQuestions.length}): "${sq.question}"`,
      'ResearchWorkerNode',
      { subQuestionId: sq.id, searchQuery: sq.searchQuery }
    );

    // 1. Fetch raw search results
    const rawResults = await executeWebSearch(sq.searchQuery, env, 4);

    const subqSources: SourceDocument[] = [];
    const subqChunks: SourceChunk[] = [];

    for (let rIdx = 0; rIdx < rawResults.length; rIdx++) {
      const res = rawResults[rIdx];
      const sourceId = `src_${session.id.slice(0, 6)}_${sq.id.split('_').pop()}_${rIdx + 1}`;
      let domain = 'unknown';
      try {
        domain = new URL(res.url).hostname;
      } catch {
        domain = 'web-source';
      }

      const cleanContent = cleanExtractedText(res.content);
      const doc: SourceDocument = {
        id: sourceId,
        sessionId: session.id,
        subQuestionId: sq.id,
        url: res.url,
        title: res.title,
        domain,
        rawContent: cleanContent,
        chunkCount: 0,
        crawledAt: new Date().toISOString(),
      };

      // 2. Chunk document with exact start/end character offsets
      const chunks = chunkDocument(doc, { chunkSize: 500, chunkOverlap: 80 });
      doc.chunkCount = chunks.length;

      subqSources.push(doc);
      subqChunks.push(...chunks);
    }

    // 3. Generate embeddings in batch for all chunks of this sub-question
    const chunkTexts = subqChunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts, env);

    // 4. Index into Vectorize with granular provenance metadata
    const vectorRecords: VectorRecord[] = subqChunks.map((chk, idx) => {
      const parentSource = subqSources.find((s) => s.id === chk.sourceId);
      const provenance: VectorProvenanceMetadata = {
        sessionId: session.id,
        sourceId: chk.sourceId,
        subQuestionId: chk.subQuestionId,
        chunkId: chk.id,
        url: parentSource?.url || '',
        title: parentSource?.title || '',
        domain: parentSource?.domain || '',
        chunkIndex: chk.chunkIndex,
        totalChunks: parentSource?.chunkCount || 1,
        charStart: chk.charStart,
        charEnd: chk.charEnd,
        crawledAt: parentSource?.crawledAt || new Date().toISOString(),
        queryOrigin: sq.searchQuery,
      };

      return {
        id: chk.id,
        values: embeddings[idx] || new Array(768).fill(0),
        namespace: session.id,
        metadata: provenance as unknown as Record<string, string | number | boolean>,
      };
    });

    await upsertVectors(vectorRecords, env);

    // 5. Persist sources and chunks in D1
    await d1Service.saveSourcesAndChunks(subqSources, subqChunks);

    await d1Service.logAudit(
      session.id,
      'worker',
      `Harvested and indexed ${subqSources.length} sources (${subqChunks.length} chunks) for sub-question ${sq.id}`,
      'ResearchWorkerNode',
      {
        subQuestionId: sq.id,
        sourceCount: subqSources.length,
        chunkCount: subqChunks.length,
        sources: subqSources.map((s) => ({ title: s.title, url: s.url })),
      }
    );

    allSources.push(...subqSources);
    allChunks.push(...subqChunks);
  }

  return {
    sources: allSources,
    chunks: allChunks,
  };
}
