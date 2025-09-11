import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Plus, 
  Upload, 
  ArrowLeft, 
  FileText, 
  Play, 
  Eye, 
  Download, 
  Tag 
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  created_at: string;
}

interface Material {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  video_url: string | null;
  type: string;
  course_code: string;
  size: string | null;
  created_at: string;
}

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Admin forms state
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [uploadFile, setUploadFile] = useState({
    title: '',
    description: '',
    type: 'pdf',
    course_code: '',
    file: null as File | null,
    video_url: ''
  });

  const ADMIN_PASSWORD = 'edu51five2025';

  // Load courses and materials on component mount
  useEffect(() => {
    initializeDatabase();
    loadCourses();
    if (selectedCourse) {
      loadMaterials(selectedCourse.code);
    }
  }, [selectedCourse]);

  // Initialize database tables if they don't exist
  const initializeDatabase = async () => {
    try {
      // Test if tables exist by trying to select from them
      await supabase.from('courses').select('*').limit(1);
      await supabase.from('materials').select('*').limit(1);
      console.log('Database tables accessible');
    } catch (error) {
      console.log('Database tables may not exist. Please run the SQL setup:', error);
    }
  };

  // Load all courses from database
  const loadCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      // Fallback to hardcoded courses if database fails
      setCourses([
        { id: '1', name: 'Networking', code: 'CSE-319-20', description: 'Computer Networks and Security', created_at: new Date().toISOString() },
        { id: '2', name: 'Software Development', code: 'CSE-327', description: 'Software Engineering Principles', created_at: new Date().toISOString() },
        { id: '3', name: 'Project Management and Professional Ethics', code: 'CSE-407', description: 'Project Management & Ethics', created_at: new Date().toISOString() },
        { id: '4', name: 'Distributed Database', code: 'CSE-417', description: 'Database Systems and Management', created_at: new Date().toISOString() },
        { id: '5', name: 'Artificial Intelligence', code: 'CSE-351', description: 'AI and Machine Learning', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load materials for a specific course
  const loadMaterials = async (courseCode: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_code', courseCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle course click - load materials and switch view
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    loadMaterials(course.code);
  };

  // Navigation functions
  const handleBackToSection = () => {
    setCurrentView('section5');
    setSelectedCourse(null);
    setMaterials([]);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCourse(null);
    setMaterials([]);
  };

  // Admin: Create new course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase
        .from('courses')
        .insert([{
          name: newCourse.name,
          code: newCourse.code,
          description: newCourse.description
        }]);

      if (error) throw error;

      // Reset form and reload courses
      setNewCourse({ name: '', code: '', description: '' });
      setShowCreateCourse(false);
      loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Error creating course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Upload file
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile.file && !uploadFile.video_url) {
      alert('Please select a file or provide a video URL');
      return;
    }

    try {
      setLoading(true);
      let file_url = uploadFile.video_url;

      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase') || supabaseKey.includes('your-supabase')) {
        alert('Supabase is not configured. Please set up your Supabase credentials in the .env file and create the required tables.');
        return;
      }

      if (uploadFile.file) {
        // Upload file to Supabase Storage
        const fileExt = uploadFile.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        // Try to upload directly (bucket should exist)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, uploadFile.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          if (uploadError.message.includes('Bucket not found')) {
            throw new Error('Storage bucket "materials" not found. Please make sure the bucket exists and is public in your Supabase Storage.');
          } else {
            throw new Error(`File upload failed: ${uploadError.message}`);
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('materials')
          .getPublicUrl(uploadData.path);

        file_url = urlData.publicUrl;
      }

      // Insert material record
      console.log('Attempting to insert material:', {
        title: uploadFile.title,
        description: uploadFile.description,
        file_url: file_url,
        video_url: uploadFile.video_url,
        type: uploadFile.type,
        course_code: uploadFile.course_code,
        size: uploadFile.file ? `${(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB` : undefined
      });

      const { data: insertData, error: insertError } = await supabase
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

      console.log('Insert result:', { data: insertData, error: insertError });

      if (insertError) {
        console.error('Database error details:', insertError);
        throw new Error(`Database error: ${insertError.message}. Code: ${insertError.code}. Details: ${insertError.details}`);
      }

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
      if (selectedCourse) {
        loadMaterials(selectedCourse.code);
      }
      
      alert('Material uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error uploading file: ${errorMessage}`);
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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setCurrentView('admin');
      setAdminError('');
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
  };

  // Check if user wants admin access
  if (window.location.pathname.toLowerCase() === '/admin' && !isAdmin) {
    if (!showAdminLogin) {
      setShowAdminLogin(true);
    }
  }

  // Admin Login Screen
  if (showAdminLogin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <img src="/image.png" alt="Edu51Five Logo" className="h-16 w-16 mx-auto mb-4 object-contain" />
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
              <img src="/image.png" alt="Edu51Five Logo" className="h-10 w-10 object-contain" />
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
            <div className="text-center">
              <img src="/image.png" alt="Edu51Five Logo" className="h-16 w-16 mx-auto mb-4 object-contain" />
              <h2 className="text-2xl font-bold text-gray-900">Section 5 - Department of CSE</h2>
              <p className="text-gray-600 mt-2">Choose your course to access materials</p>
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
            <div className="text-center mb-8">
              <img src="/image.png" alt="Edu51Five Logo" className="h-20 w-20 mx-auto mb-6 object-contain" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Edu51Five!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                BUBT Intake 51 Learning Platform - Department of CSE
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div 
                className="border border-gray-200 rounded-lg p-8 hover:shadow-lg cursor-pointer hover:border-blue-300 transition-all text-center"
                onClick={() => setCurrentView('section5')}
              >
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-gray-900 font-semibold text-xl mb-2">Section 5</h3>
                <p className="text-gray-600 mb-3">
                  Computer Science & Engineering
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  {courses.length} courses available
                </p>
                <p className="text-blue-600 text-lg font-medium">Click to Access →</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-8 opacity-50 text-center">
                <div className="text-4xl mb-4">🚧</div>
                <h3 className="text-gray-900 font-semibold text-xl mb-2">Other Sections</h3>
                <p className="text-gray-600 mb-3">
                  Coming Soon...
                </p>
                <p className="text-gray-400 text-sm">
                  More sections will be added
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg text-center border mt-8 flex flex-col items-center">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-2">
                <a
                  href="mailto:miftahurr503@gmail.com?subject=Edu51Five%20Platform%20Contact&body=Hi%20Swapnil%2C%20I%20found%20your%20Edu51Five%20platform%20and%20want%20to%20connect!"
                  className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow"
                  target="_blank" rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20V8.99l8 7 8-7V20H4z"/></svg>
                  Gmail
                </a>
                <a
                  href="https://wa.me/8801318090383?text=Hi%20Swapnil%2C%20I%20found%20your%20Edu51Five%20platform%20and%20want%20to%20connect!"
                  className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow"
                  target="_blank" rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M16.7 13.37c-.29-.14-1.71-.84-1.98-.94-.27-.1-.47-.14-.67.14-.2.29-.77.94-.94 1.13-.17.2-.34.21-.63.07-.29-.14-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.14-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.36-.01-.56-.01-.19 0-.5.07-.76.36-.26.29-1 1-.99 2.44.01 1.44 1.02 2.84 1.16 3.04.14.2 2.01 3.07 4.87 4.18.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.19-.55-.33z"/></svg>
                  WhatsApp
                </a>
              </div>
              <p className="text-gray-700 font-medium mt-2">
                Developed by <span className="font-bold">Swapnil</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">If you find any bug or want to connect, feel free to contact me!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;