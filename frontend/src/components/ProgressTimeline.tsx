import React from 'react';
import { Cpu, Search, FileCheck, Shield, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { SessionStatus } from '../types';

interface ProgressTimelineProps {
  currentStep: SessionStatus | 'complete';
  percentage: number;
  lastMessage?: string;
  errorMessage?: string | null;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  currentStep,
  percentage,
  lastMessage,
  errorMessage,
}) => {
  const steps = [
    { key: 'planning', label: '1. Plan & Decompose', icon: Cpu },
    { key: 'searching', label: '2. Web Search & Vectorize', icon: Search },
    { key: 'synthesizing', label: '3. Synthesize & Cite', icon: FileCheck },
    { key: 'auditing', label: '4. Claim-Level Audit', icon: Shield },
    { key: 'complete', label: '5. Audited Report Ready', icon: CheckCircle2 },
  ];

  const getStepStatus = (stepKey: string) => {
    if (currentStep === 'error') return 'error';
    if (currentStep === 'complete') return 'completed';

    const stepOrder = ['planning', 'searching', 'synthesizing', 'auditing', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const thisIndex = stepOrder.indexOf(stepKey);

    if (thisIndex < currentIndex) return 'completed';
    if (thisIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>Orchestration Pipeline</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {lastMessage || 'Agent pipeline processing...'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="font-mono text-sm font-semibold text-emerald-400">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            currentStep === 'error'
              ? 'bg-rose-500'
              : currentStep === 'complete'
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        {steps.map((step) => {
          const status = getStepStatus(step.key);
          const Icon = step.icon;

          return (
            <div
              key={step.key}
              className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-2 transition ${
                status === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : status === 'active'
                  ? 'bg-blue-950/40 border-blue-500 text-blue-300 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                  : status === 'error'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                {status === 'active' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-medium tracking-tight leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
