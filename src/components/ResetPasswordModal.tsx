import { useState, useEffect } from 'react';
import { X, KeyRound } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function ResetPasswordModal({ isOpen, onClose, isDarkMode }: ResetPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('userProfileBubtEmail');
    if (stored) setEmail(stored);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your BUBT email');
      return;
    }
    if (!email.endsWith('@cse.bubt.edu.bd')) {
      setError('BUBT email must end with @cse.bubt.edu.bd');
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabaseConfigured) {
        const { error } = await (supabase as any).auth?.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-complete`
        });
        if (error) {
          setError(error.message || 'Unable to send reset instructions');
          return;
        }
      }
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className={`relative w-full max-w-md rounded-2xl shadow-2xl my-8 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Reset Password</h2>
              <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <div className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Check your email</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2`}>
                  We sent password reset instructions to <span className="font-semibold">{email}</span>.
                </p>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-1`}>Use the link within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>BUBT Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@cse.bubt.edu.bd" className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'}`} />
                  <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-1`}>We'll send a reset link to this email.</p>
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-100/20 border border-red-400/50">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting || !email.trim()} className={`${isSubmitting || !email.trim() ? 'opacity-50 cursor-not-allowed' : ''} w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {isSubmitting ? (<><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>sending</span></>) : (<><KeyRound className="h-5 w-5" /><span>Send Reset Link</span></>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
