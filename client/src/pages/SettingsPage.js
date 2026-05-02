import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, avatarLetter } from '../utils/api';

function stringColor(str=''){const c=['#1a8917','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return c[Math.abs(h)%c.length];}

export default function SettingsPage() {
  const { user, token, updateUser } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    bio:     user?.bio     || '',
    avatar:  user?.avatar  || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await api.put('/users/me/profile', form, token);
      updateUser({ ...user, ...form });
      setSuccess('Profile updated successfully!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="main">
      <div className="container--sm" style={{ padding: '48px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, marginBottom: 32 }}>
          ⚙️ Settings
        </h1>

        {/* Profile card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 28, marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            Profile Information
          </h2>

          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: stringColor(user?.username), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, overflow: 'hidden' }}>
              {form.avatar ? <img src={form.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} /> : avatarLetter(user?.username)}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{user?.username}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text3)' }}>{user?.email}</div>
            </div>
          </div>

          {error   && <div className="alert alert--error"   style={{ marginBottom: 16 }}>{error}</div>}
          {success && <div className="alert alert--success" style={{ marginBottom: 16 }}>{success}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Avatar URL</label>
              <input className="input" type="url" placeholder="https://i.imgur.com/yourphoto.jpg" value={form.avatar} onChange={set('avatar')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="input textarea" style={{ minHeight: 90 }} placeholder="Tell readers about yourself…" value={form.bio} onChange={set('bio')} maxLength={300} />
              <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: 4, textAlign: 'right' }}>{form.bio.length}/300</div>
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="input" type="url" placeholder="https://yoursite.com" value={form.website} onChange={set('website')} />
            </div>
            <div className="form-group">
              <label className="form-label">Twitter / X handle</label>
              <input className="input" type="text" placeholder="username (without @)" value={form.twitter} onChange={set('twitter')} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button className="btn btn--green" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : '💾 Save Changes'}
            </button>
            <button className="btn btn--ghost" onClick={() => nav(-1)}>Cancel</button>
          </div>
        </div>

        {/* Account info */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 28 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
            Account
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--text2)' }}>Username</span>
              <span style={{ fontWeight: 600 }}>@{user?.username}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.9rem' }}>
              <span style={{ color: 'var(--text2)' }}>Email</span>
              <span style={{ fontWeight: 600 }}>{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
