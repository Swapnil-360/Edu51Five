import React, { useState } from 'react';
import { Upload, Plus, BookOpen, Users, FileText, BarChart3, ArrowRight } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">Manage BUBT Intake 51 content and resources</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Quick Upload</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full text-white`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Management */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Courses - Section 5 (Dept. of CSE)</h3>
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{course.name}</h4>
                  <p className="text-sm text-gray-600">{course.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{course.materialCount} materials</p>
                  <p className="text-xs text-gray-500">Click to manage</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'Uploaded', item: 'Network Security Notes', course: 'CSE-319-20', time: '2 hours ago' },
            { action: 'Added', item: 'Final Exam Suggestions', course: 'CSE-327', time: '4 hours ago' },
            { action: 'Updated', item: 'Project Guidelines', course: 'CSE-407', time: '6 hours ago' },
            { action: 'Uploaded', item: 'Database Past Questions', course: 'CSE-417', time: '1 day ago' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action} <span className="font-semibold">{activity.item}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.course}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}