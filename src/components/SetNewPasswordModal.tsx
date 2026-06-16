import { useState } from 'react';
import { KeyRound, CheckCircle, Eye, EyeOff, Circle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function SetNewPasswordModal({ isOpen, onClose, isDarkMode }: Props) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Real-time requirement evaluations
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password requirements first.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message || 'Failed to update password.'); return; }
    setDone(true);
    setTimeout(() => { onClose(); setDone(false); setPassword(''); setConfirm(''); setShowPassword(false); setShowConfirm(false); }, 2000);
  };

  const card = isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const input = `w-full pl-4 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
    isDarkMode
      ? 'bg-gray-700/50 border-gray-600/50 text-gray-100 placeholder-gray-400 focus:border-blue-500'
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
  }`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${card}`}>
        <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-blue-500" /> Set New Password
          </h2>
        </div>

        <div className="px-6 py-6">
          {done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="font-semibold">Password updated!</p>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>You can now sign in with your new password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter a new password for your account.
              </p>
              {error && (
                <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}
              <div className="space-y-1">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={input}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className={input}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors ${
                      isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Password checklist */}
              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isDarkMode ? 'bg-gray-800/40 border-gray-700/60' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password Requirements:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                      Minimum of 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasLowercase ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className={hasLowercase ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                      One lowercase letter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUppercase ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className={hasUppercase ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                      One uppercase letter
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasSpecial ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className={hasSpecial ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                      One special character
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasDigit ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    )}
                    <span className={hasDigit ? 'text-emerald-500 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'}>
                      One number
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !isPasswordValid || !passwordsMatch}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
