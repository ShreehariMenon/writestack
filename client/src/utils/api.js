const BASE = process.env.REACT_APP_API_URL || '/api';

export const api = {
  async req(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error');
    return data;
  },
  get:    (p, t) => api.req('GET', p, null, t),
  post:   (p, b, t) => api.req('POST', p, b, t),
  put:    (p, b, t) => api.req('PUT', p, b, t),
  delete: (p, t) => api.req('DELETE', p, null, t),
};

export function avatarLetter(name = '') {
  return (name[0] || '?').toUpperCase();
}

export function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function readTime(n) {
  return `${n} min read`;
}

export function mdToHtml(text = '') {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^#{4}\s(.+)$/gm,'<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm,'<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm,'<h2>$1</h2>')
    .replace(/^#{1}\s(.+)$/gm,'<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>')
    .replace(/^>\s(.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/^---$/gm,'<hr/>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1"/>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\d+\.\s(.+)$/gm,'<li>$1</li>')
    .replace(/^[-*]\s(.+)$/gm,'<li>$1</li>')
    .split(/\n\n+/)
    .map(p => p.trim().match(/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|img)/) ? p : `<p>${p.replace(/\n/g,'<br/>')}</p>`)
    .join('\n');
}
