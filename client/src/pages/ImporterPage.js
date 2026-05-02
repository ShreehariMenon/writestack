import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatDate } from '../utils/api';

export default function ImporterPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [tab,       setTab]       = useState('devto');
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [articles,  setArticles]  = useState([]); // list from username search
  const [importing, setImporting] = useState(null);

  const fetchDevtoUser = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(''); setArticles([]);
    try {
      const data = await api.post('/import/devto', { username: input.trim() }, token);
      setArticles(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const importDevtoArticle = async (article) => {
    setImporting(article.id);
    try {
      const data = await api.post(`/import/devto/article/${article.id}`, {}, token);
      sessionStorage.setItem('ws_import', JSON.stringify(data));
      nav('/write');
    } catch (e) { setError(e.message); setImporting(null); }
  };

  const scrapeUrl = async () => {
    if (!input.trim()) return;
    setLoading(true); setError('');
    try {
      const data = await api.post('/import/url', { url: input.trim() }, token);
      sessionStorage.setItem('ws_import', JSON.stringify(data));
      nav('/write');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="main">
      <div className="importer">
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Article Importer
          </span>
        </div>
        <h1>Import from the web</h1>
        <p style={{ color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
          Pull articles from Dev.to or any public URL. Content is copied into your editor so you can review and publish it.
        </p>

        {/* Tabs */}
        <div className="importer__tabs">
          <button className={`importer__tab${tab==='devto'?' importer__tab--active':''}`} onClick={() => { setTab('devto'); setInput(''); setArticles([]); setError(''); }}>
            Dev.to
          </button>
          <button className={`importer__tab${tab==='url'?' importer__tab--active':''}`} onClick={() => { setTab('url'); setInput(''); setArticles([]); setError(''); }}>
            Any URL
          </button>
        </div>

        {error && <div className="alert alert--error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Dev.to tab */}
        {tab === 'devto' && (
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 24, marginBottom: 24 }}>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
                Enter a <strong>Dev.to username</strong> to browse their articles and pick one to import.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="input" style={{ flex: 1 }}
                  placeholder="e.g.  torvalds  or  sarah_developer"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchDevtoUser()}
                />
                <button className="btn btn--green" onClick={fetchDevtoUser} disabled={loading || !input.trim()}>
                  {loading ? <span className="spinner" /> : '🔍 Browse'}
                </button>
              </div>
            </div>

            {articles.length > 0 && (
              <div>
                <p style={{ fontSize: '.8rem', color: 'var(--text3)', marginBottom: 14 }}>
                  {articles.length} articles found — click one to import it into your editor
                </p>
                {articles.map(a => (
                  <div key={a.id} className="import-card" onClick={() => importDevtoArticle(a)}>
                    {a.coverImage && (
                      <div className="import-card__thumb">
                        <img src={a.coverImage} alt="" onError={e => e.target.parentElement.style.display='none'} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="import-card__title">{a.title}</div>
                      {a.subtitle && (
                        <p style={{ fontSize: '.8rem', color: 'var(--text2)', margin: '4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {a.subtitle}
                        </p>
                      )}
                      <div className="import-card__meta">
                        {a.publishedAt && <span>📅 {formatDate(a.publishedAt)}</span>}
                        {a.readTime && <span>⏱ {a.readTime} min</span>}
                        {(a.tags||[]).map(t => <span key={t}>#{t}</span>)}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {importing === a.id
                        ? <span className="spinner" />
                        : <span style={{ fontSize: '.8rem', color: 'var(--accent)', fontWeight: 600 }}>Import →</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* URL tab */}
        {tab === 'url' && (
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 24 }}>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
                Paste <strong>any public article URL</strong> — from Medium, Hashnode, your own blog, or anywhere else.
                The title, content, and cover image will be extracted automatically.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  className="input" style={{ flex: 1, minWidth: 260 }}
                  placeholder="https://medium.com/@author/article-title-abc123"
                  type="url"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && scrapeUrl()}
                />
                <button className="btn btn--green" onClick={scrapeUrl} disabled={loading || !input.trim()}>
                  {loading ? <span className="spinner" /> : '📥 Import Article'}
                </button>
              </div>
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 'var(--r)', fontSize: '.8rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                ⚠️ <strong>Note:</strong> Always credit the original author and ensure you have rights to republish the content.
                The <em>Original</em> link will be preserved on your post.
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 12 }}>
                Works well with
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  { name: 'Medium', icon: 'M', desc: 'medium.com articles' },
                  { name: 'Hashnode', icon: 'H', desc: 'hashnode.dev posts' },
                  { name: 'Substack', icon: 'S', desc: 'substack.com newsletters' },
                  { name: 'Ghost', icon: 'G', desc: 'ghost.io blogs' },
                  { name: 'WordPress', icon: 'W', desc: 'wordpress.com posts' },
                  { name: 'Any blog', icon: '🌐', desc: 'public blog articles' },
                ].map(s => (
                  <div key={s.name} style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>
                      {s.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{s.name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text3)' }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
