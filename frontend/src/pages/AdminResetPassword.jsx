import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AdminResetPassword = () => {
  const { token } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState('validating'); // validating | valid | invalid | done
  const [email, setEmail] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/auth/reset/${token}`)
      .then((r) => { setEmail(r.data.email || ''); setStatus('valid'); })
      .catch((err) => { setErrMsg(err?.response?.data?.detail || 'This reset link is invalid or expired.'); setStatus('invalid'); });
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setStatus('done');
      toast.success('Password updated. You can now sign in.');
      setTimeout(() => nav('/admin/login'), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Reset failed. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4" data-testid="admin-reset-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#E53935] text-white font-bold flex items-center justify-center">A</span>
            <span className="font-bold text-xl">Choose a new password</span>
          </div>
        </div>

        {status === 'validating' && (
          <div className="card-soft p-10 text-center" data-testid="admin-reset-validating">
            <Loader2 size={28} className="mx-auto animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="mt-3 text-sm text-[#555555]">Validating your reset link…</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="card-soft p-8 text-center space-y-3" data-testid="admin-reset-invalid">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(229,57,53,0.15)' }}>
              <AlertCircle size={28} style={{ color: '#E53935' }} />
            </div>
            <h2 className="text-lg font-bold">Link not valid</h2>
            <p className="text-sm text-[#555555]">{errMsg}</p>
            <Link to="/admin/forgot-password" className="btn-primary inline-flex mt-2" data-testid="admin-reset-request-new">
              Request a new link
            </Link>
            <div>
              <Link to="/admin/login" className="text-xs text-[#555555] hover:text-[#E53935] inline-flex items-center gap-1"><ArrowLeft size={12} /> Back to login</Link>
            </div>
          </div>
        )}

        {status === 'valid' && (
          <form onSubmit={submit} className="card-soft p-8 space-y-4" data-testid="admin-reset-form">
            <p className="text-sm text-[#555555]">Resetting password for <span className="font-semibold text-[#111]">{email}</span></p>
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-[#555555]">New Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
                <input type="password" className="input-x pl-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required data-testid="admin-reset-new" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-[#555555]">Confirm Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
                <input type="password" className="input-x pl-10" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required data-testid="admin-reset-confirm" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="admin-reset-submit">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Update password <ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {status === 'done' && (
          <div className="card-soft p-8 text-center space-y-3" data-testid="admin-reset-done">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 size={28} style={{ color: '#10B981' }} />
            </div>
            <h2 className="text-lg font-bold">Password updated</h2>
            <p className="text-sm text-[#555555]">Redirecting to login…</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResetPassword;
