import React, { useState, useEffect } from 'react';
import { Bell, Plus, ChevronDown, ChevronUp, AlertCircle, Link as LinkIcon, Trash2, Edit2, BarChart3, BookOpen, Files, Users, TrendingUp } from 'lucide-react';
import { DriveManager } from './DriveManager';

interface Notice {
  id: string;
  title?: string;
  content: string;
  is_active: boolean;
  type?: string;
  category?: string;
  created_at?: string;
}

interface EmergencyAlert {
  id: string;
  message: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface EmergencyLink {
  id: string;
  title: string;
  url: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

interface AdminDashboardProps {
  isDarkMode: boolean;
  coursesCount: number;
  materialsCount: number;
  onlineUsers?: number;
  currentWeek?: number;
  totalWeeks?: number;
  notices?: Notice[];
  onEditNotice: () => void;
  onCreateNotice: () => void;
  onDeleteNotice?: (noticeId: string) => void;
  broadcastPush?: { title: string; body: string; url: string };
  onBroadcastPushChange?: (data: { title: string; body: string; url: string }) => void;
  onSendBroadcast?: () => void;
  isSendingBroadcast?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isDarkMode,
  coursesCount,
  materialsCount,
  onlineUsers = 0,
  currentWeek = 16,
  totalWeeks = 20,
  notices = [],
  onEditNotice,
  onCreateNotice,
  onDeleteNotice,
  broadcastPush = { title: '', body: '', url: '/' },
  onBroadcastPushChange,
  onSendBroadcast,
  isSendingBroadcast = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    courseManagement: false,
    materialUpload: false,
  });

