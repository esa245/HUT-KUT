import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, X } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'mdesaalli74@gmail.com' && password === 'mdesa1111') {
      soundManager.playUpgrade();
      onSuccess();
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="fixed inset-0 z-[1060] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#0c1527] border border-[#1e2e4a] p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X /></button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white">Admin Login</h2>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 py-3 rounded-xl bg-[#131d33] border border-[#1e2e4a] text-white focus:border-amber-500 outline-none" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 py-3 rounded-xl bg-[#131d33] border border-[#1e2e4a] text-white focus:border-amber-500 outline-none" required />
          </div>
          {error && <p className="text-rose-500 text-xs text-center">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm">Login</button>
        </form>
      </div>
    </div>
  );
};
