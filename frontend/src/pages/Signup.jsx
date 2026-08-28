import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Library, User, KeyRound, Mail, Phone, Hash } from 'lucide-react';

export default function Signup({ onSignupSuccess }) {
  const [formData, setFormData] = useState({
    username: '', password: '', student_id: '', name: '', phone: '', email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed. Is backend running?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative py-12">
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center opacity-40 mix-blend-screen"
        style={{ backgroundImage: `url('/background.png')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#06090F] via-[#06090F]/80 to-[#06090F]/50 z-[-1]"></div>

      <div className="glass-panel p-8 w-full max-w-lg animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(217,119,6,0.4)] mb-4">
            <Library size={32} className="text-accent" />
          </div>
          <h2 className="text-3xl font-bold glow-text text-white tracking-wider">Student Sign Up</h2>
          <p className="text-slate-400 mt-2 text-sm">Create your account to access the library catalog.</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}
        {success && <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg text-sm mb-6 text-center">{success}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Student ID</label>
              <input required type="text" value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" placeholder="e.g. S003" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
              <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone No</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg py-2.5 px-3 outline-none" />
            </div>
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] hover:shadow-[0_0_25px_rgba(217,119,6,0.5)] mt-6">
            Create Account
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-slate-400">
          Already have an account? <Link to="/login" className="text-accent hover:underline font-bold">Login here</Link>
        </div>
      </div>
    </div>
  );
}
