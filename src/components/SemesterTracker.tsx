import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Target, Users, GraduationCap, TrendingUp, Timer } from 'lucide-react';
import { getCurrentSemesterStatus } from '../config/semester';
import { MID_TERM_SCHEDULE, getTodaysExam, getUpcomingExam, getNextExamCountdown } from '../config/examSchedule';

interface SemesterTrackerProps {
  onClose?: () => void;
}

const SemesterTracker: React.FC<SemesterTrackerProps> = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [semesterStatus, setSemesterStatus] = useState(getCurrentSemesterStatus());
  const [nextExam, setNextExam] = useState(getNextExamCountdown());
  
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      <div className="h-full overflow-y-auto p-2 sm:p-4">
        {/* Enhanced Mobile-Responsive Header */}
        <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8 p-2 sm:p-0">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0 flex-1">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-lg sm:rounded-xl hover-lift flex-shrink-0 shadow-sm border border-blue-300">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 truncate">Semester Tracker</h1>
              <p className="text-slate-600 text-xs sm:text-sm md:text-base hidden sm:block">BUBT Intake 51 - Section 5</p>
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
        <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 rounded-2xl p-6 mb-8 hover-lift shadow-lg border border-blue-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
              <div>
                <div className="text-2xl font-bold text-slate-800">{formatTime(currentTime)} BST</div>
                <div className="text-slate-600">{formatDate(currentTime)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-slate-800">Week {semesterStatus.semesterWeek}</div>
              <div className="text-slate-600">of {semesterStatus.semesterName}</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Semester Progress */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-100 via-blue-50 to-blue-100 rounded-2xl p-6 hover-lift shadow-lg border border-slate-300">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Semester Progress</h2>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Overall Progress</span>
                <span className="text-slate-800 font-bold">{semesterStatus.progressPercentage}%</span>
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
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 hover-lift border border-blue-300 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-700">Current Phase</span>
                </div>
                <div className="text-xl font-bold text-slate-800">{semesterStatus.currentPhase}</div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl p-4 hover-lift border border-indigo-300 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  <span className="text-indigo-700">Next Milestone</span>
                </div>
                <div className="text-xl font-bold text-slate-800">{semesterStatus.nextMilestone}</div>
                <div className="text-sm text-indigo-600 mt-1">
                  {semesterStatus.daysToMilestone > 0 
                    ? `${semesterStatus.daysToMilestone} days remaining`
                    : 'Active now'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Academic Timeline */}
          <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-purple-100 rounded-2xl p-6 hover-lift shadow-lg border border-indigo-300">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-800">Timeline</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-semibold text-green-700">Semester Started</div>
                  <div className="text-sm text-green-600">July 15, 2025</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                semesterStatus.currentPhase === 'Mid-term Examinations' 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div>
                  <div className={`font-semibold ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-700' : 'text-blue-700'
                  }`}>Mid-term Exams</div>
                  <div className={`text-sm ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-600' : 'text-blue-600'
                  }`}>Sept 14-24, 2025</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  semesterStatus.currentPhase === 'Mid-term Examinations' 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-blue-500'
                }`}></div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <div className="font-semibold text-purple-700">Final Exams</div>
                  <div className="text-sm text-purple-600">Dec 1-15, 2025</div>
                </div>
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
            </div>
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

        {/* Mid-term Schedule */}
        <div className="bg-gradient-to-br from-emerald-100 via-teal-50 to-teal-100 rounded-2xl p-6 hover-lift shadow-lg border border-emerald-300">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Mid-term Examination Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 min-w-[100px]">Course</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 min-w-[120px]">Date & Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 min-w-[80px]">Teacher</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 min-w-[100px]">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700 min-w-[80px]">Status</th>
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
                  let statusColor = 'text-blue-600';
                  let bgColor = 'bg-blue-50';
                  
                  if (examDate < today) {
                    status = 'Completed';
                    statusColor = 'text-green-600';
                    bgColor = 'bg-green-50';
                  } else if (examDate.getTime() === today.getTime()) {
                    // Check if exam time has passed (exam ends at 11:30 AM)
                    const examEndTime = new Date();
                    examEndTime.setHours(11, 30, 0, 0); // 11:30 AM
                    
                    if (currentTime >= examEndTime) {
                      status = 'Completed Today';
                      statusColor = 'text-green-600';
                      bgColor = 'bg-green-50';
                    } else {
                      status = 'Today';
                      statusColor = 'text-red-600';
                      bgColor = 'bg-red-50';
                    }
                  }

                  return (
                    <tr key={courseCode} className={`${bgColor} border-b border-slate-100`}>
                      <td className="py-3 px-4 font-semibold text-slate-800">{courseCode}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{exam.date.split('-').reverse().join('/')}</div>
                        <div className="text-slate-600 text-sm">{exam.day}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{exam.teacher}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 text-sm">{exam.time}</div>
                        <div className="text-slate-600 text-xs">Room {exam.room}</div>
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
        </div>
      </div>
    </div>
  );
};

export default SemesterTracker;