import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, FileJson } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const BackupTab = () => {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // parsed data awaiting confirmation
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get('/admin/backup');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch { toast.error('Failed to export backup'); }
    finally { setBusy(false); }
  };

  const onFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setPending(data);
    } catch {
      toast.error('Invalid JSON file');
      setFileName('');
    }
  };

  const confirmRestore = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const res = await api.post('/admin/restore', { data: pending, replace: true });
      toast.success(`Restored: ${Object.entries(res.data.restored).map(([k, v]) => `${k}:${v}`).join(', ')}`);
      setPending(null);
      setFileName('');
    } catch { toast.error('Restore failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="backup-tab">
      <div>
        <h1 className="text-2xl font-bold">Backup &amp; Restore</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Export all portfolio data or restore from a previously downloaded backup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-soft p-6" data-testid="backup-export-card">
          <span className="w-12 h-12 rounded-xl bg-[#FFEBEE] text-[#E53935] flex items-center justify-center"><Download size={20} /></span>
          <h3 className="mt-4 font-bold text-lg">Export Backup</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Downloads a JSON file containing all your profile, skills, projects, certificates, education, resume, and social links.</p>
          <button onClick={download} disabled={busy} className="btn-primary mt-4" data-testid="backup-download-btn">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download JSON
          </button>
        </div>

        <div className="card-soft p-6" data-testid="backup-import-card">
          <span className="w-12 h-12 rounded-xl bg-[#FFEBEE] text-[#E53935] flex items-center justify-center"><Upload size={20} /></span>
          <h3 className="mt-4 font-bold text-lg">Restore from Backup</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Upload a JSON backup file. This will <span className="font-semibold" style={{ color: 'var(--accent)' }}>replace existing data</span> in included collections.</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
            data-testid="backup-file-input"
          />
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <button onClick={() => inputRef.current?.click()} className="btn-secondary" data-testid="backup-choose-btn">
              <FileJson size={16} /> Choose File
            </button>
            {fileName && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fileName}</span>}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Restore this backup?"
        description="This will REPLACE your current profile, skills, projects, certificates, education, resume, social links, and theme with the data in the uploaded file. This action cannot be undone."
        onConfirm={confirmRestore}
        onCancel={() => { setPending(null); setFileName(''); }}
      />
    </div>
  );
};

export default BackupTab;
