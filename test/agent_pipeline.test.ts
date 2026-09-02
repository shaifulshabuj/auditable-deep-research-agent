import { describe, it, expect } from 'vitest';
import { ResearchOrchestrator } from '../src/agent/orchestrator';
import { Env, ProgressEventPayload } from '../src/types';

describe('End-to-End Auditable Deep Research Pipeline', () => {
  // Mock in-memory D1 database simulation for testing
  function createMockD1Database() {
    const storage = {
      sessions: new Map<string, any>(),
      plans: new Map<string, any>(),
      subQuestions: new Map<string, any>(),
      sources: new Map<string, any>(),
      chunks: new Map<string, any>(),
      reports: new Map<string, any>(),
      claims: new Map<string, any>(),
      auditLogs: [] as any[],
    };

    const mockDb: any = {
      prepare: (sql: string) => {
        let boundArgs: any[] = [];
        return {
          bind: (...args: any[]) => {
            boundArgs = args;
            return {
              run: async () => {
                if (sql.includes('INSERT INTO research_sessions')) {
                  storage.sessions.set(boundArgs[0], {
                    id: boundArgs[0],
                    query: boundArgs[1],
                    status: boundArgs[2],
                    created_at: boundArgs[3],
                  });
                } else if (sql.includes('UPDATE research_sessions')) {
                  const id = boundArgs[3];
                  const existing = storage.sessions.get(id);
                  if (existing) {
                    existing.status = boundArgs[0];
                    existing.error_message = boundArgs[1];
                    existing.completed_at = boundArgs[2];
                  }
                } else if (sql.includes('INSERT INTO audit_logs')) {
                  storage.auditLogs.push({
                    id: storage.auditLogs.length + 1,
                    session_id: boundArgs[0],
                    step: boundArgs[1],
                    node_name: boundArgs[2],
                    message: boundArgs[3],
                    data: boundArgs[4],
                    created_at: boundArgs[5],
                  });
                }
                return { success: true };
              },
              first: async () => {
                if (sql.includes('SELECT * FROM research_sessions')) {
                  return storage.sessions.get(boundArgs[0]) || null;
                }
                if (sql.includes('SELECT * FROM research_plans')) {
                  for (const plan of storage.plans.values()) {
                    if (plan.session_id === boundArgs[0]) return plan;
                  }
                }
                if (sql.includes('SELECT * FROM reports')) {
                  for (const rep of storage.reports.values()) {
                    if (rep.session_id === boundArgs[0]) return rep;
                  }
                }
                return null;
              },
              all: async () => {
                if (sql.includes('SELECT * FROM research_sessions')) {
                  return { results: Array.from(storage.sessions.values()) };
                }
                if (sql.includes('SELECT * FROM sub_questions')) {
                  const list = Array.from(storage.subQuestions.values()).filter(
                    (q) => q.plan_id === boundArgs[0]
                  );
                  return { results: list };
                }
                if (sql.includes('SELECT * FROM sources')) {
                  const list = Array.from(storage.sources.values()).filter(
                    (s) => s.session_id === boundArgs[0]
                  );
                  return { results: list };
                }
                if (sql.includes('SELECT sc.*, s.title')) {
                  const list = Array.from(storage.chunks.values()).filter(
                    (c) => c.session_id === boundArgs[0]
                  );
                  return { results: list };
                }
                if (sql.includes('SELECT * FROM report_claims')) {
                  const list = Array.from(storage.claims.values()).filter(
                    (c) => c.session_id === boundArgs[0]
                  );
                  return { results: list };
                }
                if (sql.includes('SELECT * FROM audit_logs')) {
                  const list = storage.auditLogs.filter(
                    (l) => l.session_id === boundArgs[0]
                  );
                  return { results: list };
                }
                return { results: [] };
              },
            };
          },
        };
      },
      batch: async (statements: any[]) => {
        for (const stmt of statements) {
          if (stmt && stmt.run) {
            await stmt.run();
          }
        }
        return [];
      },
    };

    return { mockDb, storage };
  }

  it('runs complete deep research workflow: Planner -> Search -> Synthesize -> Auditor', async () => {
    const { mockDb } = createMockD1Database();

    const mockEnv: Env = {
      DB: mockDb,
    };

    const orchestrator = new ResearchOrchestrator(mockEnv);
    const progressEvents: ProgressEventPayload[] = [];

    const sessionId = 'test_session_2026_01';
    const query = 'NIST Post-Quantum Cryptography transition standards and algorithmic benchmarks';

    const result = await orchestrator.executeResearch(sessionId, query, (event) => {
      progressEvents.push(event);
    });

    // Verify Plan
    expect(result.plan).toBeDefined();
    expect(result.plan.subQuestions.length).toBeGreaterThanOrEqual(2);

    // Verify Evidence Collection & Provenance
    expect(result.sources.length).toBeGreaterThanOrEqual(2);
    expect(result.chunks.length).toBeGreaterThanOrEqual(2);

    // Verify Synthesized Report
    expect(result.report).toBeDefined();
    expect(result.report.title).toContain('Auditable');
    expect(result.report.claims?.length).toBeGreaterThanOrEqual(2);

    // Verify Auditor Verification
    expect(result.claims.length).toBeGreaterThanOrEqual(2);
    expect(result.claims[0].verificationStatus).toBe('verified');
    expect(result.claims[0].confidenceScore).toBeGreaterThan(0.8);
    expect(result.report.confidenceScore).toBeGreaterThan(0.8);

    // Verify Progress Events & Trace
    expect(progressEvents.length).toBeGreaterThanOrEqual(4);
    expect(progressEvents.some((e) => e.step === 'planning')).toBe(true);
    expect(progressEvents.some((e) => e.step === 'searching')).toBe(true);
    expect(progressEvents.some((e) => e.step === 'synthesizing')).toBe(true);
    expect(progressEvents.some((e) => e.step === 'auditing')).toBe(true);
    expect(progressEvents.some((e) => e.step === 'complete')).toBe(true);

    // Verify Audit Logs
    expect(result.auditLogs.length).toBeGreaterThanOrEqual(4);
  });
});
