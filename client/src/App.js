import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar         from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage       from './pages/HomePage';
import AuthPage       from './pages/AuthPage';
import PostDetailPage from './pages/PostDetailPage';
import EditorPage     from './pages/EditorPage';
import DashboardPage  from './pages/DashboardPage';
import ProfilePage    from './pages/ProfilePage';
import BookmarksPage  from './pages/BookmarksPage';
import SettingsPage   from './pages/SettingsPage';
import ImporterPage   from './pages/ImporterPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="layout">
            <Navbar />
            <Routes>
                <Route path="/"           element={<HomePage />} />
                <Route path="/auth"        element={<AuthPage />} />
                <Route path="/post/:slug"  element={<PostDetailPage />} />
                <Route path="/@:username"  element={<ProfilePage />} />
                <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/write"       element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
                <Route path="/edit/:id"    element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
                <Route path="/bookmarks"   element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
                <Route path="/settings"    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/import"      element={<ProtectedRoute><ImporterPage /></ProtectedRoute>} />
                <Route path="*"            element={<HomePage />} />
              </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
