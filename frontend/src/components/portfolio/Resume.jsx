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
              className="w-56 h-72 rounded-2xl border border-[#E5E7EB] shadow-lg overflow-hidden bg-white"
              data-testid="resume-preview"
              aria-label="Resume preview mock"
            >
              {/* Realistic fake resume mock (placeholder — not real content) */}
              <svg viewBox="0 0 224 288" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" role="img">
                <rect width="224" height="288" fill="#ffffff" />
                {/* Header band */}
                <rect x="0" y="0" width="224" height="60" fill="#111111" />
                <circle cx="30" cy="30" r="16" fill="#ffffff" opacity="0.15" />
                <circle cx="30" cy="30" r="12" fill="#E53935" />
                <rect x="56" y="20" width="120" height="8" rx="2" fill="#ffffff" />
                <rect x="56" y="34" width="90" height="5" rx="2" fill="#ffffff" opacity="0.65" />

                {/* Section: Summary */}
                <rect x="16" y="76" width="40" height="6" rx="2" fill="#E53935" />
                <rect x="16" y="90" width="192" height="4" rx="2" fill="#E5E7EB" />
                <rect x="16" y="100" width="184" height="4" rx="2" fill="#E5E7EB" />
                <rect x="16" y="110" width="150" height="4" rx="2" fill="#E5E7EB" />

                {/* Section: Experience */}
                <rect x="16" y="130" width="60" height="6" rx="2" fill="#E53935" />
                <rect x="16" y="144" width="120" height="5" rx="2" fill="#111111" />
                <rect x="16" y="154" width="80" height="4" rx="2" fill="#9CA3AF" />
                <rect x="16" y="164" width="192" height="3" rx="1.5" fill="#E5E7EB" />
                <rect x="16" y="171" width="192" height="3" rx="1.5" fill="#E5E7EB" />
                <rect x="16" y="178" width="140" height="3" rx="1.5" fill="#E5E7EB" />

                {/* Second experience entry */}
                <rect x="16" y="192" width="110" height="5" rx="2" fill="#111111" />
                <rect x="16" y="202" width="70" height="4" rx="2" fill="#9CA3AF" />
                <rect x="16" y="212" width="192" height="3" rx="1.5" fill="#E5E7EB" />
                <rect x="16" y="219" width="160" height="3" rx="1.5" fill="#E5E7EB" />

                {/* Section: Skills chips */}
                <rect x="16" y="238" width="40" height="6" rx="2" fill="#E53935" />
                <rect x="16" y="252" width="34" height="10" rx="5" fill="#FFEBEE" />
                <rect x="54" y="252" width="42" height="10" rx="5" fill="#FFEBEE" />
                <rect x="100" y="252" width="30" height="10" rx="5" fill="#FFEBEE" />
                <rect x="134" y="252" width="48" height="10" rx="5" fill="#FFEBEE" />

                {/* Footer strip */}
                <rect x="0" y="278" width="224" height="10" fill="#FAFAFA" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Resume;
