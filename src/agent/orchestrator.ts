import {
  AuditLogEntry,
  Env,
  ProgressEventPayload,
  ReportClaim,
  ReportData,
  ResearchPlanData,
  ResearchSession,
  SessionStatus,
  SourceChunk,
  SourceDocument,
} from '../types';
import { D1Service } from '../services/d1';
import { OpenAIService } from '../services/openai';
import { runPlannerNode } from './planner';
import { runResearchWorkerNode } from './researcher';
import { runSynthesizerNode } from './synthesizer';
import { runAuditorNode } from './auditor';

export type ProgressCallback = (event: ProgressEventPayload) => void;

export interface ResearchExecutionResult {
  session: ResearchSession;
  plan: ResearchPlanData;
  sources: SourceDocument[];
  chunks: SourceChunk[];
  report: ReportData;
  claims: ReportClaim[];
  auditLogs: AuditLogEntry[];
}

export class ResearchOrchestrator {
  private env: Env;
  private d1: D1Service;
  private openai: OpenAIService;

  constructor(env: Env) {
    this.env = env;
    this.d1 = new D1Service(env);
    this.openai = new OpenAIService(env);
  }

  /**
   * Execute end-to-end auditable deep research pipeline
   */
  async executeResearch(
    sessionId: string,
    query: string,
    onProgress?: ProgressCallback
  ): Promise<ResearchExecutionResult> {
    const emit = (
      step: SessionStatus | 'complete',
      type: ProgressEventPayload['type'],
      message: string,
      percentage: number,
      data?: Record<string, unknown>
    ) => {
      if (onProgress) {
        onProgress({
          sessionId,
          type,
          step,
          message,
          percentage,
          data,
          timestamp: new Date().toISOString(),
        });
      }
    };

    let session = await this.d1.getSession(sessionId);
    if (!session) {
      session = await this.d1.createSession(sessionId, query);
    }

    try {
      // =====================================================================
      // STEP 1: PLANNER NODE
      // =====================================================================
      emit('planning', 'status_change', 'Initializing research plan and query decomposition...', 10);
      await this.d1.updateSessionStatus(sessionId, 'planning');

      const plan = await runPlannerNode(session, this.env, this.openai, this.d1);

      emit('planning', 'step_progress', `Plan established: decomposed into ${plan.subQuestions.length} targeted sub-questions.`, 25, {
        planOverview: plan.coreObjective,
        subQuestions: plan.subQuestions.map((q) => q.question),
      });

      // =====================================================================
      // STEP 2: RESEARCH WORKER (Web Search & Vector Indexing)
      // =====================================================================
      emit('searching', 'status_change', 'Searching web sources and indexing chunks with vector provenance...', 30);
      await this.d1.updateSessionStatus(sessionId, 'searching');

      const { sources, chunks } = await runResearchWorkerNode(
        session,
        plan.subQuestions,
        this.env,
        this.d1
      );

      emit('searching', 'step_progress', `Harvested ${sources.length} sources and indexed ${chunks.length} chunks to Vectorize.`, 55, {
        sourcesCount: sources.length,
        chunksCount: chunks.length,
        domains: Array.from(new Set(sources.map((s) => s.domain))),
      });

      // =====================================================================
      // STEP 3: EVIDENCE AGGREGATION & SYNTHESIZER NODE
      // =====================================================================
      emit('synthesizing', 'status_change', 'Synthesizing evidence and drafting claims with strict source citations...', 60);
      await this.d1.updateSessionStatus(sessionId, 'synthesizing');

      const { report, claims } = await runSynthesizerNode(
        session,
        sources,
        chunks,
        this.env,
        this.openai,
        this.d1
      );

      emit('synthesizing', 'step_progress', `Drafted report "${report.title}" with ${claims.length} cited claims.`, 80, {
        title: report.title,
        claimsCount: claims.length,
      });

      // =====================================================================
      // STEP 4: CLAIM-LEVEL AUDITOR NODE
      // =====================================================================
      emit('auditing', 'status_change', 'Executing claim-level fact-checking audit against vector DB source chunks...', 85);
      await this.d1.updateSessionStatus(sessionId, 'auditing');

      const auditOutcome = await runAuditorNode(
        session,
        report,
        claims,
        chunks,
        this.env,
        this.openai,
        this.d1
      );

      // =====================================================================
      // STEP 5: FINALIZATION & COMPLETION
      // =====================================================================
      await this.d1.updateSessionStatus(sessionId, 'complete');
      session.status = 'complete';
      session.completedAt = new Date().toISOString();

      const auditLogs = await this.d1.getAuditLogs(sessionId);

      emit('complete', 'report_ready', `Research completed! Audit confidence: ${(auditOutcome.overallAuditScore * 100).toFixed(1)}%`, 100, {
        reportId: report.id,
        auditScore: auditOutcome.overallAuditScore,
        claimsVerified: auditOutcome.auditedClaims.length,
      });

      return {
        session,
        plan,
        sources,
        chunks,
        report,
        claims: auditOutcome.auditedClaims,
        auditLogs,
      };
    } catch (error: any) {
      console.error(`Research execution failed for session ${sessionId}:`, error);
      const errorMsg = error?.message || 'Unknown pipeline execution failure';
      await this.d1.updateSessionStatus(sessionId, 'error', errorMsg);
      await this.d1.logAudit(sessionId, 'system', `Pipeline error: ${errorMsg}`, 'Orchestrator', {
        error: String(error),
      });

      emit('error', 'error', `Research error: ${errorMsg}`, 0, { error: errorMsg });
      throw error;
    }
  }
}
