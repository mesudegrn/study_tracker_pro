import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { GraduationCap } from 'lucide-react';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const result = await signUp(email, password, name, semesterStartDate);
        if (result.error) {
          console.error('Sign-up failed:', result.error);
          setError(result.error);
        } else if (result.requiresEmailConfirmation) {
          setNotice('Account created. Check your email to confirm it, then sign in.');
          setMode('signin');
        } else {
          setNotice('Account created and signed in.');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          console.error('Sign-in failed:', result.error);
          setError(result.error);
        }
      }
    } catch (submitError) {
      console.error('Authentication request failed:', submitError);
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4">
            <GraduationCap className="w-8 h-8 text-[#0a0a0f]" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Study Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track your academic progress with precision</p>
        </div>

        <div className="bg-[#16161f] border border-white/5 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1 mb-6 bg-[#0a0a0f] rounded-xl p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                placeholder="you@university.edu"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                placeholder="••••••••"
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Semester Start Date</label>
                <input
                  type="date"
                  required
                  value={semesterStartDate}
                  onChange={(e) => setSemesterStartDate(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            )}

            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            {notice && <p role="status" className="text-sm text-emerald-400">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
