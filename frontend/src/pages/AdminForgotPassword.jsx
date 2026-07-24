import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [debugUrl, setDebugUrl] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (res.data?.debug_reset_url) {
        setDebugUrl(res.data.debug_reset_url);
        toast.message('Email delivery is not configured — reset link shown below.');
      } else {
        toast.success('If that email is registered, a reset link has been sent.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4" data-testid="admin-forgot-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#E53935] text-white font-bold flex items-center justify-center">A</span>
            <span className="font-bold text-xl">Reset your password</span>
          </div>
          <p className="mt-2 text-[#555555] text-sm">Enter your admin email and we'll send you a reset link.</p>
        </div>

        {!sent ? (
          <form onSubmit={submit} className="card-soft p-8 space-y-4" data-testid="admin-forgot-form">
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-[#555555]">Admin Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
                <input
                  type="email"
                  className="input-x pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="admin-forgot-email"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="admin-forgot-submit">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Send reset link <ArrowRight size={16} /></>}
            </button>
            <Link to="/admin/login" className="flex items-center justify-center gap-1 text-xs font-semibold text-[#555555] hover:text-[#E53935] pt-1" data-testid="admin-forgot-back">
              <ArrowLeft size={13} /> Back to login
            </Link>
          </form>
        ) : (
          <div className="card-soft p-8 text-center space-y-4" data-testid="admin-forgot-success">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 size={28} style={{ color: '#10B981' }} />
            </div>
            <h2 className="text-lg font-bold">Check your inbox</h2>
            <p className="text-sm text-[#555555]">
              If <span className="font-semibold text-[#111]">{email}</span> is registered, a reset link has been sent. The link expires in 30 minutes.
            </p>
            {debugUrl && (
              <div className="text-xs p-3 rounded-lg text-left" style={{ backgroundColor: 'var(--bg-alt)', border: '1px dashed var(--border)' }}>
                <div className="uppercase font-bold tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Dev mode · email not configured</div>
                <a href={debugUrl} className="break-all font-semibold" style={{ color: 'var(--accent)' }} data-testid="admin-forgot-debug-url">{debugUrl}</a>
              </div>
            )}
            <Link to="/admin/login" className="btn-secondary inline-flex items-center gap-1 mt-2" data-testid="admin-forgot-return">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminForgotPassword;
