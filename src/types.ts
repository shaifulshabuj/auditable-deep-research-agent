/**
 * Cloudflare Worker Environment Bindings
 */
export interface Env {
  // Workers AI binding for embeddings
  AI?: Ai;
  // Vectorize Vector DB binding
  VECTORIZE?: VectorizeIndex;
  // D1 Database binding
  DB: D1Database;
  // Static Assets binding for frontend
  ASSETS?: Fetcher;

  // Environment Secrets / Variables
  OPENAI_API_KEY?: string;
  TAVILY_API_KEY?: string;
  ENVIRONMENT?: string;
}

/**
 * Vector Database Item with Complete Provenance Metadata
 */
export interface VectorProvenanceMetadata {
  sessionId: string;
  sourceId: string;
  subQuestionId: string;
  chunkId: string;
  url: string;
  title: string;
  domain: string;
  chunkIndex: number;
  totalChunks: number;
  charStart: number;
  charEnd: number;
  crawledAt: string;
  queryOrigin: string;
}

/**
 * Core Domain Interfaces
 */
export type SessionStatus =
  | 'planning'
  | 'searching'
  | 'synthesizing'
  | 'auditing'
  | 'complete'
  | 'error';

export interface ResearchSession {
  id: string;
  query: string;
  status: SessionStatus;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface SubQuestionItem {
  id: string;
  planId?: string;
  sessionId: string;
  question: string;
  searchQuery: string;
  status: 'pending' | 'searching' | 'completed' | 'failed';
  createdAt?: string;
}

export interface ResearchPlanData {
  id: string;
  sessionId: string;
  coreObjective: string;
  rationale: string;
  subQuestions: SubQuestionItem[];
  createdAt?: string;
}

export interface SourceDocument {
  id: string;
  sessionId: string;
  subQuestionId: string;
  url: string;
  title: string;
  domain: string;
  rawContent: string;
  chunkCount: number;
  crawledAt: string;
  chunks?: SourceChunk[];
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  sessionId: string;
  subQuestionId: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  content: string;
  vectorId?: string;
  createdAt?: string;
  // Optional provenance fields when joined
  sourceTitle?: string;
  sourceUrl?: string;
  domain?: string;
}

export type ClaimVerificationStatus = 'verified' | 'caution' | 'unsupported';

export interface ReportClaim {
  id: string;
  sessionId: string;
  reportId?: string;
  claimText: string;
  sourceChunkIds: string[]; // e.g. ["src-1-chk-0", "src-2-chk-1"]
  supportingQuote: string;
  verificationStatus: ClaimVerificationStatus;
  verificationReasoning?: string;
  confidenceScore: number;
  createdAt?: string;
}

export interface ReportData {
  id: string;
  sessionId: string;
  title: string;
  executiveSummary: string;
  bodyMarkdown: string;
  confidenceScore: number;
  claims?: ReportClaim[];
  createdAt?: string;
}

export interface AuditLogEntry {
  id?: number;
  sessionId: string;
  step: 'planner' | 'worker' | 'aggregator' | 'synthesizer' | 'auditor' | 'system';
  nodeName?: string;
  message: string;
  data?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface ProgressEventPayload {
  sessionId: string;
  type: 'status_change' | 'step_progress' | 'audit_log' | 'report_ready' | 'error';
  step: SessionStatus | 'complete';
  message: string;
  percentage: number;
  data?: Record<string, unknown>;
  timestamp: string;
}
