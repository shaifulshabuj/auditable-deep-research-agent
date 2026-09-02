import React, { useState } from 'react';
import { Terminal, Shield, Search, Cpu, FileCheck, ChevronRight, ChevronDown } from 'lucide-react';
import { AuditLogEntry } from '../types';

interface AuditTrailViewerProps {
  logs: AuditLogEntry[];
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ logs }) => {
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const getStepIcon = (step: AuditLogEntry['step']) => {
    switch (step) {
      case 'planner':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'worker':
        return <Search className="w-4 h-4 text-blue-400" />;
      case 'synthesizer':
        return <FileCheck className="w-4 h-4 text-emerald-400" />;
      case 'auditor':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'system':
      default:
        return <Terminal className="w-4 h-4 text-purple-400" />;
    }
  };

  const getStepBadgeColor = (step: AuditLogEntry['step']) => {
    switch (step) {
      case 'planner':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'worker':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'synthesizer':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'auditor':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'system':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-slate-100">Step-by-Step Reasoning Trace</h3>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          {logs.length} logged state transitions
        </span>
      </div>

      <div className="space-y-3 font-mono text-xs">
        {logs.map((log, index) => {
          const isExpanded = expandedLogId === (log.id ?? index);

          return (
            <div
              key={log.id || index}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 transition hover:border-slate-700"
            >
              <div
                onClick={() => setExpandedLogId(isExpanded ? null : (log.id ?? index))}
                className="flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start space-x-2.5 flex-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                    {getStepIcon(log.step)}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getStepBadgeColor(
                          log.step
                        )}`}
                      >
                        {log.step}
                      </span>
                      {log.nodeName && (
                        <span className="text-slate-400 text-[11px] font-semibold">
                          [{log.nodeName}]
                        </span>
                      )}
                      {log.createdAt && (
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    <p className="text-slate-200 text-xs font-sans font-normal leading-relaxed">
                      {log.message}
                    </p>
                  </div>
                </div>

                {log.data && (
                  <button className="text-slate-400 hover:text-slate-200 p-1">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {isExpanded && log.data && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                    Structured Trace State:
                  </span>
                  <pre className="bg-slate-900 p-3 rounded-lg text-[11px] text-emerald-300 overflow-x-auto max-h-60 border border-slate-800">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
