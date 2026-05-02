import { useNavigate } from 'react-router-dom';
import { avatarLetter, formatDate, readTime } from '../utils/api';

export default function PostCard({ post, style }) {
  const nav = useNavigate();
  return (
    <article className="post-card" style={style}>
      <div className="post-card__body">
        <div className="post-card__author">
          <button
            className="post-card__author-avatar"
            style={{ background: stringColor(post.authorName) }}
            onClick={e => { e.stopPropagation(); nav(`/@${post.authorName}`); }}
          >
            {avatarLetter(post.authorName)}
          </button>
          <button
            className="post-card__author-name"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={e => { e.stopPropagation(); nav(`/@${post.authorName}`); }}
          >
            {post.authorName}
          </button>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        <button
          style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
          onClick={() => nav(`/post/${post.slug}`)}
        >
          <h2 className="post-card__title">{post.title}</h2>
          {post.subtitle && <p className="post-card__subtitle">{post.subtitle}</p>}
        </button>

        <div className="post-card__meta">
          {(post.tags || []).slice(0, 3).map(t => (
            <button key={t} className="tag-chip tag-chip--clickable"
              onClick={e => { e.stopPropagation(); nav(`/?tag=${t}`); }}
            ># {t}</button>
          ))}
          <span className="post-card__meta-item">⏱ {readTime(post.readTime)}</span>
          {post.claps > 0 && <span className="post-card__meta-item clap">👏 {post.claps}</span>}
          {post.views > 0 && <span className="post-card__meta-item">👁 {post.views}</span>}
        </div>
      </div>

      {post.coverImage && (
        <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => nav(`/post/${post.slug}`)}>
          <div className="post-card__thumb">
            <img src={post.coverImage} alt={post.title} loading="lazy" onError={e => e.target.style.display='none'} />
          </div>
        </button>
      )}
    </article>
  );
}

function stringColor(str = '') {
  const colors = ['#1a8917','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
