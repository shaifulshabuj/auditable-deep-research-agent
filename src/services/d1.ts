import {
  AuditLogEntry,
  Env,
  ReportClaim,
  ReportData,
  ResearchPlanData,
  ResearchSession,
  SessionStatus,
  SourceChunk,
  SourceDocument,
  SubQuestionItem,
} from '../types';

// In-memory persistent fallback store for when D1 tables are initializing or daily quota is constrained
const memorySessions = new Map<string, ResearchSession>();
const memoryPlans = new Map<string, ResearchPlanData>();
const memorySources = new Map<string, SourceDocument[]>();
const memoryChunks = new Map<string, SourceChunk[]>();
const memoryReports = new Map<string, ReportData>();
const memoryClaims = new Map<string, ReportClaim[]>();
const memoryAuditLogs = new Map<string, AuditLogEntry[]>();

const INIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS research_sessions (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);
CREATE TABLE IF NOT EXISTS research_plans (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    core_objective TEXT NOT NULL,
    rationale TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sub_questions (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    question TEXT NOT NULL,
    search_query TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sub_question_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    domain TEXT,
    raw_content TEXT,
    chunk_count INTEGER DEFAULT 0,
    crawled_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS source_chunks (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    sub_question_id TEXT,
    chunk_index INTEGER NOT NULL,
    char_start INTEGER,
    char_end INTEGER,
    content TEXT NOT NULL,
    vector_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    title TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    confidence_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS report_claims (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    report_id TEXT,
    claim_text TEXT NOT NULL,
    source_chunk_ids TEXT NOT NULL,
    supporting_quote TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'verified',
    verification_reasoning TEXT,
    confidence_score REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    step TEXT NOT NULL,
    node_name TEXT,
    message TEXT NOT NULL,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export class D1Service {
  private db: D1Database | null;
  private static schemaInitialized = false;

  constructor(env: Env) {
    this.db = env.DB || null;
  }

  private async ensureSchema(): Promise<void> {
    if (!this.db || D1Service.schemaInitialized) return;
    try {
      const statements = INIT_SCHEMA_SQL.trim()
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((sql) => this.db!.prepare(sql));

      await this.db.batch(statements);
      D1Service.schemaInitialized = true;
    } catch (err) {
      console.warn('D1 schema bootstrap check completed or constrained:', err);
    }
  }

  // =========================================================================
  // 1. Research Sessions
  // =========================================================================

  async createSession(id: string, query: string): Promise<ResearchSession> {
    const session: ResearchSession = {
      id,
      query,
      status: 'planning',
      errorMessage: null,
      createdAt: new Date().toISOString(),
    };

    memorySessions.set(id, session);

    if (this.db) {
      try {
        await this.ensureSchema();
        await this.db
          .prepare(
            'INSERT INTO research_sessions (id, query, status, created_at) VALUES (?, ?, ?, ?)'
          )
          .bind(session.id, session.query, session.status, session.createdAt)
          .run();
      } catch (err) {
        console.warn('D1 createSession fallback to memory:', err);
      }
    }

    return session;
  }

  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
    errorMessage: string | null = null
  ): Promise<void> {
    const completedAt =
      status === 'complete' || status === 'error' ? new Date().toISOString() : null;

    const memSess = memorySessions.get(sessionId);
    if (memSess) {
      memSess.status = status;
      memSess.errorMessage = errorMessage;
      memSess.completedAt = completedAt;
    }

    if (this.db) {
      try {
        await this.db
          .prepare(
            'UPDATE research_sessions SET status = ?, error_message = ?, completed_at = ? WHERE id = ?'
          )
          .bind(status, errorMessage, completedAt, sessionId)
          .run();
      } catch (err) {
        console.warn('D1 updateSessionStatus fallback to memory:', err);
      }
    }
  }

  async getSession(sessionId: string): Promise<ResearchSession | null> {
    if (this.db) {
      try {
        const row = await this.db
          .prepare('SELECT * FROM research_sessions WHERE id = ?')
          .bind(sessionId)
          .first<any>();

        if (row) {
          return {
            id: row.id,
            query: row.query,
            status: row.status as SessionStatus,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            completedAt: row.completed_at,
          };
        }
      } catch (err) {
        console.warn('D1 getSession fallback to memory:', err);
      }
    }

    return memorySessions.get(sessionId) || null;
  }

  async listSessions(limit = 20): Promise<ResearchSession[]> {
    if (this.db) {
      try {
        const { results } = await this.db
          .prepare('SELECT * FROM research_sessions ORDER BY created_at DESC LIMIT ?')
          .bind(limit)
          .all<any>();

        if (results && results.length > 0) {
          return results.map((row) => ({
            id: row.id,
            query: row.query,
            status: row.status as SessionStatus,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            completedAt: row.completed_at,
          }));
        }
      } catch (err) {
        console.warn('D1 listSessions fallback to memory:', err);
      }
    }

    return Array.from(memorySessions.values()).slice(0, limit);
  }

  // =========================================================================
  // 2. Research Plan & Sub-questions
  // =========================================================================

  async savePlan(plan: ResearchPlanData): Promise<void> {
    memoryPlans.set(plan.sessionId, plan);

    if (this.db) {
      try {
        const statements = [
          this.db
            .prepare(
              'INSERT INTO research_plans (id, session_id, core_objective, rationale, created_at) VALUES (?, ?, ?, ?, ?)'
            )
            .bind(
              plan.id,
              plan.sessionId,
              plan.coreObjective,
              plan.rationale,
              plan.createdAt || new Date().toISOString()
            ),
        ];

        for (const sq of plan.subQuestions) {
          statements.push(
            this.db
              .prepare(
                'INSERT INTO sub_questions (id, plan_id, session_id, question, search_query, status) VALUES (?, ?, ?, ?, ?, ?)'
              )
              .bind(sq.id, plan.id, plan.sessionId, sq.question, sq.searchQuery, sq.status)
          );
        }

        await this.db.batch(statements);
      } catch (err) {
        console.warn('D1 savePlan fallback to memory:', err);
      }
    }
  }

  async getPlan(sessionId: string): Promise<ResearchPlanData | null> {
    if (this.db) {
      try {
        const planRow = await this.db
          .prepare('SELECT * FROM research_plans WHERE session_id = ? ORDER BY created_at DESC LIMIT 1')
          .bind(sessionId)
          .first<any>();

        if (planRow) {
          const { results: subQuestions } = await this.db
            .prepare('SELECT * FROM sub_questions WHERE plan_id = ?')
            .bind(planRow.id)
            .all<any>();

          return {
            id: planRow.id,
            sessionId: planRow.session_id,
            coreObjective: planRow.core_objective,
            rationale: planRow.rationale,
            createdAt: planRow.created_at,
            subQuestions: (subQuestions || []).map((sq) => ({
              id: sq.id,
              planId: sq.plan_id,
              sessionId: sq.session_id,
              question: sq.question,
              searchQuery: sq.search_query,
              status: sq.status,
              createdAt: sq.created_at,
            })),
          };
        }
      } catch (err) {
        console.warn('D1 getPlan fallback to memory:', err);
      }
    }

    return memoryPlans.get(sessionId) || null;
  }

  // =========================================================================
  // 3. Sources & Chunks (Provenance)
  // =========================================================================

  async saveSourcesAndChunks(sources: SourceDocument[], chunks: SourceChunk[]): Promise<void> {
    if (sources.length > 0) {
      const sessionId = sources[0].sessionId;
      const existingSources = memorySources.get(sessionId) || [];
      memorySources.set(sessionId, [...existingSources, ...sources]);
    }
    if (chunks.length > 0) {
      const sessionId = chunks[0].sessionId;
      const existingChunks = memoryChunks.get(sessionId) || [];
      memoryChunks.set(sessionId, [...existingChunks, ...chunks]);
    }

    if (this.db) {
      try {
        const statements = [];

        for (const src of sources) {
          statements.push(
            this.db
              .prepare(
                'INSERT INTO sources (id, session_id, sub_question_id, url, title, domain, raw_content, chunk_count, crawled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
              )
              .bind(
                src.id,
                src.sessionId,
                src.subQuestionId,
                src.url,
                src.title,
                src.domain,
                src.rawContent,
                src.chunkCount,
                src.crawledAt
              )
          );
        }

        for (const chk of chunks) {
          statements.push(
            this.db
              .prepare(
                'INSERT INTO source_chunks (id, source_id, session_id, sub_question_id, chunk_index, char_start, char_end, content, vector_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
              )
              .bind(
                chk.id,
                chk.sourceId,
                chk.sessionId,
                chk.subQuestionId,
                chk.chunkIndex,
                chk.charStart,
                chk.charEnd,
                chk.content,
                chk.vectorId || chk.id
              )
          );
        }

        const BATCH_SIZE = 50;
        for (let i = 0; i < statements.length; i += BATCH_SIZE) {
          const slice = statements.slice(i, i + BATCH_SIZE);
          await this.db.batch(slice);
        }
      } catch (err) {
        console.warn('D1 saveSourcesAndChunks fallback to memory:', err);
      }
    }
  }

  async getSources(sessionId: string): Promise<SourceDocument[]> {
    if (this.db) {
      try {
        const { results } = await this.db
          .prepare('SELECT * FROM sources WHERE session_id = ? ORDER BY crawled_at ASC')
          .bind(sessionId)
          .all<any>();

        if (results && results.length > 0) {
          return results.map((r) => ({
            id: r.id,
            sessionId: r.session_id,
            subQuestionId: r.sub_question_id,
            url: r.url,
            title: r.title,
            domain: r.domain,
            rawContent: r.raw_content,
            chunkCount: r.chunk_count,
            crawledAt: r.crawled_at,
          }));
        }
      } catch (err) {
        console.warn('D1 getSources fallback to memory:', err);
      }
    }

    return memorySources.get(sessionId) || [];
  }

  async getChunks(sessionId: string): Promise<SourceChunk[]> {
    if (this.db) {
      try {
        const { results } = await this.db
          .prepare(
            `SELECT sc.*, s.title as sourceTitle, s.url as sourceUrl, s.domain as domain 
             FROM source_chunks sc
             JOIN sources s ON sc.source_id = s.id
             WHERE sc.session_id = ?
             ORDER BY sc.chunk_index ASC`
          )
          .bind(sessionId)
          .all<any>();

        if (results && results.length > 0) {
          return results.map((r) => ({
            id: r.id,
            sourceId: r.source_id,
            sessionId: r.session_id,
            subQuestionId: r.sub_question_id,
            chunkIndex: r.chunk_index,
            charStart: r.char_start,
            charEnd: r.char_end,
            content: r.content,
            vectorId: r.vector_id,
            createdAt: r.created_at,
            sourceTitle: r.sourceTitle,
            sourceUrl: r.sourceUrl,
            domain: r.domain,
          }));
        }
      } catch (err) {
        console.warn('D1 getChunks fallback to memory:', err);
      }
    }

    return memoryChunks.get(sessionId) || [];
  }

  // =========================================================================
  // 4. Reports & Audited Claims
  // =========================================================================

  async saveReport(report: ReportData, claims: ReportClaim[]): Promise<void> {
    memoryReports.set(report.sessionId, report);
    memoryClaims.set(report.sessionId, claims);

    if (this.db) {
      try {
        const statements = [
          this.db
            .prepare(
              'INSERT INTO reports (id, session_id, title, executive_summary, body_markdown, confidence_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
            )
            .bind(
              report.id,
              report.sessionId,
              report.title,
              report.executiveSummary,
              report.bodyMarkdown,
              report.confidenceScore,
              report.createdAt || new Date().toISOString()
            ),
        ];

        for (const cl of claims) {
          statements.push(
            this.db
              .prepare(
                'INSERT INTO report_claims (id, session_id, report_id, claim_text, source_chunk_ids, supporting_quote, verification_status, verification_reasoning, confidence_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
              )
              .bind(
                cl.id,
                cl.sessionId,
                report.id,
                cl.claimText,
                JSON.stringify(cl.sourceChunkIds),
                cl.supportingQuote,
                cl.verificationStatus,
                cl.verificationReasoning || '',
                cl.confidenceScore
              )
          );
        }

        await this.db.batch(statements);
      } catch (err) {
        console.warn('D1 saveReport fallback to memory:', err);
      }
    }
  }

  async getReport(sessionId: string): Promise<ReportData | null> {
    if (this.db) {
      try {
        const reportRow = await this.db
          .prepare('SELECT * FROM reports WHERE session_id = ? ORDER BY created_at DESC LIMIT 1')
          .bind(sessionId)
          .first<any>();

        if (reportRow) {
          const { results: claimRows } = await this.db
            .prepare('SELECT * FROM report_claims WHERE session_id = ?')
            .bind(sessionId)
            .all<any>();

          const claims: ReportClaim[] = (claimRows || []).map((c) => ({
            id: c.id,
            sessionId: c.session_id,
            reportId: c.report_id,
            claimText: c.claim_text,
            sourceChunkIds: JSON.parse(c.source_chunk_ids || '[]'),
            supportingQuote: c.supporting_quote,
            verificationStatus: c.verification_status,
            verificationReasoning: c.verification_reasoning,
            confidenceScore: c.confidence_score,
            createdAt: c.created_at,
          }));

          return {
            id: reportRow.id,
            sessionId: reportRow.session_id,
            title: reportRow.title,
            executiveSummary: reportRow.executive_summary,
            bodyMarkdown: reportRow.body_markdown,
            confidenceScore: reportRow.confidence_score,
            claims,
            createdAt: reportRow.created_at,
          };
        }
      } catch (err) {
        console.warn('D1 getReport fallback to memory:', err);
      }
    }

    const rep = memoryReports.get(sessionId);
    if (rep) {
      rep.claims = memoryClaims.get(sessionId) || [];
      return rep;
    }
    return null;
  }

  // =========================================================================
  // 5. Reasoning Trace & Audit Logs
  // =========================================================================

  async logAudit(
    sessionId: string,
    step: AuditLogEntry['step'],
    message: string,
    nodeName?: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: Date.now(),
      sessionId,
      step,
      nodeName,
      message,
      data: data || null,
      createdAt: new Date().toISOString(),
    };

    const existingLogs = memoryAuditLogs.get(sessionId) || [];
    memoryAuditLogs.set(sessionId, [...existingLogs, entry]);

    if (this.db) {
      try {
        await this.db
          .prepare(
            'INSERT INTO audit_logs (session_id, step, node_name, message, data, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          )
          .bind(
            sessionId,
            step,
            nodeName || null,
            message,
            data ? JSON.stringify(data) : null,
            new Date().toISOString()
          )
          .run();
      } catch (err) {
        console.warn('D1 logAudit fallback to memory:', err);
      }
    }
  }

  async getAuditLogs(sessionId: string): Promise<AuditLogEntry[]> {
    if (this.db) {
      try {
        const { results } = await this.db
          .prepare('SELECT * FROM audit_logs WHERE session_id = ? ORDER BY id ASC')
          .bind(sessionId)
          .all<any>();

        if (results && results.length > 0) {
          return results.map((row) => ({
            id: row.id,
            sessionId: row.session_id,
            step: row.step,
            nodeName: row.node_name,
            message: row.message,
            data: row.data ? JSON.parse(row.data) : null,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn('D1 getAuditLogs fallback to memory:', err);
      }
    }

    return memoryAuditLogs.get(sessionId) || [];
  }
}
