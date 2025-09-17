import { useState, useEffect } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Notice } from './types';
import { getGoogleDriveLink, getCourseCategories, getCategoryInfo, getCourseFiles } from './config/googleDrive';
import { getCurrentSemesterStatus } from './config/semester';
import SemesterTracker from './components/SemesterTracker';
import { ExamMaterialsDashboard } from './components/Student/ExamMaterialsDashboard';
import PDFViewer from './components/PDFViewer';
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
  ImageIcon,
  Clock
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
  const [currentView, setCurrentView] = useState<'admin' | 'section5' | 'course' | 'home' | 'semester' | 'examMaterials'>(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/section5') return 'section5';
    if (path === '/semester') return 'semester';
    if (path === '/exam-materials') return 'examMaterials';
    if (path.startsWith('/course/')) return 'course';
    if (path === '/home') return 'home';
    return 'home';
  });

  // Helper to change view and update browser history
  const goToView = (view: 'admin' | 'section5' | 'course' | 'home' | 'semester' | 'examMaterials', extra?: string | null) => {
    let path = '/';
    if (view === 'admin') path = '/admin';
    else if (view === 'section5') path = '/section5';
    else if (view === 'semester') path = '/semester';
    else if (view === 'examMaterials') path = '/exam-materials';
    else if (view === 'course' && extra) path = `/course/${extra}`;
    else if (view === 'home') path = '/home';
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  // Listen for browser back/forward events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setCurrentView('admin');
      else if (path === '/section5') setCurrentView('section5');
      else if (path === '/semester') setCurrentView('semester');
      else if (path === '/exam-materials') setCurrentView('examMaterials');
      else if (path.startsWith('/course/')) setCurrentView('course');
      else if (path === '/home') setCurrentView('home');
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
  const [totalMaterialsCount, setTotalMaterialsCount] = useState<number>(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [semesterStatus, setSemesterStatus] = useState(getCurrentSemesterStatus());
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showNoticePanel, setShowNoticePanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [unreadNotices, setUnreadNotices] = useState<string[]>([]);
  
  // File viewer modal states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  
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
    category: 'announcement' as 'random' | 'exam' | 'event' | 'information' | 'academic' | 'announcement',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    exam_type: null as 'midterm' | 'final' | null,
    event_date: '',
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

  // Load total materials count when accessing admin panel
  useEffect(() => {
    if (currentView === 'admin' && isAdmin) {
      loadTotalMaterialsCount();
    }
  }, [currentView, isAdmin]);

  // Real-time clock and semester status updates
  useEffect(() => {
    const updateTimeAndStatus = () => {
      setCurrentTime(new Date());
      setSemesterStatus(getCurrentSemesterStatus());
    };

    // Update immediately
    updateTimeAndStatus();
    
    // Update every second for real-time display
    const interval = setInterval(updateTimeAndStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // No longer auto-create welcome notice - Admin must manually create notices
  // useEffect removed to prevent automatic welcome notice spam

  // Auto-refresh notices every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing notices...');
      loadNotices();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Real-time semester tracking - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setSemesterStatus(getCurrentSemesterStatus());
    }, 1000); // Update every second for live clock

    return () => clearInterval(interval);
  }, []);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close mobile menu if clicking outside of it
      if (showMobileMenu) {
        const mobileMenuButton = document.querySelector('[title="Menu"]');
        const mobileMenuDropdown = document.querySelector('.mobile-menu-dropdown');
        
        if (mobileMenuButton && mobileMenuDropdown) {
          if (!mobileMenuButton.contains(target) && !mobileMenuDropdown.contains(target)) {
            setShowMobileMenu(false);
          }
        }
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

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
  category TEXT CHECK (category IN ('random', 'exam', 'event', 'information', 'academic', 'announcement')) DEFAULT 'announcement',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  exam_type TEXT CHECK (exam_type IN ('midterm', 'final')) DEFAULT NULL,
  event_date DATE DEFAULT NULL,
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

  // Load total materials count for admin dashboard
  const loadTotalMaterialsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalMaterialsCount(count || 0);
    } catch (error) {
      console.error('Error loading total materials count:', error);
      setTotalMaterialsCount(0);
    }
  };

  // Create welcome notice if it doesn't exist
  // Initialize default notices (Welcome + Exam Routine slots)
  const initializeDefaultNotices = async () => {
    try {
      console.log('Checking for default notices...');
      
      // Check database for existing welcome and routine notices
      const { data } = await supabase
        .from('notices')
        .select('*')
        .in('id', ['welcome-notice', 'exam-routine-notice']);

      let welcomeNotice = null;
      let routineNotice = null;

      if (data) {
        welcomeNotice = data.find(n => n.id === 'welcome-notice');
        routineNotice = data.find(n => n.id === 'exam-routine-notice');
      }

      const defaultNotices = [];

      // Create default welcome notice if it doesn't exist
      if (!welcomeNotice) {
        welcomeNotice = {
          id: 'welcome-notice',
          title: '🎉 Welcome to Edu51Five - BUBT Intake 51 Section 5',
          content: `Dear BUBT Intake 51 Students,

Welcome to Edu51Five, your comprehensive learning platform designed specifically for your academic excellence and exam preparation success!

🎯 **Your Exam Success Platform:**
📚 Complete Study Materials • 📝 Past Exam Questions • 🔔 Real-time Updates

This platform is your centralized hub for all Section 5 (Computer Science & Engineering) resources. Use it regularly to stay ahead in your studies and achieve academic excellence!

Best of luck with your studies!
- Edu51Five Team`,
          type: 'info',
          is_active: true,
          created_at: new Date().toISOString()
        };

        // Try to save to database
        try {
          await supabase.from('notices').insert([welcomeNotice]);
          console.log('Default welcome notice created in database');
        } catch (dbError) {
          console.log('Welcome notice saved locally only');
        }
      }

      // Create placeholder for exam routine if it doesn't exist
      if (!routineNotice) {
        routineNotice = {
          id: 'exam-routine-notice',
          title: '📅 Midterm Exam Routine - Section 5',
          content: `Midterm examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information:**
• Start Date: Sunday, September 14, 2025
• All students must check the detailed routine below
• Arrive 15 minutes early for each exam
• Bring student ID and necessary materials

⚠️ **Admin Notice:** Use the admin panel to upload the detailed exam routine image. This notice will be automatically updated when the routine is uploaded.

For any queries, contact your course instructors or the department.`,
          type: 'warning',
          is_active: true,
          created_at: new Date().toISOString()
        };

        // Try to save to database
        try {
          await supabase.from('notices').insert([routineNotice]);
          console.log('Default routine notice created in database');
        } catch (dbError) {
          console.log('Routine notice saved locally only');
        }
      }

      // Always show these 2 notices (welcome + routine)
      defaultNotices.push(welcomeNotice, routineNotice);
      
      // Filter only active notices and limit to 2
      const activeNotices = defaultNotices.filter(n => n && n.is_active).slice(0, 2);
      
      setNotices(activeNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(activeNotices));
      
      console.log('Initialized with default notices:', activeNotices.length);

    } catch (error) {
      console.error('Error initializing default notices:', error);
      // Fallback to empty notices
      setNotices([]);
    }
  };

  // Load notices - Global 2-notice system (Welcome + Exam Routine)
  const loadNotices = async () => {
    try {
      console.log('Loading global notices (Welcome + Exam Routine)...');
      
      // Try to load the 2 specific notices from database
      const { data: dbNotices, error } = await supabase
        .from('notices')
        .select('*')
        .in('id', ['welcome-notice', 'exam-routine-notice'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      let welcomeNotice = null;
      let routineNotice = null;

      // If database query successful, extract the notices
      if (!error && dbNotices) {
        welcomeNotice = dbNotices.find(n => n.id === 'welcome-notice');
        routineNotice = dbNotices.find(n => n.id === 'exam-routine-notice');
        console.log('Database notices found:', { welcome: !!welcomeNotice, routine: !!routineNotice });
      }

      // Fallback to localStorage if notices not found in database
      const localNoticesStr = localStorage.getItem('edu51five_notices');
      if (localNoticesStr && (!welcomeNotice || !routineNotice)) {
        try {
          const localNotices = JSON.parse(localNoticesStr);
          if (!welcomeNotice) {
            welcomeNotice = localNotices.find((n: Notice) => n.id === 'welcome-notice');
          }
          if (!routineNotice) {
            routineNotice = localNotices.find((n: Notice) => n.id === 'exam-routine-notice');
          }
          console.log('Local fallback used for missing notices');
        } catch (e) {
          console.error('Error parsing local notices:', e);
        }
      }

      // If notices still don't exist, initialize defaults
      if (!welcomeNotice || !routineNotice) {
        console.log('Initializing missing default notices...');
        await initializeDefaultNotices();
        return; // initializeDefaultNotices will handle setting the notices
      }

      // Always show exactly 2 notices: Welcome + Routine
      const globalNotices = [welcomeNotice, routineNotice].filter(n => n);
      
      setNotices(globalNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(globalNotices));
      
      console.log('Global notices loaded:', globalNotices.length, 'notices');
      
    } catch (err) {
      console.error('Error loading global notices:', err);
      
      // Final fallback - try to initialize defaults
      try {
        await initializeDefaultNotices();
      } catch (initError) {
        console.error('Failed to initialize default notices:', initError);
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

  // File viewer functions
  const openFileViewer = (fileUrl: string, fileName: string) => {
    // Convert Google Drive URL to embeddable format
    let embedUrl = fileUrl;
    
    // Handle different Google Drive URL formats
    if (fileUrl.includes('drive.google.com')) {
      // Extract file ID from various Google Drive URL formats
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      } else {
        // Fallback for folder URLs - open in new tab
        window.open(fileUrl, '_blank');
        return;
      }
    }
    
    setCurrentFileUrl(embedUrl);
    setCurrentFileName(fileName);
    setShowFileViewer(true);
  };

  const closeFileViewer = () => {
    setShowFileViewer(false);
    setCurrentFileUrl('');
    setCurrentFileName('');
  };

  // Toggle notice panel
  const toggleNoticePanel = () => {
    setShowNoticePanel(!showNoticePanel);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Get unread notice count
  const getUnreadNoticeCount = () => {
    return notices.filter(notice => 
      notice.is_active && !unreadNotices.includes(notice.id)
    ).length;
  };

  // Mark notice as read
  const markNoticeAsRead = (noticeId: string) => {
    if (!unreadNotices.includes(noticeId)) {
      setUnreadNotices([...unreadNotices, noticeId]);
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
      loadTotalMaterialsCount(); // Update total count
      
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

  // Course color schemes for unique visual identity
  const getCourseColorScheme = (courseCode: string, index: number) => {
    const colorSchemes = [
      {
        gradient: 'from-blue-500 to-purple-600',
        bgGradient: 'from-blue-50 via-purple-50 to-indigo-100',
        accent: 'blue-500',
        textGradient: 'from-blue-600 to-purple-600',
        badge: 'bg-blue-100 text-blue-700',
        border: 'border-blue-300'
      },
      {
        gradient: 'from-emerald-500 to-teal-600', 
        bgGradient: 'from-emerald-50 via-teal-50 to-cyan-100',
        accent: 'emerald-500',
        textGradient: 'from-emerald-600 to-teal-600',
        badge: 'bg-emerald-100 text-emerald-700',
        border: 'border-emerald-300'
      },
      {
        gradient: 'from-orange-500 to-red-600',
        bgGradient: 'from-orange-50 via-red-50 to-pink-100', 
        accent: 'orange-500',
        textGradient: 'from-orange-600 to-red-600',
        badge: 'bg-orange-100 text-orange-700',
        border: 'border-orange-300'
      },
      {
        gradient: 'from-violet-500 to-fuchsia-600',
        bgGradient: 'from-violet-50 via-fuchsia-50 to-pink-100',
        accent: 'violet-500', 
        textGradient: 'from-violet-600 to-fuchsia-600',
        badge: 'bg-violet-100 text-violet-700',
        border: 'border-violet-300'
      },
      {
        gradient: 'from-cyan-500 to-blue-600',
        bgGradient: 'from-cyan-50 via-blue-50 to-indigo-100',
        accent: 'cyan-500',
        textGradient: 'from-cyan-600 to-blue-600', 
        badge: 'bg-cyan-100 text-cyan-700',
        border: 'border-cyan-300'
      },
      {
        gradient: 'from-rose-500 to-pink-600',
        bgGradient: 'from-rose-50 via-pink-50 to-fuchsia-100',
        accent: 'rose-500',
        textGradient: 'from-rose-600 to-pink-600',
        badge: 'bg-rose-100 text-rose-700', 
        border: 'border-rose-300'
      }
    ];
    
    return colorSchemes[index % colorSchemes.length];
  };

  // Material color schemes for diversity
  const getMaterialColorScheme = (materialId: string, index: number) => {
    const materialSchemes = [
      { bg: 'from-white via-blue-50 to-indigo-100', accent: 'from-blue-500 to-indigo-600' },
      { bg: 'from-white via-green-50 to-emerald-100', accent: 'from-green-500 to-emerald-600' },
      { bg: 'from-white via-purple-50 to-violet-100', accent: 'from-purple-500 to-violet-600' },
      { bg: 'from-white via-orange-50 to-amber-100', accent: 'from-orange-500 to-amber-600' },
      { bg: 'from-white via-pink-50 to-rose-100', accent: 'from-pink-500 to-rose-600' },
      { bg: 'from-white via-teal-50 to-cyan-100', accent: 'from-teal-500 to-cyan-600' }
    ];
    
    return materialSchemes[index % materialSchemes.length];
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminError('');
      loadTotalMaterialsCount(); // Load total materials count for dashboard
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
      loadTotalMaterialsCount(); // Update total count
      
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

  // Admin: Update global notices (Welcome or Exam Routine only)
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Determine which global notice slot this should update
      let noticeId: string;
      let noticeTitle: string;
      
      if (newNotice.title.toLowerCase().includes('welcome') || 
          newNotice.title.toLowerCase().includes('intro')) {
        noticeId = 'welcome-notice';
        noticeTitle = '🎉 Welcome to Edu51Five - BUBT Intake 51 Section 5';
      } else if (newNotice.title.toLowerCase().includes('exam') || 
                 newNotice.title.toLowerCase().includes('routine') ||
                 newNotice.title.toLowerCase().includes('midterm')) {
        noticeId = 'exam-routine-notice';
        noticeTitle = '📅 Midterm Exam Routine - Section 5';
      } else {
        // Default to exam routine slot for other admin notices
        noticeId = 'exam-routine-notice';
        noticeTitle = newNotice.title;
      }
      
      const notice: Notice = {
        id: noticeId,
        title: noticeTitle,
        content: newNotice.content,
        type: newNotice.type,
        category: newNotice.category,
        priority: newNotice.priority,
        exam_type: newNotice.exam_type,
        event_date: newNotice.event_date,
        created_at: new Date().toISOString(),
        is_active: newNotice.is_active
      };

      console.log('Updating global notice slot:', noticeId);

      // Update the specific notice in the global system
      const updatedNotices = [...notices];
      const existingIndex = updatedNotices.findIndex(n => n.id === noticeId);
      
      if (existingIndex >= 0) {
        updatedNotices[existingIndex] = notice;
      } else {
        // If we somehow don't have this notice, add it
        updatedNotices.push(notice);
      }

      setNotices(updatedNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('Global notice updated in localStorage');

      // Try to save to database
      try {
        // Use upsert to update or insert
        const { error } = await supabase
          .from('notices')
          .upsert([notice], { onConflict: 'id' });
        
        if (error) {
          console.error('Database save failed:', error);
          console.log('Notice saved locally only.');
        } else {
          console.log('Global notice saved to database successfully');
        }
      } catch (dbError) {
        console.warn('Database not available, using local storage:', dbError);
      }
      
      // Reset form
      setNewNotice({ 
        title: '', 
        content: '', 
        type: 'info', 
        category: 'announcement',
        priority: 'normal',
        exam_type: null,
        event_date: '',
        is_active: true 
      });
      setShowCreateNotice(false);
      
      alert(`Global ${noticeId === 'welcome-notice' ? 'Welcome' : 'Exam Routine'} notice updated successfully!`);
      
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Error creating notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Delete notice
  const handleDeleteNotice = async (noticeId: string) => {
    // Prevent deletion of global system notices
    if (noticeId === 'welcome-notice' || noticeId === 'exam-routine-notice') {
      alert('❌ Cannot delete global system notices!\n\nUse "Update Notice" to modify the Welcome or Exam Routine content instead.');
      return;
    }
    
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

  // Admin: Reset exam routine to default content
  const handleDeleteExamRoutine = async (noticeId: string) => {
    // Only allow deletion of exam routine notice
    if (noticeId !== 'exam-routine-notice') {
      alert('❌ This action is only available for exam routine notices.');
      return;
    }
    
    if (!confirm('⚠️ This will reset the exam routine to default content and remove any uploaded image. Continue?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Find the current routine notice for storage cleanup
      const routineNotice = notices.find(n => n.id === 'exam-routine-notice');
      
      // Clean up Supabase Storage if the notice used URL-based storage
      if (routineNotice?.content.includes('[EXAM_ROUTINE_URL]')) {
        try {
          const urlMatch = routineNotice.content.match(/\[EXAM_ROUTINE_URL\](.*?)\[\/EXAM_ROUTINE_URL\]/);
          if (urlMatch) {
            const imageUrl = urlMatch[1];
            // Extract filename from URL
            const filename = imageUrl.split('/').pop();
            if (filename) {
              console.log('Attempting to delete image from storage:', filename);
              await supabase.storage.from('exam-routines').remove([filename]);
              console.log('Image deleted from Supabase Storage');
            }
          }
        } catch (storageError) {
          console.warn('Could not delete image from storage:', storageError);
        }
      }
      
      // Reset to default exam routine notice
      const defaultRoutineNotice: Notice = {
        id: 'exam-routine-notice',
        title: '📅 Midterm Exam Routine - Section 5',
        content: `Midterm examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information:**
• Start Date: Sunday, September 14, 2025
• All students must check the detailed routine below
• Arrive 15 minutes early for each exam
• Bring student ID and necessary materials

⚠️ **Admin Notice:** Use the admin panel to upload the detailed exam routine image. This notice will be automatically updated when the routine is uploaded.

For any queries, contact your course instructors or the department.`,
        type: 'warning',
        category: 'exam',
        priority: 'high',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      // Update the global notice slot
      const updatedNotices = [...notices];
      const routineIndex = updatedNotices.findIndex(n => n.id === 'exam-routine-notice');
      
      if (routineIndex >= 0) {
        updatedNotices[routineIndex] = defaultRoutineNotice;
      }
      
      setNotices(updatedNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('Exam routine reset to default content');
      
      // Update in database
      try {
        const { error } = await supabase
          .from('notices')
          .upsert([defaultRoutineNotice], { onConflict: 'id' });
        
        if (error) {
          console.error('Database update error:', error);
          alert('Exam routine reset locally but database update failed.');
        } else {
          console.log('Exam routine reset in database');
          alert('✅ Exam routine has been reset to default content.\n\nYou can now upload a new routine image.');
        }
      } catch (error) {
        console.warn('Database update failed:', error);
        alert('Exam routine reset locally but database update may be needed.');
      }
    } catch (error) {
      console.error('Error resetting exam routine:', error);
      alert('Error resetting exam routine. Please try again.');
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
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors no-select"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Enhanced Mobile-First Responsive Header */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white shadow-2xl border-b border-gray-700/40 z-40">
        <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 lg:h-22 xl:h-24">
            
            {/* Left Side - Logo and Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 flex-shrink-0 min-w-0">
              <button
                onClick={() => goToView('home')}
                className="flex items-center space-x-2 sm:space-x-3 focus:outline-none group"
                title="Go to Home"
              >
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 rounded-xl shadow-xl bg-gradient-to-br from-white to-gray-50 p-1 border-2 border-white/30 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <img 
                      src="/Edu_51_Logo.png" 
                      alt="Edu51Five Logo" 
                      className="h-full w-full object-cover rounded-lg no-select transform transition-transform duration-300 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold no-select text-white truncate">
                    Edu<span className="text-red-400">51</span>Five
                  </h1>
                  <p className="text-xs sm:text-xs md:text-sm text-gray-300 no-select truncate">Intake 51</p>
                </div>
              </button>
            </div>

            {/* Real-time Semester Dashboard - Beautiful Display (Non-clickable) */}
            <div className="hidden lg:flex items-center space-x-5 xl:space-x-6 glass-card px-6 py-3 transition-all duration-300 shadow-lg">
              {/* Live Clock with Animation */}
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 bg-opacity-30 rounded-lg transition-all duration-300">
                  <Clock className="h-4 w-4 text-blue-200 semester-clock-pulse" />
                </div>
                <div className="text-right">
                  <div className="responsive-text-sm font-bold text-white no-select transition-colors duration-300">
                    {currentTime.toLocaleDateString('en-BD', {
                      timeZone: 'Asia/Dhaka',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="responsive-text-xs text-blue-200 no-select font-medium">
                    {currentTime.toLocaleTimeString('en-BD', {
                      timeZone: 'Asia/Dhaka',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    })} BST
                  </div>
                </div>
              </div>

              {/* Semester Progress with Modern Design */}
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="responsive-text-sm font-bold text-white no-select transition-colors duration-300">
                    {semesterStatus.semesterName} - Week {semesterStatus.semesterWeek}
                  </div>
                  <div className="responsive-text-xs text-blue-200 no-select font-medium">
                    {semesterStatus.currentPhase}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-20 bg-blue-800 bg-opacity-50 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="h-full semester-progress-bar transition-all duration-500 progress-glow"
                      style={{ width: `${semesterStatus.progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className="responsive-text-xs text-blue-200 mt-1.5 no-select font-bold transition-colors duration-300">
                    {semesterStatus.progressPercentage}%
                  </span>
                </div>
              </div>

              {/* Next Milestone with Enhanced Style */}
              <div className="text-right">
                <div className={`responsive-text-sm font-bold no-select milestone-indicator transition-colors duration-300 ${
                  semesterStatus.daysToMilestone <= 7 ? 'urgent text-orange-200' : 'text-white'
                }`}>
                  {semesterStatus.nextMilestone}
                </div>
                <div className="responsive-text-xs text-blue-200 no-select font-medium">
                  {semesterStatus.daysToMilestone > 0 
                    ? `${semesterStatus.daysToMilestone} days left`
                    : 'Active now'
                  }
                </div>
              </div>
            </div>

            {/* Mobile Semester Info - Ultra Compact Redesigned */}
            <div className="lg:hidden flex items-center space-x-1 glass-card rounded-md px-2 py-1 transition-all duration-200 shadow-sm">
              {/* Left: Date */}
              <div className="flex items-center space-x-1 min-w-0">
                <div className="p-0.5 bg-blue-600 bg-opacity-30 rounded transition-all duration-300 flex-shrink-0">
                  <Calendar className="h-2.5 w-2.5 text-blue-200 transition-colors duration-300" />
                </div>
                <div className="text-xs text-white no-select font-medium transition-colors duration-300">
                  {currentTime.toLocaleDateString('en-BD', {
                    timeZone: 'Asia/Dhaka',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Center: Phase above Progress Bar with Week */}
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                {/* Phase text above */}
                <div className="text-xs text-orange-200 no-select font-bold transition-colors duration-300 mb-0.5">
                  {semesterStatus.currentPhase === 'Mid-term Examinations' ? 'Mid-term' : semesterStatus.currentPhase.split(' ')[0]}
                </div>
                {/* Progress bar */}
                <div className="w-10 bg-blue-800 bg-opacity-50 rounded-full h-1 overflow-hidden shadow-inner mb-0.5">
                  <div 
                    className="h-full semester-progress-bar transition-all duration-500 progress-glow"
                    style={{ width: `${semesterStatus.progressPercentage}%` }}
                  ></div>
                </div>
                {/* Week below */}
                <span className="text-xs text-blue-200 no-select font-bold transition-colors duration-300">
                  W{semesterStatus.semesterWeek}
                </span>
              </div>
            </div>
            
            {/* Right Side - Mobile-First Navigation */}
            <div className="flex items-center flex-shrink-0">
              
              {/* Mobile Menu Button - Shows on mobile/tablet */}
              <div className="relative md:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 transition-all duration-300 shadow-lg border border-blue-400/40 group"
                  title="Menu"
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  {getUnreadNoticeCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-xl border border-white animate-pulse">
                      {getUnreadNoticeCount()}
                    </span>
                  )}
                </button>

                {/* Mobile Dropdown Menu - Enhanced Mobile Design */}
                {showMobileMenu && (
                  <div className="mobile-menu-dropdown absolute top-full right-0 mt-3 w-72 sm:w-80 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 z-50 animate-in slide-in-from-top-2 duration-300">
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Smart Exam Materials */}
                      <button
                        onClick={() => {
                          goToView('examMaterials');
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/30 hover:to-pink-500/30 transition-all duration-300 group border border-orange-500/20 hover:border-orange-400/40"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white drop-shadow-sm" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-white font-semibold text-base block">Smart Exam Materials</span>
                          <span className="text-gray-300 text-sm">Access study resources</span>
                        </div>
                      </button>
                      
                      {/* Semester Tracker */}
                      <button
                        onClick={() => {
                          goToView('semester');
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 group border border-blue-500/20 hover:border-blue-400/40"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-white drop-shadow-sm" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-white font-semibold text-base block">Semester Tracker</span>
                          <span className="text-gray-300 text-sm">Track your progress</span>
                        </div>
                      </button>
                      
                      {/* Notifications Section - Enhanced as Interactive Button */}
                      <button
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowNoticePanel(true);
                        }}
                        className="w-full flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30 transition-all duration-300 group border border-indigo-500/20 hover:border-indigo-400/40"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center relative">
                          <Bell className="h-5 w-5 text-white drop-shadow-sm" />
                          {getUnreadNoticeCount() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-lg border border-white animate-pulse">
                              {getUnreadNoticeCount()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className="text-white font-semibold text-base block">Notifications</span>
                          <span className="text-gray-300 text-sm">
                            {getUnreadNoticeCount() > 0 ? `${getUnreadNoticeCount()} new notifications` : 'No new notifications'}
                          </span>
                        </div>
                      </button>
                      
                      {/* Optional: Separator for clarity */}
                      <div className="border-t border-gray-700/30 pt-2">
                        <div className="text-center">
                          <span className="text-gray-400 text-xs font-medium">💡 Tap any option above to navigate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Navigation - Shows on medium screens and up */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                {/* Modern Exam Materials Button */}
                <button
                  onClick={() => goToView('examMaterials')}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-400 hover:via-red-400 hover:to-pink-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20 group"
                  title="Smart Exam Materials"
                >
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-white group-hover:scale-110 transition-transform drop-shadow-lg" />
                </button>

                {/* Modern Semester Tracker Button */}
                <button
                  onClick={() => goToView('semester')}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20 group"
                  title="Semester Tracker"
                >
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-white group-hover:scale-110 transition-transform drop-shadow-lg" />
                </button>

                {/* Professional Notice Bell Icon */}
                <div className="relative">
                  <button
                    onClick={toggleNoticePanel}
                    className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-blue-400/40 hover:border-blue-300/60 group"
                    title="Notifications"
                  >
                    <Bell className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-white group-hover:scale-110 transition-transform drop-shadow-lg" />
                    {getUnreadNoticeCount() > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 flex items-center justify-center font-bold shadow-xl border border-white animate-pulse">
                        {getUnreadNoticeCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={handleAdminLogout}
                  className="px-2 py-1 md:px-4 md:py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Admin Logout</span>
                  <span className="sm:hidden">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modern Notice Panel with Glassmorphism */}
      {showNoticePanel && (
        <div className="fixed top-16 md:top-20 right-2 md:right-4 w-80 sm:w-96 max-w-[calc(100vw-1rem)] backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl border border-white/30 z-50 max-h-80 md:max-h-96 overflow-hidden">
          {/* Professional Header with Enhanced Gradient */}
          <div className="bg-gradient-to-r from-gray-800 via-slate-800 to-gray-800 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-3xl shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center text-sm md:text-base">
                <div className="p-2 bg-white/20 rounded-xl mr-3 shadow-lg border border-white/30">
                  <Bell className="h-4 w-4 text-white drop-shadow-lg" />
                </div>
                <span className="text-white drop-shadow-sm">Notifications</span>
              </h3>
              <button
                onClick={() => setShowNoticePanel(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 p-2 rounded-2xl shadow-md border border-white/20 hover:border-white/30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Content Area with Modern Scrollbar */}
          <div className="max-h-56 md:max-h-64 overflow-y-auto scrollbar-modern">
            {notices.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl mb-4">
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-400 text-xs mt-1">Stay tuned for updates!</p>
              </div>
            ) : (
              notices.filter(notice => notice.is_active).map((notice, index) => (
                <div
                  key={notice.id}
                  className="p-4 md:p-5 border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
                  onClick={() => {
                    handleNoticeClick(notice);
                    markNoticeAsRead(notice.id);
                    setShowNoticePanel(false);
                  }}
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    {/* Modern Category & Priority Icon */}
                    <div className={`p-2 md:p-3 rounded-2xl flex-shrink-0 relative shadow-lg transition-all duration-300 ${
                      notice.type === 'info' ? 'bg-gradient-to-r from-blue-100 to-blue-200' :
                      notice.type === 'warning' ? 'bg-gradient-to-r from-yellow-100 to-orange-200' :
                      notice.type === 'success' ? 'bg-gradient-to-r from-green-100 to-emerald-200' :
                      'bg-gradient-to-r from-red-100 to-pink-200'
                    }`}>
                      {/* Category-based icons with modern styling */}
                      {notice.category === 'exam' ? (
                        <span className="text-lg drop-shadow-sm">📚</span>
                      ) : notice.category === 'event' ? (
                        <span className="text-lg drop-shadow-sm">🎉</span>
                      ) : notice.category === 'academic' ? (
                        <span className="text-lg drop-shadow-sm">🎓</span>
                      ) : notice.category === 'information' ? (
                        <span className="text-lg drop-shadow-sm">ℹ️</span>
                      ) : notice.category === 'random' ? (
                        <span className="text-lg drop-shadow-sm">🎲</span>
                      ) : (
                        <Bell className={`h-4 w-4 md:h-5 md:w-5 drop-shadow-sm ${
                          notice.type === 'info' ? 'text-blue-600' :
                          notice.type === 'warning' ? 'text-yellow-600' :
                          notice.type === 'success' ? 'text-green-600' :
                          'text-red-600'
                        }`} />
                      )}
                      
                      {/* Modern Priority indicator */}
                      {notice.priority === 'urgent' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg border border-white"></div>
                      )}
                      {notice.priority === 'high' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full shadow-md border border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Modern Title with category badge */}
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 flex-1 leading-relaxed">
                          {notice.title}
                        </p>
                        {notice.category === 'exam' && notice.exam_type && (
                          <span className="text-xs bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-2 py-1 rounded-full whitespace-nowrap font-medium shadow-sm">
                            {notice.exam_type === 'midterm' ? '📝 Mid' : '🎯 Final'}
                          </span>
                        )}
                      </div>
                      
                      {/* Modern Date and badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </p>
                        
                        {/* Modern Priority badges */}
                        {notice.priority === 'urgent' && (
                          <span className="text-xs bg-gradient-to-r from-red-100 to-pink-100 text-red-800 px-2 py-1 rounded-full font-bold animate-pulse shadow-sm">
                            🔴 URGENT
                          </span>
                        )}
                        {notice.priority === 'high' && (
                          <span className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-2 py-1 rounded-full font-semibold shadow-sm">
                            🟡 HIGH
                          </span>
                        )}
                        
                        {/* Modern Event date */}
                        {notice.category === 'event' && notice.event_date && (
                          <span className="text-xs bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 px-2 py-1 rounded-full font-medium shadow-sm">
                            📅 {new Date(notice.event_date).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        </div>
                        
                        {/* Modern New indicator */}
                        {!unreadNotices.includes(notice.id) && (
                          <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full font-bold shadow-lg animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Professional Footer */}
          {notices.length > 0 && (
            <div className="bg-gradient-to-r from-gray-100/90 to-slate-100/90 px-4 py-3 rounded-b-3xl border-t border-gray-200/60 shadow-inner">
              <p className="text-xs text-center text-gray-700 font-medium">
                💡 Click any notification to view details
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Enhanced Mobile Responsive Design */}
      {currentView !== 'semester' && (
        <main className="pt-16 sm:pt-18 md:pt-20 lg:pt-22 xl:pt-24 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Home Page */}
        {currentView === 'home' && (
          <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {/* Hero Section - Enhanced Mobile Responsive Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/60 backdrop-blur-sm">
              {/* Decorative Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 sm:w-64 md:w-80 h-48 sm:h-64 md:h-80 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative z-10 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16">
                <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
                  {/* Enhanced Logo with Professional Styling */}
                  <div className="relative mb-6 sm:mb-8 md:mb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 mx-auto"></div>
                    <img 
                      src="/image.png" 
                      alt="Edu51Five Logo" 
                      className="relative h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 mx-auto object-contain shadow-2xl rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm border border-white/40 p-1.5 sm:p-2" 
                    />
                  </div>
                  
                  {/* Professional Typography with Mobile Optimization */}
                  <div className="space-y-3 sm:space-y-4 md:space-y-6 mb-8 sm:mb-10 md:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent no-select leading-tight px-2">
                      Welcome to Edu<span className="text-red-500">51</span>Five
                    </h1>
                    <div className="relative px-2">
                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-700 no-select">
                        BUBT Intake 51 Excellence Platform
                      </h2>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mt-1 sm:mt-2 font-medium no-select">
                        Department of Computer Science & Engineering
                      </p>
                    </div>
                  </div>

                  {/* Platform Features - Enhanced Mobile Layout */}
                  <div className="bg-white/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-white/50 mb-8 sm:mb-10">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="inline-flex items-center bg-gradient-to-r from-orange-500 to-red-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg mb-2 sm:mb-3">
                        <span className="text-base sm:text-lg text-white no-select">🎯</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 no-select">Platform Features</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {[
                        { icon: "📚", text: "Course Materials", desc: "Study resources" },
                        { icon: "📝", text: "Past Questions", desc: "Previous exams" },
                        { icon: "🔔", text: "Smart Notices", desc: "Important updates" },
                        { icon: "📁", text: "Google Drive", desc: "Cloud storage" },
                        { icon: "⏰", text: "Semester Tracker", desc: "Progress timeline" },
                        { icon: "📱", text: "Mobile Ready", desc: "Responsive design" }
                      ].map((feature, index) => (
                        <div key={index} className="bg-white/70 backdrop-blur-sm p-2 sm:p-3 rounded-lg border border-white/40 hover:bg-white/80 transition-colors duration-200">
                          <div className="text-center">
                            <span className="text-sm sm:text-base md:text-lg mb-1 sm:mb-2 block no-select">{feature.icon}</span>
                            <h4 className="text-xs sm:text-sm font-semibold text-gray-800 no-select leading-tight">{feature.text}</h4>
                            <p className="text-xs text-gray-600 no-select mt-0.5 sm:mt-1 hidden sm:block">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Section Cards with Mobile-First Design */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10 mb-8 sm:mb-10 md:mb-12 lg:mb-16">
                  {/* Active Section Card - Mobile Optimized */}
                  <div 
                    className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-2xl border border-white/60 hover:shadow-3xl cursor-pointer transition-all duration-500 transform hover:-translate-y-2 sm:hover:-translate-y-3 hover:border-blue-400/60"
                    onClick={() => goToView('section5')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-gradient-to-r from-emerald-500 via-blue-600 to-purple-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center shadow-xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
                        {/* Special Premium Badge Design */}
                        <div className="relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-lg"></div>
                          
                          {/* Main Crown/Shield Icon */}
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            {/* Crown Base */}
                            <path d="M5 16L3 10L7.5 12L12 8L16.5 12L21 10L19 16H5Z" opacity="0.9"/>
                            
                            {/* Crown Jewels */}
                            <circle cx="7.5" cy="11" r="1" className="text-yellow-300"/>
                            <circle cx="12" cy="9" r="1.2" className="text-yellow-200"/>
                            <circle cx="16.5" cy="11" r="1" className="text-yellow-300"/>
                            
                            {/* Special "5" in the center */}
                            <text x="12" y="14" textAnchor="middle" className="text-xs font-bold fill-white">5</text>
                            
                            {/* Decorative Stars */}
                            <path d="M6 6L6.5 7.5L8 8L6.5 8.5L6 10L5.5 8.5L4 8L5.5 7.5Z" opacity="0.7"/>
                            <path d="M18 6L18.5 7.5L20 8L18.5 8.5L18 10L17.5 8.5L16 8L17.5 7.5Z" opacity="0.7"/>
                          </svg>
                          
                          {/* Animated Glow Effect */}
                          <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/40 via-blue-400/40 to-purple-400/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                          
                          {/* Special Badge */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">★</span>
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 group-hover:text-blue-700 transition-colors duration-300 no-select">
                        Section 5 - CSE
                      </h3>
                      <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
                        Computer Science & Engineering Department - Your gateway to academic excellence
                      </p>
                      <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-2 sm:p-3 mb-4 sm:mb-6 border border-blue-200/50">
                        <p className="text-blue-800 font-semibold text-center">
                          <span className="text-2xl font-bold text-blue-600">{courses.length}</span> Active Courses Available
                        </p>
                      </div>
                      <div className="flex items-center text-blue-600 font-bold text-lg group-hover:text-blue-700 transition-colors duration-300">
                        <span className="no-select">Enter Learning Portal</span>
                        <svg className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Coming Soon Card */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-2xl border border-white/60 opacity-75">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/10"></div>
                    <div className="relative z-10">
                      <div className="bg-gradient-to-r from-gray-400 to-slate-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center shadow-xl mb-6">
                        <span className="text-3xl text-white no-select">🔧</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4 no-select">
                        Other Sections
                      </h3>
                      <p className="text-gray-500 mb-4 text-base md:text-lg leading-relaxed">
                        Additional departments and sections - Expanding the educational ecosystem
                      </p>
                      <div className="bg-gradient-to-r from-gray-100 to-slate-100 rounded-lg p-3 mb-6 border border-gray-200/50">
                        <p className="text-gray-600 font-semibold text-center">
                          More Sections Coming Soon...
                        </p>
                      </div>
                      <p className="text-gray-400 font-medium text-base">
                        🔔 Stay tuned for updates
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Footer Section */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden">
              <div className="relative z-10 p-6 md:p-8">
                {/* Contact & Connect Section */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">
                    Connect & Support
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 max-w-xl mx-auto">
                    Found a bug? Have suggestions? Let's connect and improve together.
                  </p>
                  
                  {/* Professional Contact Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
                    <a
                      href="mailto:miftahurr503@gmail.com?subject=Edu51Five%20Platform%20Contact&body=Hi%20Swapnil%2C%20I%20found%20your%20Edu51Five%20platform%20and%20want%20to%20connect!"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      Professional Email
                    </a>
                    <a
                      href="https://wa.me/8801318090383?text=Hi%20Swapnil%2C%20I%20found%20your%20Edu51Five%20platform%20and%20want%20to%20connect!"
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md"
                      target="_blank" rel="noopener noreferrer"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp Direct
                    </a>
                  </div>
                </div>

                {/* Developer & Copyright Section */}
                <div className="border-t border-slate-700/50 pt-6">
                  <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    {/* Developer Info */}
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border-2 border-blue-400/50">
                          <img 
                            src="/Swapnil.png" 
                            alt="Swapnil" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-slate-200 text-sm">
                            Developed by{' '}
                            <a 
                              href="https://www.facebook.com/mr.swapnil360" 
                              onClick={handleFacebookClick}
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-semibold hover:underline inline-flex items-center space-x-1"
                              title="Connect with Swapnil on Facebook"
                            >
                              <span>Swapnil</span>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </a>
                          </p>
                          <p className="text-slate-400 text-xs">Intake 51, Sec 5</p>
                          <p className="text-slate-400 text-xs">Dept. of CSE, BUBT</p>
                        </div>
                      </div>
                    </div>

                    {/* Copyright & Legal */}
                    <div className="text-center md:text-right">
                      <p className="text-slate-300 text-sm font-medium">
                        © {new Date().getFullYear()} Edu51Five
                      </p>
                      <p className="text-slate-400 text-xs">
                        BUBT Intake 51 • All rights reserved
                      </p>
                    </div>
                  </div>

                  {/* Platform Info */}
                  <div className="mt-4 pt-4 border-t border-slate-700/30 text-center">
                    <div className="flex justify-center items-center space-x-4 text-xs text-slate-500">
                      <span>🔒 Secure</span>
                      <span>📱 Mobile Ready</span>
                      <span>🚀 Fast</span>
                      <span>💡 Updated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5 Courses */}
        {currentView === 'section5' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <img src="/image.png" alt="Edu51Five Logo" className="h-20 w-20 mx-auto object-contain" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 blur-lg"></div>
              </div>
              <h2 className="text-3xl font-bold text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text mb-4">Section 5 - Department of CSE</h2>
              <p className="text-gray-700 text-lg">Choose your course to access materials</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {courses.map((course, index) => {
                const colorScheme = getCourseColorScheme(course.code, index);
                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className={`bg-gradient-to-br ${colorScheme.bgGradient} p-6 md:p-8 rounded-2xl shadow-xl border border-white/30 backdrop-blur-sm hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 hover:${colorScheme.border} group`}
                  >
                    <h3 className={`text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:bg-gradient-to-r group-hover:${colorScheme.textGradient} group-hover:bg-clip-text transition-all duration-300`}>{course.name}</h3>
                    <p className={`font-semibold mb-3 text-sm md:text-base ${colorScheme.badge} px-3 py-1 rounded-full inline-block`}>{course.code}</p>
                    <p className="text-gray-700 text-sm md:text-base mb-4 md:mb-6 select-text leading-relaxed">{course.description}</p>
                    <p className={`text-transparent bg-gradient-to-r ${colorScheme.textGradient} bg-clip-text text-sm md:text-base font-bold no-select flex items-center group-hover:translate-x-2 transition-transform duration-300`}>
                      Access Materials 
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Course Materials View */}
        {currentView === 'course' && selectedCourse && (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium w-fit">
                {selectedCourse.code}
              </span>
            </div>
            <p className="text-gray-600 text-sm md:text-base select-text">{selectedCourse.description}</p>

            {/* Google Drive Resources */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Course Materials</h3>
                  <p className="text-sm text-gray-600">Access organized study materials by category</p>
                </div>
              </div>
              
              <div className="grid-responsive">
                {getCourseCategories(selectedCourse.code).map((category) => {
                  const categoryInfo = getCategoryInfo(category);
                  const driveLink = getGoogleDriveLink(selectedCourse.code, category);
                  const files = getCourseFiles(selectedCourse.code, category);
                  
                  return (
                    <div key={category} className={`bg-gradient-to-br ${categoryInfo.bgGradient} rounded-xl ${categoryInfo.borderColor} border overflow-hidden smooth-card transition-all duration-300 ui-element hover:shadow-lg transform hover:-translate-y-1 group`}>
                      {/* Professional Category Header */}
                      <div className={`flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm border-b ${categoryInfo.borderColor}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${categoryInfo.iconBg} rounded-lg flex items-center justify-center text-lg no-select shadow-sm`}>
                            {categoryInfo.icon}
                          </div>
                          <div>
                            <h4 className={`font-semibold ${categoryInfo.textColor} responsive-text-base no-select`}>
                              {categoryInfo.label}
                            </h4>
                            <p className={`responsive-text-sm ${categoryInfo.textColor} opacity-70 no-select font-medium`}>
                              {files.length} files
                            </p>
                          </div>
                        </div>
                        {/* Elegant Folder Icon */}
                        <a
                          href={driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-2 ${categoryInfo.textColor} opacity-70 hover:opacity-100 hover:bg-white/30 rounded-lg smooth-button transition-all duration-300 ui-element group-hover:scale-105 transform`}
                          title="Open folder in Google Drive"
                        >
                          <svg className="w-5 h-5 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </a>
                      </div>
                      
                      {/* Professional Files List */}
                      <div className="p-4">
                        {files.length > 0 ? (
                          <div className="space-y-2">
                            {files.slice(0, 3).map((file) => (
                              <div key={file.id} className={`flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-lg hover:bg-white/70 transition-all duration-200 group border ${categoryInfo.borderColor} border-opacity-30`}>
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  {/* Professional File Type Icons */}
                                  <div className="flex-shrink-0">
                                    {file.name.toLowerCase().includes('.pdf') ? (
                                      <div className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center border border-red-100">
                                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.5,8.5H10.5A2,2 0 0,1 12.5,10.5V11.5A2,2 0 0,1 10.5,13.5H8.5V16.5H7.5V8.5M8.5,9.5V12.5H10.5A1,1 0 0,0 11.5,11.5V10.5A1,1 0 0,0 10.5,9.5H8.5M13.5,8.5H15.43C16.47,8.5 17,9 17,10V11.2C17,12.2 16.47,12.7 15.43,12.7H14.5V16.5H13.5V8.5M14.5,9.5V11.7H15.43C15.73,11.7 16,11.47 16,11.2V10C16,9.73 15.73,9.5 15.43,9.5H14.5Z"/>
                                        </svg>
                                      </div>
                                    ) : file.name.toLowerCase().includes('.ppt') ? (
                                      <div className="w-7 h-7 bg-orange-50 rounded-md flex items-center justify-center border border-orange-100">
                                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M8,8H10.5A2.5,2.5 0 0,1 13,10.5A2.5,2.5 0 0,1 10.5,13H9V16H8V8M9,9V12H10.5A1.5,1.5 0 0,0 12,10.5A1.5,1.5 0 0,0 10.5,9H9Z"/>
                                        </svg>
                                      </div>
                                    ) : file.name.toLowerCase().includes('.mp4') ? (
                                      <div className="w-7 h-7 bg-purple-50 rounded-md flex items-center justify-center border border-purple-100">
                                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                                        </svg>
                                      </div>
                                    ) : (
                                      <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center border border-blue-100">
                                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M6 2C4.89 2 4 2.9 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2H6Z"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Professional File Name */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${categoryInfo.textColor} truncate group-hover:text-gray-900 transition-colors`}>
                                      {file.name}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Professional Action Buttons */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  <button
                                    onClick={() => openFileViewer(file.embedUrl || file.url, file.name)}
                                    className={`p-1.5 ${categoryInfo.textColor} opacity-70 hover:opacity-100 hover:bg-white/50 rounded-md smooth-button transition-all duration-200 ui-element`}
                                    title="Preview"
                                  >
                                    <svg className="w-4 h-4 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </button>
                                  
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-gray-400 hover:text-green-600 rounded smooth-button transition-smooth ui-element"
                                    title="Open in Drive"
                                  >
                                    <svg className="w-4 h-4 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            ))}
                            {files.length > 3 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                +{files.length - 3} more files
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 mb-2">No files</p>
                            <a
                              href={driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                            >
                              Browse
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between responsive-text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500 no-select" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="no-select">👁️ Preview files • 📁 Browse complete folders • Real file counts</span>
                  </div>
                  <span className="text-gray-400 no-select">Google Drive Integration</span>
                </div>
              </div>
            </div>

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
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Upload className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">📁 Uploaded Materials</h3>
                    <p className="text-sm text-gray-600">Materials uploaded through the admin panel</p>
                  </div>
                </div>
                
                {materials.map((material, index) => {
                  const materialScheme = getMaterialColorScheme(material.id, index);
                  return (
                    <div key={material.id} className={`bg-gradient-to-br ${materialScheme.bg} rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-6 flex-1">
                          <div className={`p-4 rounded-2xl shadow-lg transform rotate-3 bg-gradient-to-r ${materialScheme.accent} text-white`}>
                            {getTypeIcon(material.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xl font-bold text-gray-900 mb-2 hover:text-transparent hover:bg-gradient-to-r hover:${materialScheme.accent} hover:bg-clip-text transition-all cursor-pointer`}>
                              {material.title}
                            </h3>
                            <p className="text-gray-700 text-base mb-4 leading-relaxed">{material.description}</p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <div className={`bg-gradient-to-r ${materialScheme.accent} bg-opacity-20 px-4 py-2 rounded-xl font-semibold text-gray-800`}>
                                Type: {material.type}
                              </div>
                              {material.size && (
                                <div className="bg-gradient-to-r from-gray-100 to-slate-200 px-4 py-2 rounded-xl font-semibold text-gray-800">Size: {material.size}</div>
                              )}
                              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-xl font-semibold text-emerald-800">
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
                  );
                })}
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
                      onClick={() => setShowCreateNotice(true)}
                      className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-700 text-white rounded-xl hover:from-purple-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">Create Smart Notice</span>
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
                      <p className="text-3xl font-bold mt-1">{totalMaterialsCount}</p>
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

              {/* Courses List - Modern Design */}
              <div id="courses-section" className="bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl shadow-xl border border-white/20 backdrop-blur-sm p-6 md:p-8 lg:p-10 responsive-container">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-responsive">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ui-element">
                      <span className="text-white font-bold no-select text-lg">📚</span>
                    </div>
                    <h3 className="responsive-text-xl font-bold text-gray-800 no-select ml-4">Course Management</h3>
                  </div>
                </div>
                <div className="space-y-6">
                  {courses.map((course, index) => {
                    const colorScheme = getCourseColorScheme(course.code, index);
                    return (
                      <div key={course.id} className={`group bg-gradient-to-r ${colorScheme.bgGradient} p-6 md:p-8 border-l-4 border-${colorScheme.accent} rounded-2xl shadow-lg hover:shadow-2xl smooth-card ui-element hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className={`font-bold text-gray-900 responsive-text-xl group-hover:bg-gradient-to-r group-hover:${colorScheme.textGradient} group-hover:bg-clip-text transition-all duration-300 no-select`}>{course.name}</h4>
                            <p className={`font-semibold mt-2 no-select ${colorScheme.badge} px-3 py-1 rounded-full inline-block text-sm`}>{course.code}</p>
                            <p className="text-gray-700 responsive-text-base mt-3 select-text leading-relaxed">{course.description}</p>
                          </div>
                          <div className="text-right ml-8">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className={`w-10 h-10 bg-gradient-to-r ${colorScheme.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <span className="text-white text-sm font-bold">
                                  {materials.filter(m => m.course_code === course.code).length}
                                </span>
                              </div>
                              <span className="text-gray-700 font-semibold">materials</span>
                            </div>
                            <button
                              onClick={() => handleCourseClick(course)}
                              className={`inline-flex items-center px-6 py-3 bg-gradient-to-r ${colorScheme.gradient} text-white rounded-xl hover:shadow-xl transition-all duration-300 text-sm font-semibold shadow-lg transform hover:scale-105`}
                            >
                              View Materials
                              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

        {/* Enhanced Categorized Notice Creation Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">📢 Create Smart Notice</h2>
                  <p className="text-sm text-gray-600">Choose a category and let the system help you create targeted notices</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateNotice(false);
                    setNewNotice({ 
                      title: '', 
                      content: '', 
                      type: 'info', 
                      category: 'announcement',
                      priority: 'normal',
                      exam_type: null,
                      event_date: '',
                      is_active: true 
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Notice Category</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'announcement', icon: '📢', label: 'General', desc: 'Regular announcements' },
                    { value: 'exam', icon: '📚', label: 'Exam', desc: 'Exam schedules & updates' },
                    { value: 'event', icon: '🎉', label: 'Event', desc: 'Events & activities' },
                    { value: 'information', icon: 'ℹ️', label: 'Information', desc: 'Important information' },
                    { value: 'academic', icon: '🎓', label: 'Academic', desc: 'Academic calendar' },
                    { value: 'random', icon: '🎲', label: 'Other', desc: 'Miscellaneous' }
                  ].map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setNewNotice({ ...newNotice, category: category.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        newNotice.category === category.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-semibold text-gray-900">{category.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{category.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Title with smart suggestions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                      {newNotice.category === 'exam' && (
                        <span className="text-xs text-blue-600 ml-2">(Exam notices get priority display)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        newNotice.category === 'exam' ? 'Mid-term Exam Schedule Update' :
                        newNotice.category === 'event' ? 'Upcoming Cultural Event' :
                        newNotice.category === 'academic' ? 'Academic Calendar Update' :
                        newNotice.category === 'information' ? 'Important Class Information' :
                        'Enter notice title...'
                      }
                    />
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'low', icon: '🟢', label: 'Low', color: 'text-green-600' },
                        { value: 'normal', icon: '🔵', label: 'Normal', color: 'text-blue-600' },
                        { value: 'high', icon: '🟡', label: 'High', color: 'text-yellow-600' },
                        { value: 'urgent', icon: '🔴', label: 'Urgent', color: 'text-red-600' }
                      ].map((priority) => (
                        <button
                          key={priority.value}
                          onClick={() => setNewNotice({ ...newNotice, priority: priority.value as any })}
                          className={`p-2 rounded-lg border text-sm transition-all ${
                            newNotice.priority === priority.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="mr-1">{priority.icon}</span>
                          <span className={priority.color}>{priority.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notice Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visual Style</label>
                    <select
                      value={newNotice.type}
                      onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="info">🔵 Info (Blue)</option>
                      <option value="success">🟢 Success (Green)</option>
                      <option value="warning">🟡 Warning (Yellow)</option>
                      <option value="error">🔴 Error (Red)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Exam-specific fields */}
                  {newNotice.category === 'exam' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'midterm', label: 'Mid-term', icon: '📝' },
                          { value: 'final', label: 'Final', icon: '🎯' }
                        ].map((examType) => (
                          <button
                            key={examType.value}
                            onClick={() => setNewNotice({ ...newNotice, exam_type: examType.value as any })}
                            className={`p-2 rounded-lg border text-sm transition-all ${
                              newNotice.exam_type === examType.value
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="mr-1">{examType.icon}</span>
                            {examType.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event-specific fields */}
                  {newNotice.category === 'event' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                      <input
                        type="date"
                        value={newNotice.event_date || ''}
                        onChange={(e) => setNewNotice({ ...newNotice, event_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}

                  {/* Active toggle */}
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newNotice.is_active}
                      onChange={(e) => setNewNotice({ ...newNotice, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      📢 Publish immediately (visible to all students)
                    </label>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notice Content</label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder={
                    newNotice.category === 'exam' ? 
                    'Mid-term examinations will be held from September 14-24, 2025. Please check your individual exam schedules and prepare accordingly. Good luck!' :
                    newNotice.category === 'event' ?
                    'Join us for an exciting event! More details will be shared soon.' :
                    'Enter the detailed content of your notice here...'
                  }
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {newNotice.content.length} characters
                  </span>
                  {newNotice.category === 'exam' && newNotice.exam_type && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      🎯 {newNotice.exam_type === 'midterm' ? 'Mid-term' : 'Final'} Exam Notice
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowCreateNotice(false);
                    setNewNotice({ 
                      title: '', 
                      content: '', 
                      type: 'info', 
                      category: 'announcement',
                      priority: 'normal',
                      exam_type: null,
                      event_date: '',
                      is_active: true 
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotice}
                  disabled={!newNotice.title || !newNotice.content}
                  className="flex-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                >
                  🚀 Create {newNotice.priority === 'urgent' ? 'Urgent' : newNotice.category === 'exam' ? 'Exam' : 'Smart'} Notice
                </button>
              </div>
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
                    
                    // Check for both URL and base64 image formats
                    const urlMatch = content.match(/\[EXAM_ROUTINE_URL\](.*?)\[\/EXAM_ROUTINE_URL\]/);
                    const imageMatch = content.match(/\[EXAM_ROUTINE_IMAGE\](.*?)\[\/EXAM_ROUTINE_IMAGE\]/);
                    
                    if (urlMatch || imageMatch) {
                      const imageData = urlMatch ? urlMatch[1] : (imageMatch ? imageMatch[1] : '');
                      const textContent = content
                        .replace(/\[EXAM_ROUTINE_URL\].*?\[\/EXAM_ROUTINE_URL\]/g, '')
                        .replace(/\[EXAM_ROUTINE_IMAGE\].*?\[\/EXAM_ROUTINE_IMAGE\]/g, '');
                      
                      return (
                        <div>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 select-text">
                            {textContent}
                          </p>
                          <div className="bg-gray-50 rounded-xl p-4 text-center">
                            <h4 className="font-semibold text-gray-900 mb-3"><span className="no-select">📋</span> Exam Routine</h4>
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
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap select-text">
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

        {/* Enhanced PDF Viewer */}
        <PDFViewer
          fileUrl={currentFileUrl}
          fileName={currentFileName}
          isOpen={showFileViewer}
          onClose={closeFileViewer}
        />
        </div>
      </main>
      )}

      {/* Semester Tracker Page */}
      {currentView === 'semester' && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <SemesterTracker onClose={() => goToView('home')} />
        </div>
      )}

      {/* Exam Materials Dashboard */}
      {currentView === 'examMaterials' && (
        <div className="fixed inset-0 z-50">
          <div className="relative h-full">
            <button
              onClick={() => goToView('home')}
              className="fixed top-2 right-2 sm:top-4 sm:right-4 z-60 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <ExamMaterialsDashboard />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;