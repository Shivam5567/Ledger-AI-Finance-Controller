import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useApi';
import { SparklesIcon, SendIcon, TrashIcon } from './Icons';

export default function SettlementPanel({ isOpen, onClose, contextPrompt, onClearContext }) {
  const { messages, sendMessage, isTyping, toolState, clearMessages } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const lastProcessedContextRef = useRef(null);

  const suggestedQuestions = [
    'What is our net ledger position & summary?',
    'Show all duplicate charges and double billings',
    'How much did we spend on payroll this period?',
    'What are the largest anomalies requiring review?',
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && contextPrompt && lastProcessedContextRef.current !== contextPrompt) {
      lastProcessedContextRef.current = contextPrompt;
      sendMessage(contextPrompt);
      if (onClearContext) onClearContext();
    }
  }, [isOpen, contextPrompt, sendMessage, onClearContext]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, toolState, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleSuggestedClick = (q) => {
    if (isTyping) return;
    sendMessage(q);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed backdrop with blur for focus and clear depth */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-50 transition-opacity animate-fade-in cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Slide-in Chat Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#007A4D] flex items-center justify-center font-bold text-sm shadow-2xs">
              <SparklesIcon className="w-5 h-5 text-[#007A4D]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900 tracking-tight">Ledger AI Copilot</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-gray-400 font-mono">Autonomous Financial Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                title="Clear conversation history"
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close Copilot (Esc)"
              className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 bg-[#F9FAFB]/70">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-xl mb-3 text-[#007A4D] shadow-xs">
                <SparklesIcon className="w-6 h-6 text-[#007A4D]" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Ask your financial copilot
              </h4>
              <p className="text-xs text-gray-500 mb-6 max-w-[280px] leading-relaxed">
                Query live cash positions, reconciliation rates, vendor expenses, and anomalies in natural language.
              </p>

              <div className="w-full flex flex-col gap-2">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider text-left pl-1">
                  Suggested queries:
                </span>
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedClick(q)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs bg-white hover:bg-emerald-50/60 text-gray-800 border border-gray-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs font-medium flex items-center gap-2 group"
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0 opacity-60 group-hover:opacity-100" />
                    <span className="truncate">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed select-text shadow-xs ${
                      isUser
                        ? 'bg-[#007A4D] text-white rounded-br-xs font-medium'
                        : 'bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-gray-100 text-[10px] font-bold text-[#007A4D] font-mono">
                        <SparklesIcon className="w-3 h-3 text-[#007A4D]" />
                        <span>Copilot Analysis</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              );
            })
          )}

          {/* Tool execution indicator */}
          {toolState && (
            <div className="flex items-center gap-2 text-xs text-[#007A4D] font-mono pl-1 py-1">
              <span className="w-3 h-3 border-2 border-[#007A4D] border-t-transparent rounded-full animate-spin" />
              <span>{toolState}</span>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && !toolState && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white border border-gray-200/80 w-16 shadow-xs">
              <span className="w-1.5 h-1.5 bg-[#007A4D] rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-[#007A4D] rounded-full typing-dot" />
              <span className="w-1.5 h-1.5 bg-[#007A4D] rounded-full typing-dot" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bottom area */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a financial question about transactions, cash flow…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007A4D] focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              title="Send question"
              className="w-9 h-9 rounded-full bg-[#007A4D] hover:bg-[#006644] text-white flex items-center justify-center text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
            >
              <SendIcon className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
