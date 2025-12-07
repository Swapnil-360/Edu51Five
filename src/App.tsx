import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Notice } from './types';
import { getGoogleDriveLink, getCourseCategories, getCategoryInfo, getCourseFiles } from './config/googleDrive';
import { getCurrentSemesterStatus } from './config/semester';
import SemesterTracker from './components/SemesterTracker';
import { 
  registerServiceWorker, 
  requestNotificationPermission, 
  subscribeToPushNotifications,
  savePushSubscription,
  isPushNotificationSupported,
  getNotificationPermission,
  isPushSubscribed,
  validateCurrentSubscription
} from './lib/pushNotifications';
import { ExamMaterialsDashboard } from './components/Student/ExamMaterialsDashboard';
import MarqueeTicker from './components/MarqueeTicker';
import PDFViewer from './components/PDFViewer';
import { DirectDriveUpload } from './components/Admin/DirectDriveUpload';
import { DriveManager } from './components/Admin/DriveManager';
import AdminDashboard from './components/Admin/AdminDashboard';
import { StudentDriveView } from './components/Student/StudentDriveView';
import { CourseDriveView } from './components/Student/CourseDriveView';
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
  Clock,
  Moon,
  Sun,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader,
  LogOut
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
  exam_period?: 'midterm' | 'final'; // NEW: For filtering by exam period
  uploaded_by?: string; // NEW: Admin email who uploaded
  download_url?: string; // NEW: Separate download link
  created_at: string;
}

