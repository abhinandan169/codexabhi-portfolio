import React from 'react';
import { Download, Eye, Share2 } from 'lucide-react';
import { mediaUrl } from '@/lib/api';
import { trackResumeDownload } from '@/lib/analytics';
import { toast } from 'sonner';

const Resume = ({ resume }) => {
  const url = resume?.file_url ? mediaUrl(resume.file_url) : '';

  const handleDownload = () => {
    if (!url) { toast.info('Resume Coming Soon'); return; }
    trackResumeDownload();
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleView = () => {
    if (!url) { toast.info('Resume Coming Soon'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (!url) { toast.info('Resume Coming Soon'); return; }
    if (navigator.share) {
      try { await navigator.share({ title: 'Resume', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Resume link copied');
    }
  };

  return (
    <section id="resume" className="section-y" data-testid="resume-section">
      <div className="container-x">
        <div className="card-soft p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-white to-[#FFEBEE]/40">
          <div>
            <span className="eyebrow">Resume</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">
              Grab a copy of my <span className="text-[#E53935]">resume.</span>
            </h2>
            <p className="mt-4 text-[#555555]">
              {url ? 'Get the latest snapshot of my experience, skills and projects.' : 'Resume Coming Soon — I\'m polishing it up.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleDownload} className="btn-primary" data-testid="resume-download-btn">
                <Download size={16} /> Download
              </button>
              <button onClick={handleView} className="btn-secondary" data-testid="resume-view-btn">
                <Eye size={16} /> View
              </button>
              <button onClick={handleShare} className="btn-secondary" data-testid="resume-share-btn">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div
              className="w-56 h-72 rounded-xl border border-[#E5E7EB] shadow-xl overflow-hidden bg-white ring-1 ring-black/5"
              data-testid="resume-preview"
              aria-label="Sample resume preview"
            >
              <img
                src="/assets/sample-resume.png"
                alt="Sample resume preview"
                loading="lazy"
                className="w-full h-full object-contain block transform scale-[1.09]"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resume;
