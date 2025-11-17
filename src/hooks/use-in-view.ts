import { useEffect, useRef, useState } from "react";

/**
 * useInView - React hook to detect if an element is in the viewport
 * @param {Object} options - IntersectionObserver options
 * @returns [ref, inView]
 */
export function useInView<T extends HTMLElement = HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      options
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options]);

  return [ref, inView] as const;
}
