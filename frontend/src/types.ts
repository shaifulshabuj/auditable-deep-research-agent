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
  question: string;
  searchQuery: string;
  status: string;
}

export interface ResearchPlanData {
  id: string;
  sessionId: string;
  coreObjective: string;
  rationale: string;
  subQuestions: SubQuestionItem[];
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
}

export interface SourceChunk {
  id: string;
  sourceId: string;
  sessionId: string;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
  content: string;
  vectorId?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  domain?: string;
}

export type ClaimVerificationStatus = 'verified' | 'caution' | 'unsupported';

export interface ReportClaim {
  id: string;
  sessionId: string;
  claimText: string;
  sourceChunkIds: string[];
  supportingQuote: string;
  verificationStatus: ClaimVerificationStatus;
  verificationReasoning?: string;
  confidenceScore: number;
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
