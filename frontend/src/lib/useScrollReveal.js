import { useEffect, useRef, useState } from 'react';

/**
 * Reveal element on scroll into view. Adds fade + slide-in animation via CSS class.
 * Usage: const { ref, inView } = useScrollReveal();
 *        <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''}`}>
 */
export const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options.threshold, options.rootMargin]);

  return { ref, inView };
};
