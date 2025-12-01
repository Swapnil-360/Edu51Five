import React, { useState, useEffect } from 'react';
import { Bell, Plus, ChevronDown, ChevronUp, AlertCircle, Link as LinkIcon, Trash2, Edit2 } from 'lucide-react';
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      {/* Header Section */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1.5 sm:mt-2 text-sm sm:text-base`}>
            Manage notices, emergencies, and view platform statistics
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* SECTION 1: Quick Stats Dashboard */}
        <div>
          <h2 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            📊 Platform Statistics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Courses Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Courses</p>
                <p className="text-2xl sm:text-3xl font-bold">{coursesCount}</p>
                <div className="text-xl sm:text-2xl opacity-50">📚</div>
              </div>
            </div>

            {/* Files Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <p className="text-emerald-100 text-xs sm:text-sm font-medium">Total Files</p>
                <p className="text-2xl sm:text-3xl font-bold">{materialsCount}</p>
                <div className="text-xl sm:text-2xl opacity-50">📁</div>
              </div>
            </div>

            {/* Online Users Card - Real-time */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
              {/* Live indicator animation */}
              <div className="absolute top-3 right-3">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <div className="flex items-center space-x-2">
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Online Users</p>
                  <span className="text-[10px] bg-green-400 text-green-900 px-1.5 py-0.5 rounded-full font-semibold">LIVE</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{onlineUsers}</p>
                <div className="flex items-center space-x-1.5 text-purple-100 text-xs">
                  <span className="opacity-75">Active now</span>
                  <span className="opacity-50">•</span>
                  <span className="opacity-75">Updates every 10s</span>
                </div>
              </div>
              
              {/* Decorative pulse effect */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            {/* Semester Progress Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 sm:p-5 lg:p-6 rounded-xl lg:rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col space-y-1.5 sm:space-y-2">
                <p className="text-orange-100 text-xs sm:text-sm font-medium">Semester Progress</p>
                <p className="text-2xl sm:text-3xl font-bold">Week {currentWeek}</p>
                <p className="text-orange-100 text-xs sm:text-sm">{semesterProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Notice Management (PRIMARY) */}
        <div className={`rounded-xl lg:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-5 lg:p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className={`text-base sm:text-lg font-semibold flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <Bell className="w-5 h-5 mr-2 text-blue-500" />
              <span>Notices</span>
            </h2>
            <button
              onClick={onCreateNotice}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Notice</span>
            </button>
          </div>

          {/* Existing Notices from Database */}
          {notices.length > 0 ? (
            <div className={`space-y-2 sm:space-y-3 max-h-80 overflow-y-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isDarkMode
                      ? `border-gray-600 ${notice.is_active ? 'bg-gray-700/50' : 'bg-gray-800/30'}`
                      : `border-gray-200 ${notice.is_active ? 'bg-blue-50' : 'bg-gray-50'}`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <p className={`font-semibold text-sm break-words ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {notice.title || notice.id}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            notice.is_active
                              ? isDarkMode
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-green-100 text-green-700'
                              : isDarkMode
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {notice.is_active ? '🟢 Active' : '⚫ Inactive'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notice.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={onEditNotice}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                        }`}
                        title="Edit this notice"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => onDeleteNotice && onDeleteNotice(notice.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode ? 'hover:bg-red-900/50' : 'hover:bg-red-50'
                        }`}
                        title="Delete this notice"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-3 sm:pt-4`}>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-3 sm:py-4`}>
                No notices yet. Click "Add Notice" to create one.
              </p>
            </div>
          )}
        </div>

        {/* SECTION 3: Emergency Alerts */}
        <div className={`rounded-xl lg:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-5 lg:p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className={`text-base sm:text-lg font-semibold flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              <span>Emergency Alerts</span>
            </h2>
            <button
              onClick={() => setShowAddAlert(!showAddAlert)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Alert</span>
            </button>
          </div>

          {showAddAlert && (
            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <textarea
                value={newAlertMessage}
                onChange={(e) => setNewAlertMessage(e.target.value)}
                placeholder="Emergency alert message..."
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                rows={3}
              />
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button
                  onClick={saveAlert}
                  disabled={!newAlertMessage.trim()}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Alert
                </button>
                <button
                  onClick={() => {
                    setShowAddAlert(false);
                    setNewAlertMessage('');
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {emergencyAlerts.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
              No active emergency alerts
            </p>
          ) : (
            <div className="space-y-3">
              {emergencyAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all ${
                    alert.status === 'ACTIVE'
                      ? isDarkMode
                        ? 'bg-red-900/30 border border-red-500/50'
                        : 'bg-red-100 border border-red-300'
                      : isDarkMode
                      ? 'bg-gray-700/30'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} break-words`}>{alert.message}</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status: <span className={alert.status === 'ACTIVE' ? 'text-green-500 font-medium' : 'text-gray-500'}>{alert.status}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => toggleAlertStatus(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title={alert.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      <span className="text-base">{alert.status === 'ACTIVE' ? '✓' : '○'}</span>
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-900' : 'hover:bg-red-100'}`}
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 4: Emergency Links */}
        <div className={`rounded-xl lg:rounded-2xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 sm:p-5 lg:p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <h2 className={`text-base sm:text-lg font-semibold flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <LinkIcon className="w-5 h-5 mr-2 text-blue-500" />
              <span>Emergency Links</span>
            </h2>
            <button
              onClick={() => setShowAddLink(!showAddLink)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Add Link</span>
            </button>
          </div>

          {showAddLink && (
            <div className={`mb-4 p-4 rounded-lg space-y-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <input
                type="text"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Link title..."
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className={`w-full px-3 py-2 rounded-lg text-sm ${isDarkMode ? 'bg-gray-600 text-white placeholder-gray-400' : 'bg-white text-gray-900'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={saveLink}
                  disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Link
                </button>
                <button
                  onClick={() => {
                    setShowAddLink(false);
                    setNewLinkTitle('');
                    setNewLinkUrl('');
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {emergencyLinks.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center py-4`}>
              No emergency links
            </p>
          ) : (
            <div className="space-y-3">
              {emergencyLinks.map(link => (
                <div
                  key={link.id}
                  className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-start gap-3 transition-all ${
                    isDarkMode
                      ? link.status === 'ACTIVE'
                        ? 'bg-gray-700 border border-blue-500/30'
                        : 'bg-gray-700/50 opacity-60'
                      : link.status === 'ACTIVE'
                      ? 'bg-gray-50 border border-blue-200'
                      : 'bg-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} break-words`}>{link.title}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs sm:text-sm hover:underline break-all block mt-1"
                    >
                      {link.url}
                    </a>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status: <span className={link.status === 'ACTIVE' ? 'text-green-500 font-medium' : 'text-gray-500'}>{link.status}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => toggleLinkStatus(link.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                      }`}
                      title={link.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      <span className="text-base">{link.status === 'ACTIVE' ? '✓' : '○'}</span>
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-red-900' : 'hover:bg-red-100'}`}
                      title="Delete link"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
