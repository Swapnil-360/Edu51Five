import { useState, useEffect } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Notice } from './types';
import { getGoogleDriveLink, getCourseCategories, getCategoryInfo, getCourseFiles } from './config/googleDrive';
import { getCurrentSemesterStatus } from './config/semester';
import SemesterTracker from './components/SemesterTracker';
import { ExamMaterialsDashboard } from './components/Student/ExamMaterialsDashboard';
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
  const [unreadNotices, setUnreadNotices] = useState<string[]>([]);
  const [showExamRoutineUpload, setShowExamRoutineUpload] = useState(false);
  const [examRoutineFile, setExamRoutineFile] = useState<File | null>(null);
  
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

  // Handle exam routine upload
  const handleExamRoutineUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examRoutineFile) {
      alert('Please select a PNG file for the exam routine');
      return;
    }

    try {
      setLoading(true);

      // First, try to upload image to Supabase Storage
      let imageUrl = '';
      let base64String = '';
      
      try {
        // Generate unique filename
        const fileExt = examRoutineFile.name.split('.').pop();
        const fileName = `exam-routine-${Date.now()}.${fileExt}`;
        
        console.log('Uploading image to Supabase Storage...');
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('exam-routines')
          .upload(fileName, examRoutineFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.warn('Supabase Storage upload failed:', uploadError);
          console.log('Falling back to base64 storage...');
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('exam-routines')
            .getPublicUrl(fileName);
          
          imageUrl = urlData.publicUrl;
          console.log('Image uploaded to storage successfully:', imageUrl);
        }
      } catch (storageError) {
        console.warn('Storage upload failed, using base64 fallback:', storageError);
      }

      // If storage upload failed, fall back to base64
      if (!imageUrl) {
        console.log('Using base64 fallback for image storage...');
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = () => {
            base64String = reader.result as string;
            resolve(true);
          };
          reader.readAsDataURL(examRoutineFile);
        });
      }

      // Create notice content based on available storage method
      const imageContent = imageUrl 
        ? `[EXAM_ROUTINE_URL]${imageUrl}[/EXAM_ROUTINE_URL]`
        : `[EXAM_ROUTINE_IMAGE]${base64String}[/EXAM_ROUTINE_IMAGE]`;

      // Update the global exam routine notice
      const routineNotice: Notice = {
        id: 'exam-routine-notice', // Use fixed ID for global system
        title: '📅 Midterm Exam Routine - Section 5',
        content: `Midterm examinations for Section 5 (Computer Science & Engineering) will commence from Sunday, September 14, 2025.

📋 **Important Instructions:**
• Please check your exam schedule carefully
• Arrive at the exam hall 15 minutes early
• Bring your student ID card and necessary stationery
• Mobile phones are strictly prohibited in exam halls
• Follow all university exam regulations

For any queries regarding the exam schedule, contact your course instructors or the department.

**Best of luck with your midterm exams!**

${imageContent}`,
        type: 'warning',
        is_active: true,
        created_at: new Date().toISOString()
      };

      // Update the specific global notice slot
      const updatedNotices = [...notices];
      const routineIndex = updatedNotices.findIndex(n => n.id === 'exam-routine-notice');
      
      if (routineIndex >= 0) {
        updatedNotices[routineIndex] = routineNotice;
      } else {
        // If somehow missing, ensure we maintain only 2 notices
        if (updatedNotices.length >= 2) {
          updatedNotices[1] = routineNotice; // Replace second slot
        } else {
          updatedNotices.push(routineNotice);
        }
      }

      setNotices(updatedNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('Global exam routine notice updated locally');

      // Try to save to database with upsert
      try {
        console.log('Saving global exam routine to database...');
        
        const { error } = await supabase
          .from('notices')
          .upsert([routineNotice], { onConflict: 'id' });
        
        if (error) {
          console.error('Database error saving exam routine:', error);
          alert('Exam routine uploaded but may not sync to all devices. Error: ' + error.message);
        } else {
          console.log('Global exam routine saved to database successfully');
          alert('✅ Exam routine uploaded successfully and synced to all devices!\n\nAll users will now see the updated routine.');
        }
      } catch (dbError) {
        console.error('Exception while saving exam routine to database:', dbError);
        alert('Exam routine uploaded locally but database sync failed. It may not be visible on other devices.');
      }

      // Reset form
      setExamRoutineFile(null);
      setShowExamRoutineUpload(false);

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
      setNewNotice({ title: '', content: '', type: 'info', is_active: true });
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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-blue-900 text-white shadow-lg z-40">
        <div className="responsive-container">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-responsive">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center space-responsive smooth-button transition-smooth ui-element focus:outline-none"
                title="Go to Home"
              >
                <img 
                  src="/Edu_51_Logo.png" 
                  alt="Edu51Five Logo" 
                  className="h-12 w-12 md:h-16 md:w-16 object-contain no-select" 
                />
                <div className="hidden sm:block">
                  <h1 className="responsive-text-lg font-bold no-select">Edu51Five</h1>
                  <p className="responsive-text-xs text-blue-200 no-select">Intake 51</p>
                </div>
                <div className="sm:hidden">
                  <h1 className="responsive-text-lg font-bold no-select">Edu51Five</h1>
                </div>
              </button>
            </div>

            {/* Real-time Semester Dashboard - Beautiful Display (Non-clickable) */}
            <div className="hidden lg:flex items-center space-x-4 glass-card px-6 py-3 transition-all duration-300 shadow-lg">
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

            {/* Mobile Semester Info - Non-clickable Display */}
            <div className="lg:hidden flex items-center space-x-3 glass-card rounded-lg px-3 py-2 transition-all duration-200 shadow-md">
              <div className="p-1 bg-blue-600 bg-opacity-30 rounded transition-all duration-300">
                <Clock className="h-3 w-3 text-blue-200 transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <div className="text-xs text-blue-200 no-select font-medium transition-colors duration-300">
                  {currentTime.toLocaleDateString('en-BD', {
                    timeZone: 'Asia/Dhaka',
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })} • {currentTime.toLocaleTimeString('en-BD', {
                    timeZone: 'Asia/Dhaka',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })} BST
                </div>
                <div className="text-xs text-blue-300 no-select font-medium transition-colors duration-300">
                  Week {semesterStatus.semesterWeek} • {semesterStatus.daysToMilestone}d to {semesterStatus.nextMilestone.split(' ')[0]}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 md:space-x-5">
              {/* Exam Materials Button */}
              <button
                onClick={() => goToView('examMaterials')}
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 transition-all duration-300 shadow-lg group"
                title="Smart Exam Materials"
              >
                <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Semester Tracker Button */}
              <button
                onClick={() => goToView('semester')}
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-800 hover:bg-blue-700 transition-colors shadow-lg group"
                title="Semester Tracker"
              >
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white group-hover:scale-110 transition-transform" />
              </button>

              {/* Notice Bell Icon */}
              <div className="relative">
                <button
                  onClick={toggleNoticePanel}
                  className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-800 hover:bg-blue-700 transition-colors relative shadow-lg"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  {getUnreadNoticeCount() > 0 && (
                    <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center font-bold shadow-md">
                      {getUnreadNoticeCount()}
                    </span>
                  )}
                </button>
              </div>

              {currentView === 'course' && selectedCourse && (
                <button
                  onClick={handleBackToSection}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-colors text-sm"
                >
                  <span>← Back to Courses</span>
                </button>
              )}
              
              {currentView === 'section5' && (
                <button
                  onClick={handleBackToHome}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-800 hover:bg-blue-700 transition-colors text-sm"
                >
                  <span>← Back to Home</span>
                </button>
              )}

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

      {/* Notice Panel */}
      {showNoticePanel && (
        <div className="fixed top-16 md:top-20 right-2 md:right-4 w-80 sm:w-96 max-w-[calc(100vw-1rem)] bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 md:max-h-96 overflow-hidden">
          <div className="bg-blue-900 text-white px-3 md:px-4 py-2 md:py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center text-sm md:text-base">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </h3>
              <button
                onClick={() => setShowNoticePanel(false)}
                className="text-white hover:text-gray-300 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-56 md:max-h-64 overflow-y-auto">
            {notices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications
              </div>
            ) : (
              notices.filter(notice => notice.is_active).map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    handleNoticeClick(notice);
                    markNoticeAsRead(notice.id);
                    setShowNoticePanel(false);
                  }}
                >
                  <div className="flex items-start space-x-2 md:space-x-3">
                    <div className={`p-1 md:p-1.5 rounded-full flex-shrink-0 ${
                      notice.type === 'info' ? 'bg-blue-100' :
                      notice.type === 'warning' ? 'bg-yellow-100' :
                      notice.type === 'success' ? 'bg-green-100' :
                      'bg-red-100'
                    }`}>
                      <Bell className={`h-3 w-3 md:h-4 md:w-4 ${
                        notice.type === 'info' ? 'text-blue-600' :
                        notice.type === 'warning' ? 'text-yellow-600' :
                        notice.type === 'success' ? 'text-green-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">
                        {notice.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notice.created_at).toLocaleDateString()}
                      </p>
                      {!unreadNotices.includes(notice.id) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Content - Hidden when semester tracker is active */}
      {currentView !== 'semester' && (
        <main className="pt-16 md:pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Home Page */}
        {currentView === 'home' && (
          <div className="space-y-6 md:space-y-8">
            {/* Welcome Section - Always on Top */}
            <div className="bg-white p-6 md:p-8 lg:p-10 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center mb-6 md:mb-8">
                <img 
                  src="/image.png" 
                  alt="Edu51Five Logo" 
                  className="h-16 w-16 md:h-20 md:w-20 mx-auto mb-4 md:mb-6 object-contain" 
                />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 no-select">
                  Welcome to Edu51Five!
                </h2>
                <p className="text-gray-600 mb-4 text-base md:text-lg max-w-3xl mx-auto no-select">
                  BUBT Intake 51 Learning Platform - Department of CSE
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 mb-6">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 text-center no-select"><span className="no-select">🎯</span> Your Exam Success Platform</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-sm md:text-base">
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-blue-600 text-lg no-select">📚</span>
                      <span className="text-gray-700 no-select">Complete Study Materials</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-green-600 text-lg no-select">📝</span>
                      <span className="text-gray-700 no-select">Past Exam Questions</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-purple-600 text-lg no-select">🔔</span>
                      <span className="text-gray-700 no-select">Real-time Updates</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-orange-600 text-lg no-select">🎥</span>
                      <span className="text-gray-700 no-select">Video Lectures</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-red-600 text-lg no-select">⏰</span>
                      <span className="text-gray-700 no-select">Exam Schedules</span>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/50 rounded-lg">
                      <span className="text-teal-600 text-lg no-select">💡</span>
                      <span className="text-gray-700 no-select">Study Tips & Guides</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                <div 
                  className="border border-gray-200 rounded-xl p-6 md:p-8 hover:shadow-lg cursor-pointer hover:border-blue-300 transition-all text-center bg-white"
                  onClick={() => goToView('section5')}
                >
                  <div className="text-4xl md:text-5xl mb-4 no-select">📚</div>
                  <h3 className="text-gray-900 font-semibold text-xl md:text-2xl mb-2 no-select">Section 5</h3>
                  <p className="text-gray-600 mb-3 text-sm md:text-base">
                    Computer Science & Engineering
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    {courses.length} courses available
                  </p>
                  <p className="text-blue-600 text-lg font-medium no-select">Click to Access →</p>
                </div>
                
                <div className="border border-gray-200 rounded-xl p-6 md:p-8 opacity-50 text-center bg-white">
                  <div className="text-4xl md:text-5xl mb-4 no-select">🚧</div>
                  <h3 className="text-gray-900 font-semibold text-xl md:text-2xl mb-2 no-select">Other Sections</h3>
                  <p className="text-gray-600 mb-3 text-sm md:text-base">
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all hover:border-blue-300"
                >
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{course.name}</h3>
                  <p className="text-blue-600 font-medium mb-2 text-sm md:text-base">{course.code}</p>
                  <p className="text-gray-600 text-sm md:text-base mb-3 md:mb-4 select-text">{course.description}</p>
                  <p className="text-blue-600 text-sm md:text-base font-medium no-select">Access Materials →</p>
                </div>
              ))}
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
                    <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden smooth-card transition-smooth ui-element">
                      {/* Compact Category Header */}
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg no-select" style={{backgroundColor: `var(--color-${categoryInfo.color}-100)`}}>
                            {categoryInfo.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 responsive-text-sm no-select">
                              {categoryInfo.label}
                            </h4>
                            <p className="responsive-text-xs text-gray-500 no-select">
                              {files.length} files
                            </p>
                          </div>
                        </div>
                        {/* Folder Icon */}
                        <a
                          href={driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded smooth-button transition-smooth ui-element"
                          title="Open folder in Google Drive"
                        >
                          <svg className="w-5 h-5 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </a>
                      </div>
                      
                      {/* Compact Files List */}
                      <div className="p-3">
                        {files.length > 0 ? (
                          <div className="space-y-2">
                            {files.slice(0, 3).map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-blue-50 transition-all duration-200 group">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  {/* Compact File Type Icon */}
                                  <div className="flex-shrink-0">
                                    {file.name.toLowerCase().includes('.pdf') ? (
                                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.5,8.5H10.5A2,2 0 0,1 12.5,10.5V11.5A2,2 0 0,1 10.5,13.5H8.5V16.5H7.5V8.5M8.5,9.5V12.5H10.5A1,1 0 0,0 11.5,11.5V10.5A1,1 0 0,0 10.5,9.5H8.5M13.5,8.5H15.43C16.47,8.5 17,9 17,10V11.2C17,12.2 16.47,12.7 15.43,12.7H14.5V16.5H13.5V8.5M14.5,9.5V11.7H15.43C15.73,11.7 16,11.47 16,11.2V10C16,9.73 15.73,9.5 15.43,9.5H14.5Z"/>
                                      </svg>
                                    ) : file.name.toLowerCase().includes('.ppt') ? (
                                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M8,8H10.5A2.5,2.5 0 0,1 13,10.5A2.5,2.5 0 0,1 10.5,13H9V16H8V8M9,9V12H10.5A1.5,1.5 0 0,0 12,10.5A1.5,1.5 0 0,0 10.5,9H9Z"/>
                                      </svg>
                                    ) : file.name.toLowerCase().includes('.mp4') ? (
                                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/>
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 2C4.89 2 4 2.9 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2H6Z"/>
                                      </svg>
                                    )}
                                  </div>
                                  
                                  {/* Compact File Name */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                      {file.name}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Compact Action Buttons */}
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-smooth-slow">
                                  <button
                                    onClick={() => openFileViewer(file.embedUrl || file.url, file.name)}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded smooth-button transition-smooth ui-element"
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

              {/* Courses List */}
              <div id="courses-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 responsive-container">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-responsive">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center ui-element">
                      <span className="text-blue-600 font-bold no-select">📚</span>
                    </div>
                    <h3 className="responsive-text-lg font-semibold text-gray-800 no-select">Course Management</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="group p-4 md:p-6 border border-gray-200 rounded-xl smooth-card ui-element hover:border-blue-300 transition-smooth">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 responsive-text-lg group-hover:text-blue-600 transition-smooth no-select">{course.name}</h4>
                          <p className="text-blue-600 font-medium mt-1 no-select">{course.code}</p>
                          <p className="text-gray-600 responsive-text-sm mt-2 select-text">{course.description}</p>
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
                <h3 className="text-lg font-semibold text-gray-900">📢 Global Notice System (2 Notices)</h3>
                <button
                  onClick={() => setShowCreateNotice(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Update Global Notice
                </button>
              </div>
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-4 border rounded-lg break-words ${notice.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4 overflow-hidden">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notice.title}</h4>
                          {(notice.title.includes('Exam Routine') || notice.title.includes('exam routine') || notice.content.includes('EXAM_ROUTINE')) && (
                            <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                              📅 EXAM ROUTINE
                            </span>
                          )}
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
                        {/* Truncate long content to prevent overflow */}
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                          {notice.content.length > 200 
                            ? notice.content.substring(0, 200) + '...' 
                            : notice.content}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(notice.created_at).toLocaleDateString()}</p>
                      </div>
                      {/* Conditional Delete Button - Special handling for exam routines */}
                      {(notice.title.includes('Exam Routine') || notice.title.includes('exam routine') || notice.content.includes('EXAM_ROUTINE')) ? (
                        <div className="ml-4 flex flex-col space-y-2">
                          <button
                            onClick={() => handleDeleteExamRoutine(notice.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Routine
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteNotice(notice.id)}
                          className="ml-4 inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
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

        {/* Update Global Notice Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Update Global Notice</h2>
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
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Global Notice System:</strong> All users see exactly 2 notices - Welcome and Exam Routine. 
                  Your content will update the appropriate global slot based on keywords in the title.
                </p>
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
                    Update Global Notice
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

        {/* File Viewer Modal */}
        {showFileViewer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 modal-overlay">
            <div className="bg-white rounded-2xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl border border-gray-200 modal-content transition-smooth ui-element">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                <div className="flex items-center space-responsive">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 no-select" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="responsive-text-lg font-semibold text-gray-900 truncate max-w-md no-select">
                      {currentFileName}
                    </h3>
                    <p className="responsive-text-sm text-gray-600 no-select">File Preview</p>
                  </div>
                </div>
                <div className="flex items-center space-responsive">
                  <a
                    href={currentFileUrl.replace('/preview', '/view')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 md:px-4 py-2 responsive-text-sm bg-blue-600 text-white rounded-lg smooth-button transition-smooth shadow-sm ui-element"
                  >
                    <svg className="w-4 h-4 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="no-select">Open in Drive</span>
                  </a>
                  <button
                    onClick={closeFileViewer}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg smooth-button transition-smooth ui-element"
                    title="Close viewer"
                  >
                    <svg className="w-6 h-6 no-select" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 bg-gray-50 rounded-b-2xl overflow-hidden">
                <iframe
                  src={currentFileUrl}
                  className="w-full h-full border-0"
                  title={currentFileName}
                  allow="autoplay"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
      )}

      {/* Semester Tracker Page */}
      {currentView === 'semester' && (
        <div className="fixed inset-0 z-50">
          <SemesterTracker onClose={() => goToView('home')} />
        </div>
      )}

      {/* Exam Materials Dashboard */}
      {currentView === 'examMaterials' && (
        <div className="fixed inset-0 z-50">
          <div className="relative h-full">
            <button
              onClick={() => goToView('home')}
              className="fixed top-4 right-4 z-60 flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <ExamMaterialsDashboard />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;