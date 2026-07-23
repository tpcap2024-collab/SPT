import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { initAuth, googleSignIn, logout } from '../lib/firebase';
import { User } from 'firebase/auth';

interface SettingsModalProps {
  onClose: () => void;
  spreadsheetId: string;
  onSpreadsheetIdChange: (id: string) => void;
}

export function SettingsModal({ onClose, spreadsheetId, onSpreadsheetIdChange }: SettingsModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">ตั้งค่าระบบ (Settings)</h3>
          <button onClick={onClose} className="text-slate-400 p-2 active:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-6">
          
          {/* Auth Section */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-3">บัญชีผู้ใช้ (Google Account)</label>
            {user ? (
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm text-slate-800 truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg active:bg-red-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-3 p-3 border-2 border-slate-200 rounded-xl active:bg-slate-50 transition-colors font-bold text-slate-700"
              >
                {isLoggingIn ? (
                  'กำลังเข้าสู่ระบบ...'
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.03c-.22-.66-.35-1.36-.35-2.03s.13-1.37.35-2.03V7.13H2.18C1.43 8.61 1 10.26 1 12s.43 3.39 1.18 4.87l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.13l3.66 2.84c.87-2.6 3.3-4.59 6.16-4.59z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            )}
          </div>

          {/* Settings Section */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Google Sheet ID</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => onSpreadsheetIdChange(e.target.value)}
              placeholder="e.g. 1BxiMvs0XRYFgCE..."
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">นำ ID จาก URL ของ Google Sheet มาใส่ที่นี่ (หลัง /d/)</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
