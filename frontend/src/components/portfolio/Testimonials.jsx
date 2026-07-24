import React, { useEffect, useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight, Linkedin } from 'lucide-react';
import { mediaUrl } from '@/lib/api';

const Testimonials = ({ testimonials }) => {
  const list = testimonials || [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length]);

  if (!list.length) return null;
  const t = list[idx];

  return (
    <section className="section-y" style={{ backgroundColor: 'var(--bg-alt)' }} data-testid="testimonials-section">
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="eyebrow">Testimonials</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            What others <span style={{ color: 'var(--accent)' }}>say.</span>
          </h2>
        </div>

        <div className="mt-12 max-w-4xl mx-auto card-soft p-8 sm:p-12 relative" data-testid="testi-card">
          <Quote className="absolute top-6 left-6 opacity-10" size={80} style={{ color: 'var(--accent)' }} />
          <div className="relative">
            <p className="text-lg sm:text-2xl leading-relaxed font-medium" style={{ color: 'var(--text)' }} data-testid="testi-review">
              "{t.review}"
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-alt)' }}>
                {t.photo ? (
                  <img src={mediaUrl(t.photo)} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg" style={{ color: 'var(--accent)' }}>{t.name?.[0]}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold" data-testid="testi-name">{t.name}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.role}{t.company ? ` @ ${t.company}` : ''}</div>
                <div className="mt-1 flex items-center gap-0.5" style={{ color: 'var(--accent)' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < t.rating ? 'currentColor' : 'transparent'} strokeWidth={1.5} />)}
                </div>
              </div>
              {t.linkedin && (
                <a href={t.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }} data-testid="testi-linkedin"><Linkedin size={16} /></a>
              )}
            </div>
          </div>
        </div>

        {list.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3" data-testid="testi-controls">
            <button onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)} className="p-3 rounded-full border transition-colors hover:bg-[var(--accent-light)]" style={{ borderColor: 'var(--border)' }} data-testid="testi-prev"><ChevronLeft size={16} /></button>
            <div className="flex gap-1.5">
              {list.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className="w-2 h-2 rounded-full transition-all"
                  style={{ backgroundColor: i === idx ? 'var(--accent)' : 'var(--border)', width: i === idx ? 22 : 8 }}
                  data-testid={`testi-dot-${i}`} />
              ))}
            </div>
            <button onClick={() => setIdx((i) => (i + 1) % list.length)} className="p-3 rounded-full border transition-colors hover:bg-[var(--accent-light)]" style={{ borderColor: 'var(--border)' }} data-testid="testi-next"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;
