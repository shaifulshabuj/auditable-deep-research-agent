import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShieldCheck, Award, Download, Copy, Check } from 'lucide-react';
import { ReportClaim, ReportData, SourceChunk } from '../types';
import { CitationBadge } from './CitationBadge';

interface ReportViewerProps {
  report: ReportData;
  chunks?: SourceChunk[];
  claims?: ReportClaim[];
  onSelectChunk?: (chunkId: string) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  chunks = [],
  claims = [],
  onSelectChunk,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${report.title}\n\nExecutive Summary:\n${report.executiveSummary}\n\n${report.bodyMarkdown}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [`# ${report.title}\n\n## Executive Summary\n${report.executiveSummary}\n\n${report.bodyMarkdown}`],
      { type: 'text/markdown' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom renderer for markdown to replace [[CHUNK_ID]] with interactive CitationBadges
  const renderContentWithCitations = (text: string) => {
    const parts = text.split(/(\[\[src_[^\]]+\]\]|\[\[[^\]]+\]\])/g);

    return parts.map((part, i) => {
      const match = part.match(/^\[\[(.*)\]\]$/);
      if (match) {
        const chunkId = match[1];
        return (
          <CitationBadge
            key={i}
            chunkId={chunkId}
            chunks={chunks}
            claims={claims}
            onSelectChunk={onSelectChunk}
          />
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Verified Enterprise Report
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '2026'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            {report.title}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          {/* Audit Confidence Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 shadow-sm">
            <Award className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Audit Confidence
              </div>
              <div className="text-base font-extrabold font-mono leading-none">
                {(report.confidenceScore * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Download Report (.md)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Executive Summary & Grounding Verification</span>
        </h4>
        <p className="text-slate-300 text-sm leading-relaxed">
          {report.executiveSummary}
        </p>
      </div>

      {/* Main Markdown Body */}
      <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-2 prose-h3:text-lg prose-p:leading-relaxed prose-p:text-slate-300 prose-li:text-slate-300">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => {
              if (typeof children === 'string') {
                return <p className="mb-4">{renderContentWithCitations(children)}</p>;
              }
              return <p className="mb-4">{children}</p>;
            },
            li: ({ children }) => {
              if (typeof children === 'string') {
                return <li>{renderContentWithCitations(children)}</li>;
              }
              return <li>{children}</li>;
            },
          }}
        >
          {report.bodyMarkdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};
