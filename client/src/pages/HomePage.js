import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const initSearch = params.get('search') || '';
  const initTag    = params.get('tag')    || '';

  const [tab,    setTab]    = useState(user ? 'for-you' : 'latest');
  const [sort,   setSort]   = useState('latest');
  const [search, setSearch] = useState(initSearch);
  const [tag,    setTag]    = useState(initTag);
  const [posts,  setPosts]  = useState([]);
  const [hasMore,setHasMore]= useState(false);
  const [loading,setLoading]= useState(true);
  const [loadingMore, setLM]= useState(false);
  const [tags,   setTags]   = useState([]);

  useEffect(() => {
    api.get('/tags').then(setTags).catch(() => {});
  }, []);

  const fetch = useCallback(async (skip = 0, append = false) => {
    if (skip === 0) setLoading(true); else setLM(true);
    try {
      let data;
      if (tab === 'following' && user) {
        data = await api.get(`/posts/following?skip=${skip}`, token);
      } else {
        const q = new URLSearchParams({ skip, sort });
        if (search) q.set('search', search);
        if (tag)    q.set('tag', tag);
        data = await api.get(`/posts?${q}`);
      }
      setPosts(p => append ? [...p, ...data.posts] : data.posts);
      setHasMore(data.hasMore);
    } finally { setLoading(false); setLM(false); }
  }, [tab, sort, search, tag, token, user]);

  useEffect(() => { fetch(0, false); }, [fetch]);

  // Sync URL params
  useEffect(() => {
    const s = params.get('search') || '';
    const t = params.get('tag')    || '';
    setSearch(s); setTag(t);
  }, [params]);

  const TABS = user
    ? [['for-you','✨ For You'],['latest','🕒 Latest'],['following','👥 Following'],['popular','🔥 Popular']]
    : [['latest','🕒 Latest'],['popular','🔥 Popular']];

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'popular') setSort('popular'); else setSort('latest');
  };

  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Hero */}
      <div className="hero">
        <div className="hero__inner">
          <h1>Stay <em>curious</em>.<br/>Read deeply.</h1>
          <p>A community platform for developers, writers, and thinkers to share ideas that matter.</p>
          {!user && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--primary" onClick={() => nav('/auth?mode=register')}>Start writing →</button>
              <button className="btn btn--ghost" onClick={() => nav('/auth')}>Sign In</button>
            </div>
          )}
          {tags.length > 0 && (
            <div className="hero__tags" style={{ marginTop: 20 }}>
              {tags.slice(0, 10).map(t => (
                <button
                  key={t.tag}
                  className={`tag-chip tag-chip--clickable${tag === t.tag ? ' tag-chip--active' : ''}`}
                  onClick={() => { setTag(tag === t.tag ? '' : t.tag); setSearch(''); }}
                >
                  # {t.tag} <span style={{ opacity: .6, fontSize: '.7rem' }}>{t.count}</span>
                </button>
              ))}
              {tag && <button className="btn btn--ghost btn--xs" onClick={() => setTag('')}>✕ Clear</button>}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container feed-layout">
        <div>
          {(search || tag) && (
            <div style={{ marginBottom: 20 }}>
              <div className="alert alert--info">
                {search && <>Search: <strong>"{search}"</strong>{tag && ' · '}</>}
                {tag && <>Tag: <strong>#{tag}</strong></>}
                <button
                  style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '.85rem' }}
                  onClick={() => { setSearch(''); setTag(''); nav('/'); }}
                >✕ Clear filters</button>
              </div>
            </div>
          )}

          <div className="feed-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} className={`feed-tab${tab===id?' feed-tab--active':''}`} onClick={() => handleTabChange(id)}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner spinner--lg" /></div>
          ) : posts.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">📭</div>
              <h3>Nothing here yet</h3>
              <p>{tab === 'following' ? "Follow some authors to see their posts here." : "Be the first to publish something!"}</p>
              {user && <button className="btn btn--primary" onClick={() => nav('/write')}>Write a story</button>}
            </div>
          ) : (
            <>
              {posts.map((p, i) => (
                <PostCard key={p._id} post={p} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }} />
              ))}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <button className="btn btn--ghost" onClick={() => fetch(posts.length, true)} disabled={loadingMore}>
                    {loadingMore ? <span className="spinner" /> : 'Load more stories'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar__card">
            <div className="sidebar__title">Trending Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.slice(0, 12).map(t => (
                <button key={t.tag} className={`tag-chip tag-chip--clickable${tag===t.tag?' tag-chip--active':''}`}
                  onClick={() => { setTag(tag===t.tag?'':t.tag); nav('/'); }}
                >
                  #{t.tag}
                </button>
              ))}
            </div>
          </div>

          {!user && (
            <div className="sidebar__card">
              <div className="sidebar__title">Join WriteStack</div>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
                Share your stories with thousands of curious readers.
              </p>
              <button className="btn btn--green" style={{ width: '100%', justifyContent: 'center' }} onClick={() => nav('/auth?mode=register')}>
                Create free account
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
