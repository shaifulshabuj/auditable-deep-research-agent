import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Database, Cpu, Lock, CheckCircle } from 'lucide-react';

const SUGGESTED_QUERIES = [
  {
    title: 'Post-Quantum Cryptography Transition',
    query: 'Analyze the NIST Post-Quantum Cryptography standardization timeline, Kyber/Dilithium algorithmic benchmarks, and enterprise hardware migration bottlenecks in 2026.',
    category: 'Security & Crypto',
  },
  {
    title: 'Agentic AI Safety & Verification Standards',
    query: 'What are the contemporary standards, prompt-injection defense mechanisms, and claim-level audit requirements for deploying autonomous deep research agents in regulated enterprises?',
    category: 'Enterprise AI',
  },
  {
    title: 'Solid-State EV Battery Commercialization',
    query: 'Examine solid-state lithium-metal battery cathode stability, volumetric energy density (Wh/L) benchmarks, and projected gigafactory manufacturing yields through 2028.',
    category: 'CleanTech',
  },
  {
    title: 'Neuromorphic Compute vs Traditional GPUs',
    query: 'Compare neuromorphic spiking neural network hardware (Loihi, BrainScaleS) against Blackwell/Hopper GPUs in terms of energy efficiency per token and edge latency.',
    category: 'Semiconductors',
  },
];

export const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleStart = async (selectedQuery?: string) => {
    const q = (selectedQuery || query).trim();
    if (!q) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        navigate(`/research/${data.sessionId}?query=${encodeURIComponent(q)}`);
      } else {
        alert('Failed to initialize research session');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strictly Grounded Enterprise Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          The <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Auditable Deep Research</span> Agent
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Autonomous multi-step investigation that plans, searches, chunks, and writes structured reports where <span className="text-slate-200 font-semibold">every single claim</span> is mathematically audited and cited back to vector embeddings.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a complex research topic or prompt to investigate (e.g. comparative benchmarks, technical specifications, regulatory standards)..."
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl p-4 text-slate-100 placeholder-slate-500 text-sm sm:text-base resize-none transition outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleStart();
              }
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-4 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Vectorize Provenance</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Claim-Level Fact Auditor</span>
            </span>
          </div>

          <button
            onClick={() => handleStart()}
            disabled={!query.trim() || isSubmitting}
            className="inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            <span>{isSubmitting ? 'Initializing Agent...' : 'Launch Deep Research'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Sample Enterprise Research Inquiries
          </h3>
          <span className="text-xs text-slate-500">Click to run immediately</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUGGESTED_QUERIES.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleStart(item.query)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-600/50 p-5 rounded-2xl cursor-pointer transition group shadow-sm hover:shadow-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {item.category}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </div>

              <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition">
                {item.title}
              </h4>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {item.query}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 text-left">
        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Decomposed Planning</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-step graph planner breaks high-level inquiries into structured, parallel search vectors to ensure exhaustive scope.
          </p>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Granular Vector Provenance</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every crawl chunk is indexed in Cloudflare Vectorize with start/end byte offsets, URL tags, and retrieval timestamps.
          </p>
        </div>

        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Claim-Level Audit Judge</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dedicated auditor node evaluates every factual sentence against vector evidence, calculating verified confidence ratings.
          </p>
        </div>
      </div>
    </div>
  );
};
