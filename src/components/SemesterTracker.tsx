import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Target, Users, GraduationCap, TrendingUp, Timer } from 'lucide-react';
import { getCurrentSemesterStatus } from '../config/semester';
import { MID_TERM_SCHEDULE, getTodaysExam, getUpcomingExam, getNextExamCountdown } from '../config/examSchedule';
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
  const [nextExam, setNextExam] = useState(getNextExamCountdown());
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
      setNextExam(getNextExamCountdown(now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const todaysExam = getTodaysExam(currentTime);
  const upcomingExam = getUpcomingExam(currentTime);
  
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
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover-lift text-sm sm:text-base flex-shrink-0 shadow-lg"
            >
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
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
              ? 'bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-purple-800/40 border border-indigo-700/50'
              : 'bg-gradient-to-br from-indigo-100 via-purple-50 to-purple-100 border border-indigo-300'
          }`}>
              <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-6 w-6 text-indigo-600" />
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
                  }`}>{new Date(semesterStatus.currentPhase === 'Regular Classes' ? '2026-01-01' : '2026-01-01').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
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
                  }`}>Feb 17-24, 2026</div>
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
                  <div className={`text-sm ${isDarkMode ? 'text-purple-200' : 'text-purple-600'}`}>Apr 23-30, 2026</div>
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Calendar Section */}
        <div className={`rounded-2xl p-6 mb-8 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-purple-800/40 border border-purple-700/50'
            : 'bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 border border-purple-300'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-slate-800'
              }`}>Academic Calendar</h2>
              <p className={`text-sm transition-colors duration-300 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-700'
              }`}>Spring 2026 - Key Dates & Events</p>
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
              new Date() < new Date('2026-01-01')
                ? isDarkMode ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-01-01')
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
                    January 1, 2026 (Wednesday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Orientation and start of Spring Semester
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-01-14')
                ? isDarkMode ? 'bg-orange-900/30 border-orange-700/50' : 'bg-orange-50 border-orange-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-01-14')
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
                    January 14, 2026 (Wednesday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Last day for course changes
                  </div>
                </div>
              </div>
            </div>

            {/* Mid-term Period */}
            <div className={`p-4 rounded-xl border transition-all ${
              semesterStatus.isMidtermPeriod
                ? isDarkMode ? 'bg-red-900/30 border-red-700/50 ring-2 ring-red-500/50' : 'bg-red-50 border-red-200 ring-2 ring-red-400/50'
                : new Date() < new Date('2026-02-17')
                  ? isDarkMode ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200'
                  : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  semesterStatus.isMidtermPeriod
                    ? 'bg-red-600 text-white animate-pulse'
                    : new Date() < new Date('2026-02-17')
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
                    February 17-24, 2026 (8 days)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Preparatory leave: Feb 16
                  </div>
                </div>
              </div>
            </div>

            {/* Mid-term Results */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-03-11')
                ? isDarkMode ? 'bg-indigo-900/30 border-indigo-700/50' : 'bg-indigo-50 border-indigo-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-03-11')
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
                    March 11, 2026 (Wednesday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Deadline for faculty to submit grades
                  </div>
                </div>
              </div>
            </div>

            {/* Final Examinations */}
            <div className={`p-4 rounded-xl border transition-all ${
              semesterStatus.isFinalPeriod
                ? isDarkMode ? 'bg-purple-900/30 border-purple-700/50 ring-2 ring-purple-500/50' : 'bg-purple-50 border-purple-200 ring-2 ring-purple-400/50'
                : new Date() < new Date('2026-04-23')
                  ? isDarkMode ? 'bg-purple-900/30 border-purple-700/50' : 'bg-purple-50 border-purple-200'
                  : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  semesterStatus.isFinalPeriod
                    ? 'bg-purple-600 text-white animate-pulse'
                    : new Date() < new Date('2026-04-23')
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
                    April 23-30, 2026 (8 days)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Preparatory leave: Apr 22
                  </div>
                </div>
              </div>
            </div>

            {/* Final Results */}
            <div className={`p-4 rounded-xl border transition-all ${
              new Date() < new Date('2026-05-04')
                ? isDarkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200'
                : isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  new Date() < new Date('2026-05-04')
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
                    May 4, 2026 (Monday)
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Spring 2026 semester results
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
                    May 5, 2026 onwards
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Summer 2026 starts: June 6
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className={`mt-6 p-4 rounded-xl border ${
            isDarkMode
              ? 'bg-purple-900/20 border-purple-700/50'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <div className={`text-xs font-semibold mb-2 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-700'
            }`}>📌 Important Notes:</div>
            <ul className={`text-xs space-y-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <li>• Payment deadlines: 1st installment (Jan 1-14), 2nd installment (Feb 1-12), Final (Apr 1-16)</li>
              <li>• Sports Week: April 1-7 | Research Showcase: April 15-21</li>
              <li>• Teachers Evaluation: April 12-18</li>
              <li>• Some holiday dates marked with * are subject to moon appearance</li>
            </ul>
          </div>
        </div>

        {/* Today's/Upcoming Exam Alert with Countdown */}
        {(todaysExam || upcomingExam || nextExam) && (
          <div className={`${todaysExam?.isCompleted ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-gradient-to-r from-red-600 to-red-500'} rounded-2xl p-6 mb-8 border ${todaysExam?.isCompleted ? 'border-green-400' : 'border-red-400'} border-opacity-30 shadow-xl`}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Timer className="h-6 w-6 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {todaysExam ? (todaysExam.isCompleted ? '✅ EXAM COMPLETED TODAY!' : '🚨 EXAM TODAY!') : nextExam?.countdown.isToday ? '🚨 EXAM TODAY!' : '📅 Next Exam'}
              </h2>
            </div>

            {todaysExam ? (
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className={`${todaysExam.isCompleted ? 'text-green-100' : 'text-red-100'} text-sm`}>Course</div>
                    <div className="text-white text-lg font-bold">{todaysExam.courseCode}</div>
                  </div>
                  <div>
                    <div className={`${todaysExam.isCompleted ? 'text-green-100' : 'text-red-100'} text-sm`}>Teacher</div>
                    <div className="text-white font-semibold">{todaysExam.teacher}</div>
                  </div>
                  <div>
                    <div className={`${todaysExam.isCompleted ? 'text-green-100' : 'text-red-100'} text-sm`}>Time & Room</div>
                    <div className="text-white font-semibold">{todaysExam.time}</div>
                    <div className={`${todaysExam.isCompleted ? 'text-green-200' : 'text-red-200'} text-sm`}>Room {todaysExam.room}</div>
                  </div>
                </div>
                {todaysExam.isCompleted && (
                  <div className="mt-4 text-center">
                    <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold bg-green-500/40 text-green-100">
                      🎉 Exam completed successfully! Well done!
                    </div>
                  </div>
                )}
              </div>
            ) : nextExam ? (
              <div className="space-y-4">
                {/* Course Info */}
                <div className="bg-white bg-opacity-10 rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-red-100 text-sm">Course</div>
                      <div className="text-white text-lg font-bold">{nextExam.courseCode}</div>
                    </div>
                    <div>
                      <div className="text-red-100 text-sm">Date & Teacher</div>
                      <div className="text-white font-semibold">{nextExam.day}, {nextExam.date.split('-').reverse().join('/')}</div>
                      <div className="text-red-200 text-sm">Teacher: {nextExam.teacher}</div>
                    </div>
                    <div>
                      <div className="text-red-100 text-sm">Time & Room</div>
                      <div className="text-white font-semibold">{nextExam.time}</div>
                      <div className="text-red-200 text-sm">Room {nextExam.room}</div>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="bg-white bg-opacity-10 rounded-xl p-4">
                  <div className="text-center mb-4">
                    <div className="text-red-100 text-sm mb-2">Time Remaining</div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {nextExam.countdown.days}
                      </div>
                      <div className="text-red-200 text-xs font-semibold">Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {nextExam.countdown.hours}
                      </div>
                      <div className="text-red-200 text-xs font-semibold">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {nextExam.countdown.minutes}
                      </div>
                      <div className="text-red-200 text-xs font-semibold">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white animate-pulse">
                        {nextExam.countdown.seconds}
                      </div>
                      <div className="text-red-200 text-xs font-semibold">Seconds</div>
                    </div>
                  </div>

                  {/* Status Message */}
                  {(nextExam.countdown.isCritical || nextExam.countdown.isUrgent) && (
                    <div className="mt-4 text-center">
                      <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/40 text-red-100">
                        {nextExam.countdown.isCritical && '⚡ Critical: Exam starting very soon!'}
                        {nextExam.countdown.isUrgent && !nextExam.countdown.isCritical && '⚠️ Urgent: Exam within 24 hours!'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : upcomingExam && (
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-red-100 text-sm">Course</div>
                    <div className="text-white text-lg font-bold">{upcomingExam.courseCode}</div>
                  </div>
                  <div>
                    <div className="text-red-100 text-sm">Date & Teacher</div>
                    <div className="text-white font-semibold">{upcomingExam.day} ({upcomingExam.teacher})</div>
                  </div>
                  <div>
                    <div className="text-red-100 text-sm">Days Left</div>
                    <div className="text-white text-xl font-bold">{upcomingExam.daysUntil} days</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mid-term Schedule - Only show during final exam period */}
        {semesterStatus.isFinalPeriod && (
        <div className={`rounded-2xl p-6 hover-lift shadow-lg transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-teal-800/40 border border-emerald-700/50'
            : 'bg-gradient-to-br from-emerald-100 via-teal-50 to-teal-100 border border-emerald-300'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-emerald-600" />
            <h2 className={`text-xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-gray-100' : 'text-slate-800'
            }`}>Final Examination Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className={`border-b transition-colors duration-300 ${
                  isDarkMode ? 'border-emerald-700/50' : 'border-slate-200'
                }`}>
                  <th className={`text-left py-3 px-4 font-semibold min-w-[100px] transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-300' : 'text-slate-700'
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
                      isDarkMode ? 'border-emerald-700/30' : 'border-slate-100'
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