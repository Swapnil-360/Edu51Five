import { useState, useEffect } from 'react';
import { X, LogIn, Mail, Lock, Sparkles } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSignIn: (identifier: string, password: string, profile?: any) => void;
  onOpenSignUp: () => void;
}

export function SignInModal({
  isOpen,
  onClose,
  isDarkMode,
  onSignIn,
  onOpenSignUp
}: SignInModalProps) {
  // Temporary feature flag: hide "Login with Google" in Sign In modal until configured
  const SHOW_GOOGLE_SIGNIN = false;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isSupabaseAuthAvailable = supabaseConfigured && Boolean((supabase as any).auth?.signInWithOAuth);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIdentifier('');
      setPassword('');
      setError('');
      setIsSubmitting(false);
      setIsGoogleLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const normalizedIdentifier = trimmedIdentifier.toLowerCase();
      // Try Supabase auth first if configured and email provided
      if (supabaseConfigured && trimmedIdentifier.includes('@') && (supabase as any).auth?.signInWithPassword) {
        try {
          const { data, error } = await (supabase as any).auth.signInWithPassword({
            email: normalizedIdentifier,
            password,
          });

          if (error) {
            console.error('Supabase auth error:', error);
            if (error.message.includes('Invalid login credentials')) {
              setError('Invalid email or password. Please check and try again.');
            } else if (error.message.includes('Email not confirmed')) {
              setError('Please verify your email before signing in.');
            } else {
              setError(error.message || 'Invalid credentials. Please try again.');
            }
            return;
          }

          // Load profile from database
          const { data: profileRows, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('bubt_email', normalizedIdentifier)
            .limit(1);

          if (profileError) {
            console.warn('Profile load failed, using fallback:', profileError.message);
          }

          let profile = (profileRows && profileRows[0]) || null;

          if (!profile && data?.user?.id) {
            const fallbackProfile = {
              id: data.user.id,
              name: data?.user?.user_metadata?.name || 'Welcome Student',
              section: data?.user?.user_metadata?.section || '',
              major: data?.user?.user_metadata?.major || '',
              bubt_email: normalizedIdentifier,
              notification_email: data?.user?.user_metadata?.notificationEmail || '',
              phone: data?.user?.user_metadata?.phone || '',
              profile_pic: data?.user?.user_metadata?.profilePic || '',
              created_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
            };

            const { error: insertError } = await supabase
              .from('profiles')
              .insert([fallbackProfile]);

            if (insertError) {
              console.warn('Profile insert on first sign-in failed:', insertError.message);
            } else {
              profile = fallbackProfile;
            }
          }

          if (!profile) {
            profile = {
              name: data?.user?.user_metadata?.name || 'Welcome Student',
              section: '',
              major: '',
              bubt_email: normalizedIdentifier,
              notification_email: '',
              phone: '',
              profile_pic: '',
            };
          }

          // Persist locally for offline usage
          const profileData = {
            name: profile.name,
            section: profile.section,
            major: profile.major,
            bubtEmail: profile.bubt_email,
            notificationEmail: profile.notification_email,
            phone: profile.phone,
            password,
            profilePic: profile.profile_pic,
          };
          
          localStorage.setItem('userProfile', JSON.stringify(profileData));
          localStorage.setItem('userProfileName', profile.name || 'Welcome Student');
          localStorage.setItem('userProfileSection', profile.section || '');
          localStorage.setItem('userProfileMajor', profile.major || '');
          localStorage.setItem('userProfileBubtEmail', profile.bubt_email || '');
          localStorage.setItem('userProfileNotificationEmail', profile.notification_email || '');
          localStorage.setItem('userProfilePhone', profile.phone || '');
          if (profile.profile_pic) {
            localStorage.setItem('userProfilePic', profile.profile_pic);
          }
          localStorage.setItem('userProfilePassword', password);

          setIsSubmitting(false);
          console.log('✅ Sign in successful, closing modal');
          onClose();
          onSignIn(identifier, password, profile);
          return;
        } catch (authError: any) {
          console.error('Supabase authentication exception:', authError);
          setError('Unable to sign in. Please check your connection and try again.');
          return;
        }
      }

      // Fallback: local-only profile check
      const storedProfile = localStorage.getItem('userProfile');
      if (!storedProfile) {
        setError('No account found. Please sign up first.');
        return;
      }

      const profile = JSON.parse(storedProfile);
      const emailMatch = (profile.bubtEmail || '').toLowerCase() === normalizedIdentifier;
      const phoneMatch = profile.phone === trimmedIdentifier;
      const identifierMatch = emailMatch || phoneMatch;
      const passwordMatch = profile.password === password;

      if (identifierMatch && passwordMatch) {
        setIsSubmitting(false);
        console.log('✅ Sign in successful (local fallback)');
        onClose();
        onSignIn(identifier, password, profile);
      } else {
        setError('Invalid credentials. Please check your email/phone and password.');
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    if (!isSupabaseAuthAvailable) {
      setError('Google sign up requires Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });

      if (googleError) {
        setError('Google sign up failed. Please try again.');
      }
    } catch (err) {
      console.error('Google sign up error:', err);
      setError('Could not start Google sign up. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className={`relative w-full max-w-md rounded-2xl shadow-2xl transition-colors duration-300 my-8 ${
            isDarkMode
              ? 'bg-gray-900'
              : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`px-6 py-5 border-b ${
            isDarkMode
              ? 'border-gray-700/50'
              : 'border-gray-200/50'
          }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Sign In</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
          {error && (
            <div className={`p-4 rounded-xl border text-sm ${
              isDarkMode
                ? 'bg-red-900/30 border-red-700/50 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Email or Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                placeholder="your.email@cse.bubt.edu.bd or 01XXXXXXXXX"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-gray-100 placeholder-gray-400 focus:border-blue-500'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                placeholder="Enter your password"
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
          </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>loading</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </>
              )}
            </button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wide">
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>or</span>
            <div className={`flex-1 h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>

            {SHOW_GOOGLE_SIGNIN && (
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
                } ${isGoogleLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>loading</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Login with Google</span>
                  </>
                )}
              </button>
            )}

            <p className={`text-center text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignUp();
                }}
                className={`font-semibold hover:underline ${
                  isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Sign Up
              </button>
            </p>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
