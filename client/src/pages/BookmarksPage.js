import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import PostCard from '../components/PostCard';

export default function BookmarksPage() {
  const { token } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me/bookmarks', token)
      .then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="main">
      <div className="container--md" style={{ padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, marginBottom: 6 }}>
            🔖 Reading List
          </h1>
          <p style={{ color: 'var(--text2)' }}>Stories you've saved to read later.</p>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner spinner--lg" /></div>
        ) : posts.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">🔖</div>
            <h3>Nothing saved yet</h3>
            <p>Bookmark stories while reading to find them here.</p>
            <button className="btn btn--green" onClick={() => nav('/')}>Browse stories</button>
          </div>
        ) : (
          posts.map(p => <PostCard key={p._id} post={p} />)
        )}
      </div>
    </div>
  );
}
