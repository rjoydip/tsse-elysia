/**
 * Hook that debounces a loading flag.
 * Returns true only if the source has been loading for longer than `delay` ms.
 * This prevents skeleton flashes during fast API responses (< delay).
 */

import { useEffect, useState, useRef } from "react";

/**
 * @param loading - The source loading flag to debounce.
 * @param delay - Minimum time in ms to wait before showing loading (default 300).
 * @returns `true` only when source has been loading for > `delay` ms.
 */
export function useDebouncedLoading(loading: boolean, delay = 300): boolean {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => setShow(true), delay);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setShow(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading, delay]);

  return show;
}