  // Load emergency alerts and links from localStorage
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [emergencyLinks, setEmergencyLinks] = useState<EmergencyLink[]>([]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem('emergency_alerts');
    const savedLinks = localStorage.getItem('emergency_links');
    
    if (savedAlerts) {
      try {
        setEmergencyAlerts(JSON.parse(savedAlerts));
      } catch (e) {
        console.error('Failed to parse emergency alerts', e);
      }
    }
    
    if (savedLinks) {
      try {
        setEmergencyLinks(JSON.parse(savedLinks));
      } catch (e) {
        console.error('Failed to parse emergency links', e);
      }
    }
  }, []);

  // Save alerts to localStorage
  const saveAlert = () => {
    if (!newAlertMessage.trim()) return;
    
    const newAlert: EmergencyAlert = {
      id: Date.now().toString(),
      message: newAlertMessage,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    
    const updated = [newAlert, ...emergencyAlerts];
    setEmergencyAlerts(updated);
    localStorage.setItem('emergency_alerts', JSON.stringify(updated));
    // Dispatch custom event for instant UI update
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_alerts' } }));
    setNewAlertMessage('');
    setShowAddAlert(false);
  };

  // Delete alert
  const deleteAlert = (id: string) => {
    const updated = emergencyAlerts.filter(a => a.id !== id);
    setEmergencyAlerts(updated);
    localStorage.setItem('emergency_alerts', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_alerts' } }));
  };

  // Toggle alert status
  const toggleAlertStatus = (id: string) => {
    const updated = emergencyAlerts.map(a =>
      a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : a
    );
    setEmergencyAlerts(updated);
    localStorage.setItem('emergency_alerts', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_alerts' } }));
  };

  // Save link to localStorage
  const saveLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    
    const newLink: EmergencyLink = {
      id: Date.now().toString(),
      title: newLinkTitle,
      url: newLinkUrl,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    
    const updated = [newLink, ...emergencyLinks];
    setEmergencyLinks(updated);
    localStorage.setItem('emergency_links', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_links' } }));
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowAddLink(false);
  };

  // Delete link
  const deleteLink = (id: string) => {
    const updated = emergencyLinks.filter(l => l.id !== id);
    setEmergencyLinks(updated);
    localStorage.setItem('emergency_links', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_links' } }));
  };

  // Toggle link status
  const toggleLinkStatus = (id: string) => {
    const updated = emergencyLinks.map(l =>
      l.id === id ? { ...l, status: l.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : l
    );
    setEmergencyLinks(updated);
    localStorage.setItem('emergency_links', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'emergency_links' } }));
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const semesterProgress = ((currentWeek / totalWeeks) * 100).toFixed(1);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-slate-800/80 to-slate-900/80 border-slate-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200 backdrop-blur-sm'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
            Admin Dashboard
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 sm:mt-3 text-sm sm:text-base font-medium`}>
            Manage notices, emergencies, and view platform statistics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8">
        {/* SECTION 1: Quick Stats Dashboard */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Platform Statistics
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Courses Card */}
            <div className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-blue-500/20' : 'bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-xl border border-blue-200/50 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-200/50'}`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/5 to-transparent' : 'bg-gradient-to-br from-blue-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10 p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Courses</p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30' : 'bg-blue-200 text-blue-600 group-hover:bg-blue-300'} transition-all group-hover:scale-110`}>
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-blue-600 group-hover:text-blue-700'} transition-colors`}>{coursesCount}</p>
                <div className={`mt-2 h-1 w-8 rounded-full ${isDarkMode ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}></div>
              </div>
            </div>

            {/* Files Card */}
            <div className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-emerald-500/20' : 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/80 backdrop-blur-xl border border-emerald-200/50 hover:border-emerald-300/80 hover:shadow-lg hover:shadow-emerald-200/50'}`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : 'bg-gradient-to-br from-emerald-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10 p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Files</p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30' : 'bg-emerald-200 text-emerald-600 group-hover:bg-emerald-300'} transition-all group-hover:scale-110`}>
                    <Files className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-emerald-300 group-hover:text-emerald-200' : 'text-emerald-600 group-hover:text-emerald-700'} transition-colors`}>{materialsCount}</p>
                <div className={`mt-2 h-1 w-8 rounded-full ${isDarkMode ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}></div>
              </div>
            </div>

            {/* Online Users Card */}
            <div className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-purple-500/20 hover:border-purple-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-purple-500/20' : 'bg-gradient-to-br from-purple-50/80 to-purple-100/80 backdrop-blur-xl border border-purple-200/50 hover:border-purple-300/80 hover:shadow-lg hover:shadow-purple-200/50'}`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-purple-500/5 to-transparent' : 'bg-gradient-to-br from-purple-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10 p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active</p>
                    <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-200 text-green-700'}`}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                      LIVE
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30' : 'bg-purple-200 text-purple-600 group-hover:bg-purple-300'} transition-all group-hover:scale-110`}>
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-purple-300 group-hover:text-purple-200' : 'text-purple-600 group-hover:text-purple-700'} transition-colors`}>{onlineUsers}</p>
                <div className={`mt-2 h-1 w-8 rounded-full ${isDarkMode ? 'bg-gradient-to-r from-purple-500 to-purple-400' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}></div>
              </div>
            </div>

            {/* Semester Progress Card */}
            <div className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-orange-500/20 hover:border-orange-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-orange-500/20' : 'bg-gradient-to-br from-orange-50/80 to-orange-100/80 backdrop-blur-xl border border-orange-200/50 hover:border-orange-300/80 hover:shadow-lg hover:shadow-orange-200/50'}`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-orange-500/5 to-transparent' : 'bg-gradient-to-br from-orange-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              <div className="relative z-10 p-3 sm:p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Progress</p>
                  </div>
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30' : 'bg-orange-200 text-orange-600 group-hover:bg-orange-300'} transition-all group-hover:scale-110`}>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <p className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-orange-300 group-hover:text-orange-200' : 'text-orange-600 group-hover:text-orange-700'} transition-colors`}>Week {currentWeek}</p>
                <p className={`mt-1 text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{semesterProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast Push Notification Section */}
        <div className={`group relative overflow-hidden rounded-xl lg:rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30 hover:border-indigo-400/50 hover:from-indigo-900/60 hover:to-purple-900/60 hover:shadow-lg hover:shadow-indigo-500/20' : 'bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-xl border border-indigo-200/50 hover:border-indigo-300/80 hover:shadow-lg hover:shadow-indigo-200/50'}`}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-indigo-500/5 to-transparent' : 'bg-gradient-to-br from-indigo-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-200 text-indigo-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                  📢 Broadcast Push Notification
                </h2>
                <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
                  Send instant notifications to all subscribed users
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                    Notification Title
                  </label>
                  <input
                    type="text"
                    value={broadcastPush.title}
                    onChange={(e) => onBroadcastPushChange?.({ ...broadcastPush, title: e.target.value })}
                    placeholder="e.g., New Study Material Uploaded"
                    className={`w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isDarkMode
                        ? 'bg-slate-800/50 border-slate-600/50 text-gray-100 placeholder-gray-400 focus:bg-slate-800 focus:border-indigo-500/50'
                        : 'bg-white/70 border-indigo-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                    Open URL (optional)
                  </label>
                  <input
                    type="text"
                    value={broadcastPush.url}
                    onChange={(e) => onBroadcastPushChange?.({ ...broadcastPush, url: e.target.value })}
                    placeholder="/course/CSE-319 or /"
                    className={`w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      isDarkMode
                        ? 'bg-slate-800/50 border-slate-600/50 text-gray-100 placeholder-gray-400 focus:bg-slate-800 focus:border-indigo-500/50'
                        : 'bg-white/70 border-indigo-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-200' : 'text-indigo-900'}`}>
                  Message Body
                </label>
                <textarea
                  value={broadcastPush.body}
                  onChange={(e) => onBroadcastPushChange?.({ ...broadcastPush, body: e.target.value })}
                  placeholder="Check out the new CSE-319 notes uploaded in the Notes section!"
                  rows={3}
                  className={`w-full px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${
                    isDarkMode
                      ? 'bg-slate-800/50 border-slate-600/50 text-gray-100 placeholder-gray-400 focus:bg-slate-800 focus:border-indigo-500/50'
                      : 'bg-white/70 border-indigo-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-indigo-400'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-indigo-300/20">
                <p className={`text-xs ${isDarkMode ? 'text-indigo-300/60' : 'text-indigo-600/60'}`}>
                  💡 Requires Edge Function with VAPID keys configured
                </p>
                <button
                  onClick={onSendBroadcast}
                  disabled={isSendingBroadcast || !broadcastPush.title || !broadcastPush.body}
                  className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSendingBroadcast || !broadcastPush.title || !broadcastPush.body
                      ? isDarkMode
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-gray-300 text-gray-500'
                      : isDarkMode
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/50 hover:scale-105'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-400/50 hover:scale-105'
                  }`}
                >
                  {isSendingBroadcast ? '⏳ Sending...' : '🚀 Send to All Subscribers'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Notice Management (PRIMARY) */}
        <div className={`group relative overflow-hidden rounded-xl lg:rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-cyan-500/20 hover:border-cyan-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-cyan-500/20' : 'bg-gradient-to-br from-[#E6F5FF] to-white/60 backdrop-blur-xl border border-[#D1ECFF] hover:border-[#B0D6F0] hover:shadow-lg hover:shadow-[#2B7CBF]/10'}`}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-cyan-500/5 to-transparent' : 'bg-gradient-to-br from-[#D1ECFF] to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
              <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wider flex items-center ${isDarkMode ? 'text-cyan-300 group-hover:text-cyan-200' : 'text-[#2B7CBF] group-hover:text-[#1f6aa0]'} transition-colors`}>
                <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#E6F5FF] text-[#2B7CBF]'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <span>Notices</span>
              </h2>
              <button
                onClick={onCreateNotice}
                className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 group/btn ${isDarkMode ? 'bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/50 border border-cyan-400/50 hover:border-cyan-300/80 hover:shadow-lg hover:shadow-cyan-500/30' : 'bg-[#D1ECFF] text-[#2B7CBF] hover:bg-[#B0D6F0] border border-[#C6E6F8] hover:border-[#A6CFE9] hover:shadow-lg hover:shadow-[#2B7CBF]/10'} w-full sm:w-auto`}
              >
                <Plus className="w-4 h-4 flex-shrink-0 transition-transform group-hover/btn:rotate-90" />
                <span>Add Notice</span>
              </button>
            </div>

            {/* Existing Notices from Database */}
            {notices.length > 0 ? (
              <div className={`space-y-3 max-h-96 overflow-y-auto`}>
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    className={`group/notice p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-start gap-3 transition-all duration-300 backdrop-blur-sm ${
                      notice.is_active
                        ? isDarkMode
                          ? 'bg-cyan-500/15 border border-cyan-500/40 hover:bg-cyan-500/25 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/20'
                          : 'bg-[#E6F5FF] border border-[#D1ECFF] hover:bg-[#D1ECFF] hover:border-[#B0D6F0] hover:shadow-lg hover:shadow-[#2B7CBF]/10'
                        : isDarkMode
                        ? 'bg-slate-700/20 border border-slate-600/40 opacity-60 hover:opacity-80'
                        : 'bg-gray-200/30 border border-gray-300/40 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <p className={`font-bold text-sm break-words ${isDarkMode ? 'text-cyan-200' : 'text-[#2B7CBF]'}`}>
                          {notice.title || notice.id}
                        </p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${notice.is_active ? (isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-200 text-green-700') : (isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600')}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${notice.is_active ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} mr-1`}></span>
                          {notice.is_active ? 'LIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {notice.content}
                      </p>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={onEditNotice}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/notice:scale-110 ${isDarkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-[#2B7CBF]/10 text-[#2B7CBF] hover:bg-[#2B7CBF]/20'}`}
                        title="Edit this notice"
                      >
                        <Edit2 className="w-4 h-4" color={isDarkMode ? undefined : '#2B7CBF'} />
                      </button>
                      <button
                        onClick={() => onDeleteNotice && onDeleteNotice(notice.id)}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/notice:scale-110 ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-200/50 text-red-600 hover:bg-red-300/50'}`}
                        title="Delete this notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm text-center py-6 ${isDarkMode ? 'text-slate-400' : 'text-[#2B7CBF]/60'}`}>
                No notices yet. Click "Add Notice" to create one.
              </p>
            )}
          </div>
        </div>

        {/* SECTION 3: Emergency Alerts */}
        <div className={`group relative overflow-hidden rounded-xl lg:rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-red-500/20 hover:border-red-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-red-500/20' : 'bg-gradient-to-br from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200/50 hover:border-red-300/80 hover:shadow-lg hover:shadow-red-200/50'}`}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-red-500/5 to-transparent' : 'bg-gradient-to-br from-red-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
              <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wider flex items-center ${isDarkMode ? 'text-red-300 group-hover:text-red-200' : 'text-red-600 group-hover:text-red-700'} transition-colors`}>
                <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-200 text-red-600'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span>Emergency Alerts</span>
              </h2>
              <button
                onClick={() => setShowAddAlert(!showAddAlert)}
                className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 group/btn ${isDarkMode ? 'bg-red-500/30 text-red-200 hover:bg-red-500/50 border border-red-400/50 hover:border-red-300/80 hover:shadow-lg hover:shadow-red-500/30' : 'bg-red-500/20 text-red-700 hover:bg-red-500/30 border border-red-300/50 hover:border-red-400/80 hover:shadow-lg hover:shadow-red-200/50'} w-full sm:w-auto`}
              >
                <Plus className="w-4 h-4 flex-shrink-0 transition-transform group-hover/btn:rotate-90" />
                <span>Add Alert</span>
              </button>
            </div>

            {showAddAlert && (
              <div className={`mb-4 p-4 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border border-red-500/30 backdrop-blur-sm' : 'bg-red-100/50 border border-red-200/80 backdrop-blur-sm'}`}>
                <textarea
                  value={newAlertMessage}
                  onChange={(e) => setNewAlertMessage(e.target.value)}
                  placeholder="Emergency alert message..."
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${isDarkMode ? 'bg-slate-700/60 text-white placeholder-slate-400 border border-slate-600/50 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/30' : 'bg-white text-gray-900 placeholder-gray-400 border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-300/50'} focus:outline-none`}
                  rows={3}
                />
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <button
                    onClick={saveAlert}
                    disabled={!newAlertMessage.trim()}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!newAlertMessage.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 hover:shadow-lg hover:shadow-green-500/30' : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 hover:shadow-lg hover:shadow-green-300/50'}`}
                  >
                    Save Alert
                  </button>
                  <button
                    onClick={() => {
                      setShowAddAlert(false);
                      setNewAlertMessage('');
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 hover:text-white border border-slate-600/50' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 border border-gray-300/50'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {emergencyAlerts.length === 0 ? (
              <p className={`text-sm text-center py-6 ${isDarkMode ? 'text-slate-400' : 'text-red-600/60'}`}>
                No active emergency alerts
              </p>
            ) : (
              <div className="space-y-3">
                {emergencyAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`group/alert p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all duration-300 backdrop-blur-sm ${
                      alert.status === 'ACTIVE'
                        ? isDarkMode
                          ? 'bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20'
                          : 'bg-red-200/30 border border-red-300/60 hover:bg-red-200/50 hover:border-red-400/80 hover:shadow-lg hover:shadow-red-200/30'
                        : isDarkMode
                        ? 'bg-slate-700/20 border border-slate-600/40 opacity-60 hover:opacity-80'
                        : 'bg-gray-200/30 border border-gray-300/40 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium break-words ${isDarkMode ? 'text-red-200' : 'text-red-700'}`}>{alert.message}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${alert.status === 'ACTIVE' ? (isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-200 text-green-700') : (isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600')}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${alert.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} mr-1`}></span>
                          {alert.status === 'ACTIVE' ? 'LIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAlertStatus(alert.id)}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/alert:scale-110 ${
                          isDarkMode 
                            ? `${alert.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'}`
                            : `${alert.status === 'ACTIVE' ? 'bg-green-200 text-green-600 hover:bg-green-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`
                        }`}
                        title={alert.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {alert.status === 'ACTIVE' ? <AlertCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/alert:scale-110 ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-200/50 text-red-600 hover:bg-red-300/50'}`}
                        title="Delete alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Emergency Links */}
        <div className={`group relative overflow-hidden rounded-xl lg:rounded-2xl transition-all duration-300 ${isDarkMode ? 'bg-gradient-to-br from-slate-700/40 to-slate-800/40 backdrop-blur-xl border border-blue-500/20 hover:border-blue-400/40 hover:from-slate-700/60 hover:to-slate-800/60 hover:shadow-lg hover:shadow-blue-500/20' : 'bg-gradient-to-br from-blue-50/80 to-blue-100/80 backdrop-blur-xl border border-blue-200/50 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-200/50'}`}>
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/5 to-transparent' : 'bg-gradient-to-br from-blue-400/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          <div className="relative z-10 p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
              <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wider flex items-center ${isDarkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-blue-600 group-hover:text-blue-700'} transition-colors`}>
                <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-200 text-blue-600'}`}>
                  <LinkIcon className="w-5 h-5" />
                </div>
                <span>Important Links</span>
              </h2>
              <button
                onClick={() => setShowAddLink(!showAddLink)}
                className={`flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 group/btn ${isDarkMode ? 'bg-blue-500/30 text-blue-200 hover:bg-blue-500/50 border border-blue-400/50 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/30' : 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30 border border-blue-300/50 hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-200/50'} w-full sm:w-auto`}
              >
                <Plus className="w-4 h-4 flex-shrink-0 transition-transform group-hover/btn:rotate-90" />
                <span>Add Link</span>
              </button>
            </div>

            {showAddLink && (
              <div className={`mb-4 p-4 rounded-lg space-y-3 transition-all duration-300 ${isDarkMode ? 'bg-slate-800/50 border border-blue-500/30 backdrop-blur-sm' : 'bg-blue-100/50 border border-blue-200/80 backdrop-blur-sm'}`}>
                <input
                  type="text"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Link title..."
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${isDarkMode ? 'bg-slate-700/60 text-white placeholder-slate-400 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30' : 'bg-white text-gray-900 placeholder-gray-400 border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/50'} focus:outline-none`}
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all ${isDarkMode ? 'bg-slate-700/60 text-white placeholder-slate-400 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30' : 'bg-white text-gray-900 placeholder-gray-400 border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-300/50'} focus:outline-none`}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={saveLink}
                    disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!newLinkTitle.trim() || !newLinkUrl.trim() ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 hover:shadow-lg hover:shadow-green-500/30' : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 hover:shadow-lg hover:shadow-green-300/50'}`}
                  >
                    Save Link
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLink(false);
                      setNewLinkTitle('');
                      setNewLinkUrl('');
                    }}
                    className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 hover:text-white border border-slate-600/50' : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700 border border-gray-300/50'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {emergencyLinks.length === 0 ? (
              <p className={`text-sm text-center py-6 ${isDarkMode ? 'text-slate-400' : 'text-blue-600/60'}`}>
                No emergency links
              </p>
            ) : (
              <div className="space-y-3">
                {emergencyLinks.map(link => (
                  <div
                    key={link.id}
                    className={`group/link p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-start gap-3 transition-all duration-300 backdrop-blur-sm ${
                      link.status === 'ACTIVE'
                        ? isDarkMode
                          ? 'bg-blue-500/15 border border-blue-500/40 hover:bg-blue-500/25 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/20'
                          : 'bg-blue-200/30 border border-blue-300/60 hover:bg-blue-200/50 hover:border-blue-400/80 hover:shadow-lg hover:shadow-blue-200/30'
                        : isDarkMode
                        ? 'bg-slate-700/20 border border-slate-600/40 opacity-60 hover:opacity-80'
                        : 'bg-gray-200/30 border border-gray-300/40 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm break-words ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>{link.title}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs sm:text-sm font-medium hover:underline break-all block mt-2 transition-colors ${isDarkMode ? 'text-blue-300/80 hover:text-blue-200' : 'text-blue-600/80 hover:text-blue-700'}`}
                      >
                        {link.url}
                      </a>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${link.status === 'ACTIVE' ? (isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-200 text-green-700') : (isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600')}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${link.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'} mr-1`}></span>
                          {link.status === 'ACTIVE' ? 'LIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => toggleLinkStatus(link.id)}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/link:scale-110 ${
                          isDarkMode 
                            ? `${link.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'}`
                            : `${link.status === 'ACTIVE' ? 'bg-green-200 text-green-600 hover:bg-green-300' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`
                        }`}
                        title={link.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteLink(link.id)}
                        className={`p-2.5 rounded-lg transition-all duration-300 group-hover/link:scale-110 ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-200/50 text-red-600 hover:bg-red-300/50'}`}
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Google Drive Manager */}
        <div className={`rounded-xl lg:rounded-2xl shadow-xl border backdrop-blur-sm p-4 sm:p-5 lg:p-6 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' 
            : 'bg-gradient-to-br from-orange-50 via-white to-pink-50 border-orange-200'
        }`}>
          <DriveManager isDarkMode={isDarkMode} />
        </div>

        {/* SECTION 6: Course Management (Collapsed) */}
        <div className={`rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-6`}>
          <button
            onClick={() => toggleSection('courseManagement')}
            className="w-full flex items-center justify-between"
          >
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              📚 Course Management
            </h2>
            {expandedSections.courseManagement ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.courseManagement && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Course management features available here (hidden for future use)
              </p>
            </div>
          )}
        </div>

        {/* SECTION 7: Material Upload (Collapsed) */}
        <div className={`rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-6`}>
          <button
            onClick={() => toggleSection('materialUpload')}
            className="w-full flex items-center justify-between"
          >
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              📤 Material Upload
            </h2>
            {expandedSections.materialUpload ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
          {expandedSections.materialUpload && (
            <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Material upload features available here (hidden for future use)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
