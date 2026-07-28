import React from 'react';
import { Heart } from 'lucide-react';
import { mediaUrl } from '@/lib/api';
import { getSocialMeta } from '@/lib/socialIcons';

const Footer = ({ profile, social }) => (
  <footer className="bg-[#111111] text-gray-400 py-12" data-testid="footer">
    <div className="container-x">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          {profile?.logo ? (
            <img src={mediaUrl(profile.logo)} alt={profile?.name || 'Logo'} className="h-10 w-auto max-w-[180px] object-contain brightness-0 invert" data-testid="footer-logo-img" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold">A</span>
              <span className="font-bold text-lg text-white">{profile?.name?.split(' ')[0]}<span className="text-[#E53935]">.</span></span>
            </div>
          )}
          <p className="mt-4 text-sm leading-relaxed">{profile?.tagline}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['About','Skills','Projects','Certificates','Education','Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-[#E53935] transition-colors" data-testid={`footer-link-${l.toLowerCase()}`}>{l}</a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4">Connect</h4>
          <div className="flex flex-wrap gap-2">
            {social?.map((s) => {
              const meta = getSocialMeta(s.platform);
              const Ico = meta.icon;
              const isEmail = meta.label === 'Email';
              const emailAddr = isEmail ? String(s.url || '').replace(/^mailto:/i, '').trim() : '';
              const href = isEmail && emailAddr
                ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}`
                : s.url;
              return (
                <a key={s.id} href={href} target="_blank" rel="noreferrer" title={meta.label || s.platform}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#E53935] flex items-center justify-center transition-colors"
                  data-testid={`footer-social-${s.platform}`}>
                  <Ico size={16} className="text-white" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <p>© {new Date().getFullYear()} {profile?.name}. All rights reserved.</p>
        <p className="flex items-center gap-1.5">Made with <Heart size={13} className="text-[#E53935] fill-[#E53935]" /> and clean code.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
