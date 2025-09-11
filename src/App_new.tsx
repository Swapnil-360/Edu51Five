import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Eye, Download, Upload, Plus, ArrowLeft, FileText, Play, Tag } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string;
  video_url?: string;
  type: string;
  course_code: string;
  created_at: string;
  size?: string;
}

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: 'Networking', code: 'CSE-319-20', description: 'Computer Networks and Security' },
    { id: '2', name: 'Software Development', code: 'CSE-327', description: 'Software Engineering Principles' },
    { id: '3', name: 'Project Management and Professional Ethics', code: 'CSE-407', description: 'Project Management & Ethics' },
    { id: '4', name: 'Distributed Database', code: 'CSE-417', description: 'Database Systems and Management' },
    { id: '5', name: 'Artificial Intelligence', code: 'CSE-351', description: 'AI and Machine Learning' },
  ]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin form states
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', code: '', description: '' });
  const [uploadFile, setUploadFile] = useState({
    title: '',
    description: '',
    type: 'pdf',
    course_code: '',
    file: null as File | null,
    video_url: ''
  });

  const ADMIN_PASSWORD = 'edu51five2025';

  // Load materials from Supabase
  const loadMaterials = async (courseCode?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('materials').select('*');
      
      if (courseCode) {
        query = query.eq('course_code', courseCode);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check for admin route
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin') {
      setShowAdminLogin(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setCurrentView('admin');
      setAdminError('');
      loadMaterials(); // Load all materials for admin
      window.history.pushState({}, '', '/admin');
    } else {
      setAdminError('Incorrect password');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setCurrentView('home');
    setShowAdminLogin(false);
    setAdminPassword('');
    setAdminError('');
    setShowCreateCourse(false);
    setShowUploadFile(false);
    window.history.pushState({}, '', '/');
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    loadMaterials(course.code);
  };

  const handleBackToSection = () => {
    setCurrentView('section5');
    setSelectedCourse(null);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCourse(null);
  };

  // Admin: Create new course
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourse.name && newCourse.code) {
      const course: Course = {
        id: Date.now().toString(),
        name: newCourse.name,
        code: newCourse.code,
        description: newCourse.description
      };
      setCourses([...courses, course]);
      setNewCourse({ name: '', code: '', description: '' });
      setShowCreateCourse(false);
    }
  };

  // Admin: Upload file
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile.file && !uploadFile.video_url) return;

    try {
      setLoading(true);
      let file_url = uploadFile.video_url;

      if (uploadFile.file) {
        // Upload file to Supabase Storage
        const fileExt = uploadFile.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, uploadFile.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('materials')
          .getPublicUrl(uploadData.path);

        file_url = urlData.publicUrl;
      }

      // Insert material record
      const { error: insertError } = await supabase
        .from('materials')
        .insert([{
          title: uploadFile.title,
          description: uploadFile.description,
          file_url: file_url,
          video_url: uploadFile.video_url,
          type: uploadFile.type,
          course_code: uploadFile.course_code,
          size: uploadFile.file ? `${(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB` : undefined
        }]);

      if (insertError) throw insertError;

      // Reset form and reload materials
      setUploadFile({
        title: '',
        description: '',
        type: 'pdf',
        course_code: '',
        file: null,
        video_url: ''
      });
      setShowUploadFile(false);
      loadMaterials();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-5 w-5" />;
      case 'pdf': 
      case 'doc': return <FileText className="h-5 w-5" />;
      case 'suggestion': return <Tag className="h-5 w-5" />;
      case 'past_question': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'pdf': return 'text-blue-600 bg-blue-100';
      case 'doc': return 'text-green-600 bg-green-100';
      case 'suggestion': return 'text-orange-600 bg-orange-100';
      case 'past_question': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Admin Login Screen
  if (showAdminLogin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edu51Five</h1>
            <p className="text-gray-600 mt-2">Admin Access</p>
          </div>
          
          <form onSubmit={handleAdminLogin}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {adminError && (
              <div className="mb-4 text-red-600 text-sm text-center">
                {adminError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Login
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowAdminLogin(false);
                window.history.pushState({}, '', '/');
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold">Edu51Five</h1>
                <p className="text-sm text-blue-200">Intake 51</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentView === 'course' && selectedCourse && (
                <button
                  onClick={handleBackToSection}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Courses</span>
                </button>
              )}
              
              {currentView === 'section5' && (
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={handleAdminLogout}
                  className="px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Admin Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Admin Dashboard */}
        {isAdmin && currentView === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateCourse(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course</span>
                </button>
                <button
                  onClick={() => setShowUploadFile(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Material</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900">Total Courses</h3>
                <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900">Total Materials</h3>
                <p className="text-2xl font-bold text-green-600">{materials.length}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900">Students</h3>
                <p className="text-2xl font-bold text-orange-600">156</p>
              </div>
            </div>

            {/* Courses List */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Courses</h3>
              <div className="grid gap-4">
                {courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.code}</p>
                      <p className="text-xs text-gray-500">{course.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {materials.filter(m => m.course_code === course.code).length} materials
                      </p>
                      <button
                        onClick={() => handleCourseClick(course)}
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                      >
                        View Materials →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Course Modal */}
            {showCreateCourse && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Course</h3>
                  <form onSubmit={handleCreateCourse}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                      <input
                        type="text"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                      <input
                        type="text"
                        value={newCourse.code}
                        onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newCourse.description}
                        onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateCourse(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create Course
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Upload File Modal */}
            {showUploadFile && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Material</h3>
                  <form onSubmit={handleFileUpload}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={uploadFile.title}
                        onChange={(e) => setUploadFile({...uploadFile, title: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                      <select
                        value={uploadFile.course_code}
                        onChange={(e) => setUploadFile({...uploadFile, course_code: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.code}>{course.code} - {course.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                      <select
                        value={uploadFile.type}
                        onChange={(e) => setUploadFile({...uploadFile, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pdf">PDF/Document</option>
                        <option value="video">Video</option>
                        <option value="suggestion">Suggestion</option>
                        <option value="past_question">Past Question</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={uploadFile.description}
                        onChange={(e) => setUploadFile({...uploadFile, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    {uploadFile.type === 'video' ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                        <input
                          type="url"
                          value={uploadFile.video_url}
                          onChange={(e) => setUploadFile({...uploadFile, video_url: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com/video"
                        />
                      </div>
                    ) : (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile({...uploadFile, file: e.target.files?.[0] || null})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowUploadFile(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-400"
                      >
                        {loading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Course Materials View */}
        {currentView === 'course' && selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {selectedCourse.code}
              </span>
            </div>
            <p className="text-gray-600">{selectedCourse.description}</p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading materials...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
                <p className="text-gray-600">No materials have been uploaded for this course yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-full ${getTypeColor(material.type)}`}>
                          {getTypeIcon(material.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {material.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">{material.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div>
                              Type: {material.type}
                            </div>
                            {material.size && (
                              <div>Size: {material.size}</div>
                            )}
                            <div>
                              {new Date(material.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Preview Button */}
                        {material.type === 'video' && material.video_url ? (
                          <a
                            href={material.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Watch Video"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                        ) : material.file_url ? (
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Preview File"
                          >
                            <Eye className="h-5 w-5" />
                          </a>
                        ) : (
                          <button
                            className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                            title="No preview available"
                            disabled
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        )}

                        {/* Download Button */}
                        {material.file_url ? (
                          <a
                            href={material.file_url}
                            download
                            className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Download File"
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        ) : (
                          <button
                            className="p-2 text-gray-300 cursor-not-allowed rounded-lg"
                            title="No file to download"
                            disabled
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 5 Courses */}
        {currentView === 'section5' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Section 5 - Department of CSE</h2>
              <p className="text-gray-600 mt-2">Click on any course to access materials</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md cursor-pointer transition-all hover:border-blue-300"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.name}</h3>
                  <p className="text-blue-600 font-medium mb-2">{course.code}</p>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  <p className="text-blue-600 text-sm font-medium">Access Materials →</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Home Page */}
        {currentView === 'home' && !isAdmin && (
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome Students!
            </h2>
            <p className="text-gray-600 mb-6">
              Access your course materials and resources for Section 5 - Department of CSE
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div 
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md cursor-pointer hover:border-blue-300 transition-all"
                onClick={() => setCurrentView('section5')}
              >
                <h3 className="text-gray-900 font-semibold text-lg">Section 5</h3>
                <p className="text-gray-600">
                  Dept. of CSE - {courses.length} courses available
                </p>
                <p className="text-blue-600 text-sm mt-2">Click to access →</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6 opacity-50">
                <h3 className="text-gray-900 font-semibold text-lg">Other Sections</h3>
                <p className="text-gray-600">
                  Coming Soon...
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600 text-sm">
                🚀 System Status: All systems operational
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Admin access: Visit /admin with password
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
