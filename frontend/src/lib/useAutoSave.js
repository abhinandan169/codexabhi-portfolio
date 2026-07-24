import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useAutoSave — debounced auto-save.
 * Fires `saveFn(value)` after `delay` ms of idle time, but ONLY when `enabled`
 * is true (typically only when editing an existing record).
 *
 * Usage:
 *   const { status } = useAutoSave({ value: form, enabled: !!editing, saveFn: (v) => api.put(`/x/${id}`, v) })
 *   <AutoSaveStatus status={status} />
 *
 * Statuses: 'idle' | 'saving' | 'saved' | 'error'
 */
export const useAutoSave = ({ value, enabled, saveFn, delay = 1500 }) => {
  const [status, setStatus] = useState('idle');
  const timerRef = useRef(null);
  const lastSerialised = useRef(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (!enabled) { setStatus('idle'); firstRun.current = true; return; }
    // Skip the very first render after enabling (avoids saving straight after load).
    if (firstRun.current) {
      firstRun.current = false;
      lastSerialised.current = JSON.stringify(value);
      return;
    }
    const serialised = JSON.stringify(value);
    if (serialised === lastSerialised.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    timerRef.current = setTimeout(async () => {
      try {
        await saveFn(value);
        lastSerialised.current = serialised;
        setStatus('saved');
      } catch (e) {
        setStatus('error');
      }
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), enabled, delay]);

  const reset = useCallback(() => { setStatus('idle'); firstRun.current = true; lastSerialised.current = null; }, []);

  return { status, reset };
};

export default useAutoSave;
