import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatDate, readTime } from '../utils/api';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/posts/mine', token)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const del = async (id) => {
    if (!window.confirm('Permanently delete this story?')) return;
    setDeleting(id);
    await api.delete(`/posts/${id}`, token).catch(() => null);
    setPosts(p => p.filter(x => x._id !== id));
    setDeleting(null);
  };

  const filtered = tab === 'all' ? posts : posts.filter(p => p.status === tab);
  const totalClaps = posts.reduce((a, p) => a + p.claps, 0);
  const totalViews = posts.reduce((a, p) => a + p.views, 0);

  return (
    <div className="main">
      <div className="container" style={{ padding:'40px 24px 80px' }}>
        {/* Stats bar */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:36 }}>
          {[
            { label:'Total Stories', value: posts.length, icon:'📝' },
            { label:'Published', value: posts.filter(p=>p.status==='published').length, icon:'🚀' },
            { label:'Drafts', value: posts.filter(p=>p.status==='draft').length, icon:'📋' },
            { label:'Total Claps', value: totalClaps, icon:'👏' },
            { label:'Total Views', value: totalViews, icon:'👁' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'18px 20px' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:'1.6rem', fontWeight:700, fontFamily:'var(--serif)', letterSpacing:'-.03em' }}>{s.value}</div>
              <div style={{ fontSize:'.78rem', color:'var(--text3)', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.5rem', fontWeight:700 }}>My Stories</h2>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn--ghost btn--sm" onClick={() => nav('/import')}>📥 Import</button>
            <button className="btn btn--green btn--sm" onClick={() => nav('/write')}>✏️ Write New</button>
          </div>
        </div>

        <div className="feed-tabs" style={{ marginBottom:24 }}>
          {[['all','All'],['published','Published'],['draft','Drafts']].map(([id,label]) => (
            <button key={id} className={`feed-tab${tab===id?' feed-tab--active':''}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner spinner--lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">📭</div>
            <h3>{tab==='draft'?'No drafts':'No stories yet'}</h3>
            <p>Start writing and sharing your ideas with the world.</p>
            <button className="btn btn--green" onClick={() => nav('/write')}>Write your first story</button>
          </div>
        ) : (
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)', overflow:'hidden' }}>
            {filtered.map(post => (
              <div key={post._id} className="dash-post">
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="dash-post__title" onClick={() => nav(`/post/${post.slug}`)}>{post.title}</div>
                  <div className="dash-post__meta">
                    <span className={`status-badge status-badge--${post.status}`}>{post.status}</span>
                    <span className="dash-post__stat">📅 {formatDate(post.createdAt)}</span>
                    <span className="dash-post__stat">⏱ {readTime(post.readTime)}</span>
                    <span className="dash-post__stat">👏 {post.claps}</span>
                    <span className="dash-post__stat">👁 {post.views}</span>
                    {(post.tags||[]).slice(0,2).map(t => (
                      <span key={t} className="tag-chip" style={{ fontSize:'.7rem', padding:'1px 8px' }}>#{t}</span>
                    ))}
                  </div>
                </div>
                <div className="dash-post__actions">
                  <button className="btn btn--ghost btn--xs" onClick={() => nav(`/edit/${post._id}`)}>Edit</button>
                  <button className="btn btn--xs" style={{ color:'var(--danger)', border:'1px solid var(--border)', borderRadius:20, padding:'4px 10px', background:'none' }}
                    onClick={() => del(post._id)} disabled={deleting===post._id}>
                    {deleting===post._id ? <span className="spinner" style={{width:12,height:12}} /> : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
