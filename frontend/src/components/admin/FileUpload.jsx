import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Drag & drop file upload input.
 * value: current URL/path
 * onChange: (newUrl) => void
 * accept: input accept attribute
 */
const FileUpload = ({ value, onChange, accept = 'image/*', label = 'Upload', testId = 'file-upload' }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange(res.data.url);
      toast.success('Uploaded');
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  return (
    <div>
      {label && <label className="text-xs uppercase tracking-widest font-semibold text-[#555555] block mb-1.5">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#E53935] bg-[#FFEBEE]' : 'border-[#E5E7EB] hover:border-[#E53935] bg-[#FAFAFA]'
        }`}
        data-testid={testId}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => doUpload(e.target.files?.[0])}
        />
        {uploading ? (
          <div className="py-3 flex items-center justify-center gap-2 text-[#E53935]">
            <Loader2 size={16} className="animate-spin" /> Uploading...
          </div>
        ) : value ? (
          <div className="flex items-center gap-3">
            {accept.includes('image') ? (
              <img src={mediaUrl(value)} alt="preview" loading="lazy" className="w-16 h-16 rounded-lg object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[#E53935]">PDF</div>
            )}
            <div className="text-left flex-1 truncate text-sm text-[#555555]">{value}</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-2 hover:bg-white rounded-lg"
              data-testid={`${testId}-clear`}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="py-4 flex flex-col items-center gap-1 text-[#555555]">
            <UploadCloud size={22} className="text-[#E53935]" />
            <div className="text-sm font-semibold">Drop file here or click to upload</div>
            <div className="text-xs text-[#888888]">{accept}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
