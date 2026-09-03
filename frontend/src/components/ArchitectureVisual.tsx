import React from 'react';

export const ArchitectureVisual: React.FC = () => {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 shadow-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            State Machine Architecture &amp; Vector Provenance Matrix
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Cloudflare Workers • Vectorize v2 • D1 SQLite
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs font-mono">
        {/* Column 1: Multi-Step Graph Orchestrator (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-cyan-400 font-bold uppercase tracking-wide flex items-center justify-between pb-2 border-b border-slate-800">
            <span>1. State Graph</span>
            <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/50">LangGraph</span>
          </div>

          <div className="space-y-2.5">
            {/* Step 1 */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-cyan-500/40">
              <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                <span>[1] Planner Node</span>
                <span className="text-[10px] text-cyan-400 font-normal">GPT-4o / o3</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Decomposes complex prompt into 2–4 targeted search vectors with explicit rationale.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                <span>[2] Search Workers</span>
                <span className="text-[10px] text-emerald-400 font-normal">Tavily Search</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Parallel crawling, sliding window chunking (500 chars) with byte offset boundaries.
              </p>
              <div className="mt-1.5 text-[10px] text-emerald-400 font-mono">
                → Ingests to Cloudflare Vectorize v2
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-emerald-500/40">
              <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                <span>[3] Synthesizer Node</span>
                <span className="text-[10px] text-emerald-400 font-normal">Structured Citation</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Drafts report strictly bounded to evidence chunks, outputting itemized claim records.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/90 p-3 rounded-lg border border-amber-500/40">
              <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                <span>[4] Fact Auditor Node</span>
                <span className="text-[10px] text-amber-400 font-normal">Fact-Check Judge</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Cross-examines claims against vector chunks; calculates mathematical confidence score.
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Audited Report Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="text-emerald-400 font-bold uppercase tracking-wide flex items-center justify-between pb-2 border-b border-slate-800">
            <span>2. Audited Synthesis Report</span>
            <span className="text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">Verified</span>
          </div>

          <div className="bg-slate-950/90 p-3.5 rounded-lg border border-slate-800 space-y-2.5 font-sans">
            <h4 className="text-sm font-bold text-slate-100">
              Technical Analysis: Post-Quantum Migration 2026
            </h4>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Contemporary deep research architectures demonstrate an empirical efficiency gain of <strong className="text-emerald-400">48.7%</strong> when applying automated verification pipelines over monolithic prompts <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">[src:1#0]</span>.
            </p>

            <p className="text-xs text-slate-300 leading-relaxed">
              By indexing crawl chunks with start/end byte offsets, the system enables <strong className="text-cyan-400">100% deterministic back-tracing</strong> directly to sources <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">[src:2#1]</span> with sub-50ms query latencies at the edge.
            </p>

            {/* Provenance Chunk Callout */}
            <div className="mt-3 bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-cyan-400 font-bold block text-[10px]">
                VECTOR PROVENANCE: src_101_chk_0
              </span>
              <p className="text-slate-300 font-sans italic text-[11px]">
                "Empirical findings confirm error tolerances dropped below 0.003% across 14,000 trials with state graph checkpointing."
              </p>
              <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                <span>Start: 0 | End: 492</span>
                <span className="text-emerald-400">Vectorize 768-dim</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Every assertion strictly cited</span>
            <span className="text-emerald-400">Zero Speculation</span>
          </div>
        </div>

        {/* Column 3: Claim Audit Matrix & Reasoning Trace (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-amber-400 font-bold uppercase tracking-wide flex items-center justify-between pb-2 border-b border-slate-800">
            <span>3. Audit Matrix</span>
            <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-700/50">96.4%</span>
          </div>

          <div className="space-y-2">
            <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-600/40">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-emerald-400 font-bold">✓ VERIFIED (98%)</span>
              </div>
              <p className="text-[11px] text-slate-200 font-sans line-clamp-2">
                48.7% automated verification gain
              </p>
              <span className="text-[10px] text-slate-400">Source: src_101_chk_0</span>
            </div>

            <div className="bg-slate-950/90 p-2.5 rounded-lg border border-emerald-600/40">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-emerald-400 font-bold">✓ VERIFIED (95%)</span>
              </div>
              <p className="text-[11px] text-slate-200 font-sans line-clamp-2">
                100% deterministic back-tracing
              </p>
              <span className="text-[10px] text-slate-400">Source: src_102_chk_1</span>
            </div>

            {/* D1 Trace Snippet */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1 text-slate-400">
              <span className="text-slate-300 font-bold block">D1 REASONING TRACE</span>
              <div className="text-cyan-400">[PLANNER] 3 sub-questions</div>
              <div className="text-emerald-400">[VECTORIZE] 12 chunks indexed</div>
              <div className="text-amber-400">[AUDITOR] Score 96.4%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
