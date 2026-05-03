import { useNavigate } from 'react-router-dom';
import { formatDate, readTime } from '../utils/api';

function stringColor(str) {
  const s = str || '?';
  const colors = ['#1a8917','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#84cc16'];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function avatarLetter(name) {
  return ((name || '?')[0]).toUpperCase();
}

export default function PostCard({ post, style }) {
  const nav = useNavigate();

  // Guard against malformed post data
  if (!post || !post._id) return null;

  const author  = post.authorName || 'Unknown';
  const slug    = post.slug || post._id;
  const title   = post.title || 'Untitled';
  const tags    = post.tags || [];
  const claps   = post.claps || 0;
  const views   = post.views || 0;
  const rt      = post.readTime || 1;

  return (
    <article className="post-card" style={style}>
      <div className="post-card__body">

        {/* Author row */}
        <div className="post-card__author">
          <button
            className="post-card__author-avatar"
            style={{ background: stringColor(author) }}
            onClick={e => { e.stopPropagation(); nav('/@' + author); }}
          >
            {avatarLetter(author)}
          </button>
          <button
            className="post-card__author-name"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
            onClick={e => { e.stopPropagation(); nav('/@' + author); }}
          >
            {author}
          </button>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>

        {/* Title + subtitle */}
        <button
          style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
          onClick={() => nav('/post/' + slug)}
        >
          <h2 className="post-card__title">{title}</h2>
          {post.subtitle && <p className="post-card__subtitle">{post.subtitle}</p>}
        </button>

        {/* Meta row */}
        <div className="post-card__meta">
          {tags.slice(0, 3).map(t => (
            <button key={t} className="tag-chip tag-chip--clickable"
              onClick={e => { e.stopPropagation(); nav('/?tag=' + t); }}
            ># {t}</button>
          ))}
          <span className="post-card__meta-item">⏱ {readTime(rt)}</span>
          {claps > 0 && <span className="post-card__meta-item clap">👏 {claps}</span>}
          {views > 0 && <span className="post-card__meta-item">👁 {views}</span>}
        </div>
      </div>

      {/* Thumbnail */}
      {post.coverImage && (
        <button style={{ all: 'unset', cursor: 'pointer' }} onClick={() => nav('/post/' + slug)}>
          <div className="post-card__thumb">
            <img
              src={post.coverImage}
              alt={title}
              loading="lazy"
              onError={e => e.target.parentElement.style.display = 'none'}
            />
          </div>
        </button>
      )}
    </article>
  );
}
