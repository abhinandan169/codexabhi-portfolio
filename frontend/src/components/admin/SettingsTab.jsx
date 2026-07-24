import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, KeyRound, Mail, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const SettingsTab = () => {
  const nav = useNavigate();
  const currentEmail = (() => {
    try { return JSON.parse(atob((localStorage.getItem('admin_token') || '').split('.')[1] || 'e30=')).sub || ''; }
    catch { return ''; }
  })();
  const [email, setEmail] = useState({ current_password: '', new_email: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  const [savingE, setSavingE] = useState(false);
  const [savingP, setSavingP] = useState(false);

  const logoutAll = () => {
    localStorage.removeItem('admin_token');
    toast.info('You have been logged out. Please login again.');
    setTimeout(() => nav('/admin/login'), 700);
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    if (!email.current_password || !email.new_email) { toast.error('Fill in all fields'); return; }
    setSavingE(true);
    try {
      await api.put('/admin/account/email', email);
      toast.success('Email updated. Please login again.');
      logoutAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to update email');
    } finally { setSavingE(false); }
  };

  const submitPwd = async (e) => {
    e.preventDefault();
    if (!pwd.current_password || !pwd.new_password) { toast.error('Fill all fields'); return; }
    if (pwd.new_password.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwd.new_password !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    setSavingP(true);
    try {
      await api.put('/admin/account/password', { current_password: pwd.current_password, new_password: pwd.new_password });
      toast.success('Password changed. Logging out all sessions...');
      logoutAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to change password');
    } finally { setSavingP(false); }
  };

  return (
    <div className="space-y-6" data-testid="settings-tab">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Signed in as <span className="font-semibold">{currentEmail}</span></p>
      </div>

      <form onSubmit={submitEmail} className="card-soft p-6 space-y-4 max-w-xl" data-testid="email-form">
        <h3 className="font-bold flex items-center gap-2"><Mail size={16} /> Change Email</h3>
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
          <input type="password" className="input-x" value={email.current_password} onChange={(e) => setEmail({ ...email, current_password: e.target.value })} required data-testid="email-current-pwd" />
        </div>
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Email</label>
          <input type="email" className="input-x" value={email.new_email} onChange={(e) => setEmail({ ...email, new_email: e.target.value })} required data-testid="email-new" />
        </div>
        <button type="submit" disabled={savingE} className="btn-primary" data-testid="email-save-btn">
          {savingE ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update Email
        </button>
      </form>

      <form onSubmit={submitPwd} className="card-soft p-6 space-y-4 max-w-xl" data-testid="password-form">
        <h3 className="font-bold flex items-center gap-2"><KeyRound size={16} /> Change Password</h3>
        <div>
          <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
          <input type="password" className="input-x" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} required data-testid="pwd-current" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
            <input type="password" className="input-x" value={pwd.new_password} onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} minLength={6} required data-testid="pwd-new" />
          </div>
          <div>
            <label className="text-xs uppercase font-semibold tracking-widest block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm New Password</label>
            <input type="password" className="input-x" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required data-testid="pwd-confirm" />
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Changing your password will log out all active sessions.</p>
        <button type="submit" disabled={savingP} className="btn-primary" data-testid="pwd-save-btn">
          {savingP ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update Password
        </button>
      </form>
    </div>
  );
};

export default SettingsTab;
