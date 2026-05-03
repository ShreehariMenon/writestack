import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import PostCard from '../components/PostCard';

export default function HomePage() {
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [tab,     setTab]    = useState('latest');
  const [search,  setSearch] = useState(params.get('search') || '');
  const [tag,     setTag]    = useState(params.get('tag') || '');
  const [posts,   setPosts]  = useState([]);
  const [hasMore, setHasMore]= useState(false);
  const [loading, setLoading]= useState(true);
  const [loadingMore, setLM] = useState(false);
  const [tags,    setTags]   = useState([]);
  const [error,   setError]  = useState('');

  useEffect(() => {
    api.get('/tags').then(setTags).catch(() => {});
  }, []);

  const loadFeed = useCallback(async (skip = 0, append = false) => {
    if (skip === 0) setLoading(true); else setLM(true);
    setError('');
    try {
      let data;
      if (tab === 'following') {
        if (!user || !token) {
          setPosts([]); setHasMore(false);
          setLoading(false); setLM(false);
          return;
        }
        data = await api.get('/posts/following?skip=' + skip, token);
      } else {
        const sortParam = tab === 'popular' ? 'popular' : 'latest';
        const q = new URLSearchParams({ skip, sort: sortParam });
        if (search) q.set('search', search);
        if (tag)    q.set('tag', tag);
        data = await api.get('/posts?' + q);
      }
      setPosts(p => append ? [...p, ...(data.posts || [])] : (data.posts || []));
      setHasMore(!!data.hasMore);
    } catch (e) {
      setError(e.message || 'Failed to load posts');
      if (!append) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLM(false);
    }
  }, [tab, search, tag, token, user]);

  useEffect(() => { loadFeed(0, false); }, [loadFeed]);

  useEffect(() => {
    setSearch(params.get('search') || '');
    setTag(params.get('tag') || '');
  }, [params]);

  const TABS = user
    ? [['latest','🕒 Latest'],['following','👥 Following'],['popular','🔥 Popular']]
    : [['latest','🕒 Latest'],['popular','🔥 Popular']];

  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
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
                <button key={t.tag}
                  className={'tag-chip tag-chip--clickable' + (tag === t.tag ? ' tag-chip--active' : '')}
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

      <div className="container feed-layout">
        <div>
          {(search || tag) && (
            <div style={{ marginBottom: 20 }}>
              <div className="alert alert--info">
                {search && <><strong>"{search}"</strong>{tag && ' · '}</>}
                {tag && <>Tag: <strong>#{tag}</strong></>}
                <button style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '.85rem' }}
                  onClick={() => { setSearch(''); setTag(''); nav('/'); }}>✕ Clear</button>
              </div>
            </div>
          )}

          <div className="feed-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} className={'feed-tab' + (tab === id ? ' feed-tab--active' : '')} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert--error" style={{ marginBottom: 20 }}>
              {error}&nbsp;
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontWeight: 600 }}
                onClick={() => loadFeed(0, false)}>Retry</button>
            </div>
          )}

          {loading ? (
            <div className="page-loader"><div className="spinner spinner--lg" /></div>
          ) : posts.length === 0 ? (
            <div className="empty">
              <div className="empty__icon">📭</div>
              <h3>{tab === 'following' ? 'Your following feed is empty' : 'Nothing here yet'}</h3>
              <p>{tab === 'following' ? 'Follow some authors to see their posts here.' : tag ? 'No posts with this tag yet.' : 'Be the first to publish something!'}</p>
              {user && tab !== 'following' && <button className="btn btn--primary" onClick={() => nav('/write')}>Write a story</button>}
            </div>
          ) : (
            <>
              {posts.map((p, i) => (
                <PostCard key={p._id} post={p} style={{ animationDelay: Math.min(i, 6) * 60 + 'ms' }} />
              ))}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <button className="btn btn--ghost" onClick={() => loadFeed(posts.length, true)} disabled={loadingMore}>
                    {loadingMore ? <span className="spinner" /> : 'Load more stories'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="sidebar">
          <div className="sidebar__card">
            <div className="sidebar__title">Trending Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.length === 0
                ? <span style={{ fontSize: '.8rem', color: 'var(--text3)' }}>No tags yet</span>
                : tags.slice(0, 12).map(t => (
                  <button key={t.tag} className={'tag-chip tag-chip--clickable' + (tag === t.tag ? ' tag-chip--active' : '')}
                    onClick={() => { setTag(tag === t.tag ? '' : t.tag); nav('/'); }}>
                    #{t.tag}
                  </button>
                ))
              }
            </div>
          </div>

          {!user ? (
            <div className="sidebar__card">
              <div className="sidebar__title">Join WriteStack</div>
              <p style={{ fontSize: '.875rem', color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
                Share your stories with thousands of curious readers.
              </p>
              <button className="btn btn--green" style={{ width: '100%', justifyContent: 'center' }} onClick={() => nav('/auth?mode=register')}>
                Create free account
              </button>
            </div>
          ) : (
            <div className="sidebar__card">
              <div className="sidebar__title">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn--green btn--sm" style={{ justifyContent: 'center' }} onClick={() => nav('/write')}>✏️ Write a story</button>
                <button className="btn btn--ghost btn--sm" style={{ justifyContent: 'center' }} onClick={() => nav('/import')}>📥 Import article</button>
                <button className="btn btn--ghost btn--sm" style={{ justifyContent: 'center' }} onClick={() => nav('/dashboard')}>📊 Dashboard</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
