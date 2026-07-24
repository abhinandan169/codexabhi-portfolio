import React, { useState } from 'react';
import { MessageCircle, Plus, X } from 'lucide-react';
import { getSocialIcon } from '@/lib/socialIcons';

const FloatingButtons = ({ social }) => {
  const [expanded, setExpanded] = useState(false);
  const whatsapp = social?.find((s) => s.platform.toLowerCase().includes('whats'));
  const others = social?.filter((s) => !s.platform.toLowerCase().includes('whats')) || [];

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-start gap-3" data-testid="floating-container">
      {whatsapp && (
        <a
          href={whatsapp.url}
          target="_blank"
          rel="noreferrer"
          className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          data-testid="floating-whatsapp"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={26} fill="white" />
        </a>
      )}

      <div className="flex flex-col-reverse items-start gap-2">
        {expanded && others.map((s) => {
          const Ico = getSocialIcon(s.platform);
          return (
            <a
              key={s.id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-full bg-white border border-[#E5E7EB] shadow-lg text-[#E53935] flex items-center justify-center hover:bg-[#E53935] hover:text-white transition-colors fade-in-up"
              data-testid={`floating-social-${s.platform}`}
              title={s.platform}
            >
              <Ico size={18} />
            </a>
          );
        })}
        {others.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-14 h-14 rounded-full bg-[#E53935] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            data-testid="floating-social-toggle"
            aria-label="Social links"
          >
            {expanded ? <X size={22} /> : <Plus size={24} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingButtons;
