import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Library, User, KeyRound } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data);
        if (data.role === 'admin') navigate('/admin');
        else if (data.role === 'librarian') navigate('/librarian');
        else if (data.role === 'student') navigate('/student');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed. Is backend running?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: `url('/background.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-[#06090F]/80 to-[#06090F]/50 z-[-1]"></div>

      <div className="glass-panel p-8 w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.4)] mb-4">
            <Library size={32} className="text-accent" />
          </div>
          <h2 className="text-3xl font-bold glow-text text-white tracking-wider">EasyLibrary</h2>
          <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-bold">Enterprise LMS</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all shadow-inner"
                placeholder="stu1, lib1, or admin"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-xl py-2.5 pl-10 pr-4 outline-none transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] mt-4">
            Secure Login
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-slate-400">
          Student without an account? <Link to="/signup" className="text-accent hover:underline font-bold">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}
