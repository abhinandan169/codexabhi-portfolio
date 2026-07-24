import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileEdit, Send } from 'lucide-react';

/** Small "Saving… / Saved / Error" indicator for the edit forms. */
export const AutoSaveStatus = ({ status, testId = 'autosave-status' }) => {
  if (status === 'idle') return null;
  const cfg = {
    saving: { icon: Loader2, text: 'Saving…', spin: true, color: 'var(--text-muted)' },
    saved: { icon: CheckCircle2, text: 'Saved', color: '#10B981' },
    error: { icon: AlertCircle, text: 'Auto-save failed', color: 'var(--accent)' },
  }[status];
  if (!cfg) return null;
  const Ico = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold"
      style={{ color: cfg.color }}
      data-testid={testId}
      data-status={status}
    >
      <Ico size={13} className={cfg.spin ? 'animate-spin' : ''} />
      {cfg.text}
    </span>
  );
};

/** Draft/Published pill toggle for admin item cards + forms. */
export const StatusPill = ({ status = 'published', onChange, testId, size = 'sm', asBadge = false }) => {
  const isDraft = status === 'draft';
  if (asBadge) {
    if (!isDraft) return null;
    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
        style={{ backgroundColor: 'rgba(234,179,8,0.15)', color: '#B45309' }}
        data-testid={testId || 'status-badge-draft'}
      >
        <FileEdit size={10} /> Draft
      </span>
    );
  }
  const label = isDraft ? 'Draft' : 'Published';
  const Ico = isDraft ? FileEdit : Send;
  const bg = isDraft ? 'rgba(234,179,8,0.15)' : 'rgba(16,185,129,0.15)';
  const fg = isDraft ? '#B45309' : '#047857';
  const px = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';
  const fs = size === 'sm' ? 'text-[11px]' : 'text-xs';
  return (
    <button
      type="button"
      onClick={() => onChange && onChange(isDraft ? 'published' : 'draft')}
      className={`inline-flex items-center gap-1 rounded-full ${px} ${fs} font-semibold uppercase tracking-wide transition-colors`}
      style={{ backgroundColor: bg, color: fg }}
      title={isDraft ? 'Click to publish' : 'Click to move to draft'}
      data-testid={testId || `status-toggle-${status}`}
      data-status={status}
    >
      <Ico size={12} /> {label}
    </button>
  );
};

export default StatusPill;
