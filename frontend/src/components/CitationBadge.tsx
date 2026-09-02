import React, { useState } from 'react';
import { CheckCircle2, Database } from 'lucide-react';
import { SourceChunk, ReportClaim } from '../types';

interface CitationBadgeProps {
  chunkId: string;
  chunks?: SourceChunk[];
  claims?: ReportClaim[];
  onSelectChunk?: (chunkId: string) => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  chunkId,
  chunks = [],
  claims = [],
  onSelectChunk,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const chunk = chunks.find((c) => c.id === chunkId || chunkId.includes(c.id));
  const claim = claims.find((c) =>
    c.sourceChunkIds.some((id) => id === chunkId || chunkId.includes(id))
  );

  const cleanLabel = chunkId.replace(/^src_[a-zA-Z0-9]+_/, 'src:').replace(/_chk_/, '#');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectChunk) {
      onSelectChunk(chunkId);
    }
  };

  return (
    <span className="relative inline-block mx-0.5">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center space-x-1 px-1.5 py-0.5 text-[11px] font-mono font-medium rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-800/80 hover:border-emerald-500 transition-colors shadow-sm"
      >
        <Database className="w-2.5 h-2.5 text-emerald-400" />
        <span>[{cleanLabel}]</span>
      </button>

      {showTooltip && chunk && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-1.5 pb-1.5 border-b border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 font-semibold truncate max-w-[180px]">
              {chunk.id}
            </span>
            {claim?.verificationStatus === 'verified' && (
              <span className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-300 line-clamp-3 italic mb-2">
            "{chunk.content}"
          </p>

          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span className="truncate max-w-[150px]">{chunk.sourceTitle || 'Web Source'}</span>
            <span className="font-mono text-slate-500">Bytes: {chunk.charStart}-{chunk.charEnd}</span>
          </div>
        </div>
      )}
    </span>
  );
};
