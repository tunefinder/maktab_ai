import { useState, useEffect } from 'react';

export function useHistory<T>(key: string) {
  const [history, setHistory] = useState<T[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, [key]);

  const addHistory = (item: T) => {
    const newHistory = [item, ...history].slice(0, 10); // Keep last 10 items
    setHistory(newHistory);
    localStorage.setItem(key, JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(key);
  };

  return { history, addHistory, clearHistory };
}