function App() {
  // Dark mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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

  // Helper to change view and update browser history (memoized)
  const goToView = useCallback((view: 'admin' | 'section5' | 'course' | 'home' | 'semester' | 'examMaterials', extra?: string | null) => {
    let path = '/';
    if (view === 'admin') path = '/admin';
    else if (view === 'section5') path = '/section5';
    else if (view === 'semester') path = '/semester';
    else if (view === 'examMaterials') path = '/exam-materials';
    else if (view === 'course' && extra) path = `/course/${extra}`;
    else if (view === 'home') path = '/home';
    window.history.pushState({}, '', path);
    setCurrentView(view);
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

  // Force admin to stay on admin view until logout (no back/swipe escape)
  useEffect(() => {
    if (isAdmin && currentView !== 'admin') {
      setCurrentView('admin');
      window.history.pushState({}, '', '/admin');
    }
  }, [isAdmin, currentView]);

  // Listen for browser back/forward events
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setCurrentView('admin');
      else if (isAdmin) {
        // Prevent navigating away from admin while logged in
        window.history.pushState({}, '', '/admin');
        setCurrentView('admin');
      }
      else if (path === '/section5') setCurrentView('section5');
      else if (path === '/semester') setCurrentView('semester');
      else if (path === '/exam-materials') setCurrentView('examMaterials');
      else if (path.startsWith('/course/')) setCurrentView('course');
      else if (path === '/home') setCurrentView('home');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalMaterialsCount, setTotalMaterialsCount] = useState<number>(0);
  const [isLoadingNotices, setIsLoadingNotices] = useState(false);
  const hasLoadedInitialNotices = useRef(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<Array<{id: string; message: string; status: string; created_at: string}>>([]);
  const [emergencyLinks, setEmergencyLinks] = useState<Array<{id: string; title: string; url: string; status: string; created_at: string}>>([]);
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
  
  // Real-time active users tracking
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const sessionIdRef = useRef<string>('');
  
  // Push notification states
  const [isPushEnabled, setIsPushEnabled] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const hasInitializedPush = useRef(false);
  
  // Admin broadcast push notification state
  const [broadcastPush, setBroadcastPush] = useState({
    title: '',
    body: '',
    url: '/'
  });
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  
  // Exam period selection state - Auto-detect based on current semester phase
  const [selectedExamPeriod, setSelectedExamPeriod] = useState<'midterm' | 'final'>(() => {
    const status = getCurrentSemesterStatus();
    // Show 'final' tab if we're in Final Exam Preparation or Final Examinations period
    return (status.currentPhase === "Final Exam Preparation" || status.currentPhase === "Final Examinations") ? 'final' : 'midterm';
  });
  
  // File viewer modal states
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string>('');
  const [currentFileName, setCurrentFileName] = useState<string>('');
  
  // Material viewer modal state
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);
  
  // Material viewer enhancement states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isViewerLoading, setIsViewerLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // ===== MEMOIZED HOOKS (AFTER state declarations) =====
  // Memoize filtered materials for current exam period
  const filteredMaterials = useMemo(() => 
    materials.filter(m => (m.exam_period || 'midterm') === selectedExamPeriod),
    [materials, selectedExamPeriod]
  );
  
  // Memoize active notices count
  const activeNotices = useMemo(() => 
    notices.filter(n => n.is_active),
    [notices]
  );
  
  // Memoize unread notice count
  const unreadCount = useMemo(() => 
    notices.filter(notice => notice.is_active && !unreadNotices.includes(notice.id)).length,
    [notices, unreadNotices]
  );
  
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
    description: '',
    exam_period: 'midterm' as 'midterm' | 'final' // Default to midterm
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

  // Generate or get session ID
  const getSessionId = () => {
    if (!sessionIdRef.current) {
      // Try to get existing device ID from localStorage
      let deviceId = localStorage.getItem('device_id');
      
      // If not found, create new device ID and persist it
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem('device_id', deviceId);
      }
      
      sessionIdRef.current = deviceId;
    }
    return sessionIdRef.current;
  };

  // Track user presence on student/admin page
  const trackUserPresence = async (page: string) => {
    try {
      const sessionId = getSessionId();
      const now = new Date().toISOString();
      console.log(`📝 Inserting presence: session=${sessionId}, page=${page}, time=${now}`);
      
      const { error, data } = await supabase
        .from('active_users')
        .upsert({
          session_id: sessionId,
          page_name: page,
          last_seen: now,
          updated_at: now,
          user_agent: navigator.userAgent
        }, { onConflict: 'session_id' });
      
      if (error) {
        console.error('❌ Upsert error:', error.message, error.code);
      } else {
        console.log(`✅ Presence tracked: ${page} (${sessionId.slice(0, 12)}...)`);
      }
    } catch (err) {
      // Silently fail if table doesn't exist yet
      console.error('❌ Presence tracking exception:', err);
    }
  };

  // Remove user session on unmount
  const removeUserSession = async () => {
    try {
      const sessionId = getSessionId();
      await supabase
        .from('active_users')
        .delete()
        .eq('session_id', sessionId);
    } catch (err) {
      // Silently fail
    }
  };

  // Get active users count (only unique devices active in last 30 seconds - INSTANT real-time)
  const fetchActiveUsersCount = async () => {
    try {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      
      // FIRST: Delete stale sessions (older than 30 seconds) - handles closed browsers INSTANTLY
      const { error: deleteError } = await supabase
        .from('active_users')
        .delete()
        .lt('updated_at', thirtySecondsAgo);
      
      if (deleteError) {
        console.warn('⚠️ Cleanup failed:', deleteError.message);
      }
      
      // THEN: Count remaining active users (all remaining records are fresh)
      const { count, error } = await supabase
        .from('active_users')
        .select('session_id', { count: 'exact', head: true })
        .eq('page_name', 'student');
      
      if (error) {
        console.error('❌ Count query error:', error);
        setActiveUsersCount(0);
        return;
      }
      
      console.log(`⚡ Active users: ${count}`);
      setActiveUsersCount(count || 0);
    } catch (err) {
      console.error('❌ Exception fetching user count:', err);
      setActiveUsersCount(0);
    }
  };

  // Initialize push notifications
  const initializePushNotifications = async () => {
    if (!isPushNotificationSupported() || hasInitializedPush.current) {
      return;
    }

    hasInitializedPush.current = true;

    try {
      // Register service worker
      await registerServiceWorker();

      // Check current permission
      const currentPermission = getNotificationPermission();
      setPushPermission(currentPermission);

      // Check if already subscribed
      const isSubscribed = await isPushSubscribed();
      setIsPushEnabled(isSubscribed);

      // Auto-validate and repair subscriptions if already subscribed
      if (isSubscribed && currentPermission === 'granted') {
        const sessionId = getSessionId();
        console.log('🔍 Validating current subscription...');
        const isValid = await validateCurrentSubscription(sessionId);
        if (isValid) {
          console.log('✅ Subscription is valid and has encryption keys');
        } else {
          console.log('⚠️ Subscription was repaired (fresh subscription created)');
          setIsPushEnabled(true); // Ensure state reflects fresh subscription
        }
      }

      console.log('Push notifications initialized:', { permission: currentPermission, subscribed: isSubscribed });
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  // Enable push notifications
  const enablePushNotifications = async () => {
    try {
      // Request permission
      const permission = await requestNotificationPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
        return false;
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications();
      
      if (!subscription) {
        alert('Failed to subscribe to push notifications');
        return false;
      }

      // Save subscription to database
      const sessionId = getSessionId();
      const saved = await savePushSubscription(subscription, sessionId);

      if (saved) {
        // Validate the new subscription has encryption keys
        const isValid = await validateCurrentSubscription(sessionId);
        
        if (isValid) {
          setIsPushEnabled(true);
          console.log('Push notifications enabled successfully with valid encryption keys');
          return true;
        } else {
          alert('Failed to validate push subscription. Please try again.');
          return false;
        }
      } else {
        alert('Failed to save notification subscription');
        return false;
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      alert('Failed to enable push notifications: ' + String(error));
      return false;
    }
  };

  // Send push notification when notice is created (admin only)
  const sendNoticeNotification = async (notice: Notice) => {
    try {
      // Call Supabase Edge Function to send push notifications
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          noticeId: notice.id,
          noticeType: notice.id, // 'welcome-notice' or 'exam-routine-notice'
          title: notice.title,
          body: notice.content.substring(0, 100), // Truncate to 100 chars
          url: '/'
        }
      });

      if (error) {
        console.error('Failed to send push notification:', error);
        return;
      }

      console.log('Push notification sent:', data);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  // Suppress Google API console errors (they're logged but won't clutter console)
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Suppress Google API discovery errors (502 Bad Gateway)
      if (args[0]?.includes?.('GapiClientError') || 
          args[0]?.includes?.('API discovery') ||
          args[0]?.message?.includes?.('API discovery')) {
        return; // Silently ignore these errors
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);

  // Load courses, notices, and initialize on component mount (once)
  useEffect(() => {
    if (hasLoadedInitialNotices.current) {
      return; // Prevent StrictMode from causing duplicate calls
    }
    hasLoadedInitialNotices.current = true;
    initializeDatabase();
    loadCourses();
    loadNotices();
    loadEmergencyData();
  }, []); // Run only once on mount

  // Load materials when selectedCourse changes
  useEffect(() => {
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

  // Auto-refresh notices and emergency data every 2 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing notices and emergency data...');
      loadNotices();
      loadEmergencyData();
    }, 120000); // 2 minutes (reduced from 30s to minimize unnecessary calls)

    return () => clearInterval(interval);
  }, []);

  // Track user presence and setup realtime subscription for active users
  useEffect(() => {
    let sessionId: string | null = null;

    // Track presence on student OR admin pages
    if (currentView === 'section5' || currentView === 'course' || currentView === 'home' || (currentView === 'admin' && isAdmin)) {
      sessionId = getSessionId();
      const pageType = (currentView === 'admin' && isAdmin) ? 'admin' : 'student';
      trackUserPresence(pageType);
      console.log(`✅ Tracking user presence as ${pageType}`, sessionId);
      
      // Update presence every 5 seconds for INSTANT real-time tracking
      const presenceInterval = setInterval(() => {
        trackUserPresence(pageType);
      }, 5000);

      // Cleanup on unmount or view change
      return () => {
        clearInterval(presenceInterval);
        removeUserSession();
        console.log(`❌ Stopped tracking user presence`);
      };
    } else {
      // If not on tracked page, clean up the session immediately
      removeUserSession();
    }
  }, [currentView, isAdmin]);

  // Subscribe to active users changes (for admin panel) - INSTANT real-time updates
  useEffect(() => {
    if (isAdmin && currentView === 'admin') {
      // Initial fetch
      fetchActiveUsersCount();
      
      // Periodic cleanup every 10 seconds to remove stale sessions INSTANTLY
      const cleanupInterval = setInterval(() => {
        fetchActiveUsersCount();
      }, 10000);

      // Setup realtime subscription for INSTANT updates when users join/leave
      const channel = supabase
        .channel('active_users_realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'active_users'
          },
          (_payload: any) => {
            // New user joined - fetch updated count instantly
            console.log('➕ User joined');
            fetchActiveUsersCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_users'
          },
          (_payload: any) => {
            // User activity updated - recount
            fetchActiveUsersCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'active_users'
          },
          (_payload: any) => {
            // User left - fetch updated count instantly
            console.log('➖ User left');
            fetchActiveUsersCount();
          }
        )
        .subscribe();

      return () => {
        clearInterval(cleanupInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin, currentView]);

  // Listen for storage changes to instantly update notices when admin adds/edits them
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const debouncedReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadNotices();
        loadEmergencyData();
      }, 500); // Wait 500ms before reloading to batch rapid changes
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'edu51five_notices' || e.key === 'emergency_alerts' || e.key === 'emergency_links') {
        console.log('📦 Storage changed, scheduling reload:', e.key);
        debouncedReload();
      }
    };

    // Listen for custom event (same-window updates)
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('⚡ Custom event received, scheduling reload:', customEvent.detail.type);
      debouncedReload();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('edu51five-data-updated', handleCustomEvent);
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('edu51five-data-updated', handleCustomEvent);
    };
  }, []);

  // Real-time semester tracking - update every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setSemesterStatus(getCurrentSemesterStatus());
    }, 1000); // Update every second for live clock

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts for material viewer
  useEffect(() => {
    if (!showMaterialViewer) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        closeMaterialViewer();
      }
      // Arrow keys for page navigation (for PDFs)
      else if (e.key === 'ArrowRight') {
        nextPage();
      }
      else if (e.key === 'ArrowLeft') {
        previousPage();
      }
      // + for zoom in
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      }
      // - for zoom out
      else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      }
      // 0 to reset zoom
      else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
      // F for fullscreen
      else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showMaterialViewer]);

  // Initialize push notifications on mount (student pages only)
  useEffect(() => {
    if (currentView !== 'admin' && !isAdmin) {
      initializePushNotifications();
    }
  }, [currentView, isAdmin]);

  // Handle click outside to close mobile menu and notification panel
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

      // Close notification panel if clicking outside of it
      if (showNoticePanel) {
        const notificationButton = document.querySelector('[title="Notifications"]');
        const notificationPanel = document.querySelector('.notification-panel');
        
        if (notificationButton && notificationPanel) {
          if (!notificationButton.contains(target) && !notificationPanel.contains(target)) {
            setShowNoticePanel(false);
          }
        }
      }
    };

    if (showMobileMenu || showNoticePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu, showNoticePanel]);

  // Lock background scrolling when any overlay/modal/panel is open
  useEffect(() => {
    const overlaysOpen = showNoticePanel || showNoticeModal || showCreateNotice || showUploadFile || showCreateCourse || showFileViewer || showMobileMenu || showMaterialViewer;
    if (overlaysOpen) {
      const previousOverflow = document.body.style.overflow;
      const previousPaddingRight = document.body.style.paddingRight || '';
      // Compensate for scrollbar disappearance to avoid layout shift
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previousOverflow;
        document.body.style.paddingRight = previousPaddingRight;
      };
    }
    return;
  }, [showNoticePanel, showNoticeModal, showCreateNotice, showUploadFile, showCreateCourse, showFileViewer, showMobileMenu, showMaterialViewer]);

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
        { id: '2', name: 'Software Engineering', code: 'CSE-327', description: 'Software Engineering Principles', created_at: new Date().toISOString() },
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
  const initializeDefaultNotices = async (): Promise<Notice[]> => {
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
        welcomeNotice = (data as Notice[]).find((n: Notice) => n.id === 'welcome-notice');
        routineNotice = (data as Notice[]).find((n: Notice) => n.id === 'exam-routine-notice');
      }

      const defaultNotices: Notice[] = [];

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
          category: 'announcement',
          priority: 'normal',
          exam_type: null,
          event_date: '',
          is_active: true,
          created_at: new Date().toISOString()
        } as Notice;

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
          title: '📅 Final Exam Routine - Section 5 (Dec 04–14, 2025)',
          content: `Final examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information (Finals - Dec 04 to Dec 14, 2025):**
• 04/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 319 • SHB • Room 2710
• 07/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 327 • DMAa • Room 2710
• 09/12/2025 (Tuesday)  — 09:45 AM to 11:45 AM • CSE 407 • NB   • Room 2710
• 11/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 351 • SHD  • Room 2710
• 14/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 417 • TAB  • Room 2710

• Arrive 15 minutes early for each exam
• Carry your student ID and necessary materials

[EXAM_ROUTINE_PDF]https://aljnyhxthmwgesnkqwzu.supabase.co/storage/v1/object/public/materials/materials/Final_Exam_Routine_Dec_2025.pdf[/EXAM_ROUTINE_PDF]
`,
          type: 'warning',
          category: 'exam',
          priority: 'high',
          exam_type: 'final',
          event_date: '',
          is_active: true,
          created_at: new Date().toISOString()
        } as Notice;

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
      
      // Filter only active notices and allow up to 5
      const activeNotices = defaultNotices.filter(n => n && n.is_active).slice(0, 5);

      setNotices(activeNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(activeNotices));

      console.log('Initialized with default notices:', activeNotices.length);

      return activeNotices;

    } catch (error) {
      console.error('Error initializing default notices:', error);
      // Fallback to empty notices
      setNotices([]);
      return [];
    }
  };

  // Load notices - Load all active notices (up to 5) from DATABASE first, then localStorage
  const loadNotices = async () => {
    // Prevent duplicate loading
    if (isLoadingNotices) {
      console.log('⏸️ Notice loading already in progress, skipping...');
      return;
    }

    setIsLoadingNotices(true);
    try {
      console.log('Loading all active notices (up to 5) from database...');
      
      let allNotices: Notice[] = [];
      // Restore persisted read-notice ids (we store reads in 'edu51five_read_notices')
      try {
        const readStr = localStorage.getItem('edu51five_read_notices');
        if (readStr) {
          const readArr = JSON.parse(readStr);
          if (Array.isArray(readArr)) setUnreadNotices(readArr);
        }
      } catch (e) {
        console.warn('Could not restore read notices from localStorage', e);
      }
      
      // PRIMARY SOURCE: Try to load ALL notices from database
      try {
        const { data: dbNotices, error } = await supabase
          .from('notices')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && dbNotices && dbNotices.length > 0) {
          allNotices = dbNotices as Notice[];
          console.log('✅ Database notices loaded:', allNotices.length);
          // Save to localStorage for offline access
          localStorage.setItem('edu51five_notices', JSON.stringify(allNotices));
          setNotices(allNotices);
          return; // Success! Exit early with database data
        } else if (error) {
          console.warn('Database error:', error.message);
        } else {
          console.log('No notices in database');
        }
      } catch (dbErr) {
        console.error('Database connection error:', dbErr);
      }

      // FALLBACK: If database is empty or unavailable, try localStorage
      const localNoticesStr = localStorage.getItem('edu51five_notices');
      if (localNoticesStr) {
        try {
          const localNotices = JSON.parse(localNoticesStr);
          allNotices = Array.isArray(localNotices) 
            ? localNotices.filter((n: any) => n && n.is_active).slice(0, 5)
            : [];
          console.log('⚠️ Using local storage fallback:', allNotices.length, 'notices');
        } catch (e) {
          console.error('Error parsing local notices:', e);
        }
      }

      // If there are no notices from DB/localStorage, initialize defaults (welcome + routine)
      if (!allNotices || allNotices.length === 0) {
        try {
          const defaults = await initializeDefaultNotices();
          if (defaults && defaults.length > 0) {
            allNotices = defaults;
          } else {
            // as a last resort try to read what was written
            const stored = localStorage.getItem('edu51five_notices');
            if (stored) {
              allNotices = JSON.parse(stored) as Notice[];
            }
          }
        } catch (e) {
          console.error('Error creating default notices:', e);
        }
      }

      setNotices(allNotices);

      console.log('All notices loaded:', allNotices.length, 'notices');
      
    } catch (err) {
      console.error('Error loading notices:', err);
      setNotices([]);
    } finally {
      setIsLoadingNotices(false);
    }
  };

  // Load emergency alerts and links from localStorage
  const loadEmergencyData = () => {
    try {
      const savedAlerts = localStorage.getItem('emergency_alerts');
      const savedLinks = localStorage.getItem('emergency_links');
      
      if (savedAlerts) {
        const alerts = JSON.parse(savedAlerts);
        setEmergencyAlerts(alerts.filter((a: any) => a.status === 'ACTIVE'));
      }
      
      if (savedLinks) {
        const links = JSON.parse(savedLinks);
        setEmergencyLinks(links.filter((l: any) => l.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error('Error loading emergency data:', err);
    }
  };

  // Handle course click - load materials and navigate (memoized)
  const handleCourseClick = useCallback((course: Course) => {
    setSelectedCourse(course);
    loadMaterials(course.code);
    goToView('course', course.code);
  }, [goToView]);

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

  // Material viewer function - open material in modal instead of new tab
  const openMaterialViewer = (material: Material) => {
    setSelectedMaterial(material);
    setShowMaterialViewer(true);
    setIsViewerLoading(true);
    setZoomLevel(100);
    setCurrentPage(1);
    setIsFullscreen(false);
    // Lock body scroll when modal opens
    document.body.style.overflow = 'hidden';
  };

  const closeMaterialViewer = () => {
    setShowMaterialViewer(false);
    setSelectedMaterial(null);
    setIsFullscreen(false);
    setZoomLevel(100);
    setCurrentPage(1);
    // Unlock body scroll when modal closes
    document.body.style.overflow = 'unset';
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  // Page navigation
  const nextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const previousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Normalize viewer URL and apply page hash for PDF-like types
  const buildViewerUrl = (material: Material, page: number) => {
    if (!material.file_url) return '';

    const ensureDrivePreview = (url: string) => {
      if (!url.includes('drive.google.com')) return url;
      if (url.includes('/preview')) return url;
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
    };

    const normalized = ensureDrivePreview(material.file_url);
    const [base] = normalized.split('#');

    // Only append page anchor for PDF-like embeds
    if (['pdf', 'notes', 'slides', 'document'].includes(material.type)) {
      return `${base}#page=${page}`;
    }

    return base;
  };

  // Handle file click from Google Drive - Convert DriveItem to Material and open viewer
  const handleDriveFileClick = (file: any) => {
    // Convert DriveItem to Material format
    const material: Material = {
      id: file.id,
      title: file.name,
      description: `Size: ${file.size ? formatBytes(file.size) : 'Unknown'}`,
      file_url: file.webViewLink || file.webContentLink || '',
      video_url: null,
      type: getMimeTypeCategory(file.mimeType),
      course_code: selectedCourse?.code || '',
      size: file.size ? formatBytes(file.size) : null,
      exam_period: selectedExamPeriod,
      created_at: new Date().toISOString()
    };
    
    openMaterialViewer(material);
  };

  // Helper: Convert bytes to readable format
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper: Convert MIME type to category
  const getMimeTypeCategory = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'slides';
    if (mimeType.includes('document') || mimeType.includes('text')) return 'notes';
    return 'document';
  };

  // Toggle notice panel
  const toggleNoticePanel = () => {
    setShowNoticePanel(!showNoticePanel);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // Get unread notice count (using memoized value)
  const getUnreadNoticeCount = useCallback(() => unreadCount, [unreadCount]);

  // Mark notice as read
  const markNoticeAsRead = (noticeId: string) => {
    setUnreadNotices(prev => {
      if (prev.includes(noticeId)) return prev;
      const next = [...prev, noticeId];
      try {
        localStorage.setItem('edu51five_read_notices', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to persist read notices', e);
      }
      return next;
    });
  };



  // Handle Facebook link - open in app on mobile, new tab on PC
  const handleFacebookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Open Facebook profile directly in new tab (no delays, no app protocol attempts)
    const facebookUrl = "https://www.facebook.com/mr.swapnil360";
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
  };

  // App color classes used for small avatar/icon backgrounds
  const APP_COLOR_CLASSES = 'from-blue-600 to-indigo-600';

  // Handle email contact - Open Gmail compose directly
  const handleEmailClick = () => {
    const email = 'miftahurr503@gmail.com';
    const subject = encodeURIComponent('Edu51Five Platform Contact');
    const body = encodeURIComponent('Hi Swapnil,\n\nI found your Edu51Five platform and want to connect!\n\nBest regards');
    
    // Open Gmail compose in new tab
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${email}&subject=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  // WhatsApp contact (replace the number with the actual support number)
  const SUPPORT_WHATSAPP_NUMBER = '8801318090383'; // updated to 01318090383 -> 8801318090383
  const handleWhatsAppClick = () => {
    const text = encodeURIComponent('Hi Swapnil, I want to talk about Edu51Five.');
    const waUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${text}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
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
        exam_period: newMaterial.exam_period,
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
          exam_period: newMaterial.exam_period,
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
        description: '',
        exam_period: 'midterm'
      });
      setShowUploadFile(false);
      if (selectedCourse) {
        loadMaterials(selectedCourse.code);
      }
      loadTotalMaterialsCount(); // Update total count
      
      // Send push notification to all subscribed users about new material
      try {
        const newMaterialNotice: Notice = {
          id: `material-${Date.now()}`,
          title: `New Material: ${newMaterial.title}`,
          content: `A new ${newMaterial.type} has been uploaded for ${selectedCourse?.name || newMaterial.course_id}${newMaterial.description ? ': ' + newMaterial.description.substring(0, 100) : ''}`,
          type: 'success',
          category: 'academic',
          priority: 'normal',
          is_active: true,
          created_at: new Date().toISOString()
        };
        await sendNoticeNotification(newMaterialNotice);
        console.log('✅ Push notification sent for new material');
      } catch (notificationError) {
        console.warn('⚠️ Could not send push notification, but file uploaded successfully:', notificationError);
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

  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'video': return <Play className="h-5 w-5" />;
      case 'pdf': 
      case 'doc': return <FileText className="h-5 w-5" />;
      case 'suggestion': return <Tag className="h-5 w-5" />;
      case 'past_question': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'pdf': return 'text-blue-600 bg-blue-100';
      case 'doc': return 'text-green-600 bg-green-100';
      case 'suggestion': return 'text-orange-600 bg-orange-100';
      case 'past_question': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, []);

  // Course color schemes for unique visual identity (memoized)
  const getCourseColorScheme = useCallback((courseCode: string, index: number) => {
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
  }, []);

  // Material color schemes for diversity (memoized)
  const getMaterialColorScheme = useCallback((index: number) => {
    const materialSchemes = [
      { bg: 'from-white via-blue-50 to-indigo-100', accent: 'from-blue-500 to-indigo-600' },
      { bg: 'from-white via-green-50 to-emerald-100', accent: 'from-green-500 to-emerald-600' },
      { bg: 'from-white via-purple-50 to-violet-100', accent: 'from-purple-500 to-violet-600' },
      { bg: 'from-white via-orange-50 to-amber-100', accent: 'from-orange-500 to-amber-600' },
      { bg: 'from-white via-pink-50 to-rose-100', accent: 'from-pink-500 to-rose-600' },
      { bg: 'from-white via-teal-50 to-cyan-100', accent: 'from-teal-500 to-cyan-600' }
    ];
    
    return materialSchemes[index % materialSchemes.length];
  }, []);

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

  // Admin: Send broadcast push notification to all subscribers
  const handleSendBroadcastNotification = async () => {
    if (!broadcastPush.title || !broadcastPush.body) {
      alert('Please fill in notification title and message');
      return;
    }

    try {
      setIsSendingBroadcast(true);

      // Format with brand for a more professional notification experience
      const rawTitle = broadcastPush.title.trim();
      const rawBody = broadcastPush.body.trim();
      const formattedTitle = rawTitle ? `Edu51Five • ${rawTitle}` : 'Edu51Five Update';
      const formattedBody = rawBody ? `${rawBody} — Stay ahead with Edu51Five.` : 'New update from Edu51Five.';

      // Call Supabase Edge Function to send push to all subscriptions
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: formattedTitle,
          body: formattedBody,
          url: broadcastPush.url || '/',
          broadcast: true // Flag to send to all subscribers
        }
      });

      if (error) {
        console.error('Error sending broadcast:', error);
        const errorMsg = error?.message || 'Unknown error';
        console.error('Full error response:', error);
        alert(`Failed to send notification:\n${errorMsg}\n\nMake sure:\n1. Edge Function is deployed\n2. VAPID keys are set in Supabase secrets\n3. At least one user has notifications enabled`);
        return;
      }

      if (data?.success === false) {
        console.error('Function returned error:', data?.error);
        alert(`Notification failed: ${data?.error || 'Unknown error'}`);
        return;
      }

      console.log('Broadcast sent:', data);
      alert(`✅ Push notification sent to ${data?.sent || 0} subscriber(s)!`);
      
      // Reset form
      setBroadcastPush({ title: '', body: '', url: '/' });
    } catch (err) {
      console.error('Broadcast error:', err);
      alert('Error sending notification');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Admin: Update global notices (Welcome or Exam Routine only)
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create new notice with unique ID (allow multiple notices, not just 2 slots)
      const noticeId = `notice-${Date.now()}`;
      
      const notice: Notice = {
        id: noticeId,
        title: newNotice.title,
        content: newNotice.content,
        type: newNotice.type,
        category: newNotice.category,
        priority: newNotice.priority,
        exam_type: newNotice.exam_type,
        event_date: newNotice.event_date,
        created_at: new Date().toISOString(),
        is_active: newNotice.is_active
      };

      console.log('Creating new notice:', noticeId);

      // Add new notice to the list (keep existing ones, add new one at the beginning)
      const updatedNotices = [notice, ...notices.filter(n => n.id !== noticeId)].slice(0, 5);

      setNotices(updatedNotices);
      localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
      console.log('New notice added to localStorage');

      // Try to save to database
      try {
        const { error } = await supabase
          .from('notices')
          .insert([notice]);
        
        if (error) {
          console.error('Database save failed:', error);
          console.log('Notice saved locally only.');
        } else {
          console.log('Notice saved to database successfully');
        }
      } catch (dbError) {
        console.warn('Database not available, using local storage:', dbError);
      }
      
      // Dispatch event for instant UI update
      window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'notices' } }));
      
      // Send push notification to all subscribers
      await sendNoticeNotification(notice);
      
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
      
      alert(`Global ${noticeId === 'welcome-notice' ? 'Welcome' : 'Exam Routine'} notice updated successfully! Push notifications sent.`);
      
    } catch (error) {
      console.error('Error creating notice:', error);
      alert('Error creating notice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Admin: Insert Final Exam Routine notice (prebuilt) - Optimized for INP
  const handleInsertFinalExamNotice = async () => {
    if (!confirm('Insert the Final Exam Routine notice for Dec 04–14, 2025?')) return;
    
    // Immediate UI feedback
    setLoading(true);
    
    // Use requestIdleCallback or setTimeout to avoid blocking
    setTimeout(async () => {
      try {
        const notice: Notice = {
          id: 'exam-routine-final-2025',
          title: '📅 Final Exam Routine - Section 5 (Dec 04–14, 2025)',
          content: `Final examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information (Finals - Dec 04 to Dec 14, 2025):**
• 04/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 319 • SHB • Room 2710
• 07/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 327 • DMAa • Room 2710
• 09/12/2025 (Tuesday)  — 09:45 AM to 11:45 AM • CSE 407 • NB   • Room 2710
• 11/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 351 • SHD  • Room 2710
• 14/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 417 • TAB  • Room 2710

• Arrive 15 minutes early for each exam
• Carry your student ID and necessary materials

[EXAM_ROUTINE_PDF]https://aljnyhxthmwgesnkqwzu.supabase.co/storage/v1/object/public/materials/materials/Final_Exam_Routine_Dec_2025.pdf[/EXAM_ROUTINE_PDF]

For queries, contact course instructors or the department.
`,
          type: 'warning',
          category: 'exam',
          priority: 'high',
          exam_type: 'final',
          event_date: '',
          created_at: new Date().toISOString(),
          is_active: true
        } as Notice;

        // Update local state first (instant UI update)
        const updatedNotices = [notice, ...notices.filter(n => n.id !== notice.id)].slice(0, 5);
        setNotices(updatedNotices);
        localStorage.setItem('edu51five_notices', JSON.stringify(updatedNotices));
        
        // Database operation in background (non-blocking)
        supabase.from('notices').upsert([notice], { onConflict: 'id' })
          .then(({ error }: { error: any }) => {
            if (error) {
              console.warn('Supabase upsert error:', error);
            } else {
              console.log('Final exam notice synced to database');
            }
          })
          .catch((err: any) => console.warn('Database sync failed:', err));

        // Notify other windows/tabs
        window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'notices' } }));
        
        setLoading(false);
        alert('✅ Final exam notice added successfully!');
      } catch (err) {
        console.error('Error inserting final exam notice:', err);
        setLoading(false);
        alert('Error adding final exam notice. See console for details.');
      }
    }, 0);
  };

  // Admin: Delete notice
  const handleDeleteNotice = async (noticeId: string) => {
    // Confirm deletion of any notice
    if (!confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
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
      
      // Delete from database (primary operation)
      let deletedFromDB = false;
      try {
        const { error } = await supabase.from('notices').delete().eq('id', noticeId);
        if (error) {
          console.error('Database delete error:', error);
          alert('⚠️ Notice deleted locally, but database update may have failed. Refresh page to verify.');
        } else {
          deletedFromDB = true;
          console.log('✅ Notice deleted from database successfully');
        }
      } catch (error) {
        console.warn('Notice deleted locally, database cleanup may be needed:', error);
        alert('⚠️ Notice deleted locally, but database update may have failed. Refresh page to verify.');
      }
      
      // Dispatch event for instant UI update across tabs
      window.dispatchEvent(new CustomEvent('edu51five-data-updated', { detail: { type: 'notices' } }));
      
      if (deletedFromDB) {
        alert('✅ Notice deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('❌ Error deleting notice. Please try again.');
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
        <div className="admin-auth bg-white p-8 rounded-lg shadow-md w-full max-w-md">
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
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
    }`}>
      {/* Enhanced Mobile-First Responsive Header */}
      <header className={`fixed top-0 left-0 right-0 shadow-2xl border-b z-40 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 border-gray-700/40'
          : 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-900 border-indigo-700/40'
      } text-white`}>
        <div className="w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 sm:h-18 md:h-20 lg:h-22 xl:h-24 gap-2 sm:gap-3 md:gap-4">
            
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
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold no-select text-white truncate filter drop-shadow-lg antialiased font-sans tracking-wide">
                    Edu<span className="text-red-400">51</span>Five
                  </h1>
                  <p className="text-xs sm:text-xs md:text-sm text-gray-300 no-select truncate">Intake 51</p>
                </div>
              </button>
            </div>

            {/* Real-time Semester Dashboard - Beautiful Display (Non-clickable) - Hidden on md/sm */}
            <div className="hidden xl:flex items-center space-x-5 xl:space-x-6 glass-card px-6 py-3 transition-all duration-300 shadow-lg">
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
                    <span className="responsive-text-xs text-white no-select font-medium">
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
            <div className="flex items-center flex-shrink-0 gap-1 sm:gap-2 justify-end min-w-0">
              
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
                  <div className={`mobile-menu-dropdown fixed top-20 right-3 sm:right-4 md:right-6 w-72 sm:w-80 backdrop-blur-xl rounded-2xl shadow-2xl border z-50 animate-in slide-in-from-top-2 duration-300 ${
                    isDarkMode
                      ? 'bg-gray-900/95 border-gray-700/50'
                      : 'bg-white/95 border-gray-200/50'
                  }`}>
                    <div className="p-4 sm:p-5 space-y-3">
                      {/* Dark Mode Toggle for Mobile */}
                      <button
                        onClick={() => {
                          toggleDarkMode();
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group border shadow-lg ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-gray-700/40 to-gray-800/40 hover:from-gray-700/50 hover:to-gray-800/50 border-gray-600/30 hover:border-gray-500/50'
                            : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          {isDarkMode ? (
                            <Sun className="h-5 w-5 text-yellow-300 drop-shadow-lg" />
                          ) : (
                            <Moon className="h-5 w-5 text-white drop-shadow-lg" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <span className={`font-bold text-base block ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                          </span>
                          <span className={`text-sm mt-0.5 block ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Toggle theme appearance</span>
                        </div>
                      </button>

                      {/* Smart Exam Materials */}
                      <button
                        onClick={() => {
                          goToView('examMaterials');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group border shadow-lg ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-orange-900/40 to-pink-900/40 hover:from-orange-900/50 hover:to-pink-900/50 border-orange-500/30 hover:border-orange-400/50'
                            : 'bg-gradient-to-r from-orange-50 to-pink-50 hover:from-orange-100 hover:to-pink-100 border-orange-300/40 hover:border-orange-400/60'
                        }`}
                      >
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-md">
                          <BookOpen className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className={`font-bold text-base block ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Smart Exam Materials</span>
                          <span className={`text-sm mt-0.5 block ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Access study resources</span>
                        </div>
                      </button>
                      
                      {/* Semester Tracker */}
                      <button
                        onClick={() => {
                          goToView('semester');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group border shadow-lg ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 hover:from-blue-900/50 hover:to-purple-900/50 border-blue-500/30 hover:border-blue-400/50'
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-300/40 hover:border-blue-400/60'
                        }`}
                      >
                        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                          <Calendar className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className={`font-bold text-base block ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>Semester Tracker</span>
                          <span className={`text-sm mt-0.5 block ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>Track your progress</span>
                        </div>
                      </button>
                      
                      {/* Notifications Section - Enhanced Modern Design */}
                      <button
                        onClick={() => {
                          setShowMobileMenu(false);
                          setShowNoticePanel(true);
                        }}
                        className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 group border shadow-lg ${
                          getUnreadNoticeCount() > 0
                            ? isDarkMode
                              ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/50 hover:to-indigo-900/50 border-blue-500/30 hover:border-blue-400/50'
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300/40 hover:border-blue-400/60'
                            : isDarkMode
                              ? 'bg-gradient-to-r from-gray-700/30 to-gray-800/30 hover:from-gray-700/40 hover:to-gray-800/40 border-gray-600/20 hover:border-gray-500/40'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative shadow-md ${
                          getUnreadNoticeCount() > 0
                            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700'
                            : isDarkMode
                              ? 'bg-gradient-to-r from-gray-600 to-gray-700'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}>
                          <Bell className="h-5 w-5 text-white drop-shadow-lg" />
                          {getUnreadNoticeCount() > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-xl border-2 border-white animate-pulse">
                              {getUnreadNoticeCount()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-base ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>Notifications</span>
                            {getUnreadNoticeCount() > 0 && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isDarkMode
                                  ? 'bg-blue-600/40 text-blue-300'
                                  : 'bg-blue-200 text-blue-800'
                              }`}>
                                {getUnreadNoticeCount()} new
                              </span>
                            )}
                          </div>
                          <span className={`text-sm mt-0.5 block ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {getUnreadNoticeCount() > 0 ? 'Tap to view updates' : 'All caught up!'}
                          </span>
                        </div>
                      </button>
                      
                      {/* Modern Tip Section */}
                      <div className={`text-center mt-4 pt-3 border-t ${
                        isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                      }`}>
                          <span className={`text-xs font-medium flex items-center justify-center space-x-1.5 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span className="text-base">💡</span>
                            <span>Tap any option to navigate</span>
                          </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Navigation - Shows on medium screens and up */}
              <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 hover:from-gray-600 hover:via-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm border border-white/20 group"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-yellow-300 group-hover:scale-110 transition-transform drop-shadow-lg" />
                  ) : (
                    <Moon className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-white group-hover:scale-110 transition-transform drop-shadow-lg" />
                  )}
                </button>

                {/* Theme selector removed (was causing issues) */}

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

              {/* Admin Button - Only visible when admin is logged in */}
              {isAdmin && (
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-xl bg-red-600 hover:bg-red-700 transition-all shadow-md hover:shadow-lg flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4 md:h-5 md:w-5 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modern Notice Panel with Glassmorphism */}
      {showNoticePanel && (
        <div className={`notification-panel fixed top-16 md:top-20 right-2 md:right-4 w-80 sm:w-96 max-w-[calc(100vw-1rem)] backdrop-blur-xl rounded-3xl shadow-2xl border z-50 max-h-80 md:max-h-96 overflow-hidden transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800/95 border-gray-700/50'
            : 'bg-white/90 border-white/30'
        }`}>
          {/* Professional Header with Enhanced Gradient */}
          <div className={`px-4 md:px-6 py-3 md:py-4 rounded-t-3xl shadow-lg transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 text-white'
              : 'bg-gradient-to-r from-gray-800 via-slate-800 to-gray-800 text-white'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center">
                <div className={`p-2 rounded-xl mr-3 shadow-lg border transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-white/10 border-white/20'
                    : 'bg-white/20 border-white/30'
                }`}>
                  <Bell className="h-4 w-4 text-white drop-shadow-lg" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-white drop-shadow-sm font-bold text-sm md:text-base">Notifications</span>
                  <span className={`text-[11px] md:text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-200'}`}>
                    Stay updated with new notices
                  </span>
                </div>
              </div>
              {isPushNotificationSupported() && (
                <button
                  onClick={async () => {
                    if (isPushEnabled) {
                      if (confirm('Disable push notifications?')) {
                        // Note: full unsubscribe would go here if needed
                        setIsPushEnabled(false);
                        alert('Push notifications disabled. You can re-enable them anytime.');
                      }
                    } else {
                      const enabled = await enablePushNotifications();
                      if (enabled) {
                        alert('Push notifications enabled! You will now receive updates when new notices are posted.');
                      }
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg border backdrop-blur-sm ${
                    isPushEnabled
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/60 hover:from-emerald-500 hover:to-teal-500'
                      : 'bg-white/15 text-white border-white/30 hover:bg-white/25'
                  }`}
                  title={isPushEnabled ? 'Notifications On' : 'Enable Notifications'}
                >
                  <Bell className="h-4 w-4" />
                  <span>{isPushEnabled ? 'On' : 'Enable'}</span>
                </button>
              )}
              <button
                onClick={() => setShowNoticePanel(false)}
                className={`p-2 rounded-2xl shadow-md border transition-all duration-300 ${
                  isDarkMode
                    ? 'text-white/80 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/20'
                    : 'text-white/80 hover:text-white hover:bg-white/20 border-white/20 hover:border-white/30'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Content Area with Modern Scrollbar */}
          <div className="max-h-56 md:max-h-64 overflow-y-auto scrollbar-modern">
            {notices.length === 0 && emergencyAlerts.length === 0 && emergencyLinks.length === 0 ? (
              <div className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50'
                    : 'bg-gradient-to-r from-blue-100 to-indigo-100'
                }`}>
                  <Bell className={`h-8 w-8 transition-colors duration-300 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                </div>
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>No notifications yet</p>
                <p className={`text-xs mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Stay tuned for updates!</p>
              </div>
            ) : (
              <>
                {/* Emergency Alerts Section */}
                {emergencyAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 md:p-5 border-b cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm ${
                      isDarkMode
                        ? 'border-red-700/50 hover:bg-gradient-to-r hover:from-red-900/30 hover:to-pink-900/30'
                        : 'border-red-200/50 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3 md:space-x-4">
                      <div className={`p-2 md:p-3 rounded-2xl flex-shrink-0 relative shadow-lg ${
                        isDarkMode ? 'bg-gradient-to-r from-red-900/50 to-pink-900/50' : 'bg-gradient-to-r from-red-100 to-pink-200'
                      }`}>
                        <span className="text-lg drop-shadow-sm">🚨</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-red-400' : 'text-red-700'
                        }`}>EMERGENCY ALERT</p>
                        <p className={`text-sm md:text-base font-medium mt-1 break-words transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Emergency Links Section */}
                {emergencyLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`p-4 md:p-5 border-b cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm ${
                      isDarkMode
                        ? 'border-purple-700/50 hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-blue-900/30'
                        : 'border-purple-200/50 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-blue-50/50'
                    }`}
                    onClick={() => {
                      if (link.url) window.open(link.url, '_blank');
                    }}
                  >
                    <div className="flex items-start space-x-3 md:space-x-4">
                      <div className={`p-2 md:p-3 rounded-2xl flex-shrink-0 relative shadow-lg ${
                        isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-r from-purple-100 to-blue-200'
                      }`}>
                        <span className="text-lg drop-shadow-sm">🔗</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs md:text-sm font-semibold transition-colors duration-300 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-700'
                        }`}>IMPORTANT LINK</p>
                        <p className={`text-sm md:text-base font-medium mt-1 break-words transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>{link.title}</p>
                        <p className={`text-xs mt-1 break-all ${
                          isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>{link.url}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Regular Notices Section */}
                {activeNotices.map((notice, index) => (
                <div
                  key={notice.id}
                  className={`p-4 md:p-5 border-b cursor-pointer transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm ${
                    isDarkMode
                      ? 'border-gray-700/50 hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-indigo-900/20'
                      : 'border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50'
                  }`}
                  onClick={() => {
                    handleNoticeClick(notice);
                    markNoticeAsRead(notice.id);
                    setShowNoticePanel(false);
                  }}
                >
                  <div className="flex items-start space-x-3 md:space-x-4">
                    {/* Modern Category & Priority Icon */}
                    <div className={`p-2 md:p-3 rounded-2xl flex-shrink-0 relative shadow-lg transition-all duration-300 ${
                      notice.type === 'info' 
                        ? isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50' : 'bg-gradient-to-r from-blue-100 to-blue-200'
                        : notice.type === 'warning' 
                        ? isDarkMode ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50' : 'bg-gradient-to-r from-yellow-100 to-orange-200'
                        : notice.type === 'success' 
                        ? isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50' : 'bg-gradient-to-r from-green-100 to-emerald-200'
                        : isDarkMode ? 'bg-gradient-to-r from-red-900/50 to-pink-900/50' : 'bg-gradient-to-r from-red-100 to-pink-200'
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
                        <p className={`text-sm md:text-base font-semibold line-clamp-2 flex-1 leading-relaxed transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {notice.title}
                        </p>
                        {notice.category === 'exam' && notice.exam_type && (
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium shadow-sm transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-orange-900/50 to-red-900/50 text-orange-300'
                              : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800'
                          }`}>
                            {notice.exam_type === 'midterm' ? '📝 Mid' : '🎯 Final'}
                          </span>
                        )}
                      </div>
                      
                      {/* Modern Date and badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className={`text-xs font-medium transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {new Date(notice.created_at).toLocaleDateString()}
                          </p>
                        
                        {/* Modern Priority badges */}
                        {notice.priority === 'urgent' && (
                          <span className={`text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-sm transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-red-900/50 to-pink-900/50 text-red-300'
                              : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                          }`}>
                            🔴 URGENT
                          </span>
                        )}
                        {notice.priority === 'high' && (
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold shadow-sm transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/50 text-yellow-300'
                              : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800'
                          }`}>
                            🟡 HIGH
                          </span>
                        )}
                        
                        {/* Modern Event date */}
                        {notice.category === 'event' && notice.event_date && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium shadow-sm transition-colors duration-300 ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 text-purple-300'
                              : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800'
                          }`}>
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
                ))}
              </>
            )}
          </div>          {/* Professional Footer */}
          {notices.length > 0 && (
            <div className={`px-4 py-3 rounded-b-3xl border-t shadow-inner ${
              isDarkMode
                ? 'bg-gradient-to-r from-gray-800/90 to-gray-900/90 border-gray-700/60'
                : 'bg-gradient-to-r from-gray-100/90 to-slate-100/90 border-gray-200/60'
            }`}>
              <p className={`text-xs text-center font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                💡 Click any notification to view details
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Enhanced Mobile Responsive Design */}
      {currentView !== 'semester' && (
        <main className="pt-16 sm:pt-18 md:pt-20 lg:pt-22 xl:pt-24 min-h-screen overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Home Page */}
        {currentView === 'home' && (
          <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            {/* Welcome Hero Section */}
            <div className="text-center py-8 sm:py-10">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className={`rounded-3xl shadow-xl p-4 sm:p-5 transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <img 
                    src="/image.png" 
                    alt="BUBT Logo" 
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain" 
                  />
                </div>
              </div>

              {/* Welcome Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                <span className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>Welcome to </span>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Edu<span className="text-red-500">51</span>Five
                </span>
              </h1>

              {/* Subtitle and Description */}
              <div className="max-w-2xl mx-auto space-y-2">
                <p className={`text-xl sm:text-2xl font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  BUBT Intake 51 Excellence Platform
                </p>
                <p className={`text-sm sm:text-base transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-slate-600'
                }`}>
                  Department of Computer Science & Engineering
                </p>
              </div>
            </div>

            {/* Section 5 Entry Card - 10 Minute School Style */}
            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {/* Section 5 Card */}
                <button
                  onClick={() => goToView('section5')}
                  className={`w-full group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] border select-none ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}
                >
                  {/* Compact Banner Image Section */}
                  <div className="relative h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
                  {/* Cover Image */}
                  <div className="absolute inset-0">
                    <img 
                      src="/cover.jpg" 
                      alt="Section 5 Cover" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Gradient Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40"></div>

                  {/* Shine Effect on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>

                {/* Compact Content Section */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className={`text-lg sm:text-xl font-bold mb-1 group-hover:text-indigo-600 transition-colors ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        Section 5 - CSE
                      </h2>
                      <p className={`text-xs sm:text-sm mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        BUBT Intake 51 • Computer Science & Engineering
                      </p>
                      
                      {/* Compact Info Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        <div className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          {courses.length} Courses
                        </div>
                        <div className="inline-flex items-center bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Materials
                        </div>
                        <div className="inline-flex items-center bg-purple-50 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule
                        </div>
                      </div>
                    </div>

                    {/* Compact Action Arrow */}
                    <div className="flex-shrink-0">
                      <div className="bg-indigo-600 text-white rounded-full p-2.5 group-hover:bg-indigo-700 transition-all shadow-md group-hover:shadow-lg">
                        <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
              </button>

              {/* Placeholder Cards - Coming Soon */}
              <div className={`rounded-xl shadow-md border p-4 flex flex-col items-center justify-center h-full min-h-[280px] opacity-60 select-none transition-colors duration-300 ${
                isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">🚧</div>
                  <p className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Section Coming Soon</p>
                </div>
              </div>

              <div className={`rounded-xl shadow-md border p-4 flex flex-col items-center justify-center h-full min-h-[280px] opacity-60 select-none transition-colors duration-300 ${
                isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
              }`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">🚧</div>
                  <p className={`font-semibold text-sm transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Section Coming Soon</p>
                </div>
              </div>
            </div>
          </div>

            {/* Platform Features - Floating Pills Grid */}
            <div className="max-w-14xl mx-auto px-4">
              <div className="text-center mb-4">
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Available Features</p>
              </div>
              
              {/* Marquee-style Available Features ticker */}
              <MarqueeTicker isDarkMode={isDarkMode} />
              
              <p className={`text-center text-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>

              </p>
            </div>

            {/* Compact Connect & Support Section removed - moved into main footer below */}

            {/* Developer & Copyright Footer */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden mt-4">
              <div className="relative z-10 p-6">
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

                  {/* Connect & Support (merged) with improved icons */}
                  <div className="mt-4 pt-4 border-t border-slate-700/30">
                    <div className="max-w-4xl mx-auto text-center">
                      <h3 className="text-sm font-semibold text-slate-200 mb-2">Connect & Support</h3>
                      <p className="text-xs text-slate-400 mb-3">Found a bug? Have suggestions? Reach out — we appreciate your feedback.</p>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={handleEmailClick}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white text-sm font-medium shadow-md hover:opacity-95 transition"
                          title="Email Support"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email</span>
                        </button>

                        <a
                          href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Swapnil, I need help with Edu51Five.')}`}
                          onClick={handleWhatsAppClick}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-medium shadow-md hover:bg-emerald-800 transition"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Support"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-4.2-1L3 21l1.9-5.7a8.38 8.38 0 01-1.1-4 8.5 8.5 0 0115.2-5.9 8.5 8.5 0 01.0 11z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13c-.5-.3-1.3-.6-1.5-.6-.2 0-.4-.1-.6.1s-.7.6-.8.7c-.1.1-.3.1-.5 0-.5-.1-1-1.9-1.1-2.2-.1-.3 0-.5.2-.7.2-.2.5-.5.8-.8.3-.3.4-.5.6-.8.2-.3 0-.6-.1-.8-.1-.2-.6-.5-1.1-.8-.6-.3-1-.3-1.5-.2s-1 .5-1.6 1.1c-.6.6-1 1.3-1 1.9s.4 1 .9 1.4c.5.4 1.2.9 2 .9.8 0 1.5-.2 2.1-.4.6-.2 1.1-.4 1.4-.3.3.1.7.2.9.4.2.2.2.6 0 .9z" />
                          </svg>
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href="https://www.facebook.com/mr.swapnil360"
                          onClick={handleFacebookClick}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-medium shadow-md hover:opacity-95 transition"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Facebook"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2h-3a4 4 0 00-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 011-1h3V2z" />
                          </svg>
                          <span>Facebook</span>
                        </a>
                      </div>
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
              <h2 className={`text-3xl font-bold bg-clip-text transition-colors duration-300 ${
                isDarkMode 
                  ? 'text-transparent bg-gradient-to-r from-gray-100 via-blue-300 to-purple-300 bg-clip-text' 
                  : 'text-transparent bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text'
              } mb-4`}>Section 5 - Department of CSE</h2>
              <p className={`text-lg transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>Choose your course to access materials</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {courses.map((course, index) => {
                const colorScheme = getCourseColorScheme(course.code, index);
                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course)}
                    className={`p-6 md:p-8 rounded-2xl shadow-xl border backdrop-blur-sm hover:shadow-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-2 group ${
                      isDarkMode
                        ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        : `bg-gradient-to-br ${colorScheme.bgGradient} border-white/30 hover:${colorScheme.border}`
                    }`}
                  >
                    <h3 className={`text-xl md:text-2xl font-bold mb-3 transition-all duration-300 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>{course.name}</h3>
                    <p className={`font-semibold mb-3 text-sm md:text-base px-3 py-1 rounded-full inline-block transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-blue-900/50 text-blue-300' 
                        : colorScheme.badge
                    }`}>{course.code}</p>
                    <p className={`text-sm md:text-base mb-4 md:mb-6 select-text leading-relaxed transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{course.description}</p>
                    <p className={`text-sm md:text-base font-bold no-select flex items-center group-hover:translate-x-2 transition-transform duration-300 ${
                      isDarkMode 
                        ? 'text-blue-400' 
                        : `text-transparent bg-gradient-to-r ${colorScheme.textGradient} bg-clip-text`
                    }`}>
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
          <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-2 sm:px-0">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>{selectedCourse.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit transition-colors duration-300 ${
                isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
              }`}>
                {selectedCourse.code}
              </span>
            </div>
            <p className={`text-sm sm:text-base md:text-lg select-text transition-colors duration-300 px-2 sm:px-0 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{selectedCourse.description}</p>

            {/* Exam Period Tabs - Modern Design */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 md:mb-10 px-2 sm:px-0 w-full">
              {/* Midterm Button */}
              <button
                onClick={() => setSelectedExamPeriod('midterm')}
                className={`flex-1 relative group overflow-hidden rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                  selectedExamPeriod === 'midterm'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                      : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-400/50'
                    : isDarkMode
                      ? 'bg-gray-800/80 border border-gray-700 text-gray-300 hover:border-blue-500/50 hover:bg-gray-800'
                      : 'bg-gray-100/80 border border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-gray-200'
                }`}
              >
                {/* Animated background for active state */}
                {selectedExamPeriod === 'midterm' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
                )}
                <div className="relative flex items-center justify-center space-x-2.5 py-3 sm:py-4 px-4">
                  <div className={`transition-transform duration-300 ${selectedExamPeriod === 'midterm' ? 'scale-110' : 'scale-100'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span>Midterm Materials</span>
                </div>
              </button>
              
              {/* Final Button */}
              <button
                onClick={() => setSelectedExamPeriod('final')}
                className={`flex-1 relative group overflow-hidden rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                  selectedExamPeriod === 'final'
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white shadow-2xl shadow-pink-500/50'
                      : 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 text-white shadow-2xl shadow-pink-400/50'
                    : isDarkMode
                      ? 'bg-gray-800/80 border border-gray-700 text-gray-300 hover:border-purple-500/50 hover:bg-gray-800'
                      : 'bg-gray-100/80 border border-gray-200 text-gray-700 hover:border-purple-400 hover:bg-gray-200'
                }`}
              >
                {/* Animated background for active state */}
                {selectedExamPeriod === 'final' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
                )}
                <div className="relative flex items-center justify-center space-x-2.5 py-3 sm:py-4 px-4">
                  <div className={`transition-transform duration-300 ${selectedExamPeriod === 'final' ? 'scale-110' : 'scale-100'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Final Materials</span>
                </div>
              </button>
            </div>

            {/* NEW: Direct Google Drive View */}
            <CourseDriveView
              courseCode={selectedCourse.code}
              courseName={selectedCourse.name}
              examPeriod={selectedExamPeriod}
              isDarkMode={isDarkMode}
              onFileClick={handleDriveFileClick}
            />

            {loading ? (
              <div className="text-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
                  isDarkMode ? 'border-blue-400' : 'border-blue-600'
                }`}></div>
                <p className={`mt-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Loading materials...</p>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-12">
                <FileText className={`h-12 w-12 mx-auto mb-4 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>No {selectedExamPeriod} materials found</h3>
                <p className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>No materials have been uploaded for {selectedExamPeriod} exam yet.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-7 px-2 sm:px-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                  <div className={`flex-shrink-0 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                  }`}>
                    <Upload className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-base sm:text-lg md:text-xl font-bold transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>📁 Uploaded {selectedExamPeriod.charAt(0).toUpperCase() + selectedExamPeriod.slice(1)} Materials</h3>
                    <p className={`text-xs sm:text-sm md:text-base transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Materials uploaded for {selectedExamPeriod} exam preparation</p>
                  </div>
                </div>
                
                {filteredMaterials.map((material, index) => {
                  const materialScheme = getMaterialColorScheme(index);
                  return (
                    <div key={material.id} className={`rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border backdrop-blur-sm p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 transform hover:sm:-translate-y-1 md:hover:-translate-y-2 ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 border-gray-700/50'
                        : `bg-gradient-to-br ${materialScheme.bg} border-white/20`
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-5 md:gap-6">
                        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 md:gap-5 lg:gap-6 flex-1 min-w-0">
                          <div className={`flex-shrink-0 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl md:rounded-2xl shadow-md sm:shadow-lg transform rotate-0 sm:rotate-1 md:rotate-3 bg-gradient-to-r ${materialScheme.accent} text-white`}>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8">
                              {getTypeIcon(material.type)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 md:mb-3 break-words transition-all cursor-pointer ${
                              isDarkMode ? 'text-gray-100 hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                            }`}>
                              {material.title}
                            </h3>
                            <p className={`text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-5 leading-relaxed line-clamp-2 transition-colors duration-300 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{material.description}</p>
                            
                            <div className="flex flex-wrap gap-2 sm:gap-2.5 md:gap-3 text-xs sm:text-xs md:text-sm">
                              <div className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-lg md:rounded-xl font-semibold transition-colors duration-300 whitespace-nowrap ${
                                isDarkMode 
                                  ? 'bg-blue-900/40 text-blue-300'
                                  : `bg-gradient-to-r ${materialScheme.accent} bg-opacity-20 text-gray-800`
                              }`}>
                                Type: {material.type}
                              </div>
                              {material.size && (
                                <div className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-lg md:rounded-xl font-semibold transition-colors duration-300 whitespace-nowrap ${
                                  isDarkMode
                                    ? 'bg-gray-700/50 text-gray-300'
                                    : 'bg-gradient-to-r from-gray-100 to-slate-200 text-gray-800'
                                }`}>Size: {material.size}</div>
                              )}
                              <div className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-lg md:rounded-xl font-semibold transition-colors duration-300 whitespace-nowrap ${
                                isDarkMode
                                  ? 'bg-emerald-900/40 text-emerald-300'
                                  : 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800'
                              }`}>
                                {new Date(material.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
                        {/* Preview Button - Opens in Modal */}
                        {material.type === 'video' && material.video_url ? (
                          <button
                            onClick={() => openMaterialViewer(material)}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Watch Video"
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                          </button>
                        ) : material.file_url ? (
                          <button
                            onClick={() => openMaterialViewer(material)}
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Preview File"
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                          </button>
                        ) : (
                          <button
                            className={`p-2 sm:p-2.5 cursor-not-allowed rounded-lg sm:rounded-xl ${
                              isDarkMode ? 'text-gray-600' : 'text-gray-300'
                            }`}
                            title="No preview available"
                            disabled
                          >
                            <Eye className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                          </button>
                        )}

                        {/* Download Button */}
                        {material.file_url ? (
                          <a
                            href={material.file_url}
                            download
                            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-300 ${
                              isDarkMode
                                ? 'text-gray-400 hover:text-teal-400 hover:bg-teal-900/30'
                                : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50'
                            }`}
                            title="Download File"
                          >
                            <Download className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
                          </a>
                        ) : (
                          <button
                            className={`p-2 sm:p-2.5 cursor-not-allowed rounded-lg sm:rounded-xl ${
                              isDarkMode ? 'text-gray-600' : 'text-gray-300'
                            }`}
                            title="No file to download"
                            disabled
                          >
                            <Download className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5" />
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

        {/* Admin Dashboard - New Redesigned */}
        {isAdmin && currentView === 'admin' && (
          <AdminDashboard
            isDarkMode={isDarkMode}
            coursesCount={courses.length}
            materialsCount={totalMaterialsCount}
            onlineUsers={activeUsersCount}
            currentWeek={semesterStatus.semesterWeek}
            totalWeeks={20}
            notices={notices}
            onEditNotice={() => setShowCreateNotice(true)}
            onCreateNotice={() => setShowCreateNotice(true)}
            onDeleteNotice={handleDeleteNotice}
            broadcastPush={broadcastPush}
            onBroadcastPushChange={setBroadcastPush}
            onSendBroadcast={handleSendBroadcastNotification}
            isSendingBroadcast={isSendingBroadcast}
          />
        )}

        {/* OLD ADMIN DASHBOARD CODE - HIDDEN FOR FUTURE USE */}
        {false && isAdmin && currentView === 'admin' && (
            <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
            {/* Modern Header */}
              <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                  <div className="order-1">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Admin Dashboard
                    </h1>
                      <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-2 text-sm sm:text-base`}>Manage your educational platform with ease</p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{courses.length} Courses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{materials.length} Materials</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{activeNotices.length} Active Notices</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 order-2">
                    <button
                      onClick={() => setShowCreateCourse(true)}
                      className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 sm:h-5 w-4 sm:w-5 group-hover:rotate-90 transition-transform duration-200" />
                      <span className="font-medium text-sm sm:text-base">Add Course</span>
                    </button>
                    <button
                      onClick={() => setShowUploadFile(true)}
                      className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Upload className="h-4 sm:h-5 w-4 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium text-sm sm:text-base">Upload Material</span>
                    </button>
                    <button
                      onClick={() => setShowCreateNotice(true)}
                      className="group flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-700 text-white rounded-xl hover:from-purple-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Bell className="h-4 sm:h-5 w-4 sm:w-5 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium text-sm sm:text-base">Create Smart Notice</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
              {/* Quick Navigation Card */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-sm border p-4 sm:p-6`}>
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-xl flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Manage Courses - HIDDEN */}
                  {false && <a 
                    href="#courses-section" 
                      className={`group p-4 border rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-700 hover:border-blue-500 hover:bg-blue-900/30' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode 
                            ? 'bg-blue-900/50 group-hover:bg-blue-900' 
                            : 'bg-blue-100 group-hover:bg-blue-200'
                        }`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>📚</span>
                      </div>
                        <span className={`font-medium text-sm sm:text-base ${
                          isDarkMode 
                            ? 'text-gray-300 group-hover:text-blue-400' 
                            : 'text-gray-700 group-hover:text-blue-700'
                        }`}>Manage Courses</span>
                    </div>
                  </a>}
                  {/* Manage Materials - HIDDEN */}
                  {false && <a 
                    href="#materials-section" 
                      className={`group p-4 border rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-700 hover:border-emerald-500 hover:bg-emerald-900/30' 
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode 
                            ? 'bg-emerald-900/50 group-hover:bg-emerald-900' 
                            : 'bg-emerald-100 group-hover:bg-emerald-200'
                        }`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>🗂️</span>
                      </div>
                        <span className={`font-medium text-sm sm:text-base ${
                          isDarkMode 
                            ? 'text-gray-300 group-hover:text-emerald-400' 
                            : 'text-gray-700 group-hover:text-emerald-700'
                        }`}>Manage Materials</span>
                    </div>
                  </a>}
                  <a 
                    href="#notices-section" 
                      className={`group p-4 border rounded-xl transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-700 hover:border-purple-500 hover:bg-purple-900/30' 
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode 
                            ? 'bg-purple-900/50 group-hover:bg-purple-900' 
                            : 'bg-purple-100 group-hover:bg-purple-200'
                        }`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>📢</span>
                      </div>
                        <span className={`font-medium text-sm sm:text-base ${
                          isDarkMode 
                            ? 'text-gray-300 group-hover:text-purple-400' 
                            : 'text-gray-700 group-hover:text-purple-700'
                        }`}>Manage Notices</span>
                    </div>
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 sm:p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Courses</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{courses.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">📚</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 sm:p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-xs sm:text-sm font-medium">Total Materials</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{totalMaterialsCount}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">📁</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 sm:p-6 rounded-2xl text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs sm:text-sm font-medium">Active Notices</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{activeNotices.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-400 bg-opacity-50 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Broadcast Push Notification Section */}
              <div className={`${isDarkMode ? 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'} rounded-2xl shadow-lg border p-4 sm:p-6`}>
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 ${isDarkMode ? 'bg-indigo-800/50' : 'bg-indigo-100'} rounded-xl flex items-center justify-center`}>
                    <Bell className={`w-5 h-5 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>📢 Broadcast Push Notification</h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Send instant notifications to all subscribed users</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Notification Title
                      </label>
                      <input
                        type="text"
                        value={broadcastPush.title}
                        onChange={(e) => setBroadcastPush({ ...broadcastPush, title: e.target.value })}
                        placeholder="e.g., New Study Material Uploaded"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Open URL (optional)
                      </label>
                      <input
                        type="text"
                        value={broadcastPush.url}
                        onChange={(e) => setBroadcastPush({ ...broadcastPush, url: e.target.value })}
                        placeholder="/course/CSE-319 or /"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Message Body
                    </label>
                    <textarea
                      value={broadcastPush.body}
                      onChange={(e) => setBroadcastPush({ ...broadcastPush, body: e.target.value })}
                      placeholder="Check out the new CSE-319 notes uploaded in the Notes section!"
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      💡 Requires Edge Function with VAPID keys configured
                    </p>
                    <button
                      onClick={handleSendBroadcastNotification}
                      disabled={isSendingBroadcast || !broadcastPush.title || !broadcastPush.body}
                      className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                        isSendingBroadcast || !broadcastPush.title || !broadcastPush.body
                          ? isDarkMode
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : isDarkMode
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isSendingBroadcast ? '⏳ Sending...' : '🚀 Send to All Subscribers'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Drive Manager - New centralized approach */}
              <div className={`rounded-3xl shadow-xl border backdrop-blur-sm p-4 sm:p-6 md:p-8 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' 
                  : 'bg-gradient-to-br from-orange-50 via-white to-pink-50 border-orange-200'
              }`}>
                <DriveManager isDarkMode={isDarkMode} />
              </div>

              {/* Courses List - Modern Design - HIDDEN FOR NOW */}
                {false && <div id="courses-section" className={`rounded-3xl shadow-xl border backdrop-blur-sm p-4 sm:p-6 md:p-8 lg:p-10 responsive-container ${
                  isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700' 
                    : 'bg-gradient-to-br from-white via-gray-50 to-blue-50 border-white/20'
                }`}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-responsive">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ui-element">
                      <span className="text-white font-bold no-select text-lg">📚</span>
                    </div>
                      <h3 className={`responsive-text-xl font-bold no-select ml-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Course Management</h3>
                  </div>
                </div>
                <div className="space-y-6">
                  {courses.map((course, index) => {
                    const colorScheme = getCourseColorScheme(course.code, index);
                    return (
                      <div key={course.id} className={`group p-6 md:p-8 border-l-4 rounded-2xl shadow-lg hover:shadow-2xl smooth-card ui-element transition-all duration-300 transform hover:-translate-y-1 ${
                        isDarkMode
                          ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 hover:border-blue-500'
                          : `bg-gradient-to-r ${colorScheme.bgGradient} border-${colorScheme.accent} hover:border-purple-500`
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                              <h4 className={`font-bold responsive-text-xl group-hover:bg-gradient-to-r group-hover:${colorScheme.textGradient} group-hover:bg-clip-text transition-all duration-300 no-select ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{course.name}</h4>
                            <p className={`font-semibold mt-2 no-select ${colorScheme.badge} px-3 py-1 rounded-full inline-block text-sm`}>{course.code}</p>
                              <p className={`responsive-text-base mt-3 select-text leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{course.description}</p>
                          </div>
                          <div className="text-right ml-8">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className={`w-10 h-10 bg-gradient-to-r ${colorScheme.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                                <span className="text-white text-sm font-bold">
                                  {materials.filter(m => m.course_code === course.code).length}
                                </span>
                              </div>
                                <span className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>materials</span>
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
                    <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-gray-800' : ''}`}>
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <span className="text-3xl">📚</span>
                      </div>
                      <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>No courses yet</p>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Create your first course to get started</p>
                    </div>
                  )}
                </div>
              </div>}

            {/* Materials Management Section - HIDDEN FOR NOW */}
              {false && <div id="materials-section" className={`rounded-2xl p-8 shadow-xl border ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700' 
                  : 'bg-gradient-to-br from-white to-gray-50 border-gray-100'
              }`}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>Materials Library</h3>
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage all uploaded materials ({materials.length} items)</p>
                  </div>
                </div>
                  <div className={`text-sm px-4 py-2 rounded-full ${
                    isDarkMode ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-100'
                  }`}>
                  {materials.length > 0 ? 'Click delete to remove materials' : 'No materials uploaded yet'}
                </div>
              </div>

              <div className="grid gap-6">
                {materials.map((material) => (
                    <div key={material.id} className={`rounded-xl border p-6 hover:shadow-lg transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-blue-200'
                    }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          {(() => {
                            if (material.type.includes('pdf')) return <FileText className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />;
                            if (material.type.includes('image')) return <ImageIcon className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />;
                            if (material.type.includes('video')) return <Play className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />;
                            if (material.type.includes('document') || material.type.includes('word')) return <FileText className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
                            return <FileText className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-lg mb-1 truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{material.title}</h4>
                            <div className={`flex items-center space-x-4 text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                              {material.type}
                            </span>
                            {material.size && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
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
                  <div className={`text-center py-16 rounded-xl ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-gray-800 to-gray-700' 
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  }`}>
                    <div className={`p-4 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center ${
                      isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-300 to-gray-400'
                    }`}>
                      <FolderOpen className="h-10 w-10 text-white" />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>No Materials Found</h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-lg mb-4`}>Upload some materials to see them here</p>
                    <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>Materials will appear as beautiful cards with file type indicators</div>
                  </div>
                )}
              </div>
            </div>}
            </div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto" style={{ height: '100dvh' }}>
            <div className="min-h-screen flex items-center justify-center p-4" style={{ minHeight: '100dvh' }}>
              <div className={`relative w-full max-w-[92vw] sm:max-w-md md:max-w-lg max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                {/* Modal Header */}
                <div className={`flex-shrink-0 p-4 sm:p-5 border-b transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      <span className="text-xl sm:text-2xl mr-2">➕</span>
                      <span>Add New Course</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowCreateCourse(false)}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleCreateCourse} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <input
                      type="text"
                      placeholder="Course Name"
                      value={newCourse.name}
                      onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Course Code"
                      value={newCourse.code}
                      onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <textarea
                      placeholder="Course Description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className={`flex-shrink-0 p-4 sm:p-5 border-t transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateCourse(false)}
                        className={`flex-1 px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Adding...' : 'Add Course'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Upload File Modal */}
        {showUploadFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto" style={{ height: '100dvh' }}>
            <div className="min-h-screen flex items-center justify-center p-4" style={{ minHeight: '100dvh' }}>
              <div className={`relative w-full max-w-[92vw] sm:max-w-md md:max-w-lg max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                {/* Modal Header */}
                <div className={`flex-shrink-0 p-4 sm:p-5 border-b transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      <span className="text-xl sm:text-2xl mr-2">📤</span>
                      <span>Upload Material</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setShowUploadFile(false)}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleFileUpload} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    <select
                      value={newMaterial.course_id}
                      onChange={(e) => setNewMaterial({ ...newMaterial, course_id: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
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
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                    <select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value as Material['type'] })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">Document</option>
                      <option value="video">Video</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="past_question">Past Question</option>
                    </select>
                    <select
                      value={newMaterial.exam_period}
                      onChange={(e) => setNewMaterial({ ...newMaterial, exam_period: e.target.value as 'midterm' | 'final' })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    >
                      <option value="midterm">Midterm Exam</option>
                      <option value="final">Final Exam</option>
                    </select>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewMaterial({ ...newMaterial, file });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.avi"
                    />
                    <input
                      type="url"
                      placeholder="Video URL (optional)"
                      value={newMaterial.video_url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, video_url: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      rows={3}
                    />
                  </div>

                  {/* Modal Footer */}
                  <div className={`flex-shrink-0 p-4 sm:p-5 border-t transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setShowUploadFile(false)}
                        className={`flex-1 px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                          isDarkMode 
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-700' 
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Categorized Notice Creation Modal */}
        {showCreateNotice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto" style={{ height: '100dvh' }}>
            <div className="min-h-screen flex items-center justify-center p-4" style={{ minHeight: '100dvh' }}>
              <div className={`relative w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                {/* Modal Header - Fixed */}
                <div className={`flex-shrink-0 p-4 sm:p-5 lg:p-6 border-b transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h2 className={`text-lg sm:text-xl font-bold flex items-center ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        <span className="text-xl sm:text-2xl mr-2">📢</span>
                        <span>Create Smart Notice</span>
                      </h2>
                      <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Choose a category and let the system help you create targeted notices
                      </p>
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
                      className={`flex-shrink-0 p-2 rounded-xl transition-all duration-300 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>
                </div>
              
                {/* Modal Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
              
              {/* Section: Category Selection */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className={`h-8 w-1 rounded-full mr-3 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                  <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Select Notice Category</h3>
                </div>
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
                          ? isDarkMode ? 'border-blue-400 bg-blue-900/50 shadow-md' : 'border-blue-500 bg-blue-50 shadow-md'
                          : isDarkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{category.icon}</span>
                        <span className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{category.label}</span>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{category.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Basic Information */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className={`h-8 w-1 rounded-full mr-3 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-600'}`}></div>
                  <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Basic Information</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* Title with smart suggestions */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Title
                      {newNotice.category === 'exam' && (
                        <span className="text-xs text-blue-600 ml-2">(Exam notices get priority display)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}
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
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Priority Level</label>
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
                              ? isDarkMode ? 'border-blue-400 bg-blue-900/50' : 'border-blue-500 bg-blue-50'
                              : isDarkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50' : 'border-gray-200 hover:border-gray-300'
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
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Visual Style</label>
                    <select
                      value={newNotice.type}
                      onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value as any })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}
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
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Exam Type</label>
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
                                ? isDarkMode ? 'border-orange-400 bg-orange-900/50 text-gray-100' : 'border-orange-500 bg-orange-50'
                                : isDarkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 text-gray-200' : 'border-gray-200 hover:border-gray-300'
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
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Event Date</label>
                      <input
                        type="date"
                        value={newNotice.event_date || ''}
                        onChange={(e) => setNewNotice({ ...newNotice, event_date: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}
                      />
                    </div>
                  )}

                  {/* Active toggle */}
                  <div className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newNotice.is_active}
                      onChange={(e) => setNewNotice({ ...newNotice, is_active: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      📢 Publish immediately (visible to all students)
                    </label>
                  </div>
                </div>
                </div>
              </div>

              {/* Section: Content */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className={`h-8 w-1 rounded-full mr-3 ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`}></div>
                  <h3 className={`text-base font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Notice Content</h3>
                </div>
                <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Notice Content</label>
                <textarea
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}
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
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {newNotice.content.length} characters
                  </span>
                  {newNotice.category === 'exam' && newNotice.exam_type && (
                    <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'}`}>
                      🎯 {newNotice.exam_type === 'midterm' ? 'Mid-term' : 'Final'} Exam Notice
                    </span>
                  )}
                </div>
                </div>
              </div>

                </div>

                {/* Modal Footer - Fixed */}
                <div className={`flex-shrink-0 p-4 sm:p-5 lg:p-6 border-t transition-colors duration-300 ${
                  isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row gap-3">
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
                      className={`px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                        isDarkMode 
                          ? 'border-gray-600 text-gray-200 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInsertFinalExamNotice}
                      disabled={loading}
                      className={`px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
                        isDarkMode 
                          ? 'border-orange-400 text-orange-300 hover:bg-orange-900/30' 
                          : 'border-orange-400 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      ➕ Insert Final Exam Routine
                    </button>
                    <button
                      onClick={handleCreateNotice}
                      disabled={!newNotice.title || !newNotice.content}
                      className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                    >
                      🚀 Create {newNotice.priority === 'urgent' ? 'Urgent' : newNotice.category === 'exam' ? 'Exam' : 'Smart'} Notice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Notice Modal */}
        {showNoticeModal && selectedNotice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="notice-modal-title">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className={`relative w-full max-w-[92vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
              <div className={`flex-shrink-0 p-3 sm:p-4 border-l-4 transition-colors duration-300 ${
                selectedNotice.type === 'info' 
                  ? isDarkMode ? 'border-blue-400 bg-blue-900/30' : 'border-blue-400 bg-blue-50'
                  : selectedNotice.type === 'warning' 
                  ? isDarkMode ? 'border-yellow-400 bg-yellow-900/30' : 'border-yellow-400 bg-yellow-50'
                  : selectedNotice.type === 'success' 
                  ? isDarkMode ? 'border-green-400 bg-green-900/30' : 'border-green-400 bg-green-50'
                  : isDarkMode ? 'border-red-400 bg-red-900/30' : 'border-red-400 bg-red-50'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg transition-colors duration-300 ${
                      selectedNotice.type === 'info' 
                        ? isDarkMode ? 'bg-blue-700/50' : 'bg-blue-100'
                        : selectedNotice.type === 'warning' 
                        ? isDarkMode ? 'bg-yellow-700/50' : 'bg-yellow-100'
                        : selectedNotice.type === 'success' 
                        ? isDarkMode ? 'bg-green-700/50' : 'bg-green-100'
                        : isDarkMode ? 'bg-red-700/50' : 'bg-red-100'
                    }`}>
                      <Bell className={`h-4 w-4 sm:h-5 sm:w-5 ${
                        selectedNotice.type === 'info' ? 'text-blue-600' :
                        selectedNotice.type === 'warning' ? 'text-yellow-600' :
                        selectedNotice.type === 'success' ? 'text-green-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 id="notice-modal-title" className={`text-base sm:text-lg md:text-xl font-bold transition-colors duration-300 leading-tight ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>{selectedNotice.title}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                          selectedNotice.type === 'info' 
                            ? isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                            : selectedNotice.type === 'warning' 
                            ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                            : selectedNotice.type === 'success' 
                            ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedNotice.type.toUpperCase()}
                        </span>
                        <span className={`text-xs transition-colors duration-300 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {new Date(selectedNotice.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeNoticeModal}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all duration-300 ${
                      isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0">
                <div className="prose prose-sm sm:prose prose-gray max-w-none">
                  {(() => {
                    const content = selectedNotice.content || '';

                    // detect embedded image or URL markers
                    const urlMatch = content.match(/\[EXAM_ROUTINE_URL\](.*?)\[\/EXAM_ROUTINE_URL\]/);
                    const imageMatch = content.match(/\[EXAM_ROUTINE_IMAGE\](.*?)\[\/EXAM_ROUTINE_IMAGE\]/);
                    const pdfMatch = content.match(/\[EXAM_ROUTINE_PDF\](.*?)\[\/EXAM_ROUTINE_PDF\]/);

                    // parse simple structured routine lines into entries
                    const parseRoutineEntries = (text: string) => {
                      const lines = text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
                      const entries: any[] = [];
                      for (const line of lines) {
                        if (/Room\s*\d+/i.test(line) && /\d{2}\/\d{2}\/\d{4}/.test(line)) {
                          const parts = line.split('•').map((p: string) => p.trim()).filter(Boolean);
                          const dateTime = parts[0] || '';
                          const course = parts[1] || '';
                          const hall = parts[2] || '';
                          const roomText = parts.slice().reverse().find((p: string) => /Room\s*\d+/i.test(p)) || '';
                          const roomMatch = roomText.match(/Room\s*(\d+)/i);
                          const roomNum = roomMatch ? roomMatch[1] : '';
                          let building = '';
                          let roomNo = roomNum;
                          if (roomNum && roomNum.length >= 2) {
                            building = roomNum.charAt(0);
                            roomNo = roomNum.slice(1);
                          }
                          entries.push({ dateTime, course, hall, roomFull: roomNum, building, roomNo, raw: line });
                        }
                      }
                      return entries;
                    };

                    const routineEntries = parseRoutineEntries(content);

                    // Build date/time parts for each entry and detect a common exam time
                    const timeRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM)\s*(?:to|–|-|—)\s*\d{1,2}:\d{2}\s*(?:AM|PM))/i;
                    const entriesWithParts = routineEntries.map((e) => {
                      const m = e.dateTime.match(timeRegex);
                      const timeOnly = m ? m[0].replace(/–/g, 'to').replace(/—/g, 'to') : '';
                      const dateOnly = m ? e.dateTime.replace(m[0], '').trim() : e.dateTime;
                      return { ...e, dateOnly, timeOnly };
                    });

                    const commonTime = entriesWithParts.length > 0 && entriesWithParts.every(en => en.timeOnly && en.timeOnly === entriesWithParts[0].timeOnly)
                      ? entriesWithParts[0].timeOnly
                      : '';

                    const generatePrintableHTML = (title: string, entries: any[]) => {
                      const styles = `body{font-family:Arial,Helvetica,sans-serif;padding:20px;color:#0f172a}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f3f4f6}`;
                      const rows = entries.map(e => {
                        const dateCell = e.dateOnly || e.dateTime || '';
                        const buildingRoom = `B${e.building || '-'}\/${e.roomNo || e.roomFull || '-'}`;
                        return `<tr><td>${dateCell}</td><td>${e.course}</td><td>${e.hall}</td><td>${buildingRoom}</td></tr>`;
                      }).join('');

                      const timeBlock = commonTime ? `<p style="text-align:center;margin:8px 0;font-weight:600;">Exam Time: ${commonTime}</p>` : '';

                      return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body><h1>${title}</h1>${timeBlock}<table><thead><tr><th>Date</th><th>Course</th><th>Course Teacher</th><th>Bld/Room</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
                    };

                    const openPrintableWindow = (html: string) => {
                      const w = window.open('', '_blank', 'noopener,noreferrer');
                      if (!w) return alert('Unable to open print window. Please allow popups.');
                      w.document.open();
                      w.document.write(html);
                      w.document.close();
                      setTimeout(() => { w.focus(); w.print(); }, 300);
                    };

                    // Mobile-friendly PDF downloader (works on all devices)
                    const downloadFile = async (url: string, filename?: string) => {
                      if (loading) return; // Prevent multiple simultaneous downloads
                      
                      try {
                        setLoading(true);
                        
                        // Mobile detection
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                        
                        if (isMobile) {
                          // Mobile: Direct link open (more reliable on mobile browsers)
                          setTimeout(() => {
                            window.open(url, '_blank', 'noopener,noreferrer');
                            setLoading(false);
                          }, 100);
                        } else {
                          // Desktop: Blob download for better UX
                          const res = await fetch(url, { mode: 'cors', cache: 'no-cache' });
                          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = blobUrl;
                          a.download = filename || url.split('/').pop() || 'routine.pdf';
                          a.style.display = 'none';
                          document.body.appendChild(a);
                          
                          // Trigger download
                          setTimeout(() => {
                            a.click();
                            setTimeout(() => {
                              document.body.removeChild(a);
                              URL.revokeObjectURL(blobUrl);
                            }, 100);
                          }, 50);
                          
                          setTimeout(() => setLoading(false), 800);
                        }
                      } catch (err) {
                        console.warn('Download failed, opening in new tab', err);
                        setLoading(false);
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    };

                    const downloadRoutinePDF = async (title: string) => {
                      if (loading) return; // Prevent multiple simultaneous operations
                      
                      // Check for PDF in notice content
                      const pdfUrlMatch = content.match(/\[EXAM_ROUTINE_PDF\](.*?)\[\/EXAM_ROUTINE_PDF\]/);
                      
                      if (pdfUrlMatch && pdfUrlMatch[1]) {
                        const pdfUrl = pdfUrlMatch[1];
                        const filename = `${(title || 'exam_routine').replace(/[^a-z0-9\-_\.]/gi, '_')}.pdf`;
                        await downloadFile(pdfUrl, filename);
                      } else {
                        // No PDF available - show alert
                        alert('⚠️ PDF not available. Please contact admin to upload the exam routine PDF.');
                      }
                    };

                    if (pdfMatch && pdfMatch[1]) {
                      const pdfUrl = pdfMatch[1];
                      const textContent = content.replace(/\[EXAM_ROUTINE_PDF\].*?\[\/EXAM_ROUTINE_PDF\]/g, '').trim();
                      const filename = `${(selectedNotice.title || 'exam_routine').replace(/[^a-z0-9\-_\.]/gi, '_')}.pdf`;
                      return (
                        <div>
                          {textContent ? (
                            <p className={`leading-relaxed whitespace-pre-wrap mb-4 select-text transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {textContent}
                            </p>
                          ) : null}
                          <div className={`rounded-xl p-4 text-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <h4 className={`font-semibold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}><span className="no-select">📄</span> Final Exam Routine (PDF)</h4>
                            <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>A PDF version of the routine is available. Download it below.</p>
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => downloadFile(pdfUrl, filename)}
                                disabled={loading}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${
                                  loading ? 'opacity-60 cursor-wait' : 'hover:bg-blue-700'
                                }`}
                              >
                                {loading ? '⏳ Downloading...' : '⬇️ Download (PDF)'}
                              </button>
                            </div>
                          </div>
                          <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white border border-gray-100'} text-sm`}>
                            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Exam Guidelines</h4>
                            <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              <li>Arrive at least 15 minutes before the exam start time.</li>
                              <li>Bring your student ID and necessary stationery.</li>
                              <li>Mobile phones must be switched off and kept away during exams.</li>
                              <li>Read instructions carefully before starting the paper.</li>
                            </ul>
                            <p className={`mt-3 font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Best of luck to all students — Edu51Five Team 🎓</p>
                          </div>
                        </div>
                      );
                    }

                    if (urlMatch || imageMatch) {
                      const imageData = urlMatch ? urlMatch[1] : (imageMatch ? imageMatch[1] : '');
                      const textContent = content.replace(/\[EXAM_ROUTINE_URL\].*?\[\/EXAM_ROUTINE_URL\]/g, '').replace(/\[EXAM_ROUTINE_IMAGE\].*?\[\/EXAM_ROUTINE_IMAGE\]/g, '');
                      return (
                        <div>
                          <p className={`leading-relaxed whitespace-pre-wrap mb-6 select-text transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {textContent}
                          </p>
                          <div className={`rounded-xl p-4 text-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <h4 className={`font-semibold mb-3 transition-colors duration-300 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}><span className="no-select">📋</span> Exam Routine</h4>
                            <img src={imageData} alt="Exam Routine" className={`max-w-full h-auto rounded-lg shadow-lg mx-auto border transition-colors duration-300 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`} style={{maxHeight: '600px'}} />
                            <p className={`text-sm mt-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Click on the image to view in full size</p>
                          </div>
                          <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white border border-gray-100'} text-sm`}>
                            <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Exam Guidelines</h4>
                            <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                              <li>Arrive at least 15 minutes before the exam start time.</li>
                              <li>Bring your student ID and necessary stationery.</li>
                              <li>Mobile phones must be switched off and kept away during exams.</li>
                              <li>Read instructions carefully before starting the paper.</li>
                            </ul>
                            <p className={`mt-3 font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Best of luck to all students — Edu51Five Team 🎓</p>
                          </div>
                        </div>
                      );
                    }

                    if (routineEntries && routineEntries.length > 0) {
                      return (
                        <div>
                          <div className={`rounded-lg p-4 shadow-sm border ${isDarkMode ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-100'}`}>
                            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Digital Final Exam Routine</h3>
                            <div className="overflow-x-auto">
                              {commonTime ? (
                                <p className={`text-sm mb-2 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Exam Time: {commonTime}</p>
                              ) : null}
                              <table className={`w-full text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                                <thead>
                                  <tr className={`text-left text-xs ${isDarkMode ? 'text-gray-100' : 'text-gray-500'}`}>
                                    <th className="pb-2">Date</th>
                                    <th className="pb-2">Course</th>
                                    <th className="pb-2">Course Teacher</th>
                                    <th className="pb-2">Bld/Room</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entriesWithParts.map((e, idx) => (
                                    <tr key={idx} className={`${isDarkMode ? 'border-t border-gray-700' : 'border-t'}`}>
                                      <td className={`py-2 align-top ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{commonTime ? e.dateOnly : e.dateTime}</td>
                                      <td className={`py-2 align-top ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{e.course}</td>
                                      <td className={`py-2 align-top ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{e.hall}</td>
                                      <td className={`py-2 align-top ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>{`B${e.building || '-'}\/${e.roomNo || e.roomFull || '-'}`}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-3 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                              <button
                                onClick={() => downloadRoutinePDF(selectedNotice.title || 'Exam Routine')}
                                disabled={loading}
                                className={`w-full sm:w-auto px-3 py-2 sm:px-4 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95 text-sm ${
                                  loading ? 'bg-blue-400 cursor-wait opacity-70' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                {loading ? '⏳ Downloading...' : '📄 Download Routine'}
                              </button>
                              <button
                                onClick={() => {
                                  alert('Routine copied to clipboard. You can paste it into a document to save as PDF.');
                                  navigator.clipboard && navigator.clipboard.writeText(content);
                                }}
                                className={`w-full sm:w-auto px-3 py-2 sm:px-4 border rounded-lg transition text-sm ${isDarkMode ? 'bg-gray-700 text-gray-100 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>
                                📋 Copy
                              </button>
                            </div>
                            <div className={`mt-4 rounded-lg p-4 ${isDarkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white border border-gray-100'} text-sm`}>
                              <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Exam Guidelines</h4>
                              <ul className={`list-disc pl-5 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                <li>Arrive at least 15 minutes before the exam start time.</li>
                                <li>Bring your student ID and necessary stationery.</li>
                                <li>Mobile phones must be switched off and kept away during exams.</li>
                                <li>Read instructions carefully before starting the paper.</li>
                              </ul>
                              <p className={`mt-3 font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Best of luck to all students — Edu51Five Team 🎓</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p className={`leading-relaxed whitespace-pre-wrap select-text transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{content}</p>
                    );
                  })()}
                </div>
              </div>
              
              <div className={`flex-shrink-0 p-3 sm:p-4 border-t transition-colors duration-300 ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-end">
                  <button
                    onClick={closeNoticeModal}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-600 text-white hover:bg-gray-700'
                    }`}
                  >
                    Close
                  </button>
                </div>
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

        {/* Material Viewer Modal - Enhanced with Fullscreen, Zoom, Navigation */}
        {showMaterialViewer && selectedMaterial && (
          <div className={`fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-2 sm:p-3 md:p-4'}`}>
            <div className={`shadow-2xl flex flex-col bg-gradient-to-br from-gray-800 via-gray-900 to-slate-900 overflow-hidden ${
              isFullscreen 
                ? 'w-full h-full max-w-none rounded-none border-0' 
                : 'w-[98vw] sm:w-[94vw] md:w-[90vw] lg:w-[85vw] xl:w-full xl:max-w-6xl h-[92vh] sm:h-[92vh] md:h-[92vh] lg:h-[90vh] rounded-xl lg:rounded-2xl border border-gray-700/50'
            }`}>
              {/* Modal Header with Controls */}
              <div className="flex-shrink-0 flex items-center justify-between border-b border-gray-700/50 p-1 sm:p-1.5 md:p-2 sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 z-10 rounded-t-lg md:rounded-t-2xl">
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-1 min-w-0 overflow-hidden">
                  <div className="flex-shrink-0 p-1 sm:p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4">
                      {getTypeIcon(selectedMaterial.type)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-100 leading-tight line-clamp-2 break-words">{selectedMaterial.title}</h2>
                    <p className="text-[9px] sm:text-xs text-gray-400 hidden md:block leading-tight line-clamp-2 break-words">{selectedMaterial.description}</p>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-0.5 sm:gap-1 ml-1 sm:ml-2 flex-shrink-0">
                  {/* Zoom Controls - Only for PDFs and Images */}
                  {(selectedMaterial.type === 'pdf' || selectedMaterial.type === 'image' || selectedMaterial.type === 'notes' || selectedMaterial.type === 'slides' || selectedMaterial.type === 'document') && (
                    <>
                      <button
                        onClick={zoomOut}
                        className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Zoom Out (-)"
                      >
                        <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </button>
                      <span className="text-[10px] sm:text-xs text-gray-400 px-0.5 sm:px-1 hidden md:inline">{zoomLevel}%</span>
                      <button
                        onClick={zoomIn}
                        className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Zoom In (+)"
                      >
                        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </button>
                      <button
                        onClick={resetZoom}
                        className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors hidden lg:block"
                        title="Reset Zoom (0)"
                      >
                        <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      </button>
                    </>
                  )}

                  {/* Fullscreen Toggle */}
                  <div className="w-px h-4 sm:h-5 md:h-6 bg-gray-700 mx-0.5 sm:mx-1"></div>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                  >
                    {isFullscreen ? <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" /> : <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={closeMaterialViewer}
                    className="p-1 sm:p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-red-700 rounded transition-colors"
                    title="Close (ESC)"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Content Display with Loading */}
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative">
                {/* Loading Spinner Overlay */}
                {isViewerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-20">
                    <div className="flex flex-col items-center gap-3">
                      <Loader className="h-10 w-10 text-blue-500 animate-spin" />
                      <p className="text-gray-300 text-sm">Loading content...</p>
                    </div>
                  </div>
                )}

                {/* Video Content */}
                {selectedMaterial.type === 'video' && selectedMaterial.video_url && (
                  <div className="w-full h-full flex items-center justify-center bg-black p-1">
                    <div className="w-full aspect-video rounded-sm md:rounded overflow-hidden shadow-xl" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}>
                      {selectedMaterial.video_url.includes('youtube') || selectedMaterial.video_url.includes('youtu.be') ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={selectedMaterial.video_url.includes('watch?v=') 
                            ? selectedMaterial.video_url.replace('watch?v=', 'embed/')
                            : selectedMaterial.video_url.replace('youtu.be/', 'youtube.com/embed/')
                          }
                          title={selectedMaterial.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                          onLoad={() => setIsViewerLoading(false)}
                        />
                      ) : (
                        <video
                          width="100%"
                          height="100%"
                          controls
                          className="w-full h-full"
                          onLoadedData={() => setIsViewerLoading(false)}
                        >
                          <source src={selectedMaterial.video_url} />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF/Document Content */}
                {selectedMaterial.type === 'pdf' && selectedMaterial.file_url && (
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-gray-950 p-1 overflow-hidden">
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top', width: '100%', height: '100%' }}>
                      <iframe
                        key={`${selectedMaterial.id || selectedMaterial.file_url}-page-${currentPage}`}
                        src={buildViewerUrl(selectedMaterial, currentPage)}
                        title={selectedMaterial.title}
                        width="100%"
                        height="100%"
                        className="rounded-lg w-full h-full"
                        style={{ height: '100%' }}
                        onLoad={() => setIsViewerLoading(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Notes/Text Content */}
                {selectedMaterial.type === 'notes' && selectedMaterial.file_url && (
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-gray-950 p-1 overflow-hidden">
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top', width: '100%', height: '100%' }}>
                      <iframe
                        key={`${selectedMaterial.id || selectedMaterial.file_url}-page-${currentPage}`}
                        src={buildViewerUrl(selectedMaterial, currentPage)}
                        title={selectedMaterial.title}
                        width="100%"
                        height="100%"
                        className="rounded-lg w-full h-full"
                        style={{ height: '100%' }}
                        onLoad={() => setIsViewerLoading(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Image Content */}
                {selectedMaterial.type === 'image' && selectedMaterial.file_url && (
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-gray-950 p-1 overflow-hidden">
                    <img
                      src={selectedMaterial.file_url}
                      alt={selectedMaterial.title}
                      className="rounded-lg shadow-2xl transition-transform"
                      style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center', maxHeight: '100%', height: '100%', width: 'auto' }}
                      onLoad={() => setIsViewerLoading(false)}
                    />
                  </div>
                )}

                {/* Slides Content */}
                {selectedMaterial.type === 'slides' && selectedMaterial.file_url && (
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-gray-950 p-1 overflow-hidden">
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top', width: '100%', height: '100%' }}>
                      <iframe
                        key={`${selectedMaterial.id || selectedMaterial.file_url}-page-${currentPage}`}
                        src={buildViewerUrl(selectedMaterial, currentPage)}
                        title={selectedMaterial.title}
                        width="100%"
                        height="100%"
                        className="rounded-lg w-full h-full"
                        style={{ height: '100%' }}
                        onLoad={() => setIsViewerLoading(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Generic Document Content - Catch all for other file types */}
                {selectedMaterial.type === 'document' && selectedMaterial.file_url && (
                  <div className="w-full flex-1 min-h-0 flex items-center justify-center bg-gray-950 p-1 overflow-hidden">
                    <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center top', width: '100%', height: '100%' }}>
                      <iframe
                        key={`${selectedMaterial.id || selectedMaterial.file_url}-page-${currentPage}`}
                        src={buildViewerUrl(selectedMaterial, currentPage)}
                        title={selectedMaterial.title}
                        width="100%"
                        height="100%"
                        className="rounded-lg w-full h-full"
                        style={{ height: '100%' }}
                        onLoad={() => setIsViewerLoading(false)}
                      />
                    </div>
                  </div>
                )}

                {/* Fallback - Generic File Link */}
                {!selectedMaterial.video_url && !selectedMaterial.file_url && (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
                    <FileText className="h-16 w-16 text-gray-500 mb-4" />
                    <p className="text-gray-300 text-center mb-4">No preview available for this material</p>
                    <a
                      href={selectedMaterial.file_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}
              </div>

              {/* Compact Footer - stays visible in fullscreen & mobile */}
              <div className="flex-shrink-0 border-t border-gray-700/50 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-gray-900/95 backdrop-blur-sm flex items-center gap-2 rounded-b-lg md:rounded-b-2xl">
                {/* Left: File info (wrap on small) */}
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 min-w-0 flex-1">
                  <span className="truncate">{selectedMaterial.title}</span>
                  <span className="hidden xs:inline">•</span>
                  <span className="truncate">{selectedMaterial.type}</span>
                  {selectedMaterial.size && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline truncate">{selectedMaterial.size}</span>
                    </>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  {selectedMaterial.file_url && (
                    <a
                      href={selectedMaterial.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 sm:p-2 hover:bg-gray-800 text-gray-400 hover:text-blue-400 rounded transition-all"
                      title="Open in Google Drive"
                    >
                      <ExternalLink className="h-4 w-4 sm:h-4 sm:w-4" />
                    </a>
                  )}
                  {selectedMaterial.file_url && (
                    <a
                      href={selectedMaterial.file_url}
                      download
                      className="p-1.5 sm:p-2 hover:bg-gray-800 text-gray-400 hover:text-teal-400 rounded transition-all"
                      title="Download"
                    >
                      <Download className="h-4 w-4 sm:h-4 sm:w-4" />
                    </a>
                  )}
                  <button
                    onClick={closeMaterialViewer}
                    className="p-1.5 sm:p-2 hover:bg-gray-800 text-gray-400 hover:text-red-400 rounded transition-all"
                    title="Close (ESC)"
                  >
                    <X className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </main>
        )}

      {/* Semester Tracker Page */}
      {currentView === 'semester' && (
        <main className="fixed inset-0 z-50 overflow-hidden">
          <SemesterTracker onClose={() => goToView('home')} isDarkMode={isDarkMode} />
        </main>
      )}

      {/* Exam Materials Dashboard */}
      {currentView === 'examMaterials' && (
        <main className="fixed inset-0 z-50">
          <div className="relative h-full">
            <button
              onClick={() => goToView('home')}
              className="fixed top-2 right-2 sm:top-4 sm:right-4 z-60 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <ExamMaterialsDashboard isDarkMode={isDarkMode} />
          </div>
        </main>
      )}
    </div>
  );
}

export default App;