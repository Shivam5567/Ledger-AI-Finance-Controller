import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SummaryCards from './components/SummaryCards';
import SpendChart from './components/SpendChart';
import TransactionTable from './components/TransactionTable';
import ChatBox from './components/ChatBox';
import RunAgentButton from './components/RunAgentButton';
import AgentTrace from './components/AgentTrace';
import HeroMetrics from './components/HeroMetrics';
import ProactiveBanner from './components/ProactiveBanner';
import ReportPanel from './components/ReportPanel';
import { useTransactions, useSummary, useIngest, useRunAgent, useAction, useExport } from './hooks/useApi';

export default function App() {
  const [hasIngested, setHasIngested] = useState(false);
  const [hasRunAgent, setHasRunAgent] = useState(false);
  const [agentStage, setAgentStage]   = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentResult, setAgentResult] = useState(null);
  const [showTrace, setShowTrace]     = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [showRules, setShowRules]     = useState(false);

  const { transactions, refetch: refetchTx }     = useTransactions();
  const { summary,      refetch: refetchSummary } = useSummary();
  const { ingest, loading: isIngesting }          = useIngest();
  const { approve, dismiss, reset }               = useAction();
  const { exportCsv }                             = useExport();

  const handleProgress = (data) => {
    setAgentStage(data.stage);
    setAgentProgress(data.progress);

    if (data.stage === 'complete') {
      setAgentResult(data);
      setHasRunAgent(true);
      refetchTx();
      refetchSummary();
      setTimeout(() => {
        setAgentStage('complete');
        setAgentProgress(1);
      }, 500);
    }
  };

  const { runAgent, isRunning } = useRunAgent(handleProgress);

  const handleIngest = async () => {
    await ingest();
    setHasIngested(true);
    setHasRunAgent(false);
    setAgentResult(null);
    setShowTrace(false);
    refetchTx();
  };

  const handleRunAgent = () => {
    setAgentStage(null);
    setAgentResult(null);
    setShowTrace(true);
    runAgent();
  };

  const handleApprove = async (id) => { await approve(id); refetchTx(); refetchSummary(); };
  const handleDismiss = async (id) => { await dismiss(id); refetchTx(); refetchSummary(); };
  const handleReset   = async (id) => { await reset(id);   refetchTx(); refetchSummary(); };

  const pendingCount  = transactions.filter(t => t.action_status === 'pending').length;
  const resolvedCount = transactions.filter(t => t.action_status === 'approved' || t.action_status === 'dismissed').length;

  return (
    <Layout isRunning={isRunning} progress={agentProgress}>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-28">

        {/* ── Landing state ────────────────────────────────────── */}
        {!hasIngested && (
          <div className="flex flex-col items-center justify-center py-24 animate-slide-up">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-4xl mb-6 shadow-xl shadow-blue-500/20">
              ⚡
            </div>
            <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Welcome to Ledger AI
            </h2>
            <p className="text-slate-400 mb-8 max-w-md text-center text-base leading-relaxed">
              Your AI-powered finance controller. Load your raw transaction data to start automated categorization, reconciliation, and anomaly detection.
            </p>
            <button
              onClick={handleIngest}
              disabled={isIngesting}
              className="glass-button px-10 py-4 rounded-2xl text-lg font-bold flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-blue-500/10"
            >
              {isIngesting ? '⏳ Loading…' : '📂 Load Transactions'}
            </button>
          </div>
        )}

        {/* ── Dashboard ─────────────────────────────────────────── */}
        {hasIngested && (
          <>
            {/* Proactive banner (only shown before first agent run) */}
            {!hasRunAgent && (
              <ProactiveBanner onReviewNow={handleRunAgent} />
            )}

            {/* Top bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {transactions.length} transactions loaded
                  {hasRunAgent && resolvedCount > 0 && ` · ${resolvedCount} resolved`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasRunAgent && (
                  <>
                    {/* Export CSV */}
                    <button
                      onClick={exportCsv}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      ⬇️ Export CSV
                    </button>

                    {/* Agent memory rules */}
                    <button
                      onClick={() => setShowRules(!showRules)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-colors flex items-center gap-1.5"
                    >
                      🧠 Agent Memory
                    </button>
                  </>
                )}

                <button
                  onClick={handleIngest}
                  disabled={isIngesting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                >
                  🔄 Re-ingest
                </button>

                <RunAgentButton
                  onRun={handleRunAgent}
                  isRunning={isRunning}
                  stage={agentStage}
                  progress={agentProgress}
                />
              </div>
            </div>

            {/* Agent Memory panel */}
            {showRules && (
              <AgentMemoryPanel onClose={() => setShowRules(false)} />
            )}

            {/* Agent Thinking Trace */}
            {showTrace && (
              <div className="animate-slide-down">
                <AgentTrace
                  currentStage={agentStage}
                  isRunning={isRunning}
                  isComplete={!isRunning && agentResult !== null}
                  agentResult={agentResult}
                  onClose={() => setShowTrace(false)}
                />
              </div>
            )}

            {/* Hero Metrics Banner */}
            {hasRunAgent && agentResult && (
              <HeroMetrics agentResult={agentResult} transactions={transactions} />
            )}

            {/* Summary Cards */}
            {hasRunAgent && summary && (
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <SummaryCards summary={summary} />
              </div>
            )}

            {/* Spend Chart */}
            {hasRunAgent && summary?.byCategory?.length > 0 && (
              <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
                <SpendChart byCategory={summary.byCategory} />
              </div>
            )}

            {/* Reconciliation Report */}
            {hasRunAgent && (
              <div className="animate-slide-up" style={{ animationDelay: '0.18s' }}>
                <ReportPanel hasRunAgent={hasRunAgent} />
              </div>
            )}

            {/* Transaction Table */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <TransactionTable
                transactions={transactions}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
                onReset={handleReset}
              />
            </div>
          </>
        )}
      </div>

      {/* Chat FAB (only after agent run) */}
      {hasRunAgent && (
        <ChatBox isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      )}
    </Layout>
  );
}

// ── Agent Memory Panel ──────────────────────────────────────────
function AgentMemoryPanel({ onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rules')
      .then(r => r.json())
      .then(data => { setRules(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const deleteRule = async (id) => {
    await fetch(`/api/rules/${id}`, { method: 'DELETE' });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="glass-card p-5 border border-purple-500/20 animate-slide-down">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">🧠 Agent Memory — Dismissed Rules</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            When you dismiss a flag, the agent remembers and won't re-flag similar transactions next run.
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
      </div>

      {loading && <p className="text-slate-500 text-sm">Loading…</p>}

      {!loading && rules.length === 0 && (
        <p className="text-slate-500 text-sm py-2">
          No dismissed rules yet. Dismiss a flagged transaction to create one.
        </p>
      )}

      {!loading && rules.length > 0 && (
        <div className="flex flex-col gap-2">
          {rules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5 border border-white/5">
              <div>
                <span className="text-xs font-medium text-slate-300">
                  <span className={`mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold
                    ${rule.flag_type === 'anomaly'   ? 'bg-red-500/20 text-red-400' :
                      rule.flag_type === 'duplicate' ? 'bg-orange-500/20 text-orange-400' :
                                                       'bg-yellow-500/20 text-yellow-400'}`}>
                    {rule.flag_type}
                  </span>
                  "{rule.description_pattern}…"
                </span>
                <span className="text-[10px] text-slate-500 ml-2">
                  dismissed {new Date(rule.dismissed_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => deleteRule(rule.id)}
                className="text-xs text-red-400/70 hover:text-red-400 transition-colors ml-4"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
