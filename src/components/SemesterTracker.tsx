import React, { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Target, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { getCurrentSemesterStatus } from '../config/semester';
import { MID_TERM_SCHEDULE, getTodaysExam, getUpcomingExam } from '../config/examSchedule';

interface SemesterTrackerProps {
  onClose?: () => void;
}

const SemesterTracker: React.FC<SemesterTrackerProps> = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [semesterStatus, setSemesterStatus] = useState(getCurrentSemesterStatus());
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSemesterStatus(getCurrentSemesterStatus());
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
    <div className="min-h-screen semester-gradient p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 glass-card rounded-xl hover-lift">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Semester Tracker</h1>
              <p className="text-blue-200">BUBT Intake 51 - Section 5</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 glass-card hover:bg-opacity-20 text-white rounded-lg transition-all duration-200 hover-lift"
            >
              Back to Dashboard
            </button>
          )}
        </div>

        {/* Live Clock */}
        <div className="glass-card rounded-2xl p-6 mb-8 hover-lift">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="h-8 w-8 text-blue-200 animate-pulse" />
              <div>
                <div className="text-2xl font-bold text-white">{formatTime(currentTime)} BST</div>
                <div className="text-blue-200">{formatDate(currentTime)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-white">Week {semesterStatus.semesterWeek}</div>
              <div className="text-blue-200">of {semesterStatus.semesterName}</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Semester Progress */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 hover-lift">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-bold text-white">Semester Progress</h2>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blue-200">Overall Progress</span>
                <span className="text-white font-bold">{semesterStatus.progressPercentage}%</span>
              </div>
              <div className="w-full bg-blue-800 bg-opacity-50 rounded-full h-4 overflow-hidden progress-glow">
                <div 
                  className="h-full semester-progress-bar transition-all duration-1000 ease-out"
                  style={{ width: `${semesterStatus.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Current Phase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-blue-800 bg-opacity-30 rounded-xl p-4 hover-lift">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="h-5 w-5 text-blue-300" />
                  <span className="text-blue-200">Current Phase</span>
                </div>
                <div className="text-xl font-bold text-white">{semesterStatus.currentPhase}</div>
              </div>
              
              <div className="bg-blue-800 bg-opacity-30 rounded-xl p-4 hover-lift">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-5 w-5 text-blue-300" />
                  <span className="text-blue-200">Next Milestone</span>
                </div>
                <div className="text-xl font-bold text-white">{semesterStatus.nextMilestone}</div>
                <div className="text-sm text-blue-300 mt-1">
                  {semesterStatus.daysToMilestone > 0 
                    ? `${semesterStatus.daysToMilestone} days remaining`
                    : 'Active now'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Academic Timeline */}
          <div className="glass-card rounded-2xl p-6 hover-lift">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="h-6 w-6 text-blue-300" />
              <h2 className="text-xl font-bold text-white">Timeline</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-500 bg-opacity-20 rounded-lg border border-green-400 border-opacity-30">
                <div>
                  <div className="font-semibold text-green-200">Semester Started</div>
                  <div className="text-sm text-green-300">July 15, 2025</div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border ${
                semesterStatus.currentPhase === 'Mid-term Examinations' 
                  ? 'bg-red-500 bg-opacity-20 border-red-400 border-opacity-30'
                  : 'bg-blue-500 bg-opacity-20 border-blue-400 border-opacity-30'
              }`}>
                <div>
                  <div className={`font-semibold ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-200' : 'text-blue-200'
                  }`}>Mid-term Exams</div>
                  <div className={`text-sm ${
                    semesterStatus.currentPhase === 'Mid-term Examinations' ? 'text-red-300' : 'text-blue-300'
                  }`}>Sept 14-24, 2025</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  semesterStatus.currentPhase === 'Mid-term Examinations' 
                    ? 'bg-red-400 animate-pulse' 
                    : 'bg-blue-400'
                }`}></div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-500 bg-opacity-20 rounded-lg border border-purple-400 border-opacity-30">
                <div>
                  <div className="font-semibold text-purple-200">Final Exams</div>
                  <div className="text-sm text-purple-300">Dec 1-15, 2025</div>
                </div>
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's/Upcoming Exam Alert */}
        {(todaysExam || upcomingExam) && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 mb-8 border border-red-400 border-opacity-30 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Target className="h-6 w-6 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {todaysExam ? '🔥 Today\'s Exam' : '📅 Next Exam'}
              </h2>
            </div>

            {todaysExam ? (
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="text-red-100 text-sm">Course</div>
                    <div className="text-white text-lg font-bold">{todaysExam.courseCode}</div>
                  </div>
                  <div>
                    <div className="text-red-100 text-sm">Teacher</div>
                    <div className="text-white font-semibold">{todaysExam.teacher}</div>
                  </div>
                  <div>
                    <div className="text-red-100 text-sm">Time & Room</div>
                    <div className="text-white font-semibold">{todaysExam.time}</div>
                    <div className="text-red-200 text-sm">Room {todaysExam.room}</div>
                  </div>
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
        <div className="glass-card rounded-2xl p-6 hover-lift">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-blue-300" />
            <h2 className="text-xl font-bold text-white">Mid-term Examination Schedule</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-blue-400 border-opacity-30">
                  <th className="text-left py-3 px-4 font-semibold text-blue-200 min-w-[100px]">Course</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-200 min-w-[120px]">Date & Day</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-200 min-w-[80px]">Teacher</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-200 min-w-[100px]">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-blue-200 min-w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MID_TERM_SCHEDULE).map(([courseCode, exam]) => {
                  const examDate = new Date(exam.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  examDate.setHours(0, 0, 0, 0);
                  
                  let status = 'Upcoming';
                  let statusColor = 'text-blue-300';
                  let bgColor = 'bg-blue-500 bg-opacity-10';
                  
                  if (examDate < today) {
                    status = 'Completed';
                    statusColor = 'text-green-300';
                    bgColor = 'bg-green-500 bg-opacity-10';
                  } else if (examDate.getTime() === today.getTime()) {
                    status = 'Today';
                    statusColor = 'text-red-300';
                    bgColor = 'bg-red-500 bg-opacity-20';
                  }

                  return (
                    <tr key={courseCode} className={`${bgColor} border-b border-white border-opacity-10`}>
                      <td className="py-3 px-4 font-semibold text-white">{courseCode}</td>
                      <td className="py-3 px-4">
                        <div className="text-white">{exam.date.split('-').reverse().join('/')}</div>
                        <div className="text-blue-300 text-sm">{exam.day}</div>
                      </td>
                      <td className="py-3 px-4 text-blue-200">{exam.teacher}</td>
                      <td className="py-3 px-4">
                        <div className="text-white text-sm">{exam.time}</div>
                        <div className="text-blue-300 text-xs">Room {exam.room}</div>
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
  );
};

export default SemesterTracker;