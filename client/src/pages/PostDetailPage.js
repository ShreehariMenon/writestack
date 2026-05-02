import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, avatarLetter, formatDate, readTime, mdToHtml } from '../utils/api';

function stringColor(str = '') {
  const colors = ['#1a8917','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function CommentItem({ c, postId, token, user, onDelete }) {
  const [liked, setLiked] = useState(c.isLiked);
  const [likes, setLikes] = useState(c.likeCount || 0);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(c.replies || []);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!token) return;
    const data = await api.post(`/comments/${c._id}/like`, {}, token).catch(() => null);
    if (data) { setLiked(data.isLiked); setLikes(data.likeCount); }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !token) return;
    setSubmitting(true);
    const r = await api.post('/comments', { postId, content: replyText, parentId: c._id }, token).catch(() => null);
    if (r) { setReplies(prev => [...prev, r]); setReplyText(''); setReplying(false); }
    setSubmitting(false);
  };

  return (
    <div className="comment">
      <div className="comment__header">
        <div className="comment__avatar" style={{ background: stringColor(c.authorName) }}>
          {avatarLetter(c.authorName)}
        </div>
        <span className="comment__author">{c.authorName}</span>
        <span className="comment__date">{formatDate(c.createdAt)}</span>
      </div>
      <p className="comment__body">{c.content}</p>
      <div className="comment__actions">
        <button className={`comment__action${liked?' comment__action--liked':''}`} onClick={handleLike}>
          👏 {likes > 0 && likes}
        </button>
        {token && <button className="comment__action" onClick={() => setReplying(r => !r)}>💬 Reply</button>}
        {user?.username === c.authorName && (
          <button className="comment__action" style={{ color: 'var(--danger)' }} onClick={() => onDelete(c._id)}>🗑 Delete</button>
        )}
      </div>

      {replying && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <input
            className="input" style={{ fontSize: '.875rem', padding: '7px 12px' }}
            placeholder="Write a reply…" value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitReply()}
          />
          <button className="btn btn--sm btn--green" onClick={submitReply} disabled={submitting}>Reply</button>
          <button className="btn btn--sm btn--ghost" onClick={() => setReplying(false)}>Cancel</button>
        </div>
      )}

      {replies.length > 0 && (
        <div className="comment__replies">
          {replies.map(r => (
            <div className="comment" key={r._id} style={{ paddingTop: 12, paddingBottom: 0, borderBottom: 'none' }}>
              <div className="comment__header">
                <div className="comment__avatar" style={{ background: stringColor(r.authorName), width: 26, height: 26, fontSize: '.65rem' }}>
                  {avatarLetter(r.authorName)}
                </div>
                <span className="comment__author">{r.authorName}</span>
                <span className="comment__date">{formatDate(r.createdAt)}</span>
              </div>
              <p className="comment__body">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const nav = useNavigate();

  const [post,      setPost]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [comments,  setComments]  = useState([]);
  const [newComment,setNewComment]= useState('');
  const [claps,     setClaps]     = useState(0);
  const [isClapped, setIsClapped] = useState(false);
  const [isBookmarked, setIsBM]   = useState(false);
  const [isFollowing,  setIsFollowing] = useState(false);
  const [commentLoading, setCL]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${slug}`, token).then(p => {
      setPost(p); setClaps(p.claps); setIsClapped(p.isClapped);
      setIsBM(p.isBookmarked); setIsFollowing(p.isFollowing);
    }).catch(() => nav('/')).finally(() => setLoading(false));
    api.get(`/comments/${slug}`, token).then(setComments).catch(() => {});
  }, [slug, token, nav]);

  const handleClap = async () => {
    if (!token) return nav('/auth');
    const d = await api.post(`/posts/${post._id}/clap`, {}, token).catch(() => null);
    if (d) { setClaps(d.claps); setIsClapped(d.isClapped); }
  };

  const handleBookmark = async () => {
    if (!token) return nav('/auth');
    const d = await api.post(`/posts/${post._id}/bookmark`, {}, token).catch(() => null);
    if (d) setIsBM(d.bookmarked);
  };

  const handleFollow = async () => {
    if (!token) return nav('/auth');
    const d = await api.post(`/users/${post.author._id}/follow`, {}, token).catch(() => null);
    if (d) setIsFollowing(d.following);
  };

  const submitComment = async () => {
    if (!newComment.trim() || !token) return;
    setCL(true);
    const c = await api.post('/comments', { postId: post._id, content: newComment }, token).catch(() => null);
    if (c) { setComments(prev => [...prev, { ...c, replies: [] }]); setNewComment(''); }
    setCL(false);
  };

  const deleteComment = async (id) => {
    await api.delete(`/comments/${id}`, token).catch(() => null);
    setComments(prev => prev.filter(c => c._id !== id));
  };

  if (loading) return <div className="page-loader" style={{ marginTop: 'var(--nav-h)' }}><div className="spinner spinner--lg" /></div>;
  if (!post) return null;

  const isOwner = user && post.author && user.id === post.author._id;

  return (
    <div className="main">
      <div className="container--md">
        {post.coverImage && (
          <div className="post-cover">
            <img src={post.coverImage} alt={post.title} onError={e => e.target.parentElement.style.display='none'} />
          </div>
        )}

        <div className="post-detail-layout">
          {/* Left sticky action bar */}
          <div style={{ display: 'none' }} className="desktop-actions" />

          {/* Main content */}
          <main>
            <div className="post-header">
              {(post.tags||[]).length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                  {post.tags.map(t => (
                    <button key={t} className="tag-chip tag-chip--clickable" onClick={() => nav(`/?tag=${t}`)}>#{t}</button>
                  ))}
                </div>
              )}
              <h1 className="post-title">{post.title}</h1>
              {post.subtitle && <p className="post-subtitle">{post.subtitle}</p>}

              <div className="post-byline">
                <div className="post-byline__avatar" style={{ background: stringColor(post.authorName) }}>
                  {post.author?.avatar ? <img src={post.author.avatar} alt={post.authorName} /> : avatarLetter(post.authorName)}
                </div>
                <div className="post-byline__info">
                  <div className="post-byline__name">
                    <Link to={`/@${post.authorName}`}>{post.authorName}</Link>
                    {user && !isOwner && (
                      <button
                        className={`btn btn--xs ${isFollowing ? 'btn--ghost' : 'btn--green'}`}
                        style={{ marginLeft: 12 }}
                        onClick={handleFollow}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </button>
                    )}
                  </div>
                  <div className="post-byline__meta">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>·</span>
                    <span>⏱ {readTime(post.readTime)}</span>
                    <span>·</span>
                    <span>👁 {post.views} views</span>
                  </div>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={handleBookmark}
                    style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', opacity: isBookmarked ? 1 : 0.4 }}
                  >🔖</button>
                  {isOwner && (
                    <button className="btn btn--ghost btn--sm" onClick={() => nav(`/edit/${post._id}`)}>✏️ Edit</button>
                  )}
                  {post.importedFrom && (
                    <a href={post.importedFrom} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--xs">↗ Original</a>
                  )}
                </div>
              </div>
            </div>

            <div className="article-body" dangerouslySetInnerHTML={{ __html: mdToHtml(post.content) }} />

            {/* Clap row */}
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'32px 0', borderTop:'1px solid var(--border)', marginTop:40 }}>
              <button className={`clap-btn${isClapped?' clap-btn--active':''}`} onClick={handleClap} title="Clap for this story">
                👏
                <span className="clap-count">{claps}</span>
              </button>
              <div>
                <div style={{ fontWeight:600, fontSize:'.875rem' }}>Enjoyed this story?</div>
                <div style={{ fontSize:'.8rem', color:'var(--text2)' }}>Give it a clap to show the author some love.</div>
              </div>
            </div>

            {/* Author card */}
            <div style={{ background:'var(--bg2)', borderRadius:'var(--r2)', padding:24, margin:'32px 0', display:'flex', gap:16 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:stringColor(post.authorName), color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:700, flexShrink:0 }}>
                {post.author?.avatar ? <img src={post.author.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} /> : avatarLetter(post.authorName)}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                  <Link to={`/@${post.authorName}`} style={{ fontWeight:700, fontSize:'1rem' }}>{post.authorName}</Link>
                  <span style={{ fontSize:'.8rem', color:'var(--text3)' }}>{post.author?.followers?.length || 0} followers</span>
                  {user && !isOwner && (
                    <button className={`btn btn--xs ${isFollowing?'btn--ghost':'btn--green'}`} onClick={handleFollow}>
                      {isFollowing ? '✓ Following' : '+ Follow'}
                    </button>
                  )}
                </div>
                {post.author?.bio && <p style={{ fontSize:'.875rem', color:'var(--text2)', lineHeight:1.5 }}>{post.author.bio}</p>}
              </div>
            </div>

            {/* Comments */}
            <div className="comments">
              <h2 className="comments__title">Responses ({comments.length})</h2>

              {token ? (
                <div style={{ display:'flex', gap:10, marginBottom:28 }}>
                  <div className="comment__avatar" style={{ background:stringColor(user.username), flexShrink:0 }}>
                    {avatarLetter(user.username)}
                  </div>
                  <div style={{ flex:1 }}>
                    <textarea
                      className="input textarea"
                      style={{ minHeight:80, fontSize:'.9rem' }}
                      placeholder="Write a thoughtful response…"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                    />
                    <button className="btn btn--green btn--sm" style={{ marginTop:8 }} onClick={submitComment} disabled={commentLoading || !newComment.trim()}>
                      {commentLoading ? <span className="spinner" /> : 'Post response'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="alert alert--info" style={{ marginBottom:24 }}>
                  <button style={{ color:'var(--accent)', background:'none', border:'none', cursor:'pointer', fontWeight:600 }} onClick={() => nav('/auth')}>Sign in</button> to join the conversation.
                </div>
              )}

              {comments.length === 0
                ? <p style={{ color:'var(--text3)', fontSize:'.9rem' }}>No responses yet. Be the first to respond!</p>
                : comments.map(c => (
                    <CommentItem key={c._id} c={c} postId={post._id} token={token} user={user} onDelete={deleteComment} />
                  ))
              }
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
