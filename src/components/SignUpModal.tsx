import { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Image as ImageIcon, Mail } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  initialProfile?: {
    name: string;
    section: string;
    major: string;
    bubtEmail: string;
    notificationEmail: string;
    phone: string;
    password: string;
    profilePic: string;
  };
  onSave: (profile: { name: string; section: string; major: string; bubtEmail: string; notificationEmail: string; phone: string; password: string; profilePic: string }) => void;
  onResetPassword?: () => void;
  onChangeEmail?: () => void;
}

export function SignUpModal({
  isOpen,
  onClose,
  isDarkMode,
  initialProfile,
  onSave,
  onResetPassword,
  onChangeEmail
}: SignUpModalProps) {
  // Only initialize with initialProfile data if editing (privacy: don't auto-populate on signup)
  const [name, setName] = useState(initialProfile ? initialProfile.name : '');
  const [section, setSection] = useState(initialProfile ? initialProfile.section : '');
  const [major, setMajor] = useState(initialProfile ? initialProfile.major : '');
  const [bubtEmail, setBubtEmail] = useState(initialProfile ? initialProfile.bubtEmail : '');
  const [notificationEmail, setNotificationEmail] = useState(initialProfile ? initialProfile.notificationEmail : '');
  const [phone, setPhone] = useState(initialProfile ? initialProfile.phone : '');
  const [password, setPassword] = useState(initialProfile ? initialProfile.password : '');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState(initialProfile ? initialProfile.profilePic : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form fields when initialProfile changes (only in edit mode)
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setSection(initialProfile.section || '');
      setMajor(initialProfile.major || '');
      setBubtEmail(initialProfile.bubtEmail || '');
      setNotificationEmail(initialProfile.notificationEmail || '');
      setPhone(initialProfile.phone || '');
      setPassword(initialProfile.password || '');
      setProfilePic(initialProfile.profilePic || '');
    } else {
      // Clear all fields when opening signup (not edit mode)
      setName('');
      setSection('');
      setMajor('');
      setBubtEmail('');
      setNotificationEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      setProfilePic('');
      setError('');
      setSuccess(false);
    }
  }, [initialProfile, isOpen]);

  // Resend verification email
  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      if (supabaseConfigured) {
        const { error } = await (supabase as any).auth?.resend({
          type: 'signup',
          email: bubtEmail
        });
        if (error) {
          setError(error.message || 'Failed to resend verification email');
        } else {
          setError('');
        }
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Lock body scroll when modal is open
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

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!section.trim()) {
      setError('Please enter your section');
      return;
    }

    if (!major) {
      setError('Please select your major');
      return;
    }

    if (!bubtEmail.trim()) {
      setError('Please enter your BUBT email');
      return;
    }

    if (!bubtEmail.endsWith('@cse.bubt.edu.bd')) {
      setError('BUBT email must end with @cse.bubt.edu.bd');
      return;
    }

    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      setError('Please enter a valid notification email');
      return;
    }

    if (!password && !initialProfile) {
      setError('Please enter a password');
      return;
    }

    if (!initialProfile && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!initialProfile && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // If Supabase is configured, register or update in Supabase
      if (supabaseConfigured) {
        if (!initialProfile) {
          // Create auth user
          const { data, error } = await (supabase as any).auth?.signUp({
            email: bubtEmail,
            password,
            options: {
              data: { name, section, major, phone, notificationEmail, profilePic }
            }
          });
          if (error) {
            setError(error.message || 'Unable to create account');
            return;
          }

          const userId = data?.user?.id;
          if (!userId) {
            setError('Failed to create user account. Please try again.');
            return;
          }

          const { error: profileError } = await supabase.from('profiles').insert([{
            id: userId,
            name,
            section,
            major,
            bubt_email: bubtEmail,
            notification_email: notificationEmail,
            phone,
            profile_pic: profilePic,
            created_at: new Date().toISOString(),
            last_login_at: new Date().toISOString(),
          }]);
          if (profileError) {
            setError(profileError.message || 'Could not save profile');
            console.error('Profile creation error:', profileError);
            return;
          }
        } else {
          // Update profile details only - use update instead of upsert to avoid duplicate key error
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name,
              section,
              major,
              notification_email: notificationEmail,
              phone,
              profile_pic: profilePic,
            })
            .eq('bubt_email', bubtEmail);
          if (profileError) {
            setError(profileError.message || 'Could not update profile');
            return;
          }
        }
      }

      // Always keep local fallback for offline mode
      localStorage.setItem('userProfileName', name);
      localStorage.setItem('userProfileSection', section);
      localStorage.setItem('userProfileMajor', major);
      localStorage.setItem('userProfileBubtEmail', bubtEmail);
      localStorage.setItem('userProfileNotificationEmail', notificationEmail);
      localStorage.setItem('userProfilePhone', phone);
      if (password) {
        localStorage.setItem('userProfilePassword', password); // In production, this should be hashed!
      }
      if (profilePic) {
        localStorage.setItem('userProfilePic', profilePic);
      }

      setSuccess(true);
      onSave({ name, section, major, bubtEmail, notificationEmail, phone, password, profilePic });

      setTimeout(() => {
        onClose();
        setSuccess(false);
        // Reset form if it's a new registration
        if (!initialProfile) {
          setName('');
          setSection('');
          setMajor('');
          setBubtEmail('');
          setNotificationEmail('');
          setPhone('');
          setPassword('');
          setConfirmPassword('');
          setProfilePic('');
        }
      }, 1500);
    } catch (err) {
      console.error('Supabase sign-up error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            }`}>
              {initialProfile?.name ? 'Edit Profile' : 'Sign Up'}
            </h2>
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
        <div className="px-6 py-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {success ? (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
              }`}>
                <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {initialProfile?.name ? 'Profile Updated' : 'Account Created'}
              </p>
              {initialProfile?.name ? (
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your profile has been updated successfully.
                </p>
              ) : (
                <div className="space-y-3 mt-2">
                  <div>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                      We just sent a confirmation email to <span className="font-semibold">{bubtEmail}</span>.
                    </p>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs mt-1`}>
                      Please check your inbox (or spam). After confirming, you can log in to Edu51Five.
                    </p>
                  </div>
                  {error && (
                    <div className="p-2 rounded-lg bg-amber-100/20 border border-amber-400/50">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{error}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 rounded-lg text-sm font-medium shadow ${
                        isDarkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Got it
                    </button>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      } ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {isResending ? 'Sending...' : 'Resend'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Picture */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {/* Avatar Preview */}
                  <div className={`w-16 h-16 rounded-full overflow-hidden shadow-lg border-2 flex items-center justify-center flex-shrink-0 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500/50'
                      : 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-400/50'
                  }`}>
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Section */}
              <div>
                <label htmlFor="section" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Section *
                </label>
                <input
                  id="section"
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., Intake 51, Section 5"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* Major */}
              <div>
                <label htmlFor="major" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Major *
                </label>
                <select
                  id="major"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                >
                  <option value="">Select your major</option>
                  <option value="AI">Artificial Intelligence</option>
                  <option value="Software">Software Engineering</option>
                  <option value="Networking">Computer Networking</option>
                </select>
              </div>

              {/* BUBT Email (Account) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="bubtEmail" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    BUBT Email (Account) *
                  </label>
                  {/* Security Buttons - Only for Edit Profile */}
                  {initialProfile?.name && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onResetPassword}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                        }`}
                      >
                        Reset Password
                      </button>
                      <button
                        type="button"
                        onClick={onChangeEmail}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700'
                        }`}
                      >
                        Change Email
                      </button>
                    </div>
                  )}
                </div>
                <input
                  id="bubtEmail"
                  type="email"
                  value={bubtEmail}
                  onChange={(e) => setBubtEmail(e.target.value)}
                  placeholder="yourname@cse.bubt.edu.bd"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Used for account login
                </p>
              </div>

              {/* Notification Email */}
              <div>
                <label htmlFor="notificationEmail" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notification Email
                </label>
                <input
                  id="notificationEmail"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="alternative@gmail.com (optional)"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                  }`}
                />
                {notificationEmail.trim() === '' ? (
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`}>
                    Warning: Without a Notification Email, you won’t receive any updates.
                  </p>
                ) : (
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    For updates and notifications
                  </p>
                )}
              </div>

              {/* Phone Number (Optional, can be used for login) */}
              <div>
                <label htmlFor="phone" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX (optional)"
                  className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                  }`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Can also be used for login
                </p>
              </div>

              {/* Password (only for new registration) */}
              {!initialProfile && (
                <>
                  <div>
                    <label htmlFor="password" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Password *
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Confirm Password *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-100/20 border border-red-400/50">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isSubmitting || !name.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDarkMode
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>loading</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>{initialProfile?.name ? 'Update Profile' : 'Create Profile'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
