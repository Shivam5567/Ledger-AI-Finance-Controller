import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useApi';

export default function SettlementPanel({ isOpen, onClose }) {
  const { messages, sendMessage, isTyping, toolState } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Net position & summary?',
    'Show all duplicate charges',
    'How much did we spend on payroll?',
    'What are the largest anomalies?',
  ];

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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#007A4D] flex items-center justify-center font-bold text-sm">
            💬
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Settlement Q&A</h3>
            <p className="text-[11px] text-gray-400">Autonomous Financial Intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer text-sm"
        >
          ✕
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5 bg-[#F9FAFB]/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl mb-3 text-[#007A4D] shadow-xs">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              Ask about your ledger
            </h4>
            <p className="text-xs text-gray-500 mb-6 max-w-[260px] leading-relaxed">
              Query live totals, duplicate records, category spend, and reconciliations in natural language.
            </p>

            <div className="w-full flex flex-col gap-2">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider text-left">
                Suggested prompts:
              </span>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedClick(q)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs bg-white hover:bg-emerald-50/60 text-gray-800 border border-gray-200/80 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs font-medium"
                >
                  · {q}
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
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed select-text shadow-xs ${
                    isUser
                      ? 'bg-[#007A4D] text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Tool execution indicator */}
        {toolState && (
          <div className="flex items-center gap-2 text-xs text-[#007A4D] font-mono pl-1">
            <span className="animate-spin text-xs">⚙</span>
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
      <div className="p-4 border-t border-gray-100 bg-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a financial question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007A4D] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-full bg-[#007A4D] hover:bg-[#006644] text-white flex items-center justify-center text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
