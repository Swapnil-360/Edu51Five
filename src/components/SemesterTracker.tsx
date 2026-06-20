import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Target, Users, GraduationCap, TrendingUp, ArrowLeft, CreditCard, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { getCurrentSemesterStatus } from '../config/semester';
import { MID_TERM_SCHEDULE } from '../config/examSchedule';
import { 
  getCurrentSchedule, 
  getRoutineTitle, 
  getRoutineDescription, 
  getTodaysSchedule, 
  getNextClass, 
  getWeeklyClassSummary,
  getCurrentClassStatus,
  formatTimeRemaining,
  areTodaysClassesFinished,
  getNextDaySchedule
} from '../config/classRoutine';

interface SemesterTrackerProps {
  onClose?: () => void;
  isDarkMode?: boolean;
}

const SemesterTracker: React.FC<SemesterTrackerProps> = ({ onClose, isDarkMode = false }) => {
  function makeDayKey(schedule: { day: string; date?: string }) {
    return schedule.date ? `${schedule.day}-${schedule.date}` : schedule.day;
  }

  const [currentTime, setCurrentTime] = useState(new Date());
  const [semesterStatus, setSemesterStatus] = useState(getCurrentSemesterStatus());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedule = getCurrentSchedule();
    const todayName = dayNames[new Date().getDay()];
    const todayEntry = schedule.find(day => day.day === todayName);
    const defaultKey = todayEntry ? makeDayKey(todayEntry) : todayName;
    return new Set([defaultKey]);
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentSchedule = getCurrentSchedule();
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSemesterStatus(getCurrentSemesterStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper functions for collapsible schedule
  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const expandAllDays = () => {
    const allKeys = getCurrentSchedule().map(makeDayKey);
    setExpandedDays(new Set(allKeys));
  };

  const collapseAllDays = () => {
    const schedule = getCurrentSchedule();
    const todayName = dayNames[new Date().getDay()];
    const todayEntry = schedule.find(day => day.day === todayName);
    const todayKey = todayEntry ? makeDayKey(todayEntry) : todayName;
    setExpandedDays(new Set([todayKey]));
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-BD', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <div className="h-full overflow-y-auto p-2 sm:p-4">
        {/* Enhanced Mobile-Responsive Header */}
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 p-2 sm:p-0">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
            {onClose && (
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${
                  isDarkMode 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl hover-lift flex-shrink-0 shadow-sm transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-900 to-indigo-900 border border-blue-700'
                : 'bg-gradient-to-br from-blue-200 to-indigo-200 border border-blue-300'
            }`}>
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-xl sm:text-2xl md:text-3xl font-bold truncate transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Semester Tracker</h1>
              <p className={`text-xs sm:text-sm md:text-base hidden sm:block transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>BUBT Intake 51 - All Sections</p>
            </div>
          </div>
        </div>

        {/* Live Clock */}
        <div className={`rounded-2xl p-6 mb-8 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-blue-900/50 via-blue-800/50 to-indigo-900/50 border border-blue-700/50'
            : 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 border border-blue-300'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
              <div>
                <div className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-slate-800'
                }`}>{formatTime(currentTime)} BST</div>
                <div className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>{formatDate(currentTime)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Week {semesterStatus.semesterWeek}</div>
              <div className={`transition-colors duration-300 ${
                isDarkMode ? 'text-gray-400' : 'text-slate-600'
              }`}>of {semesterStatus.semesterName}</div>
            </div>
          </div>
        </div>

        {/* Semester Deadlines & Key Events */}
        <div className={`rounded-2xl p-6 mb-8 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-800/40 border border-slate-700/50'
            : 'bg-slate-50/70 border border-slate-200'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className={`text-xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-slate-800'
            }`}>Semester Deadlines & Key Events</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Payment Deadlines */}
            <div className={`p-5 rounded-xl border transition-all duration-300 hover-lift shadow-sm ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : 'bg-white/90 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <h3 className={`font-semibold text-sm sm:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
                  Payment Installments
                </h3>
              </div>
              <ul className={`text-xs space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <li className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800/65">
                  <span className="font-medium">1st Installment</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>May 6 - 22</span>
                </li>
                <li className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200 dark:border-slate-800/65">
                  <span className="font-medium">2nd Installment</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>June 10 - 24</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-medium">Final Installment</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>Aug 6 - 19</span>
                </li>
              </ul>
            </div>

            {/* Special Events */}
            <div className={`p-5 rounded-xl border transition-all duration-300 hover-lift shadow-sm ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : 'bg-white/90 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className={`font-semibold text-sm sm:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
                  Special Events
                </h3>
              </div>
              <ul className={`text-xs space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <li className="pb-2 border-b border-dashed border-slate-200 dark:border-slate-800/65">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Club Member Collection</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>June 7 - 10</span>
                  </div>
                </li>
                <li className="">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Research Showcase</span>
                  </div>
                  <div className="flex justify-end mt-1">
                    <span className={`font-semibold text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>August 16 - 20</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Teacher Evaluation */}
            <div className={`p-5 rounded-xl border transition-all duration-300 hover-lift shadow-sm ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : 'bg-white/90 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <UserCheck className="h-5 w-5" />
                </div>
                <h3 className={`font-semibold text-sm sm:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
                  Teacher Evaluation
                </h3>
              </div>
              <div className={`text-xs space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                <p className="leading-relaxed font-medium">
                  The portal will be open for student feedback on BUBT faculty.
                </p>
                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800/65 flex justify-between items-center">
                  <span className="font-medium text-slate-500 dark:text-slate-400">Period:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>August 17 - 22</span>
                </div>
              </div>
            </div>

            {/* Important Remarks */}
            <div className={`p-5 rounded-xl border transition-all duration-300 hover-lift shadow-sm ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                : 'bg-white/90 border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className={`font-semibold text-sm sm:text-base transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
                  Important Remarks
                </h3>
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-slate-600'} space-y-2.5`}>
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    Some academic and holiday dates marked with <span className="font-bold text-blue-600">*</span> are subject to moon appearance.
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    Deadlines and schedules are subject to official BUBT administrative decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Semester Progress */}
          <div className={`lg:col-span-2 rounded-2xl p-6 hover-lift shadow-lg transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-800 border border-gray-700'
              : 'bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 border border-slate-300'
          }`}>
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Semester Progress</h2>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>Overall Progress</span>
                <span className={`${isDarkMode ? 'text-gray-100' : 'text-slate-800'} font-bold`}>{semesterStatus.progressPercentage}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-4 overflow-hidden progress-glow">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-out"
                  style={{ width: `${semesterStatus.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Current Phase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 hover-lift shadow-sm transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/50'
                  : 'bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-700'
                  }`}>Current Phase</span>
                </div>
                <div className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-slate-800'
                }`}>{semesterStatus.currentPhase}</div>
              </div>
              
              <div className={`rounded-xl p-4 hover-lift shadow-sm transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 border border-indigo-700/50'
                  : 'bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-300'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <span className={`transition-colors duration-300 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-700'
                  }`}>Next Milestone</span>
                </div>
                <div className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-100' : 'text-slate-800'
                }`}>{semesterStatus.nextMilestone}</div>
                <div className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  {semesterStatus.daysToMilestone > 0 
                    ? `${semesterStatus.daysToMilestone} days remaining`
                    : 'Active now'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Academic Timeline */}
          <div className={`rounded-2xl p-6 hover-lift shadow-lg transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-800 border border-gray-700'
              : 'bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 border border-slate-300'
          }`}>
              <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-6 w-6 text-blue-600" />
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Timeline</h2>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div>
                  <div className={`font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-green-400' : 'text-green-700'
                  }`}>Semester Started</div>
                  <div className={`text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-green-500' : 'text-green-600'
                  }`}>{new Date('2026-05-06').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-300 ${
                semesterStatus.currentPhase === 'Mid-term Examinations' 
                  ? isDarkMode
                    ? 'bg-red-900/30 border-red-700/50'
                    : 'bg-red-50 border-red-200'
                  : isDarkMode
                  ? 'bg-blue-900/30 border-blue-700/50'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div>
                  <div className={`font-semibold ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-700' : 'text-blue-700'
                  }`}>Mid-term Exams</div>
                  <div className={`text-sm ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-600' : 'text-blue-600'
                  }`}>Jun 25 - Jul 3, 2026</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  semesterStatus.currentPhase === 'Mid-term Examinations' 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-blue-500'
                }`}></div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-purple-900/30 border-purple-700/50'
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <div>
                  <div className={`font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Final Exams</div>
                  <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-600'}`}>Aug 22-30, 2026</div>
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Calendar Section */}
        <div className={`rounded-2xl p-6 mb-8 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-800 border border-gray-700'
            : 'bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 border border-slate-300'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Academic Calendar</h2>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-700'
              }`}>{semesterStatus.semesterName} - Key Dates & Events</p>
            </div>
          </div>

          {/* Current Phase Indicator */}
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            isDarkMode
              ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-600/50'
              : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className={`font-bold text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                  Current Phase: {semesterStatus.currentPhase}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                  {semesterStatus.daysToMilestone} days until {semesterStatus.nextMilestone}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Events Grid */}
          <div className="space-y-3">
            {/* Orientation & Classes Start */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-05-06')
                ? isDarkMode ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-05-06')
                    ? 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">🚀</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Classes Commence
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    May 6, 2026 (Wednesday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Orientation and start of Summer Semester
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-05-21')
                ? isDarkMode ? 'bg-orange-900/30 border-orange-700/50' : 'bg-orange-50 border-orange-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-05-21')
                    ? 'bg-orange-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">📝</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Add/Drop & Withdrawal Deadline
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    May 21, 2026 (Thursday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Last day for course add/drop and withdrawal changes
                  </div>
                </div>
              </div>
            </div>

            {/* Mid-term Period */}
            <div className={`p-4 rounded-xl border transition-all ${
              semesterStatus.isMidtermPeriod
                ? isDarkMode ? 'bg-red-900/30 border-red-700/50 ring-2 ring-red-500/50' : 'bg-red-50 border-red-200 ring-2 ring-red-400/50'
                : new Date() < new Date('2026-06-25')
                  ? isDarkMode ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                  : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  semesterStatus.isMidtermPeriod
                    ? 'bg-red-600 text-white animate-pulse'
                    : new Date() < new Date('2026-06-25')
                      ? 'bg-blue-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">📝</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Mid-term Examinations
                    {semesterStatus.isMidtermPeriod && (
                      <span className="ml-2 text-xs px-2 py-1 bg-red-500 text-white rounded-full">ONGOING</span>
                    )}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    June 25 - July 3, 2026 (9 days)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Preparatory leave: June 24
                  </div>
                </div>
              </div>
            </div>

            {/* Mid-term Results */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-07-26')
                ? isDarkMode ? 'bg-indigo-900/30 border-indigo-700/50' : 'bg-indigo-50 border-indigo-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-07-26')
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">📊</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Mid-term Results Submission
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    July 26, 2026 (Sunday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Deadline of submission of Midterm Examination Results
                  </div>
                </div>
              </div>
            </div>

            {/* Final Examinations */}
            <div className={`p-4 rounded-xl border transition-all ${
              semesterStatus.isFinalPeriod
                ? isDarkMode ? 'bg-purple-900/30 border-purple-700/50 ring-2 ring-purple-500/50' : 'bg-purple-50 border-purple-200 ring-2 ring-purple-400/50'
                : new Date() < new Date('2026-08-22')
                  ? isDarkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-purple-50 border-purple-200'
                  : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  semesterStatus.isFinalPeriod
                    ? 'bg-purple-600 text-white animate-pulse'
                    : new Date() < new Date('2026-08-22')
                      ? 'bg-purple-600 text-white'
                      : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">🎯</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Final Examinations
                    {semesterStatus.isFinalPeriod && (
                      <span className="ml-2 text-xs px-2 py-1 bg-purple-500 text-white rounded-full">ONGOING</span>
                    )}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    August 22-30, 2026 (9 days)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Preparatory leave: Aug 21
                  </div>
                </div>
              </div>
            </div>

            {/* Final Results */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-09-03')
                ? isDarkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-09-03')
                    ? 'bg-green-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                }`}>
                  <span className="text-lg">📢</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Final Results Publication
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    September 3, 2026 (Thursday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Summer 2026 semester results
                  </div>
                </div>
              </div>
            </div>

            {/* Semester Break */}
            <div className={`p-4 rounded-xl border transition-all ${
              semesterStatus.isBreak
                ? isDarkMode ? 'bg-teal-900/30 border-teal-700/50 ring-2 ring-teal-500/50' : 'bg-teal-50 border-teal-200 ring-2 ring-teal-400/50'
                : isDarkMode ? 'bg-teal-900/30 border-teal-700/50' : 'bg-teal-50 border-teal-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  semesterStatus.isBreak
                    ? 'bg-teal-600 text-white'
                    : 'bg-teal-600 text-white'
                }`}>
                  <span className="text-lg">🏖️</span>
                </div>
                <div className="flex-1">
                  <div className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    Semester Break
                    {semesterStatus.isBreak && (
                      <span className="ml-2 text-xs px-2 py-1 bg-teal-500 text-white rounded-full">ACTIVE</span>
                    )}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    September 4, 2026
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Fall 2026 starts: September 5
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>


        {/* Mid-term Schedule - Only show during final exam period */}
        {semesterStatus.isFinalPeriod && (
        <div className={`rounded-2xl p-6 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-800 border border-gray-700'
            : 'bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 border border-slate-300'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className={`text-xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-slate-800'
            }`}>Final Examination Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className={`border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[100px] transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-300' : 'text-slate-700'
                  }`}>Course</th>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[120px] transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-300' : 'text-slate-700'
                  }`}>Date & Day</th>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[80px] transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-300' : 'text-slate-700'
                  }`}>Teacher</th>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[100px] transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-300' : 'text-slate-700'
                  }`}>Time</th>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[80px] transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-300' : 'text-slate-700'
                  }`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MID_TERM_SCHEDULE).map(([courseCode, exam]) => {
                  const examDate = new Date(exam.date);
                  const today = new Date();
                  const currentTime = new Date();
                  
                  // Set time comparison for date only
                  today.setHours(0, 0, 0, 0);
                  examDate.setHours(0, 0, 0, 0);
                  
                  let status = 'Upcoming';
                  let statusColor = isDarkMode ? 'text-blue-400' : 'text-blue-600';
                  let bgColor = isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50';
                  
                  if (examDate < today) {
                    status = 'Completed';
                    statusColor = isDarkMode ? 'text-green-400' : 'text-green-600';
                    bgColor = isDarkMode ? 'bg-green-900/30' : 'bg-green-50';
                  } else if (examDate.getTime() === today.getTime()) {
                    // Check if exam time has passed (exam ends at 11:30 AM)
                    const examEndTime = new Date();
                    examEndTime.setHours(11, 30, 0, 0); // 11:30 AM
                    
                    if (currentTime >= examEndTime) {
                      status = 'Completed';
                      statusColor = isDarkMode ? 'text-green-400' : 'text-green-600';
                      bgColor = isDarkMode ? 'bg-green-900/30' : 'bg-green-50';
                    } else {
                      status = 'Today';
                      statusColor = isDarkMode ? 'text-red-400' : 'text-red-600';
                      bgColor = isDarkMode ? 'bg-red-900/30' : 'bg-red-50';
                    }
                  }

                  return (
                    <tr key={courseCode} className={`${bgColor} border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-slate-700/30' : 'border-slate-100'
                    }`}>
                      <td className={`py-3 px-4 font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-100' : 'text-slate-800'
                      }`}>{courseCode}</td>
                      <td className="py-3 px-4">
                        <div className={`transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{exam.date.split('-').reverse().join('/')}</div>
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>{exam.day}</div>
                      </td>
                      <td className={`py-3 px-4 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-slate-700'
                      }`}>{exam.teacher}</td>
                      <td className="py-3 px-4">
                        <div className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-100' : 'text-slate-800'
                        }`}>{exam.time}</div>
                        <div className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-slate-600'
                        }`}>Room {exam.room}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`${statusColor} font-semibold`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        </div>
      </div>
    </div>
  );
};

export default SemesterTracker;