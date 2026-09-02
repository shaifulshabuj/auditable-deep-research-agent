import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Database,
  Terminal,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  X,
  Sparkles,
  Award,
} from 'lucide-react';
import { useResearchStream } from '../hooks/useResearchStream';
import { ProgressTimeline } from '../components/ProgressTimeline';
import { ReportViewer } from '../components/ReportViewer';
import { ClaimVerificationTable } from '../components/ClaimVerificationTable';
import { SourceCard } from '../components/SourceCard';
import { AuditTrailViewer } from '../components/AuditTrailViewer';

export const ResearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('query');

  const [activeTab, setActiveTab] = useState<'report' | 'claims' | 'sources' | 'audit'>('report');
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);

  const {
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
    error,
  } = useResearchStream(id);

  useEffect(() => {
    // Component mounted for given session id
  }, [id, queryParam]);

  const selectedChunk = chunks.find((c) => c.id === selectedChunkId);
  const selectedChunkSource = selectedChunk
    ? sources.find((s) => s.id === selectedChunk.sourceId)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Research Launcher</span>
          </Link>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight line-clamp-1">
            {session?.query || queryParam || 'Deep Research Session'}
          </h1>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>ID: {id}</span>
            <span>•</span>
            <span className="uppercase text-emerald-400 font-semibold">{currentStep}</span>
          </div>
        </div>

        {report && (
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-mono text-xs font-bold">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Audit Score: {(report.confidenceScore * 100).toFixed(1)}%</span>
            </span>
          </div>
        )}
      </div>

      <ProgressTimeline
        currentStep={currentStep}
        percentage={percentage}
        lastMessage={lastMessage}
        errorMessage={error}
      />

      {plan && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Planner Query Decomposition</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400">
              {plan.subQuestions.length} parallel search vectors
            </span>
          </div>

          <p className="text-xs text-slate-300 italic">{plan.rationale}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {plan.subQuestions.map((sq, i) => (
              <div
                key={sq.id || i}
                className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl text-xs space-y-1"
              >
                <span className="text-[10px] font-mono text-slate-500 font-bold block">
                  VECTOR #{i + 1}
                </span>
                <p className="text-slate-200 font-medium line-clamp-2">{sq.question}</p>
                <p className="text-[11px] font-mono text-emerald-400/90 truncate">
                  Query: {sq.searchQuery}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-800 space-x-2 sm:space-x-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'report'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Final Audited Report</span>
          {report && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'claims'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Claim Verification Matrix</span>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'sources'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Vector Provenance ({sources.length} sources / {chunks.length} chunks)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Reasoning Trace ({auditLogs.length} events)</span>
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'report' && (
          <div>
            {report ? (
              <ReportViewer
                report={report}
                chunks={chunks}
                claims={claims}
                onSelectChunk={(chunkId) => setSelectedChunkId(chunkId)}
              />
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <h3 className="text-base font-bold text-slate-200">
                  Synthesizing Audited Report...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The agent is currently searching the web, indexing chunks into Vectorize, and strictly cross-referencing every factual claim.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'claims' && (
          <ClaimVerificationTable
            claims={claims}
            onSelectChunk={(chunkId) => setSelectedChunkId(chunkId)}
          />
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Indexed Evidence Documents
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Stored with start/end byte offsets in Vectorize v2
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sources.map((src) => (
                <SourceCard
                  key={src.id}
                  source={src}
                  chunks={chunks}
                  highlightedChunkId={selectedChunkId}
                  onSelectChunk={(chunkId) => setSelectedChunkId(chunkId)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audit' && <AuditTrailViewer logs={auditLogs} />}
      </div>

      {selectedChunk && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-slate-100 text-sm font-mono">
                  Vector Chunk Provenance: {selectedChunk.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedChunkId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedChunkSource && (
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Source Parent Document
                </span>
                <h5 className="font-semibold text-slate-200">{selectedChunkSource.title}</h5>
                <a
                  href={selectedChunkSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center space-x-1 font-mono text-[11px] truncate"
                >
                  <span>{selectedChunkSource.url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                Raw Chunk Text (Indexed in Vectorize)
              </span>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans max-h-60 overflow-y-auto">
                {selectedChunk.content}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">CHUNK INDEX</span>
                <span className="text-emerald-400 font-bold">#{selectedChunk.chunkIndex}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">BYTE START</span>
                <span className="text-slate-300 font-bold">{selectedChunk.charStart}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">BYTE END</span>
                <span className="text-slate-300 font-bold">{selectedChunk.charEnd}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">SESSION ID</span>
                <span className="text-slate-400 font-bold truncate block max-w-[80px]">
                  {selectedChunk.sessionId.slice(0, 8)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedChunkId(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
