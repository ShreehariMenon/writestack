import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  useEffect(() => { setError(''); }, [mode]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };
      const data = await api.post(path, body);
      login(data.token, data.user);
      nav('/');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page" style={{ paddingTop: 'var(--nav-h)' }}>
      <div className="auth-card">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--accent)', marginBottom: 12, fontWeight: 600 }}>WriteStack</div>
          <h1>{mode === 'login' ? 'Welcome back' : 'Join the community'}</h1>
          <p className="auth-card__sub">{mode === 'login' ? 'Sign in to read and write stories.' : 'Create your account to start publishing.'}</p>
        </div>

        {error && <div className="alert alert--error" style={{ marginBottom: 18 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="input" type="text" placeholder="yourname" value={form.username} onChange={set('username')} autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoFocus={mode === 'login'} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'} value={form.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={submit} disabled={loading}>
            {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Sign up free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
