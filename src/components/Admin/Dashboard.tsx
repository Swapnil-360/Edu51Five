import { useState } from 'react';
import { Upload, BookOpen, Users, FileText, BarChart3, ArrowRight, TrendingUp, Activity } from 'lucide-react';
import { CourseManager } from './CourseManager';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'course'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    name: string;
    code: string;
  } | null>(null);

  const courses = [
    { id: '1', name: 'Networking', code: 'CSE-319-20', materialCount: 12 },
    { id: '2', name: 'Software Development', code: 'CSE-327', materialCount: 18 },
    { id: '3', name: 'Project Management and Professional Ethics', code: 'CSE-407', materialCount: 14 },
    { id: '4', name: 'Distributed Database', code: 'CSE-417', materialCount: 16 },
    { id: '5', name: 'Artificial Intelligence', code: 'CSE-351', materialCount: 20 },
  ];

  const stats = [
    { label: 'Total Courses', value: '5', icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', lightBg: 'from-blue-400/20' },
    { label: 'Active Students', value: '156', icon: Users, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', lightBg: 'from-emerald-400/20' },
    { label: 'Materials Uploaded', value: '89', icon: FileText, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50', lightBg: 'from-orange-400/20' },
    { label: 'Active Sessions', value: '12', icon: Activity, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', lightBg: 'from-purple-400/20' },
  ];

  const handleSelectCourse = (course: { id: string; name: string; code: string }) => {
    setSelectedCourse(course);
    setCurrentView('course');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourse(null);
  };

  if (currentView === 'course' && selectedCourse) {
    return (
      <CourseManager
        courseId={selectedCourse.id}
        courseName={selectedCourse.name}
        courseCode={selectedCourse.code}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col space-y-2 mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-gray-300 text-sm sm:text-base">Manage BUBT Intake 51 content and resources</p>
        </div>

        {/* Platform Statistics Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Platform Statistics
            </h2>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`relative group overflow-hidden rounded-xl lg:rounded-2xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 bg-gradient-to-br ${stat.lightBg} from-gray-800/80 to-gray-900/80 hover:shadow-lg`}
                >
                  {/* Gradient background effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300 text-xs sm:text-sm font-medium">{stat.label}</p>
                      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">Real-time data</p>
                    </div>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Course Management Section */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl lg:rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Manage Courses</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Section 5 • Computer Science & Engineering</p>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto">
              <Upload className="w-4 h-4" />
              <span>Quick Upload</span>
            </button>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 cursor-pointer transition-all duration-200 space-y-3 sm:space-y-0 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex-shrink-0 group-hover:shadow-lg transition-shadow">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate text-sm sm:text-base">{course.name}</h4>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 mt-1">
                      <span className="font-mono">{course.code}</span>
                      <span className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700/50">
                        <FileText className="w-3 h-3" />
                        {course.materialCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-400 transition-colors">
                  <TrendingUp className="w-4 h-4" />
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}