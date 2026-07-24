import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { mediaUrl } from '@/lib/api';

const Certificates = ({ certificates }) => (
  <section id="certificates" className="section-y" data-testid="certificates-section">
    <div className="container-x">
      <div className="max-w-2xl">
        <span className="eyebrow">Certificates</span>
        <h2 className="text-3xl sm:text-5xl font-bold mt-2">
          Certifications & <span className="text-[#E53935]">achievements.</span>
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="certificates-grid">
        {certificates.map((c) => (
          <div key={c.id} className="card-soft overflow-hidden" data-testid={`certificate-${c.id}`}>
            <div className="aspect-video bg-[#FAFAFA] flex items-center justify-center">
              {c.image ? (
                <img src={mediaUrl(c.image)} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <Award className="text-[#E53935]" size={56} />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-lg leading-tight">{c.name}</h3>
              <p className="text-sm text-[#555555] mt-1">{c.organization}{c.date ? ` · ${c.date}` : ''}</p>
              {c.credential_link && (
                <a href={c.credential_link} target="_blank" rel="noreferrer" className="mt-3 text-sm font-semibold text-[#E53935] inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid={`certificate-link-${c.id}`}>
                  View credential <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        ))}
        {certificates.length === 0 && (
          <p className="text-[#888888] col-span-full" data-testid="certificates-empty">No certificates yet.</p>
        )}
      </div>
    </div>
  </section>
);

export default Certificates;
