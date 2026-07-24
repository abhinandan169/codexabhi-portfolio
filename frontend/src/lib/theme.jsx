import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

const ThemeContext = createContext({ theme: null, refresh: () => {} });

export const useTheme = () => useContext(ThemeContext);

const applyTheme = (t) => {
  if (!t) return;
  const root = document.documentElement;
  const isDark = t.mode === 'dark';

  // Map theme to CSS vars
  const bg = t.background_override || (isDark ? '#0B0B0D' : (t.background || '#FFFFFF'));
  const bgAlt = t.background_alt_override || (isDark ? '#141416' : (t.background_alt || '#FAFAFA'));
  const text = t.text_override || (isDark ? '#F5F5F5' : (t.text || '#111111'));
  const textSec = t.text_secondary_override || (isDark ? '#A3A3A3' : (t.text_secondary || '#555555'));
  const border = t.border_override || (isDark ? '#26262A' : (t.border || '#E5E7EB'));

  root.style.setProperty('--bg', bg);
  root.style.setProperty('--bg-alt', bgAlt);
  root.style.setProperty('--text', text);
  root.style.setProperty('--text-secondary', textSec);
  root.style.setProperty('--text-muted', isDark ? '#8A8A8A' : '#888888');
  root.style.setProperty('--border', border);
  root.style.setProperty('--border-soft', isDark ? '#1E1E22' : '#F3F4F6');
  root.style.setProperty('--accent', t.primary || '#E53935');
  root.style.setProperty('--accent-hover', shade(t.primary || '#E53935', -15));
  root.style.setProperty('--accent-light', isDark ? tint(t.primary || '#E53935', 0.15) : tint(t.primary || '#E53935', 0.92));
  const radius = t.radius != null ? t.radius : 12;
  root.style.setProperty('--radius', `${radius}px`);

  const btnRadius = t.button_style === 'square' ? '4px'
                    : t.button_style === 'rounded' ? `${Math.max(6, radius)}px`
                    : '9999px';
  root.style.setProperty('--btn-radius', btnRadius);

  // Font family
  const fontMap = {
    'Satoshi': "'Satoshi', -apple-system, sans-serif",
    'Cabinet Grotesk': "'Cabinet Grotesk', -apple-system, sans-serif",
    'Inter': "'Inter', -apple-system, sans-serif",
    'Poppins': "'Poppins', -apple-system, sans-serif",
    'Manrope': "'Manrope', -apple-system, sans-serif",
    'Roboto': "'Roboto', -apple-system, sans-serif",
    'DM Sans': "'DM Sans', -apple-system, sans-serif",
  };
  const family = fontMap[t.font_family] || fontMap['Satoshi'];
  root.style.setProperty('--font-family', family);

  // Animation speed multiplier (transition base * speed)
  const speedMap = { slow: 1.8, normal: 1, fast: 0.5 };
  const speed = speedMap[t.animation_speed] || 1;
  root.style.setProperty('--anim-speed', speed);
  root.style.setProperty('--transition-base', `${0.3 * speed}s`);

  // Container width
  const cw = t.container_width || 1280;
  root.style.setProperty('--container-max', `${cw}px`);

  // Shadow intensity — layered (two-shadow) values for realistic depth
  const shadowMap = {
    low: '0 1px 2px rgba(0,0,0,0.02), 0 2px 10px rgba(0,0,0,0.03)',
    medium: '0 1px 2px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.05)',
    strong: '0 2px 4px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.10)',
  };
  root.style.setProperty('--shadow-soft', shadowMap[t.shadow_intensity] || shadowMap.medium);

  // Data attributes for CSS-driven styling
  root.setAttribute('data-theme', t.mode || 'light');
  root.setAttribute('data-animations', t.animations_enabled === false ? 'off' : 'on');
  root.setAttribute('data-cursor', t.cursor_style || 'default');
  root.setAttribute('data-scrollbar', t.scrollbar_style || 'default');
  root.setAttribute('data-bg-style', t.background_style || 'solid');
  root.setAttribute('data-card-style', t.card_style || 'filled');
  root.setAttribute('data-navbar-style', t.navbar_style || 'blur');
  root.setAttribute('data-glass', t.glass_effect ? 'on' : 'off');
  root.style.colorScheme = isDark ? 'dark' : 'light';
};

// utility color functions
function shade(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (v * percent) / 100)));
  return rgbToHex(f(r), f(g), f(b));
}
function tint(hex, ratio) {
  // ratio 0..1 -> mix with white
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => Math.round(v + (255 - v) * ratio);
  return rgbToHex(f(r), f(g), f(b));
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/theme');
      setTheme(res.data);
      applyTheme(res.data);
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ThemeContext.Provider value={{ theme, refresh, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export { applyTheme };
