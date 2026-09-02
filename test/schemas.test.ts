import { describe, it, expect } from 'vitest';
import {
  ResearchPlanSchema,
  SynthesizedReportSchema,
  ClaimCitationSchema,
  AuditorResultSchema,
  ClaimAuditVerificationSchema,
} from '../src/agent/schemas';

describe('Agent Schemas & Structured Output Contracts', () => {
  it('validates a valid ResearchPlan', () => {
    const validPlan = {
      coreObjective: 'Investigate post-quantum cryptography standards',
      rationale: 'Comprehensive 3-tier decomposition covering algorithms, hardware, and timeline',
      subQuestions: [
        {
          id: 'subq_1',
          question: 'What are the NIST PQC standards finalized in 2024-2026?',
          searchQuery: 'NIST PQC standards ML-KEM ML-DSA 2026',
        },
        {
          id: 'subq_2',
          question: 'What are the hardware accelerator performance benchmarks for ML-KEM?',
          searchQuery: 'ML-KEM hardware acceleration benchmarks cycles latency',
        },
      ],
    };

    const parsed = ResearchPlanSchema.safeParse(validPlan);
    expect(parsed.success).toBe(true);
  });

  it('rejects a ResearchPlan with less than 2 sub-questions', () => {
    const invalidPlan = {
      coreObjective: 'Too brief',
      rationale: 'Too brief',
      subQuestions: [
        {
          id: 'subq_1',
          question: 'Only one question?',
          searchQuery: 'one query',
        },
      ],
    };

    const parsed = ResearchPlanSchema.safeParse(invalidPlan);
    expect(parsed.success).toBe(false);
  });

  it('validates a SynthesizedReport with claim citations', () => {
    const validReport = {
      title: 'Enterprise Agentic Safety',
      executiveSummary: 'Strict provenance models eliminate hallucinations in enterprise agents.',
      bodyMarkdown: '# Report Content\n\nProven findings [[src_1_chk_0]].',
      claims: [
        {
          claimText: 'Decoupled graph agents reduce hallucinations by 64%.',
          sourceChunkIds: ['src_1_chk_0'],
          supportingQuote: 'Empirical testing shows a 64% reduction in hallucinations.',
        },
        {
          claimText: 'Vectorize indexes provide sub-50ms query latency globally.',
          sourceChunkIds: ['src_2_chk_1'],
          supportingQuote: 'Global vector queries resolve in under 50 milliseconds.',
        },
        {
          claimText: 'Over 82% of enterprise buyers mandate verifiable citations.',
          sourceChunkIds: ['src_3_chk_0'],
          supportingQuote: 'Survey indicates 82% requirement for citation logs.',
        },
      ],
      initialConfidenceScore: 0.95,
    };

    const parsed = SynthesizedReportSchema.safeParse(validReport);
    expect(parsed.success).toBe(true);
  });

  it('validates ClaimAuditVerification and AuditorResult', () => {
    const validAudit = {
      overallAuditScore: 0.96,
      auditSummary: 'All 3 claims strictly confirmed by primary evidence chunks.',
      verifiedClaims: [
        {
          claimText: 'Decoupled graph agents reduce hallucinations by 64%.',
          verificationStatus: 'verified',
          verificationReasoning: 'Exact quote match in source document.',
          confidenceScore: 0.98,
        },
      ],
    };

    const parsed = AuditorResultSchema.safeParse(validAudit);
    expect(parsed.success).toBe(true);
  });
});
