import React, { useState } from 'react';
import { Globe, ExternalLink, ChevronDown, ChevronUp, Layers, Calendar } from 'lucide-react';
import { SourceChunk, SourceDocument } from '../types';

interface SourceCardProps {
  source: SourceDocument;
  chunks: SourceChunk[];
  highlightedChunkId?: string | null;
  onSelectChunk?: (chunkId: string) => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({
  source,
  chunks,
  highlightedChunkId,
  onSelectChunk,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sourceChunks = chunks.filter((c) => c.sourceId === source.id);

  return (
    <div
      className={`bg-slate-900/80 border rounded-2xl p-5 transition shadow-lg ${
        sourceChunks.some((c) => c.id === highlightedChunkId)
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-900'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-emerald-400">
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>{source.domain}</span>
            </span>
            <span className="flex items-center space-x-1 font-mono text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>{new Date(source.crawledAt).toLocaleTimeString()}</span>
            </span>
          </div>

          <h4 className="text-base font-semibold text-slate-100 hover:text-emerald-400 transition leading-snug">
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5">
              <span>{source.title}</span>
              <ExternalLink className="w-3.5 h-3.5 inline text-slate-400 flex-shrink-0" />
            </a>
          </h4>

          <p className="text-xs text-slate-400 font-mono truncate max-w-lg">
            {source.url}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{sourceChunks.length} chunks</span>
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-in fade-in duration-150">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Indexed Vector Chunks (Vectorize Provenance):
          </span>

          <div className="space-y-2">
            {sourceChunks.map((chunk) => {
              const isChunkHighlighted = chunk.id === highlightedChunkId;

              return (
                <div
                  key={chunk.id}
                  onClick={() => onSelectChunk && onSelectChunk(chunk.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    isChunkHighlighted
                      ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1.5 pb-1 border-b border-slate-800/60">
                    <span className="text-emerald-400 font-semibold">{chunk.id}</span>
                    <span>
                      Char range: {chunk.charStart} - {chunk.charEnd} (Index #{chunk.chunkIndex})
                    </span>
                  </div>
                  <p className="line-clamp-3 leading-relaxed">{chunk.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
