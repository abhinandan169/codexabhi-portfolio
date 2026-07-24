import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/lib/theme';

/**
 * Custom cursor element used when theme.cursor_style is 'dot' or 'glow'.
 * Follows the mouse and enlarges on interactive elements.
 */
const CustomCursor = () => {
  const { theme } = useTheme();
  const ref = useRef(null);
  const style = theme?.cursor_style || 'default';

  useEffect(() => {
    if (style !== 'dot' && style !== 'glow') return;
    const el = ref.current;
    if (!el) return;

    const move = (e) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    const over = (e) => {
      const t = e.target;
      if (t.closest?.('a, button, [role="button"], input, textarea, select, [data-cursor-hover]')) {
        el.style.opacity = '1';
        el.style.transform = el.style.transform + ' scale(1.8)';
      }
    };
    const out = () => {
      el.style.opacity = '';
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mouseout', out);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mouseout', out);
    };
  }, [style]);

  if (style !== 'dot' && style !== 'glow') return null;
  return <div ref={ref} className="app-cursor" data-testid="app-cursor" />;
};

export default CustomCursor;
