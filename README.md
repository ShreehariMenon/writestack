# WriteStack v2 ✍️

A full-featured, Medium-inspired blogging platform — built as a CS final year project.

**Stack:** React 18 · Node.js/Express · MongoDB Atlas · JWT Auth

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Register, login, JWT (14-day tokens), bcrypt passwords |
| ✍️ Editor | Markdown editor with live preview, formatting toolbar |
| 🏷 Tags | Up to 5 tags per post, trending tags sidebar, tag filtering |
| 👏 Claps | Medium-style clap system (toggle on/off) |
| 💬 Comments | Threaded comments with replies and likes |
| 👥 Follow | Follow/unfollow authors, personalised feed |
| 🔖 Bookmarks | Save stories to read later |
| ⏱ Read time | Auto-calculated from word count |
| 📥 Import | Dev.to username browser + any URL scraper |
| 🔍 Search | Search by title and tag across feed |
| 📊 Dashboard | Stats: views, claps, drafts/published toggle |
| 👤 Profiles | Public author pages with follow button |
| ⚙️ Settings | Avatar, bio, website, Twitter handle |
| 🌙 Dark mode | Full dark/light toggle, persisted |
| 📱 Responsive | Mobile-first, works on all screen sizes |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### 1. Clone & Install
```bash
git clone <your-repo>
cd writestack-v2
npm run install:all
```

### 2. Create `server/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/writestack2
JWT_SECRET=change_this_to_any_long_random_string_32chars_minimum
CLIENT_URL=http://localhost:3000
```

### 3. Create `client/.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run
```bash
npm run dev
```

- **API:** http://localhost:5000
- **App:** http://localhost:3000

---

## 🌐 Deployment

### Backend → Render (free)
1. Push to GitHub → New Web Service on render.com
2. Root directory: `server`
3. Build: `npm install` · Start: `node index.js`
4. Add env vars from `server/.env`

### Frontend → Vercel (free)
1. Import repo on vercel.com
2. Root directory: `client`
3. Framework: Create React App
4. Add env var: `REACT_APP_API_URL=https://your-app.onrender.com/api`

### Database → MongoDB Atlas (free M0)
1. Create cluster → Database user → Allow all IPs (`0.0.0.0/0`)
2. Get connection string → paste into `MONGODB_URI`

---

## 📡 API Reference

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |

### Posts
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | — | Feed (search, tag, sort, pagination) |
| GET | `/api/posts/following` | ✅ | Following feed |
| GET | `/api/posts/mine` | ✅ | My posts (dashboard) |
| GET | `/api/posts/:slug` | — | Single post |
| POST | `/api/posts` | ✅ | Create post |
| PUT | `/api/posts/:id` | ✅ | Update post |
| DELETE | `/api/posts/:id` | ✅ | Delete post |
| POST | `/api/posts/:id/clap` | ✅ | Toggle clap |
| POST | `/api/posts/:id/bookmark` | ✅ | Toggle bookmark |

### Comments
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:postId` | — | Get comments |
| POST | `/api/comments` | ✅ | Add comment/reply |
| POST | `/api/comments/:id/like` | ✅ | Like comment |
| DELETE | `/api/comments/:id` | ✅ | Delete comment |

### Users
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/users/:username` | — | Public profile |
| POST | `/api/users/:id/follow` | ✅ | Follow/unfollow |
| PUT | `/api/users/me/profile` | ✅ | Update profile |
| GET | `/api/users/me/bookmarks` | ✅ | Get bookmarks |

### Import
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/import/devto` | ✅ | Browse Dev.to by username |
| POST | `/api/import/devto/article/:id` | ✅ | Import Dev.to article |
| POST | `/api/import/url` | ✅ | Scrape any URL |

### Tags
| Method | Route | Description |
|---|---|---|
| GET | `/api/tags` | Trending tags with counts |

---

## 📁 Structure

```
writestack-v2/
├── client/
│   ├── public/index.html
│   └── src/
│       ├── components/   Navbar, PostCard, ProtectedRoute
│       ├── context/      AuthContext, ThemeContext
│       ├── pages/        Home, Auth, PostDetail, Editor,
│       │                 Dashboard, Profile, Bookmarks,
│       │                 Settings, Importer
│       └── utils/        api.js (fetch helper + md renderer)
└── server/
    ├── models/           User, Post, Comment
    ├── routes/           auth, posts, comments, users, importer, tags
    ├── middleware/        auth.js (JWT)
    └── index.js
```
