import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, mdToHtml } from '../utils/api';

const TOOLS = [
  { label:'H2', insert:'## ', wrap:false },
  { label:'H3', insert:'### ', wrap:false },
  { label:'B', insert:'**', wrap:true },
  { label:'I', insert:'*', wrap:true },
  { label:'~~', insert:'~~', wrap:true },
  { label:'> Quote', insert:'> ', wrap:false },
  { label:'` code', insert:'`', wrap:true },
  { label:'``` block', insert:'```\n', wrapEnd:'\n```', wrap:true },
  { label:'- List', insert:'- ', wrap:false },
  { label:'--- hr', insert:'\n---\n', wrap:false },
  { label:'[link]', insert:'[text](url)', wrap:false },
  { label:'![img]', insert:'![alt](url)', wrap:false },
];

export default function EditorPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { token } = useAuth();
  const nav = useNavigate();
  const taRef = useRef(null);

  const [title,      setTitle]      = useState('');
  const [subtitle,   setSubtitle]   = useState('');
  const [content,    setContent]    = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags,       setTags]       = useState([]);
  const [tagInput,   setTagInput]   = useState('');
  const [status,     setStatus]     = useState('published');
  const [preview,    setPreview]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [loadingPost,setLP]         = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/posts/${id}`, token)
      .then(p => { setTitle(p.title); setSubtitle(p.subtitle||''); setContent(p.content); setCoverImage(p.coverImage||''); setTags(p.tags||[]); setStatus(p.status); })
      .catch(() => nav('/dashboard'))
      .finally(() => setLP(false));
  }, [id, isEdit, token, nav]);

  // Check if we were redirected from importer
  useEffect(() => {
    const d = sessionStorage.getItem('ws_import');
    if (d) {
      const imp = JSON.parse(d);
      setTitle(imp.title || '');
      setSubtitle(imp.subtitle || '');
      setContent(imp.content || '');
      setCoverImage(imp.coverImage || '');
      setTags(imp.tags || []);
      sessionStorage.removeItem('ws_import');
    }
  }, []);

  const insertTool = (tool) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e);
    let inserted;
    if (tool.wrap) {
      const end = tool.wrapEnd || tool.insert;
      inserted = value.slice(0,s) + tool.insert + selected + end + value.slice(e);
    } else {
      inserted = value.slice(0,s) + tool.insert + selected + value.slice(e);
    }
    setContent(inserted);
    setTimeout(() => {
      ta.focus();
      const pos = s + tool.insert.length + (selected ? selected.length : 0);
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (t && tags.length < 5 && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const save = async (s) => {
    setError('');
    if (!title.trim()) return setError('Title is required');
    if (!content.trim()) return setError('Content is required');
    setSaving(true);
    try {
      const body = { title, subtitle, content, coverImage, tags, status: s || status };
      if (isEdit) await api.put(`/posts/${id}`, body, token);
      else await api.post('/posts', body, token);
      nav('/dashboard');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loadingPost) return <div className="page-loader" style={{ marginTop:'var(--nav-h)' }}><div className="spinner spinner--lg" /></div>;

  return (
    <div className="main">
      <div className="container editor-page">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <button className="btn btn--ghost btn--sm" onClick={() => nav(-1)}>← Back</button>
          <div style={{ display:'flex', gap:8 }}>
            <button className={`btn btn--ghost btn--sm`} onClick={() => setPreview(p=>!p)}>
              {preview ? '✏️ Edit' : '👁 Preview'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => save('draft')} disabled={saving}>Save draft</button>
            <button className="btn btn--green btn--sm" onClick={() => save('published')} disabled={saving}>
              {saving ? <span className="spinner" /> : isEdit ? '💾 Update' : '🚀 Publish'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert--error" style={{ marginBottom:16 }}>{error}</div>}

        {/* Cover image */}
        <div className="form-group" style={{ marginBottom:20 }}>
          <label className="form-label">Cover Image URL (optional)</label>
          <input className="input" type="url" placeholder="https://images.unsplash.com/…" value={coverImage} onChange={e => setCoverImage(e.target.value)} />
          {coverImage && (
            <div style={{ marginTop:8, borderRadius:'var(--r)', overflow:'hidden', maxHeight:200 }}>
              <img src={coverImage} alt="cover" style={{ width:'100%', objectFit:'cover', maxHeight:200 }} onError={e=>e.target.style.display='none'} />
            </div>
          )}
        </div>

        <input
          className="input input--title"
          placeholder="Your story title…"
          value={title} onChange={e => setTitle(e.target.value)}
          style={{ marginBottom:12 }}
        />
        <input
          className="input"
          placeholder="Add a subtitle (optional)…"
          value={subtitle} onChange={e => setSubtitle(e.target.value)}
          style={{ marginBottom:20, fontSize:'1.1rem', border:'none', borderBottom:'1px solid var(--border)', borderRadius:0, padding:'6px 0' }}
        />

        {/* Tags */}
        <div style={{ marginBottom:20 }}>
          <label className="form-label" style={{ marginBottom:8, display:'block' }}>Tags (up to 5)</label>
          <div className="tags-input" style={{ padding:'8px 12px', border:'1px solid var(--border)', borderRadius:'var(--r)', background:'var(--surface)' }}>
            {tags.map(t => (
              <span key={t} className="tag-chip">
                #{t}
                <button onClick={() => setTags(prev => prev.filter(x=>x!==t))}>✕</button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                placeholder="Add tag…" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => (e.key==='Enter'||e.key===',') && (e.preventDefault(),addTag())}
              />
            )}
          </div>
          <div style={{ fontSize:'.75rem', color:'var(--text3)', marginTop:4 }}>Press Enter or comma to add a tag</div>
        </div>

        {/* Toolbar */}
        {!preview && (
          <div className="editor-toolbar">
            {TOOLS.map(t => (
              <button key={t.label} className="editor-tool" onClick={() => insertTool(t)} title={t.label}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Editor / Preview */}
        {preview ? (
          <div>
            <div className="form-label" style={{ marginBottom:8 }}>Preview</div>
            <div className="preview-box article-body" dangerouslySetInnerHTML={{ __html: mdToHtml(content || '_Nothing yet…_') }} />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Content (Markdown)</label>
            <textarea
              ref={taRef}
              className="input textarea textarea--tall"
              placeholder={'Start writing your story...\n\nUse the toolbar above for formatting:\n## Heading\n**bold** *italic*\n> blockquote\n`inline code`\n```\ncode block\n```'}
              value={content}
              onChange={e => setContent(e.target.value)}
              style={{ minHeight:500 }}
            />
          </div>
        )}

        <div style={{ display:'flex', gap:8, marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <button className="btn btn--green" onClick={() => save('published')} disabled={saving}>
            {saving ? <span className="spinner" /> : isEdit ? '💾 Update Story' : '🚀 Publish Story'}
          </button>
          <button className="btn btn--ghost" onClick={() => save('draft')} disabled={saving}>Save as Draft</button>
          <button className="btn btn--ghost" onClick={() => nav(-1)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
