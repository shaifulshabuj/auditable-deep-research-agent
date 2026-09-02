import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AuditLogEntry,
  ProgressEventPayload,
  ReportClaim,
  ReportData,
  ResearchPlanData,
  ResearchSession,
  SessionStatus,
  SourceChunk,
  SourceDocument,
} from '../types';

export interface UseResearchStreamResult {
  session: ResearchSession | null;
  plan: ResearchPlanData | null;
  sources: SourceDocument[];
  chunks: SourceChunk[];
  report: ReportData | null;
  claims: ReportClaim[];
  auditLogs: AuditLogEntry[];
  currentStep: SessionStatus | 'complete';
  percentage: number;
  lastMessage: string;
  isLoading: boolean;
  error: string | null;
  startResearch: (query: string) => Promise<string>;
  loadExistingSession: (sessionId: string) => Promise<void>;
}

export function useResearchStream(initialSessionId?: string): UseResearchStreamResult {
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [plan, setPlan] = useState<ResearchPlanData | null>(null);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [claims, setClaims] = useState<ReportClaim[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [currentStep, setCurrentStep] = useState<SessionStatus | 'complete'>('planning');
  const [percentage, setPercentage] = useState<number>(0);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSessionData = useCallback(async (sessionId: string) => {
    try {
      // 1. Fetch overview
      const res = await fetch(`/api/research/${sessionId}`);
      if (res.ok) {
        const data = (await res.json()) as any;
        setSession(data.session);
        if (data.plan) setPlan(data.plan);
        if (data.session?.status) setCurrentStep(data.session.status);
      }

      // 2. Fetch report & claims
      const repRes = await fetch(`/api/research/${sessionId}/report`);
      if (repRes.ok) {
        const repData = (await repRes.json()) as any;
        if (repData.report) {
          setReport(repData.report);
          setClaims(repData.report.claims || []);
          setCurrentStep('complete');
          setPercentage(100);
        }
      }

      // 3. Fetch audit logs
      const auditRes = await fetch(`/api/research/${sessionId}/audit`);
      if (auditRes.ok) {
        const auditData = (await auditRes.json()) as any;
        if (auditData.logs) setAuditLogs(auditData.logs);
      }

      // 4. Fetch sources & chunks
      const srcRes = await fetch(`/api/research/${sessionId}/sources`);
      if (srcRes.ok) {
        const srcData = (await srcRes.json()) as any;
        if (srcData.sources) setSources(srcData.sources);
        if (srcData.chunks) setChunks(srcData.chunks);
      }
    } catch (err: any) {
      console.warn('Failed to fetch session snapshot:', err);
    }
  }, []);

  const connectSSE = useCallback(
    (sessionId: string, query: string) => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const streamUrl = `/api/research/${sessionId}/stream?query=${encodeURIComponent(query)}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        try {
          const payload = JSON.parse(e.data) as ProgressEventPayload;
          setCurrentStep(payload.step);
          setPercentage(payload.percentage);
          setLastMessage(payload.message);

          // Add to live audit logs if relevant
          if (payload.type === 'step_progress' || payload.type === 'status_change') {
            setAuditLogs((prev) => [
              ...prev,
              {
                sessionId,
                step: (payload.step === 'complete' ? 'system' : payload.step) as any,
                message: payload.message,
                data: payload.data,
                createdAt: payload.timestamp,
              },
            ]);
          }

          if (payload.step === 'complete') {
            fetchSessionData(sessionId);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      });

      es.addEventListener('finished', () => {
        fetchSessionData(sessionId);
        setIsLoading(false);
        es.close();
      });

      es.addEventListener('error', (e: any) => {
        console.warn('SSE stream error event, checking for final state...', e);
        fetchSessionData(sessionId);
        setIsLoading(false);
        es.close();
      });
    },
    [fetchSessionData]
  );

  const startResearch = async (query: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setPercentage(5);
    setCurrentStep('planning');
    setLastMessage('Connecting to research orchestrator...');
    setReport(null);
    setClaims([]);
    setSources([]);
    setChunks([]);
    setAuditLogs([]);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`Failed to initialize research session: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const sessionId = data.sessionId;

      setSession({
        id: sessionId,
        query,
        status: 'planning',
        createdAt: data.createdAt,
      });

      connectSSE(sessionId, query);
      return sessionId;
    } catch (err: any) {
      setError(err.message || 'Failed to start research');
      setIsLoading(false);
      throw err;
    }
  };

  const loadExistingSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchSessionData(sessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSessionId) {
      loadExistingSession(initialSessionId);
    }
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [initialSessionId]);

  return {
    session,
    plan,
    sources,
    chunks,
    report,
    claims,
    auditLogs,
    currentStep,
    percentage,
    lastMessage,
    isLoading,
    error,
    startResearch,
    loadExistingSession,
  };
}
