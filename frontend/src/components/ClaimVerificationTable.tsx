import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Database, FileText } from 'lucide-react';
import { ReportClaim } from '../types';

interface ClaimVerificationTableProps {
  claims: ReportClaim[];
  onSelectChunk?: (chunkId: string) => void;
}

export const ClaimVerificationTable: React.FC<ClaimVerificationTableProps> = ({
  claims,
  onSelectChunk,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'caution' | 'unsupported'>('all');

  const filteredClaims = claims.filter((c) => {
    if (filter === 'all') return true;
    return c.verificationStatus === filter;
  });

  const getStatusBadge = (status: ReportClaim['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        );
      case 'caution':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Caution</span>
          </span>
        );
      case 'unsupported':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Unsupported</span>
          </span>
        );
    }
  };

  const verifiedCount = claims.filter((c) => c.verificationStatus === 'verified').length;
  const cautionCount = claims.filter((c) => c.verificationStatus === 'caution').length;
  const unsupportedCount = claims.filter((c) => c.verificationStatus === 'unsupported').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Claim-Level Verification Audit</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Every assertion cross-examined against vector DB source chunk evidence
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({claims.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filter === 'verified'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/50'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          {cautionCount > 0 && (
            <button
              onClick={() => setFilter('caution')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === 'caution'
                  ? 'bg-amber-950/70 text-amber-300 border border-amber-700/50'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              Caution ({cautionCount})
            </button>
          )}
          {unsupportedCount > 0 && (
            <button
              onClick={() => setFilter('unsupported')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === 'unsupported'
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-700/50'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Unsupported ({unsupportedCount})
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-800/80">
        {filteredClaims.map((claim) => {
          const isExpanded = expandedId === claim.id;

          return (
            <div key={claim.id} className="py-4 first:pt-0 last:pb-0">
              <div
                onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                className="flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-800/40 p-2 rounded-xl transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(claim.verificationStatus)}
                    <span className="text-xs font-mono text-slate-500">
                      Score: {(claim.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p className="text-sm text-slate-200 font-medium leading-snug">
                    {claim.claimText}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="text-xs font-mono text-emerald-400 hidden sm:inline">
                    {claim.sourceChunkIds.length} source chunk(s)
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 ml-2 pl-4 border-l-2 border-slate-700 space-y-3 text-xs animate-in fade-in duration-150">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      Supporting Quote (From Source)
                    </span>
                    <p className="text-slate-300 italic bg-slate-950/60 p-3 rounded-lg border border-slate-800 mt-1">
                      "{claim.supportingQuote}"
                    </p>
                  </div>

                  {claim.verificationReasoning && (
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Auditor Judge Reasoning
                      </span>
                      <p className="text-slate-300 mt-1">{claim.verificationReasoning}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      Cited Vector Chunk IDs
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {claim.sourceChunkIds.map((chunkId) => (
                        <button
                          key={chunkId}
                          onClick={() => onSelectChunk && onSelectChunk(chunkId)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[11px] border border-slate-700 transition"
                        >
                          <Database className="w-3 h-3" />
                          <span>{chunkId}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
