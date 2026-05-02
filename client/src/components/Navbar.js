import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { avatarLetter } from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { nav(`/?search=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };

  const active = (path) => loc.pathname === path ? 'nav-btn nav-btn--active' : 'nav-btn';

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <button className="navbar__logo" onClick={() => nav('/')}>
          Write<em>Stack</em>
        </button>

        <form className="navbar__search" onSubmit={handleSearch}>
          <span className="navbar__search__icon">🔍</span>
          <input
            type="text" placeholder="Search stories…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </form>

        <div className="navbar__nav">
          <button className={active('/')} onClick={() => nav('/')}>Feed</button>

          {user ? (
            <>
              <button className="nav-btn nav-btn--write" onClick={() => nav('/write')}>✏️ Write</button>
              <button className="nav-btn" onClick={() => nav('/import')}>Import</button>

              <div className="dropdown" ref={dropRef}>
                <button className="avatar-btn" onClick={() => setOpen(o => !o)} title={user.username}>
                  {user.avatar
                    ? <img src={user.avatar} alt={user.username} />
                    : avatarLetter(user.username)
                  }
                </button>
                {open && (
                  <div className="dropdown__menu">
                    <button className="dropdown__item" onClick={() => { nav(`/@${user.username}`); setOpen(false); }}>
                      👤 Profile
                    </button>
                    <button className="dropdown__item" onClick={() => { nav('/dashboard'); setOpen(false); }}>
                      📊 Dashboard
                    </button>
                    <button className="dropdown__item" onClick={() => { nav('/bookmarks'); setOpen(false); }}>
                      🔖 Bookmarks
                    </button>
                    <button className="dropdown__item" onClick={() => { nav('/settings'); setOpen(false); }}>
                      ⚙️ Settings
                    </button>
                    <div className="dropdown__divider" />
                    <button className="dropdown__item dropdown__item--danger" onClick={() => { logout(); nav('/'); setOpen(false); }}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => nav('/auth')}>Sign In</button>
              <button className="nav-btn nav-btn--write" onClick={() => nav('/auth?mode=register')}>Get Started</button>
            </>
          )}

          <button className="theme-btn" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
}
