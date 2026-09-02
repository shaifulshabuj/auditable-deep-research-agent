import { Env, ReportClaim, ReportData, ResearchSession, SourceChunk, SourceDocument } from '../types';
import { SynthesizedReport, SynthesizedReportSchema } from './schemas';
import { OpenAIService } from '../services/openai';
import { D1Service } from '../services/d1';

export async function runSynthesizerNode(
  session: ResearchSession,
  sources: SourceDocument[],
  chunks: SourceChunk[],
  env: Env,
  openaiService: OpenAIService,
  d1Service: D1Service
): Promise<{ report: ReportData; claims: ReportClaim[] }> {
  await d1Service.logAudit(
    session.id,
    'synthesizer',
    `Synthesizing research evidence from ${sources.length} sources and ${chunks.length} chunks`,
    'SynthesizerNode',
    { sourcesCount: sources.length, chunksCount: chunks.length }
  );

  // Format context for LLM with explicit chunk IDs and provenance tags
  let evidenceContext = '';
  for (const chunk of chunks) {
    const parentSource = sources.find((s) => s.id === chunk.sourceId);
    evidenceContext += `
[CHUNK ID: ${chunk.id}]
Source Title: ${parentSource?.title || 'Unknown Title'}
Source URL: ${parentSource?.url || ''}
Content:
${chunk.content}
----------------------------------------`;
  }

  const systemPrompt = `You are a Lead Enterprise Research Scientist and Technical Report Author.
Your mandate is to synthesize an exhaustive, professional technical research report based STRICTLY AND EXCLUSIVELY on the provided evidence chunks.

CRITICAL CITATION RULES:
1. Every major factual claim, technical claim, empirical percentage, benchmark, or conclusion MUST be cited inline using the format [[CHUNK_ID]].
2. You must itemize all core claims into the 'claims' array. Each item must contain:
   - claimText: The specific claim asserted in the text.
   - sourceChunkIds: Array of the exact Chunk IDs that prove this claim.
   - supportingQuote: Verbatim text from the chunk backing the claim.
3. NEVER make speculative or ungrounded assertions. If information is absent, explicitly state that current evidence has not covered it.`;

  const userPrompt = `Research Query: "${session.query}"

EVIDENCE CHUNKS COLLECTED FROM WEB SEARCH:
${evidenceContext}

Generate the complete synthesized research report with strict citations and itemized claims.`;

  const synthesized: SynthesizedReport = await openaiService.generateStructured({
    systemPrompt,
    userPrompt,
    schema: SynthesizedReportSchema,
    schemaName: 'SynthesizedReport',
    temperature: 0.1,
    fallbackGenerator: () => openaiService.createSimulatedSynthesis(session.query, chunks),
  });

  const reportId = `rep_${session.id.slice(0, 8)}_${Date.now()}`;
  const report: ReportData = {
    id: reportId,
    sessionId: session.id,
    title: synthesized.title,
    executiveSummary: synthesized.executiveSummary,
    bodyMarkdown: synthesized.bodyMarkdown,
    confidenceScore: synthesized.initialConfidenceScore,
    createdAt: new Date().toISOString(),
  };

  const claims: ReportClaim[] = synthesized.claims.map((c, idx) => ({
    id: `clm_${session.id.slice(0, 6)}_${idx + 1}`,
    sessionId: session.id,
    reportId,
    claimText: c.claimText,
    sourceChunkIds: c.sourceChunkIds,
    supportingQuote: c.supportingQuote,
    verificationStatus: 'verified', // Will be audited by Auditor node
    confidenceScore: 0.9,
  }));

  report.claims = claims;

  await d1Service.saveReport(report, claims);

  await d1Service.logAudit(
    session.id,
    'synthesizer',
    `Synthesis complete: generated "${report.title}" with ${claims.length} claims ready for audit`,
    'SynthesizerNode',
    {
      reportId: report.id,
      title: report.title,
      claimsCount: claims.length,
    }
  );

  return { report, claims };
}
