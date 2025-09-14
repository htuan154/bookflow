// src/hooks/useAutocomplete.js
import { useEffect, useState } from 'react';
import useDebounce from './useDebounce';
import useChatbot from './useChatbot';

export default function useAutocomplete(query, minLen = 2) {
  const { autocomplete } = useChatbot();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const q = useDebounce(query, 250);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!q || q.length < minLen) {
        if (alive) setList([]);
        return;
      }
      setLoading(true);
      const res = await autocomplete(q);
      if (alive) {
        setList(res || []);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [q, minLen, autocomplete]);

  return { list, loading };
}
