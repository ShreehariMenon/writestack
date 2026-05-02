import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, avatarLetter } from '../utils/api';
import PostCard from '../components/PostCard';

function stringColor(str=''){const c=['#1a8917','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return c[Math.abs(h)%c.length];}

export default function ProfilePage() {
  const { username } = useParams(); // @username
  const uname = username.replace('@','');
  const { user, token } = useAuth();
  const nav = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${uname}`, token)
      .then(d => { setData(d); setIsFollowing(d.isFollowing); setFollowerCount(d.user.followerCount); })
      .catch(() => nav('/'))
      .finally(() => setLoading(false));
  }, [uname, token, nav]);

  const handleFollow = async () => {
    if (!token) return nav('/auth');
    const d = await api.post(`/users/${data.user._id}/follow`, {}, token).catch(()=>null);
    if (d) { setIsFollowing(d.following); setFollowerCount(d.followerCount); }
  };

  if (loading) return <div className="page-loader" style={{ marginTop:'var(--nav-h)' }}><div className="spinner spinner--lg"/></div>;
  if (!data) return null;
  const { user: prof, posts } = data;
  const isMe = user?.username === prof.username;

  return (
    <div className="main">
      <div className="profile-hero">
        <div className="container--md">
          <div className="profile-avatar" style={{ background: stringColor(prof.username) }}>
            {prof.avatar ? <img src={prof.avatar} alt={prof.username} /> : avatarLetter(prof.username)}
          </div>
          <h1 className="profile-name">{prof.username}</h1>
          {prof.bio && <p className="profile-bio">{prof.bio}</p>}
          <div className="profile-stats">
            <div className="profile-stat"><strong>{posts.length}</strong> stories</div>
            <div className="profile-stat"><strong>{followerCount}</strong> followers</div>
            <div className="profile-stat"><strong>{prof.followingCount}</strong> following</div>
          </div>
          {(prof.website || prof.twitter) && (
            <div className="profile-links">
              {prof.website && <a className="profile-link" href={prof.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>}
              {prof.twitter && <a className="profile-link" href={`https://twitter.com/${prof.twitter}`} target="_blank" rel="noopener noreferrer">🐦 @{prof.twitter}</a>}
            </div>
          )}
          <div style={{ marginTop:20, display:'flex', gap:10 }}>
            {isMe ? (
              <button className="btn btn--ghost btn--sm" onClick={() => nav('/settings')}>✏️ Edit Profile</button>
            ) : (
              <button className={`btn btn--sm ${isFollowing?'btn--ghost':'btn--green'}`} onClick={handleFollow}>
                {isFollowing ? '✓ Following' : '+ Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container--md" style={{ paddingTop:40, paddingBottom:80 }}>
        <h2 style={{ fontFamily:'var(--serif)', fontSize:'1.3rem', marginBottom:8, fontWeight:700 }}>
          {isMe ? 'Your published stories' : `Stories by ${prof.username}`}
        </h2>
        {posts.length === 0 ? (
          <div className="empty" style={{ paddingTop:40 }}>
            <div className="empty__icon">✍️</div>
            <h3>No stories yet</h3>
            {isMe && <button className="btn btn--green" onClick={()=>nav('/write')}>Write your first story</button>}
          </div>
        ) : (
          posts.map(p => <PostCard key={p._id} post={p} />)
        )}
      </div>
    </div>
  );
}
