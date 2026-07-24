import React, { useEffect, useState } from 'react';
import { Save, Sun, Moon, Palette, Loader2, RotateCcw, Type, MousePointer2, Sparkles, Layers, Maximize2, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTheme, applyTheme } from '@/lib/theme';

/* ---------- Preset Themes ---------- */
const PRESETS = {
  // Base color presets (kept for backwards compat)
  red:    { primary: '#E53935', accent: '#FF7A70', mode: 'light' },
  blue:   { primary: '#2563EB', accent: '#60A5FA', mode: 'light' },
  green:  { primary: '#059669', accent: '#34D399', mode: 'light' },
  purple: { primary: '#7C3AED', accent: '#A78BFA', mode: 'light' },
  orange: { primary: '#EA580C', accent: '#FB923C', mode: 'light' },
  black:  { primary: '#111111', accent: '#4B5563', mode: 'light' },
};

const FULL_PRESETS = {
  light: {
    Minimal: { primary: '#111827', accent: '#6B7280', mode: 'light', background_override: '#FFFFFF', text_override: '#0F172A', card_style: 'outline', shadow_intensity: 'low', font_family: 'Inter' },
    Apple:   { primary: '#0071E3', accent: '#5AC8FA', mode: 'light', background_override: '#FBFBFD', text_override: '#1D1D1F', card_style: 'filled', shadow_intensity: 'medium', font_family: 'Inter' },
    Modern:  { primary: '#E53935', accent: '#FF7A70', mode: 'light', background_override: '#FFFFFF', text_override: '#111111', card_style: 'filled', shadow_intensity: 'medium', font_family: 'DM Sans' },
    Google:  { primary: '#1A73E8', accent: '#4285F4', mode: 'light', background_override: '#FFFFFF', text_override: '#202124', card_style: 'filled', shadow_intensity: 'low', font_family: 'Roboto' },
    Soft:    { primary: '#EC4899', accent: '#F472B6', mode: 'light', background_override: '#FFF7FA', text_override: '#3F1E33', card_style: 'gradient', shadow_intensity: 'medium', font_family: 'Manrope' },
  },
  dark: {
    Dark:      { primary: '#F87171', accent: '#FCA5A5', mode: 'dark', background_override: '#0B0B0D', text_override: '#F5F5F5', card_style: 'filled', shadow_intensity: 'strong', font_family: 'Inter' },
    Github:    { primary: '#58A6FF', accent: '#79C0FF', mode: 'dark', background_override: '#0D1117', text_override: '#C9D1D9', card_style: 'outline', shadow_intensity: 'low', font_family: 'Inter' },
    Dracula:   { primary: '#FF79C6', accent: '#BD93F9', mode: 'dark', background_override: '#282A36', text_override: '#F8F8F2', card_style: 'filled', shadow_intensity: 'medium', font_family: 'Poppins' },
    Nord:      { primary: '#88C0D0', accent: '#81A1C1', mode: 'dark', background_override: '#2E3440', text_override: '#ECEFF4', card_style: 'filled', shadow_intensity: 'medium', font_family: 'Manrope' },
    Cyberpunk: { primary: '#F0FF00', accent: '#FF00FF', mode: 'dark', background_override: '#0A0014', text_override: '#F0FF00', card_style: 'glass', shadow_intensity: 'strong', font_family: 'DM Sans' },
  },
};

const FONTS = ['Satoshi', 'Cabinet Grotesk', 'Inter', 'Poppins', 'Manrope', 'Roboto', 'DM Sans'];
const ANIM_SPEEDS = ['slow', 'normal', 'fast'];
const CURSORS = ['default', 'dot', 'glow'];
const SCROLLBARS = ['default', 'thin', 'rounded', 'colored'];
const BG_STYLES = ['solid', 'gradient', 'glass', 'noise', 'grid'];
const SHADOWS = ['low', 'medium', 'strong'];
const CARD_STYLES = ['filled', 'outline', 'glass', 'gradient'];
const CONTAINER_WIDTHS = [1200, 1280, 1400, 1600];
const NAVBAR_STYLES = ['solid', 'transparent', 'blur'];

