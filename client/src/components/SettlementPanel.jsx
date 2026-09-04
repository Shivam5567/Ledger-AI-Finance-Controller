import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useApi';

export default function SettlementPanel({ isOpen, onClose }) {
  const { messages, sendMessage, isTyping, toolState } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'Net position?',
    'Any duplicates?',
    'Payroll spend?',
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
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#141416] border-l border-[#2A2A2E] z-50 flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="h-16 px-5 border-b border-[#2A2A2E] flex items-center justify-between bg-[#0D0D0F]">
        <div className="flex items-center gap-2">
          <span className="text-[#4F6EF7]">💬</span>
          <h3 className="text-[15px] font-semibold text-[#F5F5F5]">Settlement Q&A</h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#8A8A8E] hover:text-[#F5F5F5] p-1.5 rounded-lg hover:bg-[#1C1C1F] transition-colors cursor-pointer text-[14px]"
        >
          ✕
        </button>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-10 h-10 rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] flex items-center justify-center text-lg mb-3 text-[#4F6EF7]">
              💬
            </div>
            <h4 className="text-[14px] font-semibold text-[#F5F5F5] mb-1">
              Ask about your transactions
            </h4>
            <p className="text-[12px] text-[#8A8A8E] mb-6 max-w-[260px]">
              Query live totals, duplicate records, category spend, and reconciliations in natural language.
            </p>

            <div className="w-full flex flex-col gap-2">
              <span className="text-[11px] font-mono text-[#505055] uppercase tracking-wider text-left">
                Suggested questions:
              </span>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestedClick(q)}
                  className="w-full text-left px-3.5 py-2.5 rounded-lg text-[13px] bg-[#1C1C1F] hover:bg-[#2A2A2E] text-[#F5F5F5] border border-[#2A2A2E] transition-colors cursor-pointer"
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
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed select-text ${
                    isUser
                      ? 'bg-[#4F6EF7] text-white'
                      : 'bg-[#1C1C1F] text-[#F5F5F5] border border-[#2A2A2E]'
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
          <div className="flex items-center gap-2 text-[12px] text-[#4F6EF7] font-mono pl-1">
            <span className="animate-spin text-xs">⚙</span>
            <span>{toolState}</span>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && !toolState && (
          <div className="flex items-center gap-1.5 p-3 rounded-xl bg-[#1C1C1F] border border-[#2A2A2E] w-16">
            <span className="w-1.5 h-1.5 bg-[#8A8A8E] rounded-full typing-dot" />
            <span className="w-1.5 h-1.5 bg-[#8A8A8E] rounded-full typing-dot" />
            <span className="w-1.5 h-1.5 bg-[#8A8A8E] rounded-full typing-dot" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bottom area */}
      <div className="p-4 border-t border-[#2A2A2E] bg-[#0D0D0F]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask a financial question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            className="flex-1 bg-[#141416] border border-[#2A2A2E] rounded-lg px-3.5 py-2 text-[13px] text-[#F5F5F5] placeholder-[#505055] focus:outline-none focus:border-[#4F6EF7] transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-3.5 py-2 rounded-lg bg-[#4F6EF7] hover:bg-[#3D5DE8] text-white text-[13px] font-semibold transition-all disabled:opacity-40 cursor-pointer"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
