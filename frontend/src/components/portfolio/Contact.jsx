import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { trackContactSubmit } from '@/lib/analytics';
import { toast } from 'sonner';

const Contact = ({ profile }) => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in name, email and message');
      return;
    }
    setLoading(true);
    try {
      await api.post('/contact', form);
      trackContactSubmit();
      toast.success('Message sent! I will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to send. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section-y bg-[#FAFAFA]" data-testid="contact-section">
      <div className="container-x grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <span className="eyebrow">Contact</span>
          <h2 className="text-3xl sm:text-5xl font-bold mt-2">
            Get in <span className="text-[#E53935]">touch.</span>
          </h2>
          <p className="mt-4 text-lg text-[#555555]">Have a project in mind? Want to say hi? Drop me a message.</p>
        </div>

        <form onSubmit={submit} className="card-soft p-6 sm:p-8 space-y-4" data-testid="contact-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input className="input-x" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" required />
            <input className="input-x" type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" required />
          </div>
          <input className="input-x" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject" />
          <textarea rows={6} className="input-x resize-none" placeholder="Your message..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" required />
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading} data-testid="contact-submit-btn">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