/* ---------- Reusable UI ---------- */
const Row = ({ title, icon: Icon, children }) => (
  <div className="card-soft p-6">
    <h3 className="font-bold mb-4 flex items-center gap-2">{Icon && <Icon size={16} />} {title}</h3>
    {children}
  </div>
);

const PillGroup = ({ options, value, onChange, testId }) => (
  <div className="flex flex-wrap gap-2" data-testid={testId}>
    {options.map((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label;
      const val = typeof opt === 'string' ? opt : opt.value;
      const active = value === val;
      return (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          className="px-4 py-2 rounded-full border-2 text-sm font-semibold capitalize transition-transform hover:scale-105"
          style={{
            borderColor: active ? 'var(--accent)' : 'var(--border)',
            backgroundColor: active ? 'var(--accent)' : 'transparent',
            color: active ? '#fff' : 'var(--text-secondary)',
          }}
          data-testid={`${testId}-${String(val)}`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

/* ---------- Main ---------- */
const AppearanceTab = () => {
  const { theme: current, refresh } = useTheme();
  const [t, setT] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current) setT({
      // Fill in sensible defaults for new fields
      font_family: 'Satoshi',
      animations_enabled: true,
      animation_speed: 'normal',
      cursor_style: 'default',
      scrollbar_style: 'default',
      background_style: 'solid',
      glass_effect: false,
      shadow_intensity: 'medium',
      card_style: 'filled',
      container_width: 1280,
      navbar_style: 'blur',
      loader_enabled: true,
      ...current,
    });
  }, [current]);

  const set = (k, v) => {
    const next = { ...t, [k]: v };
    setT(next);
    applyTheme(next);
  };

  const applyPreset = (name) => {
    const p = PRESETS[name];
    const next = { ...t, primary: p.primary, accent: p.accent, preset: name };
    setT(next);
    applyTheme(next);
  };

  const applyFullPreset = (group, name) => {
    const p = FULL_PRESETS[group][name];
    const next = { ...t, ...p, preset: `${group}:${name}` };
    setT(next);
    applyTheme(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/admin/theme', t);
      await refresh();
      toast.success('Theme saved and applied everywhere');
    } catch { toast.error('Failed to save theme'); }
    finally { setSaving(false); }
  };

  const resetPreview = () => { if (current) { setT({ ...current }); applyTheme(current); } };

  if (!t) return <div>Loading...</div>;

  return (
    <div className="space-y-6" data-testid="appearance-tab">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Appearance</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Live preview enabled — click Save to persist and apply everywhere.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetPreview} className="btn-secondary" data-testid="appearance-reset-btn"><RotateCcw size={16} /> Reset</button>
          <button onClick={save} disabled={saving} className="btn-primary" data-testid="appearance-save-btn">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
      </div>

      {/* Full Theme Presets - Light & Dark */}
      <Row title="Full Theme Presets" icon={Sparkles}>
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Light Themes</div>
            <div className="flex flex-wrap gap-2" data-testid="preset-light-group">
              {Object.entries(FULL_PRESETS.light).map(([name, p]) => (
                <button key={name} onClick={() => applyFullPreset('light', name)}
                  className="px-4 py-2 rounded-full border-2 flex items-center gap-2 text-sm font-semibold transition-transform hover:scale-105"
                  style={{ borderColor: t.preset === `light:${name}` ? p.primary : 'var(--border)', backgroundColor: t.preset === `light:${name}` ? p.primary + '15' : 'transparent', color: t.preset === `light:${name}` ? p.primary : 'var(--text)' }}
                  data-testid={`preset-light-${name}`}
                >
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }}></span>{name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Dark Themes</div>
            <div className="flex flex-wrap gap-2" data-testid="preset-dark-group">
              {Object.entries(FULL_PRESETS.dark).map(([name, p]) => (
                <button key={name} onClick={() => applyFullPreset('dark', name)}
                  className="px-4 py-2 rounded-full border-2 flex items-center gap-2 text-sm font-semibold transition-transform hover:scale-105"
                  style={{ borderColor: t.preset === `dark:${name}` ? p.primary : 'var(--border)', backgroundColor: t.preset === `dark:${name}` ? p.primary + '25' : 'transparent', color: t.preset === `dark:${name}` ? p.primary : 'var(--text)' }}
                  data-testid={`preset-dark-${name}`}
                >
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }}></span>{name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Row>

      {/* Color Presets (legacy) */}
      <Row title="Color Presets" icon={Palette}>
        <div className="flex flex-wrap gap-3" data-testid="appearance-presets">
          {Object.entries(PRESETS).map(([name, colors]) => (
            <button key={name} onClick={() => applyPreset(name)}
              className="px-4 py-2 rounded-full border-2 flex items-center gap-2 text-sm font-semibold capitalize transition-transform hover:scale-105"
              style={{ borderColor: t.preset === name ? colors.primary : 'var(--border)', backgroundColor: t.preset === name ? colors.primary + '15' : 'var(--bg)', color: t.preset === name ? colors.primary : 'var(--text)' }}
              data-testid={`preset-${name}`}
            >
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colors.primary }}></span>{name}
            </button>
          ))}
        </div>
      </Row>

      {/* Mode */}
      <Row title="Mode">
        <div className="flex gap-3" data-testid="appearance-mode">
          {['light', 'dark'].map((m) => (
            <button key={m} onClick={() => set('mode', m)}
              className="flex-1 max-w-xs p-4 rounded-xl border-2 flex items-center gap-3 transition-all"
              style={{ borderColor: t.mode === m ? 'var(--accent)' : 'var(--border)', opacity: t.mode === m ? 1 : 0.6 }}
              data-testid={`mode-${m}`}
            >
              {m === 'light' ? <Sun size={20} style={{ color: 'var(--accent)' }} /> : <Moon size={20} style={{ color: 'var(--accent)' }} />}
              <div className="text-left"><div className="font-semibold capitalize">{m}</div><div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m === 'light' ? 'Clean & bright' : 'Easy on the eyes'}</div></div>
            </button>
          ))}
        </div>
      </Row>

      {/* Font */}
      <Row title="Font Family" icon={Type}>
        <div className="flex flex-wrap gap-2" data-testid="font-group">
          {FONTS.map((f) => (
            <button key={f} onClick={() => set('font_family', f)}
              className="px-4 py-2 rounded-full border-2 text-sm font-semibold transition-transform hover:scale-105"
              style={{ borderColor: t.font_family === f ? 'var(--accent)' : 'var(--border)', backgroundColor: t.font_family === f ? 'var(--accent)' : 'transparent', color: t.font_family === f ? '#fff' : 'var(--text)', fontFamily: f }}
              data-testid={`font-${f.replace(/\s+/g, '-')}`}
            >
              {f}
            </button>
          ))}
        </div>
      </Row>

      {/* Animations */}
      <Row title="Animations" icon={Zap}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={t.animations_enabled !== false} onChange={(e) => set('animations_enabled', e.target.checked)} data-testid="anim-enabled-toggle" />
              <span className="text-sm font-semibold">Enable Animations</span>
            </label>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Disable for accessibility or older devices.</p>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Animation Speed</div>
            <PillGroup options={ANIM_SPEEDS} value={t.animation_speed || 'normal'} onChange={(v) => set('animation_speed', v)} testId="anim-speed" />
          </div>
        </div>
      </Row>

      {/* Cursor */}
      <Row title="Cursor Style" icon={MousePointer2}>
        <PillGroup options={CURSORS} value={t.cursor_style || 'default'} onChange={(v) => set('cursor_style', v)} testId="cursor" />
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Dot &amp; glow cursors follow the pointer with subtle animations.</p>
      </Row>

      {/* Scrollbar */}
      <Row title="Scrollbar">
        <PillGroup options={SCROLLBARS} value={t.scrollbar_style || 'default'} onChange={(v) => set('scrollbar_style', v)} testId="scrollbar" />
      </Row>

      {/* Background Style */}
      <Row title="Background Style" icon={Layers}>
        <PillGroup options={BG_STYLES} value={t.background_style || 'solid'} onChange={(v) => set('background_style', v)} testId="bg-style" />
      </Row>

      {/* Card & Glass */}
      <Row title="Cards & Glass">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Card Style</div>
            <PillGroup options={CARD_STYLES} value={t.card_style || 'filled'} onChange={(v) => set('card_style', v)} testId="card-style" />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer mt-6">
              <input type="checkbox" checked={!!t.glass_effect} onChange={(e) => set('glass_effect', e.target.checked)} data-testid="glass-toggle" />
              <span className="text-sm font-semibold">Global Glass Effect (backdrop blur on cards)</span>
            </label>
          </div>
        </div>
      </Row>

      {/* Shadows */}
      <Row title="Shadow Intensity">
        <PillGroup options={SHADOWS} value={t.shadow_intensity || 'medium'} onChange={(v) => set('shadow_intensity', v)} testId="shadow" />
      </Row>

      {/* Navbar */}
      <Row title="Navbar Style">
        <PillGroup options={NAVBAR_STYLES} value={t.navbar_style || 'blur'} onChange={(v) => set('navbar_style', v)} testId="navbar-style" />
      </Row>

      {/* Container Width */}
      <Row title="Container Width" icon={Maximize2}>
        <div className="flex flex-wrap gap-2" data-testid="container-width-group">
          {CONTAINER_WIDTHS.map((w) => (
            <button key={w} onClick={() => set('container_width', w)}
              className="px-4 py-2 rounded-full border-2 text-sm font-semibold transition-transform hover:scale-105 mono"
              style={{ borderColor: t.container_width === w ? 'var(--accent)' : 'var(--border)', backgroundColor: t.container_width === w ? 'var(--accent)' : 'transparent', color: t.container_width === w ? '#fff' : 'var(--text)' }}
              data-testid={`container-${w}`}
            >
              {w}px
            </button>
          ))}
        </div>
      </Row>

      {/* Loader Toggle */}
      <Row title="Page Loader">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={t.loader_enabled !== false} onChange={(e) => set('loader_enabled', e.target.checked)} data-testid="loader-toggle" />
          <span className="text-sm font-semibold">Show loading spinner while portfolio data loads</span>
        </label>
      </Row>

      {/* Colors (kept) */}
      <Row title="Custom Colors" icon={Palette}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { k: 'primary', label: 'Primary' },
            { k: 'secondary', label: 'Secondary' },
            { k: 'accent', label: 'Accent' },
            { k: 'background', label: 'Background' },
            { k: 'text', label: 'Text' },
            { k: 'text_secondary', label: 'Secondary Text' },
          ].map(({ k, label }) => (
            <div key={k}>
              <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
              <div className="flex items-center gap-2 border rounded-xl p-1.5" style={{ borderColor: 'var(--border)' }}>
                <input type="color" value={t[k] || '#000000'} onChange={(e) => set(k, e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" data-testid={`color-${k}`} />
                <input type="text" value={t[k] || ''} onChange={(e) => set(k, e.target.value)} className="flex-1 bg-transparent outline-none text-sm mono" data-testid={`color-hex-${k}`} />
              </div>
            </div>
          ))}
        </div>
      </Row>

      {/* Radius / Button Style */}
      <Row title="Radius & Buttons">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Border Radius</div>
            <input type="range" min={0} max={30} value={t.radius || 12} onChange={(e) => set('radius', Number(e.target.value))} className="w-full" data-testid="radius-slider" />
            <div className="text-sm mono mt-1" style={{ color: 'var(--text-secondary)' }}>{t.radius || 12}px</div>
          </div>
          <div>
            <div className="text-xs uppercase font-semibold tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Button Style</div>
            <div className="flex flex-wrap gap-2">
              {['pill', 'rounded', 'square'].map((s) => (
                <button key={s} onClick={() => set('button_style', s)}
                  className="px-4 py-2 border-2 text-sm font-semibold capitalize"
                  style={{ borderRadius: s === 'square' ? '4px' : s === 'rounded' ? '10px' : '9999px', borderColor: t.button_style === s ? 'var(--accent)' : 'var(--border)', color: t.button_style === s ? 'var(--accent)' : 'var(--text)' }}
                  data-testid={`btn-style-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Row>

      {/* Preview */}
      <Row title="Live Preview">
        <div className="flex flex-wrap gap-3 items-center">
          <button className="btn-primary">Primary Action</button>
          <button className="btn-secondary">Secondary</button>
          <span className="badge-red">Badge</span>
          <input className="input-x max-w-xs" placeholder="Input" />
        </div>
      </Row>
    </div>
  );
};

export default AppearanceTab;
