import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Award, Code2, GraduationCap, FileText, Link as LinkIcon, MessageSquare, LayoutDashboard, Briefcase, ExternalLink, Palette, Settings as SettingsIcon, Database, History, BarChart3, Search as SearchIcon, ImageIcon, EyeOff, Star, TrendingUp, Bell, Users, Menu, X, Github, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import OverviewTab from '@/components/admin/OverviewTab';
import ProfileTab from '@/components/admin/ProfileTab';
import SkillsTab from '@/components/admin/SkillsTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import CertificatesTab from '@/components/admin/CertificatesTab';
import EducationTab from '@/components/admin/EducationTab';
import ResumeTab from '@/components/admin/ResumeTab';
import SocialTab from '@/components/admin/SocialTab';
import MessagesTab from '@/components/admin/MessagesTab';
import AppearanceTab from '@/components/admin/AppearanceTab';
import SettingsTab from '@/components/admin/SettingsTab';
import BackupTab from '@/components/admin/BackupTab';
import ActivityTab from '@/components/admin/ActivityTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import SEOTab from '@/components/admin/SEOTab';
import MediaTab from '@/components/admin/MediaTab';
import VisibilityTab from '@/components/admin/VisibilityTab';
import TestimonialsTab from '@/components/admin/TestimonialsTab';
import ExperienceTab from '@/components/admin/ExperienceTab';
import CountersTab from '@/components/admin/CountersTab';
import NotificationsTab from '@/components/admin/NotificationsTab';
import GlobalSearch from '@/components/admin/GlobalSearch';
import GitHubActivityTab from '@/components/admin/GitHubActivityTab';
import LiveInfoTab from '@/components/admin/LiveInfoTab';

const tabGroups = [
  {
    title: 'Dashboard',
    tabs: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Content',
    tabs: [
      { id: 'profile', label: 'Profile / Hero', icon: User },
      { id: 'skills', label: 'Skills', icon: Code2 },
      { id: 'projects', label: 'Projects', icon: Briefcase },
      { id: 'experience', label: 'Experience', icon: TrendingUp },
      { id: 'certificates', label: 'Certificates', icon: Award },
      { id: 'education', label: 'Education', icon: GraduationCap },
      { id: 'testimonials', label: 'Testimonials', icon: Star },
      { id: 'counters', label: 'Counters', icon: Users },
      { id: 'resume', label: 'Resume', icon: FileText },
      { id: 'social', label: 'Social Links', icon: LinkIcon },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    title: 'Site',
    tabs: [
      { id: 'media', label: 'Media Library', icon: ImageIcon },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'visibility', label: 'Section Visibility', icon: EyeOff },
      { id: 'seo', label: 'SEO', icon: SearchIcon },
    ],
  },
  {
    title: 'Widgets',
    tabs: [
      { id: 'github', label: 'GitHub Activity', icon: Github },
      { id: 'liveinfo', label: 'Live Info Card', icon: Sparkles },
    ],
  },
  {
    title: 'System',
    tabs: [
      { id: 'backup', label: 'Backup & Restore', icon: Database },
      { id: 'activity', label: 'Activity Log', icon: History },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

const AdminDashboard = () => {
  const nav = useNavigate();
  const [tab, setTab] = useState('overview');
  const [ready, setReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { nav('/admin/login'); return; }
    api.get('/auth/me')
      .then(() => setReady(true))
      .catch(() => { localStorage.removeItem('admin_token'); nav('/admin/login'); });
  }, [nav]);

  const refreshUnread = useCallback(() => {
    api.get('/admin/notifications', { params: { page: 1, page_size: 1 } })
      .then((r) => setUnread(r.data.unread || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    refreshUnread();
    const t = setInterval(refreshUnread, 20000);
    return () => clearInterval(t);
  }, [ready, tab, refreshUnread]);

  // Cmd+K / Ctrl+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Logged out');
    nav('/admin/login');
  };

  const goTo = (id) => { setTab(id); setMobileOpen(false); };

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-alt)' }}>
      <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}></div>
    </div>
  );

  const allTabs = tabGroups.flatMap((g) => g.tabs);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-alt)' }} data-testid="admin-dashboard">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className={`${mobileOpen ? 'block' : 'hidden'} lg:block lg:w-64 flex-shrink-0`} style={{ backgroundColor: 'var(--bg)', borderRight: '1px solid var(--border)' }} data-testid="admin-sidebar">
          <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}><LayoutDashboard size={18} /></span>
              <div>
                <div className="font-bold">Admin</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Portfolio CMS</div>
              </div>
            </div>
            <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)}><X size={20} /></button>
          </div>

          <nav className="p-3 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto">
            {tabGroups.map((g) => (
              <div key={g.title}>
                <div className="px-2 mb-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>{g.title}</div>
                {g.tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => goTo(t.id)}
                    data-testid={`admin-tab-${t.id}`}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative"
                    style={{
                      backgroundColor: tab === t.id ? 'var(--accent-light)' : 'transparent',
                      color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <t.icon size={16} /> <span className="flex-1 text-left">{t.label}</span>
                    {t.id === 'notifications' && unread > 0 && (
                      <span className="text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center" style={{ backgroundColor: 'var(--accent)' }} data-testid="notif-badge">{unread}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="p-3 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--bg-alt)]" style={{ color: 'var(--text-secondary)' }} data-testid="admin-view-site">
              <ExternalLink size={16} /> View Site
            </a>
            <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--accent)' }} data-testid="admin-logout">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
            <button className="lg:hidden btn-secondary text-sm" onClick={() => setMobileOpen(true)} style={{padding:'0.5rem 1rem'}} data-testid="admin-open-menu"><Menu size={14} /> Menu</button>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex-1 max-w-md flex items-center gap-3 px-4 py-2 rounded-full text-sm"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              data-testid="admin-search-trigger"
            >
              <SearchIcon size={16} /> Search everything...
              <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded mono" style={{ backgroundColor: 'var(--bg-alt)' }}>⌘K</kbd>
            </button>
            <button onClick={() => goTo('notifications')} className="relative p-2 rounded-full" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }} data-testid="admin-notif-btn">
              <Bell size={16} />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>{unread}</span>}
            </button>
          </div>
          {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
          {tab === 'analytics' && <AnalyticsTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'profile' && <ProfileTab />}
          {tab === 'skills' && <SkillsTab />}
          {tab === 'projects' && <ProjectsTab />}
          {tab === 'experience' && <ExperienceTab />}
          {tab === 'certificates' && <CertificatesTab />}
          {tab === 'education' && <EducationTab />}
          {tab === 'testimonials' && <TestimonialsTab />}
          {tab === 'counters' && <CountersTab />}
          {tab === 'resume' && <ResumeTab />}
          {tab === 'social' && <SocialTab />}
          {tab === 'messages' && <MessagesTab />}
          {tab === 'media' && <MediaTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'visibility' && <VisibilityTab />}
          {tab === 'seo' && <SEOTab />}
          {tab === 'github' && <GitHubActivityTab />}
          {tab === 'liveinfo' && <LiveInfoTab />}
          {tab === 'backup' && <BackupTab />}
          {tab === 'activity' && <ActivityTab />}
          {tab === 'settings' && <SettingsTab />}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={setTab} />
    </div>
  );
};

export default AdminDashboard;
