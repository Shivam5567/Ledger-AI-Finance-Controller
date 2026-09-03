import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useApi';

export default function ChatBox({ isOpen, onToggle }) {
  const { messages, sendMessage, isTyping, toolState } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, toolState, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessage(input);
    setInput('');
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  return (
    <>
      {/* FAB Button */}
      <button 
        onClick={onToggle}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 transition-all z-50 ${isOpen ? 'bg-navy-700 text-slate-300' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105'}`}
        style={!isOpen ? { animation: 'pulse 2s infinite' } : {}}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[500px] glass-card flex flex-col shadow-2xl z-40 animate-slide-up origin-bottom-right">
          
          <div className="p-4 border-b border-white/10 bg-white/5 rounded-t-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-lg shadow-inner">
              🤖
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Ledger AI Assistant</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Online
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 mt-auto pb-4">
                <p className="text-xs text-slate-400 text-center mb-2">Suggested questions</p>
                {['How much did we spend on cloud infrastructure?', 'Are there any duplicate payments?', 'What\'s our biggest expense category?', 'Summarize our financial health'].map((q, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSuggestion(q)}
                    className="text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-slate-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white/10 text-slate-200 rounded-bl-sm border border-white/5'}`}>
                  {msg.content}
                  {msg.role === 'ai' && msg.content === '' && (
                    <div className="flex items-center gap-1 h-5 px-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {toolState && (
              <div className="flex items-center gap-2 text-xs text-slate-400 ml-2 animate-fade-in">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                {toolState}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 bg-navy-900/50 rounded-b-2xl">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances..."
                disabled={isTyping}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                ↗
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
