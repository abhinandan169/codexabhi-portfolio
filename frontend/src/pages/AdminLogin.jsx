import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const AdminLogin = () => {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      localStorage.setItem('admin_token', res.data.token);
      toast.success('Welcome back, admin!');
      nav('/admin');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-[#E53935] text-white font-bold flex items-center justify-center">A</span>
            <span className="font-bold text-xl">Admin Panel</span>
          </div>
          <p className="mt-2 text-[#555555] text-sm">Sign in to manage your portfolio</p>
        </div>
        <form onSubmit={submit} className="card-soft p-8 space-y-4" data-testid="admin-login-form">
          <div>
            <label className="text-xs uppercase tracking-widest font-semibold text-[#555555]">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
              <input
                type="email"
                className="input-x pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@abhinandan.dev"
                required
                data-testid="admin-login-email"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-semibold text-[#555555]">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
              <input
                type="password"
                className="input-x pl-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                data-testid="admin-login-password"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="admin-login-submit">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
          <div className="flex items-center justify-between pt-1">
            <Link to="/admin/forgot-password" className="text-xs font-semibold text-[#E53935] hover:underline" data-testid="admin-forgot-password-link">
              Forgot password?
            </Link>
            <p className="text-xs text-[#888888]">Default: admin@abhinandan.dev / Admin@123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
