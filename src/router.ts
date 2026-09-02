import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { Env, ProgressEventPayload } from './types';
import { D1Service } from './services/d1';
import { ResearchOrchestrator } from './agent/orchestrator';

export const api = new Hono<{ Bindings: Env }>();

// Enable CORS for API requests
api.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health Check
api.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'cloudflare-workers-2026',
    bindings: {
      d1: !!c.env.DB,
      vectorize: !!c.env.VECTORIZE,
      ai: !!c.env.AI,
      hasOpenAIKey: !!c.env.OPENAI_API_KEY,
      hasTavilyKey: !!c.env.TAVILY_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

// List all research sessions
api.get('/sessions', async (c) => {
  const d1 = new D1Service(c.env);
  const limit = parseInt(c.req.query('limit') || '20', 10);
  const sessions = await d1.listSessions(limit);
  return c.json({ sessions });
});

// Start a new research session
api.post('/research', async (c) => {
  const body = await c.req.json<{ query?: string; sessionId?: string }>();
  const query = body.query?.trim();

  if (!query) {
    return c.json({ error: 'Research query is required' }, 400);
  }

  const sessionId = body.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const d1 = new D1Service(c.env);

  const session = await d1.createSession(sessionId, query);

  return c.json({
    sessionId: session.id,
    query: session.query,
    status: session.status,
    createdAt: session.createdAt,
    streamUrl: `/api/research/${session.id}/stream?query=${encodeURIComponent(query)}`,
  });
});

// Server-Sent Events (SSE) Live Stream Endpoint
api.get('/research/:id/stream', async (c) => {
  const sessionId = c.req.param('id');
  const d1 = new D1Service(c.env);
  let query = c.req.query('query');

  const existingSession = await d1.getSession(sessionId);
  if (existingSession && !query) {
    query = existingSession.query;
  }

  if (!query) {
    return c.text('Missing research query for session', 400);
  }

  return streamSSE(c, async (stream) => {
    const orchestrator = new ResearchOrchestrator(c.env);

    const onProgress = async (event: ProgressEventPayload) => {
      await stream.writeSSE({
        data: JSON.stringify(event),
        event: 'progress',
        id: String(Date.now()),
      });
    };

    try {
      // Send initial connection event
      await stream.writeSSE({
        data: JSON.stringify({
          sessionId,
          type: 'connected',
          message: 'Connected to live research agent telemetry stream',
          timestamp: new Date().toISOString(),
        }),
        event: 'connected',
      });

      // Execute research pipeline
      await orchestrator.executeResearch(sessionId, query, onProgress);

      await stream.writeSSE({
        data: JSON.stringify({
          sessionId,
          type: 'finished',
          message: 'Research session finalized successfully',
          timestamp: new Date().toISOString(),
        }),
        event: 'finished',
      });
    } catch (err: any) {
      await stream.writeSSE({
        data: JSON.stringify({
          sessionId,
          type: 'error',
          error: err?.message || 'Pipeline runtime error',
          timestamp: new Date().toISOString(),
        }),
        event: 'error',
      });
    }
  });
});

// Get session status & overview
api.get('/research/:id', async (c) => {
  const sessionId = c.req.param('id');
  const d1 = new D1Service(c.env);

  const session = await d1.getSession(sessionId);
  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  const plan = await d1.getPlan(sessionId);
  const report = await d1.getReport(sessionId);

  return c.json({
    session,
    plan,
    hasReport: !!report,
    reportPreview: report ? { title: report.title, confidenceScore: report.confidenceScore } : null,
  });
});

// Get final report with claims & citations
api.get('/research/:id/report', async (c) => {
  const sessionId = c.req.param('id');
  const d1 = new D1Service(c.env);

  const report = await d1.getReport(sessionId);
  if (!report) {
    return c.json({ error: 'Report not found for this session' }, 404);
  }

  return c.json({ report });
});

// Get audit logs & reasoning trace
api.get('/research/:id/audit', async (c) => {
  const sessionId = c.req.param('id');
  const d1 = new D1Service(c.env);

  const logs = await d1.getAuditLogs(sessionId);
  return c.json({ logs });
});

// Get harvested sources & vector chunks provenance
api.get('/research/:id/sources', async (c) => {
  const sessionId = c.req.param('id');
  const d1 = new D1Service(c.env);

  const sources = await d1.getSources(sessionId);
  const chunks = await d1.getChunks(sessionId);

  return c.json({ sources, chunks });
});
