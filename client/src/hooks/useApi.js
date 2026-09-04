import { useState, useCallback, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchJson(url, options) {
  const res = await fetch(`${API_BASE}${url}`, options);
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

  return { transactions, setTransactions, loading, refetch };
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

export function useUpload() {
  const [loading, setLoading] = useState(false);

  const upload = async (csvContent) => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/transactions/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent }),
      });
      return res;
    } catch (err) {
      console.error('Failed to upload:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading };
}

export function useRunAgent(onProgress) {
  const [isRunning, setIsRunning] = useState(false);

  const runAgent = async (params = {}) => {
    setIsRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();
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
  const [messages, setMessages]   = useState([]);
  const [isTyping, setIsTyping]   = useState(false);
  const [toolState, setToolState] = useState(null);

  const sendMessage = async (text) => {
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setToolState(null);

    const aiMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '' }]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '', receivedAnyToken = false;

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
                setMessages(prev => prev.map(m =>
                  m.id === aiMsgId ? { ...m, content: m.content + data.text } : m
                ));
              } else if (data.type === 'tool_call_start') {
                setToolState('🔍 Querying live data...');
              } else if (data.type === 'tool_call_result') {
                setToolState(null);
              } else if (data.type === 'error') {
                setMessages(prev => prev.map(m =>
                  m.id === aiMsgId ? { ...m, content: m.content || `⚠️ ${data.message}` } : m
                ));
              }
            } catch (e) { /* parse error */ }
          }
        }
      }

      if (!receivedAnyToken) {
        setMessages(prev => prev.map(m =>
          m.id === aiMsgId && !m.content
            ? { ...m, content: 'Sorry, I could not generate a response. Please try again.' }
            : m
        ));
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId && !m.content
          ? { ...m, content: `⚠️ Something went wrong. (${err.message})` }
          : m
      ));
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
      return await fetchJson(`/api/actions/${id}/${actionType}`, { method: 'POST' });
    } catch (err) {
      console.error(`Failed to ${actionType} action:`, err);
      throw err;
    }
  };

  return {
    approve: (id) => handleAction(id, 'approve'),
    dismiss: (id) => handleAction(id, 'dismiss'),
    reset:   (id) => handleAction(id, 'reset'),
  };
}

export function useDashboard({ startDate, endDate, interval = 'weekly', status = 'all' } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (interval) params.set('interval', interval);
      if (status && status !== 'all') params.set('status', status);

      const res = await fetchJson(`/api/dashboard/summary?${params.toString()}`);
      setData(res);
      setLastSyncedAt(new Date());
      return res;
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, interval, status]);

  return { data, loading, error, lastSyncedAt, refetch };
}

export function useExport() {
  const exportCsv = ({ startDate, endDate, status } = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (status) params.set('status', status);

    const qs = params.toString();
    const link = document.createElement('a');
    link.href = `${API_BASE}/api/export${qs ? `?${qs}` : ''}`;
    link.download = `ledger-export${status ? `-${status}` : ''}.csv`;
    link.click();
  };
  return { exportCsv };
}

export function useDismissedRules() {
  const [rules, setRules] = useState([]);

  const fetchRules = useCallback(async () => {
    try {
      const data = await fetchJson('/api/rules');
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch dismissed rules:', err);
    }
  }, []);

  const deleteRule = async (id) => {
    try {
      await fetchJson(`/api/rules/${id}`, { method: 'DELETE' });
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  return { rules, fetchRules, deleteRule };
}
