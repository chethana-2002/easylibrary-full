import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { BookOpen, Map as MapIcon, Library, LogOut, CheckSquare, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MapView from './pages/MapView';
import StudentPortal from './pages/StudentPortal';
import LibrarianPortal from './pages/LibrarianPortal';

function App() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // If not logged in, handle auth routes
  if (!user) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup onSignupSuccess={() => navigate('/')} />} />
        <Route path="*" element={<Login onLogin={setUser} />} />
      </Routes>
    );
  }

  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col relative text-slate-100 font-sans pb-10">
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-30 pointer-events-none mix-blend-screen"
        style={{ backgroundImage: `url('/background.png')` }}
      ></div>

      <nav className="glass-panel mx-6 mt-6 p-4 flex items-center justify-between z-10 sticky top-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg text-accent shadow-[0_0_15px_rgba(217,119,6,0.3)]">
            <Library size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider glow-text text-white leading-tight">EasyLibrary</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Librarian & Student Portal</p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* STUDENT LINKS */}
          {user.role === 'student' && (
            <>
              <Link to="/student" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${location.pathname === '/student' ? 'bg-primary/20 text-white border border-primary/40 shadow-inner' : 'hover:bg-white/5 text-slate-400'}`}>
                <BookOpen size={18} /> <span className="font-medium text-sm">My Portal</span>
              </Link>
            </>
          )}

          {/* LIBRARIAN LINKS */}
          {user.role === 'librarian' && (
            <>
              <Link to="/librarian" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${location.pathname === '/librarian' ? 'bg-primary/20 text-white border border-primary/40 shadow-inner' : 'hover:bg-white/5 text-slate-400'}`}>
                <CheckSquare size={18} /> <span className="font-medium text-sm">Station & Inbox</span>
              </Link>
            </>
          )}

          {/* SHARED LINKS */}
          <Link to="/map" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${location.pathname === '/map' ? 'bg-secondary/20 text-white border border-secondary/40 shadow-inner' : 'hover:bg-white/5 text-slate-400'}`}>
            <MapIcon size={18} /> <span className="font-medium text-sm">Map Viewer</span>
          </Link>

          <div className="w-px h-6 bg-white/10 mx-2"></div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
              <p className="text-[10px] text-accent uppercase tracking-wider">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors border border-red-500/20" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full z-10">
        <Routes>
          <Route path="/" element={<Navigate to={`/${user.role}`} />} />
          <Route path="/student" element={user.role === 'student' ? <StudentPortal user={user} /> : <Navigate to="/" />} />
          <Route path="/librarian" element={user.role === 'librarian' ? <LibrarianPortal user={user} /> : <Navigate to="/" />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
