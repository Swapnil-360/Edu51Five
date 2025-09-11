import { useState, useEffect } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Notice } from './types';
import { 
  FileText, 
  Play, 
  Tag,
  Eye,
  Download,
  Trash2,
  Plus,
  Upload,
  Bell,
  X,
  FolderOpen,
  BookOpen,
  Calendar,
  ExternalLink,
  ImageIcon
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
  // Removed unused navigate and location from partial router migration
  // --- Browser history sync for currentView ---
  const [currentView, setCurrentView] = useState<'admin' | 'section5' | 'course' | 'home'>(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/section5') return 'section5';
    if (path.startsWith('/course/')) return 'course';
    return 'home';
  });

  // Helper to change view and update browser history
  const goToView = (view: 'admin' | 'section5' | 'course' | 'home', extra?: string | null) => {
    let path = '/';
    if (view === 'admin') path = '/admin';
    else if (view === 'section5') path = '/section5';
    else if (view === 'course' && extra) path = `/course/${extra}`;
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  // Listen for browser back/forward events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setCurrentView('admin');
      else if (path === '/section5') setCurrentView('section5');
      else if (path.startsWith('/course/')) setCurrentView('course');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if admin route is accessed directly
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setShowAdminLogin(true);
    }
  }, []);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showExamRoutineUpload, setShowExamRoutineUpload] = useState(false);
  const [examRoutineFile, setExamRoutineFile] = useState<File | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    description: '',
    section_id: '1'
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    course_id: '',
    type: 'pdf' as Material['type'],
    file: null as File | null,
    video_url: '',
    description: ''
  });
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    is_active: true
  });

  const ADMIN_PASSWORD = 'edu51five2025';

  // Load courses and materials on component mount
  useEffect(() => {
    initializeDatabase();
    loadCourses();
    loadNotices();
    if (selectedCourse) {
      loadMaterials(selectedCourse.code);
    }
  }, [selectedCourse]);

  // Create welcome notice after notices are loaded
  useEffect(() => {
    createWelcomeNoticeIfNeeded();
  }, [notices]); // Runs when notices state changes

  // Auto-refresh notices every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing notices...');
      loadNotices();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Initialize database tables if they don't exist
  const initializeDatabase = async () => {
    try {
      // Test if tables exist by trying to select from them
      await supabase.from('courses').select('*').limit(1);
      await supabase.from('materials').select('*').limit(1);
      
      // Test notices table specifically and create if needed
      const { error } = await supabase.from('notices').select('*').limit(1);
      if (error) {
        console.error('Notices table not accessible:', error);
        console.log('='.repeat(60));
        console.log('NOTICES TABLE MISSING! Please run this SQL in your Supabase dashboard:');
        console.log('='.repeat(60));
        console.log(`
CREATE TABLE notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on notices" ON notices
FOR ALL USING (true) WITH CHECK (true);
        `);
        console.log('='.repeat(60));
        
        // Try to create the table programmatically (this might not work without proper permissions)
        try {
          await supabase.rpc('create_notices_table');
        } catch (rpcError) {
          console.log('Could not create table automatically. Please run the SQL manually.');
        }
      } else {
        console.log('Database tables accessible, notices table working');
      }
    } catch (error) {
      console.log('Database connection issue:', error);
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

  // Create welcome notice if it doesn't exist
  const createWelcomeNoticeIfNeeded = async () => {
    // Check if welcome notice already exists
    const existingWelcome = notices.find(n => n.title.includes('Welcome to Edu51Five'));
    if (existingWelcome) {
      console.log('Welcome notice already exists');
      return;
    }

    // Check localStorage for welcome notice
    const localNotices = localStorage.getItem('edu51five_notices');
    if (localNotices) {
      const parsedNotices = JSON.parse(localNotices);
      const welcomeExists = parsedNotices.find((n: Notice) => n.title.includes('Welcome to Edu51Five'));
      if (welcomeExists) {
        console.log('Welcome notice already exists in localStorage');
        return;
      }
    }

    // Create welcome notice
    const welcomeNotice: Notice = {
      id: 'welcome-notice-' + Date.now(),
      title: '🎉 Welcome to Edu51Five - Your Academic Success Platform!',
      content: `Dear BUBT Intake 51 Students,

Welcome to Edu51Five, your comprehensive learning platform designed specifically for your academic excellence and exam preparation success!

🎯 **Why This Platform is Crucial for Your Studies:**

📚 **Centralized Learning Hub**
• Access all your course materials, lectures, and resources in one place
• Never miss important announcements or exam schedules
• Stay organized with structured content by courses and sections

📖 **Exam Preparation Excellence**
• Download past exam questions and model answers
• Access comprehensive study materials for each subject
• Get exam tips and preparation strategies from instructors

🔔 **Stay Updated & Connected**
• Receive instant notifications about exam dates and schedule changes
• Get important academic announcements immediately
• Access emergency updates about classes or exam modifications

💡 **Academic Success Features**
• Organized course-wise material distribution
• Video lectures and supplementary content
• Study guides and exam preparation resources
• 24/7 access to all learning materials

🎓 **Your Path to Excellence**
This platform is designed to support your journey through BUBT's Computer Science & Engineering program. Use it regularly to stay ahead in your studies, prepare effectively for exams, and achieve the academic success you deserve!

Start exploring the platform now - check out Section 5 materials and stay tuned for regular updates!

Best of luck with your studies!
- Edu51Five Team`,
      type: 'info',
      is_active: true,
      created_at: new Date().toISOString()
    };

    console.log('Creating welcome notice...');

    // Add to current state
    const updatedNotices = [welcomeNotice, ...notices];
    setNotices(updatedNotices);

    // Save to localStorage
    localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
    console.log('Welcome notice saved to localStorage');

    // Try to save to database
    try {
      const { data, error } = await supabase
        .from('notices')
        .insert([welcomeNotice])
        .select();
      
      if (error) {
        console.log('Welcome notice saved locally only');
      } else {
        console.log('Welcome notice saved to database successfully:', data);
      }
    } catch (dbError) {
      console.log('Database not available, welcome notice saved locally');
    }
  };

  // Load notices from database
  const loadNotices = async () => {
    try {
      console.log('Loading notices from database...');
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not load notices from database, trying localStorage:', error);
        // Fallback to localStorage
        const localNotices = localStorage.getItem('edu51five_notices');
        if (localNotices) {
          const parsedNotices = JSON.parse(localNotices);
          console.log('Loaded notices from localStorage:', parsedNotices.length);
          setNotices(parsedNotices);
        } else {
          console.log('No notices found in localStorage either');
          setNotices([]);
        }
        return;
      }
      
      // Merge database notices with localStorage notices (prioritize localStorage for recent uploads)
      const localNotices = localStorage.getItem('edu51five_notices');
      let mergedNotices = data || [];
      
      if (localNotices) {
        const parsedLocalNotices = JSON.parse(localNotices);
        // Create a map to avoid duplicates (by id)
        const noticeMap = new Map();
        
        // First add database notices
        (data || []).forEach(notice => noticeMap.set(notice.id, notice));
        
        // Then add/override with local notices (this preserves recent uploads)
        parsedLocalNotices.forEach((notice: Notice) => noticeMap.set(notice.id, notice));
        
        mergedNotices = Array.from(noticeMap.values()).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      
      console.log('Merged notices (DB + localStorage):', mergedNotices.length);
      setNotices(mergedNotices);
      
      // Save merged notices back to localStorage
      if (mergedNotices.length > 0) {
        localStorage.setItem('edu51five_notices', JSON.stringify(mergedNotices));
      }
    } catch (error) {
      console.error('Error loading notices, trying localStorage:', error);
      // Fallback to localStorage
      const localNotices = localStorage.getItem('edu51five_notices');
      if (localNotices) {
        const parsedNotices = JSON.parse(localNotices);
        console.log('Loaded notices from localStorage fallback:', parsedNotices.length);
        setNotices(parsedNotices);
      } else {
        setNotices([]);
      }
    }
  };

  // Handle course click - load materials and navigate
  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    loadMaterials(course.code);
    goToView('course', course.code);
  };

  // Handle notice click to show full content
  const handleNoticeClick = (notice: Notice) => {
    setSelectedNotice(notice);
    setShowNoticeModal(true);
  };

  // Close notice modal
  const closeNoticeModal = () => {
    setSelectedNotice(null);
    setShowNoticeModal(false);
  };

  // Handle exam routine upload
  const handleExamRoutineUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examRoutineFile) {
      alert('Please select a PNG file for the exam routine');
      return;
    }

    try {
      setLoading(true);

      // Convert file to base64 for localStorage storage
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        
        // Create a special notice for exam routine with image
        const routineNotice: Notice = {
          id: 'exam-routine-' + Date.now(),
          title: '📅 Midterm Exam Routine - Section 5 (Starting 14/09/2025)',
          content: `Midterm examinations for Section 5 (Computer Science & Engineering) will commence from Sunday, September 14, 2025.

Important Instructions:
• Please check your exam schedule carefully
• Arrive at the exam hall 15 minutes early
• Bring your student ID card and necessary stationery
• Mobile phones are strictly prohibited in exam halls
• Follow all university exam regulations

For any queries regarding the exam schedule, contact your course instructors or the department.

Best of luck with your midterm exams!

[EXAM_ROUTINE_IMAGE]${base64String}[/EXAM_ROUTINE_IMAGE]`,
          type: 'warning',
          is_active: true,
          created_at: new Date().toISOString()
        };

        // Add to notices
        const updatedNotices = [routineNotice, ...notices];
        setNotices(updatedNotices);

        // Save to localStorage
        localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
        console.log('Exam routine uploaded and saved');

        // Try to save to database
        try {
          const { error } = await supabase
            .from('notices')
            .insert([routineNotice]);
          
          if (error) {
            console.log('Exam routine saved locally only');
          } else {
            console.log('Exam routine saved to database');
          }
        } catch (dbError) {
          console.log('Database not available, exam routine saved locally');
        }

        // Reset form
        setExamRoutineFile(null);
        setShowExamRoutineUpload(false);
        
        alert('Exam routine uploaded successfully! Students can now view it in the notice board.');
      };

      reader.readAsDataURL(examRoutineFile);

    } catch (error) {
      console.error('Error uploading exam routine:', error);
      alert('Error uploading exam routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Facebook link - open in app on mobile, new tab on PC
  const handleFacebookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const facebookUrl = "https://www.facebook.com/mr.swapnil360";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open in Facebook app first, fallback to browser
      const fbAppUrl = "fb://profile/mr.swapnil360";
      
      // Create a temporary iframe to try opening the app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = fbAppUrl;
      document.body.appendChild(iframe);
      
      // If app doesn't open within 2 seconds, open in browser
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
      }, 2000);
      
    } else {
      // Desktop - open in new tab
      window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Navigation functions
  const handleBackToHome = () => {
    setSelectedCourse(null);
    setMaterials([]);
    goToView('home');
  };

  const handleBackToSection = () => {
    setSelectedCourse(null);
    setMaterials([]);
    goToView('section5');
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
      setNewCourse({ name: '', code: '', description: '', section_id: '1' });
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
    if (!newMaterial.file && !newMaterial.video_url) {
      alert('Please select a file or provide a video URL');
      return;
    }

    try {
      setLoading(true);
      let file_url = newMaterial.video_url;

      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-supabase') || supabaseKey.includes('your-supabase')) {
        alert('Supabase is not configured. Please set up your Supabase credentials in the .env file and create the required tables.');
        return;
      }

      if (newMaterial.file) {
        // Upload file to Supabase Storage
        const fileExt = newMaterial.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        // Try to upload directly (bucket should exist)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, newMaterial.file);

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
        title: newMaterial.title,
        description: newMaterial.description,
        file_url: file_url,
        video_url: newMaterial.video_url,
        type: newMaterial.type,
        course_code: newMaterial.course_id, // Using course_id from form as course_code for DB
        size: newMaterial.file ? `${(newMaterial.file.size / 1024 / 1024).toFixed(2)} MB` : undefined
      });

      const { data: insertData, error: insertError } = await supabase
        .from('materials')
        .insert([{
          title: newMaterial.title,
          description: newMaterial.description,
          file_url: file_url,
          video_url: newMaterial.video_url,
          type: newMaterial.type,
          course_code: newMaterial.course_id, // Using course_id from form as course_code for DB
          size: newMaterial.file ? `${(newMaterial.file.size / 1024 / 1024).toFixed(2)} MB` : undefined
        }]);

      console.log('Insert result:', { data: insertData, error: insertError });

      if (insertError) {
        console.error('Database error details:', insertError);
        throw new Error(`Database error: ${insertError.message}. Code: ${insertError.code}. Details: ${insertError.details}`);
      }

      // Reset form and reload materials
      setNewMaterial({
        title: '',
        course_id: '',
        type: 'pdf' as Material['type'],
        file: null,
        video_url: '',
        description: ''
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
      setAdminError('');
      goToView('admin');
    } else {
      setAdminError('Incorrect password');
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setShowAdminLogin(false);
    setAdminPassword('');
    setAdminError('');
    goToView('home');
  };

  // Admin: Delete material
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      // Remove from local state
      setMaterials(materials.filter(m => m.id !== materialId));
      
      alert('Material deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting material:', error);
      // Fallback: remove from local state anyway
      setMaterials(materials.filter(m => m.id !== materialId));
      alert('Material deleted from view. Database may need manual cleanup.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Create notice
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const notice: Notice = {
        id: Date.now().toString(),
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        created_at: new Date().toISOString(),
        is_active: newNotice.is_active
      };

      console.log('Creating notice:', notice);

      // Always add to local state first for immediate UI update
      const updatedNotices = [notice, ...notices];
      setNotices(updatedNotices);

      // Save to localStorage for persistence
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('Notice saved to localStorage');

      // Try to save to database as backup
      try {
        const { data, error } = await supabase
          .from('notices')
          .insert([notice])
          .select();
        
        if (error) {
          console.error('Database save failed:', error);
          console.log('Notice saved locally only. Database might not be set up.');
        } else {
          console.log('Notice saved to database successfully:', data);
        }
      } catch (dbError) {
        console.warn('Database not available, using local storage:', dbError);
      }
      
      // Reset form
      setNewNotice({ title: '', content: '', type: 'info', is_active: true });
      setShowCreateNotice(false);
      
      alert('Notice created successfully!');
      
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Error creating notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Delete notice
  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Update local state first
      const updatedNotices = notices.filter(n => n.id !== noticeId);
      setNotices(updatedNotices);
      
      // Update localStorage
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('Notice deleted from localStorage');
      
      // Try to delete from database
      try {
        await supabase.from('notices').delete().eq('id', noticeId);
        console.log('Notice deleted from database');
      } catch (error) {
        console.warn('Notice deleted locally, database cleanup may be needed:', error);
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show admin login screen if needed (single block)
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
                goToView('home');
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

  // Main return for all other views
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
                  <span>← Back to Courses</span>
                </button>
              )}
              
              {currentView === 'section5' && (
                <button
                  onClick={handleBackToHome}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-colors"
                >
                  <span>← Back to Home</span>
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
        {/* Home Page */}
        {currentView === 'home' && (
          <div className="space-y-6">
            {/* Welcome Section - Always on Top */}
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="text-center mb-8">
                <img src="/image.png" alt="Edu51Five Logo" className="h-20 w-20 mx-auto mb-6 object-contain" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Edu51Five!
                </h2>
                <p className="text-gray-600 mb-4 text-lg">
                  BUBT Intake 51 Learning Platform - Department of CSE
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">🎯 Your Exam Success Platform</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">📚</span>
                      <span>Complete Study Materials</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">📝</span>
                      <span>Past Exam Questions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-purple-600">🔔</span>
                      <span>Real-time Updates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-orange-600">🎥</span>
                      <span>Video Lectures</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">⏰</span>
                      <span>Exam Schedules</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-teal-600">💡</span>
                      <span>Study Tips & Guides</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div 
                  className="border border-gray-200 rounded-lg p-8 hover:shadow-lg cursor-pointer hover:border-blue-300 transition-all text-center"
                  onClick={() => goToView('section5')}
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
                    Gmail
                  </a>
                  <a
                    href="https://wa.me/8801318090383?text=Hi%20Swapnil%2C%20I%20found%20your%20Edu51Five%20platform%20and%20want%20to%20connect!"
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow"
                    target="_blank" rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </div>
                <p className="text-gray-700 font-medium mt-2">
                  Developed by <a 
                    href="https://www.facebook.com/mr.swapnil360" 
                    onClick={handleFacebookClick}
                    className="font-bold text-blue-600 hover:text-blue-800 transition-all duration-200 cursor-pointer hover:underline hover:scale-105 inline-flex items-center space-x-1"
                    title="Connect with Swapnil on Facebook"
                  >
                    <span>Swapnil</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </p>
                <p className="text-gray-500 text-xs mt-1">If you find any bug or want to connect, feel free to contact me!</p>
              </div>
            </div>

            {/* Visual Separator */}
            <div className="flex items-center justify-center py-2">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full max-w-xs"></div>
              <span className="px-4 text-gray-400 text-sm font-medium">📢</span>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full max-w-xs"></div>
            </div>

            {/* Notice Board Section - IMMEDIATELY After Welcome */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden -mt-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">📢 Notice Board</h3>
                      <p className="text-sm text-gray-600">
                        {notices.filter(n => n.is_active).length > 0 
                          ? `${notices.filter(n => n.is_active).length} active notice${notices.filter(n => n.is_active).length !== 1 ? 's' : ''} • Click to read full content` 
                          : 'No active notices'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={loadNotices}
                    disabled={loading}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                    title="Refresh notices"
                  >
                    <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {notices.filter(n => n.is_active).length > 0 ? (
                  <div className="space-y-3">
                    {notices.filter(n => n.is_active).slice(0, 3).map((notice) => (
                      <div 
                        key={notice.id} 
                        onClick={() => handleNoticeClick(notice)}
                        className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                          notice.type === 'info' ? 'bg-blue-50 border-blue-200 hover:border-blue-300' :
                          notice.type === 'warning' ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300' :
                          notice.type === 'success' ? 'bg-green-50 border-green-200 hover:border-green-300' :
                          'bg-red-50 border-red-200 hover:border-red-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded ${
                          notice.type === 'info' ? 'bg-blue-100' :
                          notice.type === 'warning' ? 'bg-yellow-100' :
                          notice.type === 'success' ? 'bg-green-100' :
                          'bg-red-100'
                        }`}>
                          <Bell className={`h-4 w-4 ${
                            notice.type === 'info' ? 'text-blue-600' :
                            notice.type === 'warning' ? 'text-yellow-600' :
                            notice.type === 'success' ? 'text-green-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 truncate">{notice.title}</h4>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notice.type === 'info' ? 'bg-blue-100 text-blue-700' :
                              notice.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              notice.type === 'success' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {notice.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notice.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {notices.filter(n => n.is_active).length > 3 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-gray-500">
                          and {notices.filter(n => n.is_active).length - 3} more notice{notices.filter(n => n.is_active).length - 3 !== 1 ? 's' : ''}...
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Bell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">No Active Notices</h4>
                    <p className="text-gray-500 text-sm">Check back later for important announcements and updates.</p>
                  </div>
                )}
              </div>
            </div>
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

        {/* Admin Dashboard */}
        {isAdmin && currentView === 'admin' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Modern Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">Manage your educational platform with ease</p>
                    <div className="flex items-center space-x-4 mt-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-gray-700">{courses.length} Courses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-700">{materials.length} Materials</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-700">{notices.filter(n => n.is_active).length} Active Notices</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCreateCourse(true)}
                      className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                      <span className="font-medium">Add Course</span>
                    </button>
                    <button
                      onClick={() => setShowUploadFile(true)}
                      className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Upload className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Upload Material</span>
                    </button>
                    <button
                      onClick={() => setShowExamRoutineUpload(true)}
                      className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-xl hover:from-orange-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Upload Exam Routine</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
              {/* Quick Navigation Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a 
                    href="#courses-section" 
                    className="group p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                        <span className="text-blue-600 font-semibold">📚</span>
                      </div>
                      <span className="text-gray-700 group-hover:text-blue-700 font-medium">Manage Courses</span>
                    </div>
                  </a>
                  <a 
                    href="#materials-section" 
                    className="group p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200">
                        <span className="text-emerald-600 font-semibold">🗂️</span>
                      </div>
                      <span className="text-gray-700 group-hover:text-emerald-700 font-medium">Manage Materials</span>
                    </div>
                  </a>
                  <a 
                    href="#notices-section" 
                    className="group p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                        <span className="text-purple-600 font-semibold">📢</span>
                      </div>
                      <span className="text-gray-700 group-hover:text-purple-700 font-medium">Manage Notices</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Courses</p>
                      <p className="text-3xl font-bold mt-1">{courses.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Total Materials</p>
                      <p className="text-3xl font-bold mt-1">{materials.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📁</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Active Notices</p>
                      <p className="text-3xl font-bold mt-1">{notices.filter(n => n.is_active).length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-purple-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses List */}
              <div id="courses-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-blue-600 font-bold">📚</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Course Management</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600">{course.name}</h4>
                          <p className="text-blue-600 font-medium mt-1">{course.code}</p>
                          <p className="text-gray-600 text-sm mt-2">{course.description}</p>
                        </div>
                        <div className="text-right ml-6">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {materials.filter(m => m.course_code === course.code).length}
                              </span>
                            </div>
                            <span className="text-gray-700 font-medium">materials</span>
                          </div>
                          <button
                            onClick={() => handleCourseClick(course)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View Materials
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📚</span>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">No courses yet</p>
                      <p className="text-gray-400 text-sm mt-1">Create your first course to get started</p>
                    </div>
                  )}
                </div>
              </div>

            {/* Materials Management Section */}
            <div id="materials-section" className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Materials Library</h3>
                    <p className="text-gray-600">Manage all uploaded materials ({materials.length} items)</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
                  {materials.length > 0 ? 'Click delete to remove materials' : 'No materials uploaded yet'}
                </div>
              </div>

              <div className="grid gap-6">
                {materials.map((material) => (
                  <div key={material.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-start space-x-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          {(() => {
                            if (material.type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
                            if (material.type.includes('image')) return <ImageIcon className="h-5 w-5 text-green-500" />;
                            if (material.type.includes('video')) return <Play className="h-5 w-5 text-purple-500" />;
                            if (material.type.includes('document') || material.type.includes('word')) return <FileText className="h-5 w-5 text-blue-500" />;
                            return <FileText className="h-5 w-5 text-gray-500" />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-lg mb-1 truncate">{material.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {material.course_code || 'Unknown Course'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(material.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {material.type}
                            </span>
                            {material.size && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {material.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        {material.file_url && (
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          title="Delete this material permanently"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && (
                  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <FolderOpen className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Materials Found</h3>
                    <p className="text-gray-600 text-lg mb-4">Upload some materials to see them here</p>
                    <div className="text-sm text-gray-500">Materials will appear as beautiful cards with file type indicators</div>
                  </div>
                )}
              </div>
            </div>

            {/* Notices Management Section */}
            <div id="notices-section" className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📢 Notices Management</h3>
                <button
                  onClick={() => setShowCreateNotice(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Notice
                </button>
              </div>
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-4 border rounded-lg ${notice.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notice.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            notice.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            notice.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            notice.type === 'success' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {notice.type}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${notice.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {notice.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notice.content}</p>
                        <p className="text-xs text-gray-400">{new Date(notice.created_at).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        className="ml-4 inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {notices.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No notices found</p>
                )}
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Course</h2>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Course Code"
                  value={newCourse.code}
                  onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <textarea
                  placeholder="Course Description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateCourse(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload File Modal */}
        {showUploadFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Material</h2>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <select
                  value={newMaterial.course_id}
                  onChange={(e) => setNewMaterial({ ...newMaterial, course_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.code}>{course.name} ({course.code})</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Material Title"
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <select
                  value={newMaterial.type}
                  onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as Material['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">Document</option>
                  <option value="video">Video</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="past_question">Past Question</option>
                </select>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewMaterial({ ...newMaterial, file });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.avi"
                />
                <input
                  type="url"
                  placeholder="Video URL (optional)"
                  value={newMaterial.video_url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, video_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadFile(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Notice Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create Notice</h2>
                <button
                  onClick={() => {
                    setShowCreateNotice(false);
                    setNewNotice({ title: '', content: '', type: 'info', is_active: true });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newNotice.title}
                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notice title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newNotice.content}
                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Notice content..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newNotice.type}
                    onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value as Notice['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="success">Success</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newNotice.is_active}
                    onChange={(e) => setNewNotice({ ...newNotice, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active (show to students)
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateNotice(false);
                      setNewNotice({ title: '', content: '', type: 'info', is_active: true });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotice}
                    disabled={!newNotice.title || !newNotice.content}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Notice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exam Routine Upload Modal */}
        {showExamRoutineUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">📅 Upload Exam Routine</h2>
                <button
                  onClick={() => setShowExamRoutineUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleExamRoutineUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Routine Image (PNG only)
                  </label>
                  <input
                    type="file"
                    accept=".png"
                    onChange={(e) => setExamRoutineFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload the midterm exam routine for Section 5 (Starting 14/09/2025)
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowExamRoutineUpload(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !examRoutineFile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : 'Upload Routine'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notice Modal */}
        {showNoticeModal && selectedNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className={`p-6 border-l-4 ${
                selectedNotice.type === 'info' ? 'border-blue-400 bg-blue-50' :
                selectedNotice.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                selectedNotice.type === 'success' ? 'border-green-400 bg-green-50' :
                'border-red-400 bg-red-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedNotice.type === 'info' ? 'bg-blue-100' :
                      selectedNotice.type === 'warning' ? 'bg-yellow-100' :
                      selectedNotice.type === 'success' ? 'bg-green-100' :
                      'bg-red-100'
                    }`}>
                      <Bell className={`h-6 w-6 ${
                        selectedNotice.type === 'info' ? 'text-blue-600' :
                        selectedNotice.type === 'warning' ? 'text-yellow-600' :
                        selectedNotice.type === 'success' ? 'text-green-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedNotice.title}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedNotice.type === 'info' ? 'bg-blue-100 text-blue-800' :
                          selectedNotice.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          selectedNotice.type === 'success' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedNotice.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">
                          Posted on {new Date(selectedNotice.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeNoticeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                <div className="prose prose-gray max-w-none">
                  {(() => {
                    const content = selectedNotice.content;
                    const imageMatch = content.match(/\[EXAM_ROUTINE_IMAGE\](.*?)\[\/EXAM_ROUTINE_IMAGE\]/);
                    
                    if (imageMatch) {
                      const imageData = imageMatch[1];
                      const textContent = content.replace(/\[EXAM_ROUTINE_IMAGE\].*?\[\/EXAM_ROUTINE_IMAGE\]/g, '');
                      
                      return (
                        <div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6">
                            {textContent}
                          </p>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <h4 className="font-semibold text-gray-900 mb-3">📋 Exam Routine</h4>
                            <img 
                              src={imageData} 
                              alt="Midterm Exam Routine - Section 5" 
                              className="max-w-full h-auto rounded-lg shadow-lg mx-auto border border-gray-200"
                              style={{maxHeight: '600px'}}
                            />
                            <p className="text-sm text-gray-600 mt-2">
                              Click on the image to view in full size
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {content}
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
              
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-end">
                  <button
                    onClick={closeNoticeModal}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;