import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, User, Phone, BookOpen, X, CheckCircle } from 'lucide-react';

interface UserRegistrationProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function UserRegistration({ onClose, onSuccess }: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollment: '',
    enableNotifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (!formData.enrollment.trim()) {
      setError('Enrollment number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Create user in database
      const { data: userData, error: userError } = await supabase
        .from('registered_users')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            enrollment_number: formData.enrollment,
            email_notifications_enabled: formData.enableNotifications,
            registered_at: new Date().toISOString(),
          }
        ])
        .select();

      if (userError) {
        if (userError.message.includes('duplicate')) {
          setError('This email is already registered');
        } else {
          setError('Failed to register: ' + userError.message);
        }
        setLoading(false);
        return;
      }

      // 2. Store user session in localStorage
      if (userData && userData.length > 0) {
        localStorage.setItem('currentUser', JSON.stringify({
          id: userData[0].id,
          name: formData.name,
          email: formData.email,
          enrollmentNumber: formData.enrollment,
          notificationsEnabled: formData.enableNotifications
        }));
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-4">
            Welcome {formData.name}! You're now registered for notifications.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Register</h2>
            <p className="text-blue-100 text-sm mt-1">Get notifications for updates</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880 1XXXXXXXXX"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Enrollment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Number *
            </label>
            <div className="relative">
              <BookOpen size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="enrollment"
                value={formData.enrollment}
                onChange={handleChange}
                placeholder="e.g., 51-5-001"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Email Notifications Checkbox */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="enableNotifications"
                checked={formData.enableNotifications}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded mt-0.5"
              />
              <div>
                <p className="font-medium text-gray-900">Enable Email Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive important updates about courses, exams, and announcements via email
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            * Required fields
          </p>
        </form>
      </div>
    </div>
  );
}
