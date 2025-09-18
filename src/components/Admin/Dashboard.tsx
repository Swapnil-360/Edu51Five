import { useState } from 'react';
import { Upload, BookOpen, Users, FileText, BarChart3, ArrowRight } from 'lucide-react';
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
    { label: 'Total Courses', value: '24', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Active Students', value: '156', icon: Users, color: 'bg-green-500' },
    { label: 'Materials Uploaded', value: '89', icon: FileText, color: 'bg-orange-500' },
    { label: 'Downloads This Month', value: '1,247', icon: BarChart3, color: 'bg-purple-500' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <div className="order-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage BUBT Intake 51 content and resources</p>
          </div>
          <div className="order-2 flex justify-center sm:justify-end">
            <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center">
              <Upload className="h-4 w-4" />
              <span>Quick Upload</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-full text-white flex-shrink-0 ml-3`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Management */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Courses - Section 5 (Dept. of CSE)</h3>
          <div className="grid gap-3 sm:gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleSelectCourse(course)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors space-y-3 sm:space-y-0"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 truncate">{course.name}</h4>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-medium text-gray-900">{course.materialCount} materials</p>
                    <p className="text-xs text-gray-500">Click to manage</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 sm:space-y-4">
            {[
              { action: 'Uploaded', item: 'Network Security Notes', course: 'CSE-319-20', time: '2 hours ago' },
              { action: 'Added', item: 'Final Exam Suggestions', course: 'CSE-327', time: '4 hours ago' },
              { action: 'Updated', item: 'Project Guidelines', course: 'CSE-407', time: '6 hours ago' },
              { action: 'Uploaded', item: 'Database Past Questions', course: 'CSE-417', time: '1 day ago' },
            ].map((activity, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action} <span className="font-semibold">{activity.item}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.course}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 sm:ml-4 self-start sm:self-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}