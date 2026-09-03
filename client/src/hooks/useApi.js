import { useState, useCallback } from 'react';

// Shared fetch wrapper for basic JSON APIs
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  return res.json();
}

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/transactions');
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { transactions, loading, refetch };
}

export function useSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/transactions/summary');
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { summary, loading, refetch };
}

export function useIngest() {
  const [loading, setLoading] = useState(false);

  const ingest = async () => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/transactions/ingest', { method: 'POST' });
      return res;
    } catch (err) {
      console.error('Failed to ingest:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { ingest, loading };
}

export function useRunAgent(onProgress) {
  const [isRunning, setIsRunning] = useState(false);

  const runAgent = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep incomplete chunk in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (onProgress) onProgress(data);
            } catch (e) {
              console.error('Failed to parse SSE JSON:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to run agent:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return { runAgent, isRunning };
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [toolState, setToolState] = useState(null);

  const sendMessage = async (text) => {
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setToolState(null);

    const aiMsgId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);

    try {
      let attempts = 0;
      let success = false;

      while (attempts < 2 && !success) {
        attempts++;
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text }),
          });
          
          if (!res.ok) {
            if (attempts < 2) {
              await new Promise(r => setTimeout(r, 800));
              continue;
            }
            throw new Error(`HTTP ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          
          let buffer = '';
          let receivedAnyToken = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  
                  if (data.type === 'token') {
                    receivedAnyToken = true;
                    setMessages((prev) => 
                      prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + data.text } : m)
                    );
                  } else if (data.type === 'tool_call_start') {
                    setToolState(`🔍 Querying transactions...`);
                  } else if (data.type === 'tool_call_result') {
                    setToolState(null);
                  } else if (data.type === 'error') {
                    setMessages((prev) => 
                      prev.map(m => m.id === aiMsgId ? { ...m, content: m.content || `⚠️ Error: ${data.message || 'Unable to complete request'}` } : m)
                    );
                  }
                } catch (e) {
                  console.error('Parse error in chat:', e);
                }
              }
            }
          }

          if (!receivedAnyToken) {
            setMessages((prev) => 
              prev.map(m => m.id === aiMsgId && !m.content ? { ...m, content: 'Sorry, I could not generate a response. Please try again.' } : m)
            );
          }

          success = true;

        } catch (err) {
          if (attempts >= 2) {
            console.error('Chat error:', err);
            setMessages((prev) => 
              prev.map(m => m.id === aiMsgId && !m.content ? { ...m, content: `⚠️ Server connection interrupted. Please try asking again. (${err.message})` } : m)
            );
          }
        }
      }
    } finally {
      setIsTyping(false);
      setToolState(null);
    }
  };

  return { messages, sendMessage, isTyping, toolState };
}

export function useAction() {
  const handleAction = async (id, actionType) => {
    try {
      const res = await fetchJson(`/api/actions/${id}/${actionType}`, { method: 'POST' });
      return res;
    } catch (err) {
      console.error(`Failed to ${actionType} action:`, err);
      throw err;
    }
  };

  const approve = (id) => handleAction(id, 'approve');
  const dismiss = (id) => handleAction(id, 'dismiss');
  const reset = (id) => handleAction(id, 'reset');

  return { approve, dismiss, reset };
}
