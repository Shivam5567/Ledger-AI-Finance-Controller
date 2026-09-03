import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SummaryCards from './components/SummaryCards';
import SpendChart from './components/SpendChart';
import TransactionTable from './components/TransactionTable';
import ChatBox from './components/ChatBox';
import RunAgentButton from './components/RunAgentButton';
import { useTransactions, useSummary, useIngest, useRunAgent, useAction } from './hooks/useApi';

export default function App() {
  const [hasIngested, setHasIngested] = useState(false);
  const [hasRunAgent, setHasRunAgent] = useState(false);
  const [agentStage, setAgentStage] = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [agentLogs, setAgentLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { transactions, refetch: refetchTx } = useTransactions();
  const { summary, refetch: refetchSummary } = useSummary();
  const { ingest, loading: isIngesting } = useIngest();
  const { approve, dismiss, reset } = useAction();

  const handleProgress = (data) => {
    setAgentStage(data.message);
    setAgentProgress(data.progress);
    if (data.message) {
      setAgentLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: data.message }]);
    }
    if (data.stage === 'complete') {
      setHasRunAgent(true);
      refetchTx();
      refetchSummary();
      setTimeout(() => {
        setAgentStage(null);
        setAgentProgress(0);
      }, 2000);
    }
  };

  const { runAgent, isRunning } = useRunAgent(handleProgress);

  const handleIngest = async () => {
    await ingest();
    setHasIngested(true);
    setHasRunAgent(false);
    setAgentLogs([]);
    refetchTx();
  };

  const handleRunAgent = () => {
    setAgentLogs([]);
    setShowLogs(true);
    runAgent();
  };

  const handleApprove = async (id) => {
    await approve(id);
    refetchTx();
    refetchSummary();
  };

  const handleDismiss = async (id) => {
    await dismiss(id);
    refetchTx();
    refetchSummary();
  };

  const handleReset = async (id) => {
    await reset(id);
    refetchTx();
    refetchSummary();
  };

  // Calculate hero metrics
  const flaggedTxs = transactions.filter(t => t.flags && t.flags.length > 0);
  const flaggedSum = flaggedTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const resolvedCount = transactions.filter(t => t.action_status === 'approved').length;

  return (
    <Layout isRunning={isRunning} progress={agentProgress}>
      <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-24">
        
        {!hasIngested && (
          <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Welcome to Ledger AI
            </h2>
            <p className="text-slate-400 mb-8 max-w-md text-center">
              Your AI-powered finance controller. Load your raw transaction data to get started with automated categorization and anomaly detection.
            </p>
            <button 
              onClick={handleIngest} 
              disabled={isIngesting}
              className="glass-button px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
            >
              {isIngesting ? 'Loading Data...' : '📂 Load Transactions'}
            </button>
          </div>
        )}

        {hasIngested && (
          <>
            {/* Top Bar Header */}
            <div className="flex justify-between items-center animate-fade-in">
              <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-xs text-slate-400">Showing {transactions.length} ingested transactions</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleIngest} 
                  disabled={isIngesting}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                >
                  🔄 Re-ingest Data
                </button>
                <RunAgentButton 
                  onRun={handleRunAgent} 
                  isRunning={isRunning} 
                  stage={agentStage} 
                  progress={agentProgress} 
                />
              </div>
            </div>

            {/* Hero Summary Metric Banner */}
            {hasRunAgent && (
              <div className="glass-card p-4 bg-gradient-to-r from-blue-900/30 via-purple-900/20 to-emerald-900/30 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4 animate-slide-up">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">AI Controller Status: Active</h3>
                    <p className="text-xs text-slate-400">
                      Identified <span className="text-amber-400 font-semibold">${flaggedSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> in discrepancy issues across {flaggedTxs.length} transactions.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Actions Resolved</span>
                    <span className="font-bold text-emerald-400 text-lg">{resolvedCount} / {flaggedTxs.length}</span>
                  </div>
                  {agentLogs.length > 0 && (
                    <button 
                      onClick={() => setShowLogs(!showLogs)} 
                      className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      {showLogs ? 'Hide Agent Trace' : '🔍 View Agent Trace'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Agent Thinking Trace Panel */}
            {showLogs && agentLogs.length > 0 && (
              <div className="glass-card p-4 font-mono text-xs text-slate-300 bg-black/40 border border-blue-500/30 rounded-xl animate-slide-down">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 font-sans font-semibold text-slate-400">
                  <span>🧠 Live Agent Execution Trace</span>
                  <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-300">✕</button>
                </div>
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                  {agentLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500">[{log.time}]</span>
                      <span className="text-emerald-400">›</span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasRunAgent && summary && (
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <SummaryCards summary={summary} />
              </div>
            )}

            {hasRunAgent && summary?.byCategory && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <SpendChart byCategory={summary.byCategory} />
              </div>
            )}

            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
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
      
      {hasRunAgent && (
        <ChatBox isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      )}
    </Layout>
  );
}
