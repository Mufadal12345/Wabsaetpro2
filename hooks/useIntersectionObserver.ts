import { useEffect, useRef } from 'react';

/**
 * A simple hook that triggers a callback when an element enters the viewport.
 * Useful for infinite scrolling.
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && targetRef.current) {
        callbackRef.current();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return targetRef;
}
