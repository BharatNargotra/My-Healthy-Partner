import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handle = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const res = await register(form.name, form.email, form.password);
    if (res.success) navigate('/profile');
    else toast.error(res.message);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            <span style={{ color: 'var(--lime)' }}>Health</span>Partner
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Create your account to get started</p>
        </div>

        <div className="card">
          <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" required placeholder="John Doe"
                value={form.name} onChange={handle('name')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" required autoComplete="email"
                placeholder="you@example.com" value={form.email} onChange={handle('email')} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input-field" type="password" required minLength={6} autoComplete="new-password"
                placeholder="Min 6 characters" value={form.password} onChange={handle('password')} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--muted)', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--lime)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
