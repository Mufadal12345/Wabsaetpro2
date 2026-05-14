import { useEffect, useRef } from 'react';

/**
 * A simple hook that triggers a callback when an element enters the viewport.
 * Useful for infinite scrolling.
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit & { delay?: number } = { threshold: 0.1 }
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  callbackRef.current = callback;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (options.delay) {
          timeoutRef.current = setTimeout(() => {
            callbackRef.current();
          }, options.delay);
        } else {
          callbackRef.current();
        }
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return targetRef;
}
