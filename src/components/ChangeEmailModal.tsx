import { useState, useEffect } from 'react';
import { X, MailCheck } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function ChangeEmailModal({ isOpen, onClose, isDarkMode }: ChangeEmailModalProps) {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('userProfileBubtEmail');
    if (stored) setCurrentEmail(stored);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newEmail.trim()) {
      setError('Please enter your new BUBT email');
      return;
    }
    if (!newEmail.endsWith('@cse.bubt.edu.bd')) {
      setError('BUBT email must end with @cse.bubt.edu.bd');
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabaseConfigured) {
        const { data, error } = await (supabase as any).auth?.updateUser({ email: newEmail });
        if (error) {
          setError(error.message || 'Unable to request email change');
          return;
        }
        // Supabase sends a confirmation to the new email; we'll update local storage after confirmation
      }
      setSuccess(true);
    } catch (err) {
      console.error('Change email error:', err);
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
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Account Email</h2>
              <button onClick={onClose} className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            {success ? (
              <div className="text-center py-8">
                <div className={`${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'} w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <MailCheck className="w-8 h-8 text-purple-600" />
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Confirm on your new email</p>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mt-2`}>
                  We sent a confirmation link to <span className="font-semibold">{newEmail}</span>. After confirming, your account email will be updated.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Current BUBT Email</label>
                  <input type="email" value={currentEmail} disabled className={`w-full px-4 py-2.5 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-600'}`} />
                  <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-xs mt-1`}>You are logged in with this email.</p>
                </div>
                <div>
                  <label htmlFor="newEmail" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>New BUBT Email</label>
                  <input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="newname@cse.bubt.edu.bd" className={`w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400'}`} />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-100/20 border border-red-400/50">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}
                <button type="submit" disabled={isSubmitting || !newEmail.trim()} className={`${isSubmitting || !newEmail.trim() ? 'opacity-50 cursor-not-allowed' : ''} w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium ${isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {isSubmitting ? (<><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>sending</span></>) : (<><MailCheck className="h-5 w-5" /><span>Send Confirmation</span></>)}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
