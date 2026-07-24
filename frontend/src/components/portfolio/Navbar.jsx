import React, { useEffect, useState } from 'react';
import { Menu, X, Code2 } from 'lucide-react';
import { mediaUrl } from '@/lib/api';

const links = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'education', label: 'Education' },
  { id: 'resume', label: 'Resume' },
  { id: 'contact', label: 'Contact' },
];

const Navbar = ({ profile }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // detect active section
      let current = 'home';
      links.forEach((l) => {
        const el = document.getElementById(l.id);
        if (el) {
          const top = el.getBoundingClientRect().top;
          if (top <= 120) current = l.id;
        }
      });
      setActive(current);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (id) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/85 backdrop-blur-xl border-b border-[#E5E7EB] shadow-sm' : 'bg-white/60 backdrop-blur-md'
      }`}
      data-testid="navbar"
    >
      <div className="container-x flex items-center justify-between h-16">
        <button
          onClick={() => handleClick('home')}
          className="flex items-center gap-2 group"
          data-testid="navbar-logo"
        >
          {profile?.logo ? (
            <img src={mediaUrl(profile.logo)} alt={profile?.name || 'Logo'} className="h-9 w-auto max-w-[160px] object-contain group-hover:scale-105 transition-transform" data-testid="navbar-logo-img" />
          ) : (
            <>
              <span className="w-9 h-9 rounded-xl bg-[#E53935] text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                <Code2 size={18} />
              </span>
              <span className="font-bold text-lg text-[#111111] tracking-tight">
                {profile?.name?.split(' ')[0] || 'Abhinandan'}
                <span className="text-[#E53935]">.</span>
              </span>
            </>
          )}
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => handleClick(l.id)}
              data-testid={`nav-link-${l.id}`}
              className={`nav-link px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                active === l.id ? 'nav-link-active text-[#E53935]' : 'text-[#555555] hover:text-[#E53935]'
              }`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => handleClick('contact')}
            data-testid="navbar-hire-btn"
            className="btn-primary ml-2"
            style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
          >
            Hire Me
          </button>
        </div>

        <button
          className="md:hidden p-2 text-[#111111]"
          onClick={() => setOpen(!open)}
          data-testid="navbar-hamburger"
          aria-label="menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-xl animate-fade-in" data-testid="navbar-mobile-menu">
          <div className="container-x py-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => handleClick(l.id)}
                data-testid={`nav-mobile-${l.id}`}
                className={`text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center justify-between ${
                  active === l.id ? 'text-[#E53935] bg-[#FFEBEE]' : 'text-[#111111] hover:bg-[#FAFAFA]'
                }`}
              >
                <span>{l.label}</span>
                {active === l.id && <span className="w-1.5 h-1.5 rounded-full bg-[#E53935]"></span>}
              </button>
            ))}
            <button
              onClick={() => handleClick('contact')}
              className="btn-primary mt-3 justify-center"
              data-testid="navbar-mobile-hire"
            >
              Hire Me
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
