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
  const [chatOpen, setChatOpen] = useState(false);

  const { transactions, refetch: refetchTx } = useTransactions();
  const { summary, refetch: refetchSummary } = useSummary();
  const { ingest, loading: isIngesting } = useIngest();
  const { approve, dismiss } = useAction();

  const handleProgress = (data) => {
    setAgentStage(data.message);
    setAgentProgress(data.progress);
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
    refetchTx();
  };

  const handleRunAgent = () => {
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
              className="glass-button px-8 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
            >
              {isIngesting ? 'Loading Data...' : '📂 Load Transactions'}
            </button>
          </div>
        )}

        {hasIngested && (
          <>
            <div className="flex justify-between items-center animate-fade-in">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              {!hasRunAgent && (
                <RunAgentButton 
                  onRun={handleRunAgent} 
                  isRunning={isRunning} 
                  stage={agentStage} 
                  progress={agentProgress} 
                />
              )}
            </div>

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
