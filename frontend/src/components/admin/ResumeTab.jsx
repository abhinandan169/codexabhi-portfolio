import React, { useEffect, useState } from 'react';
import { FileText, Save, ExternalLink } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';
import FileUpload from './FileUpload';

const ResumeTab = () => {
  const [r, setR] = useState({ file_url: '', file_name: '' });

  useEffect(() => { api.get('/resume').then((res) => setR(res.data || { file_url: '', file_name: '' })); }, []);

  const save = async () => {
    try {
      await api.put('/admin/resume', { file_url: r.file_url, file_name: r.file_name });
      toast.success('Resume updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6" data-testid="resume-tab">
      <div>
        <h1 className="text-2xl font-bold">Resume</h1>
        <p className="text-sm text-[#555555]">Upload and replace your resume PDF anytime.</p>
      </div>
      <div className="card-soft p-6 space-y-4">
        <FileUpload
          value={r.file_url}
          onChange={(v) => setR({ ...r, file_url: v, file_name: v ? v.split('/').pop() : '' })}
          label="Resume PDF"
          accept="application/pdf"
          testId="resume-upload"
        />
        <div>
          <label className="text-xs uppercase tracking-widest font-semibold text-[#555555] block mb-1.5">Display file name</label>
          <input className="input-x" value={r.file_name} onChange={(e) => setR({ ...r, file_name: e.target.value })} placeholder="Abhinandan_Kumar_Resume.pdf" data-testid="resume-filename-input" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={save} className="btn-primary" data-testid="resume-save-btn"><Save size={16} /> Save</button>
          {r.file_url && (
            <a href={mediaUrl(r.file_url)} target="_blank" rel="noreferrer" className="btn-secondary" data-testid="resume-open-btn">
              <ExternalLink size={16} /> Open Current Resume
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeTab;
