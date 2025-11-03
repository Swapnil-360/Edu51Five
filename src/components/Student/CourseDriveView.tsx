/**
 * Student Course Drive View - Browse all folders and files for a course
 * Reads directly from Google Drive - no database needed
 */

import React, { useState, useEffect } from 'react';
import { Folder, File, Eye, Download, RefreshCw, ChevronRight, Home } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const ROOT_FOLDER_ID = '1pwtRJ3AcPVztKq2nBebj0oP5b2G-iugq';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

interface CourseDriveViewProps {
  courseCode: string;
  courseName: string;
  examPeriod: 'midterm' | 'final';
  isDarkMode?: boolean;
}

export const CourseDriveView: React.FC<CourseDriveViewProps> = ({ 
  courseCode, 
  courseName, 
  examPeriod,
  isDarkMode = false 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize Google API
   */
  useEffect(() => {
    // Check if API key is configured
    if (!API_KEY) {
      console.warn('VITE_GOOGLE_API_KEY not configured in environment');
      setError('Google Drive API key not configured. Please set VITE_GOOGLE_API_KEY in environment variables.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          setIsLoaded(true);
          // Start by finding the course folder
          findCourseFolder();
        } catch (error) {
          console.error('GAPI init error:', error);
          setError('Failed to initialize Google Drive API. Check your API key configuration.');
        }
      });
    };
    
    script.onerror = () => {
      setError('Failed to load Google API. Check your internet connection.');
    };

    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
      findCourseFolder();
    }
  }, [courseCode, examPeriod]);

  /**
   * Find course folder in root
   */
  const findCourseFolder = async () => {
    if (!window.gapi?.client?.drive) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Search for course folder (e.g., "CSE-319-20")
      const response = await window.gapi.client.drive.files.list({
        q: `'${ROOT_FOLDER_ID}' in parents and name contains '${courseCode}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      const courseFolders = response.result.files || [];
      
      if (courseFolders.length === 0) {
        setError(`Course folder "${courseCode}" not found in storage`);
        setLoading(false);
        return;
      }

      const courseFolder = courseFolders[0];
      
      // Now look for Midterm/Final folder inside course folder
      const periodResponse = await window.gapi.client.drive.files.list({
        q: `'${courseFolder.id}' in parents and name='${examPeriod === 'midterm' ? 'Midterm' : 'Final'}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      const periodFolders = periodResponse.result.files || [];
      
      if (periodFolders.length === 0) {
        setError(`${examPeriod === 'midterm' ? 'Midterm' : 'Final'} folder not found for ${courseCode}`);
        setLoading(false);
        return;
      }

      const periodFolder = periodFolders[0];
      setCurrentFolderId(periodFolder.id);
      setFolderPath([
        { id: ROOT_FOLDER_ID, name: 'Home' },
        { id: courseFolder.id, name: courseFolder.name },
        { id: periodFolder.id, name: periodFolder.name }
      ]);
      
      loadFolder(periodFolder.id);
    } catch (error: any) {
      console.error('Error finding course folder:', error);
      setError('Failed to find course materials');
      setLoading(false);
    }
  };

  /**
   * Load folder contents
   */
  const loadFolder = async (folderId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink)',
        orderBy: 'folder,name',
      });

      setItems(response.result.files || []);
    } catch (error: any) {
      console.error('Error loading folder:', error);
      setError('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to folder
   */
  const navigateToFolder = (item: DriveItem) => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      setCurrentFolderId(item.id);
      setFolderPath([...folderPath, { id: item.id, name: item.name }]);
      loadFolder(item.id);
    }
  };

  /**
   * Navigate back in path
   */
  const navigateToPath = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    const folderId = newPath[newPath.length - 1].id;
    setCurrentFolderId(folderId);
    loadFolder(folderId);
  };

  /**
   * Get file icon color
   */
  const getFileColor = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return 'text-blue-500';
    if (mimeType.includes('pdf')) return 'text-red-500';
    if (mimeType.includes('video')) return 'text-purple-500';
    if (mimeType.includes('image')) return 'text-green-500';
    return 'text-gray-500';
  };

  /**
   * Format file size
   */
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (!isLoaded) {
    return (
      <div className={`p-8 text-center rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading Google Drive...</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 sm:p-6 shadow-lg border transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg sm:text-xl font-bold truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {courseName}
          </h3>
          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {examPeriod === 'midterm' ? 'Midterm' : 'Final'} Materials • Browse all folders
          </p>
        </div>
        <button
          onClick={() => findCourseFolder()}
          disabled={loading}
          className={`self-start sm:self-auto p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Breadcrumb - Mobile Scrollable */}
      {folderPath.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <button
                onClick={() => navigateToPath(index)}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-blue-400'
                    : 'hover:bg-gray-100 text-blue-600'
                }`}
              >
                {index === 0 && <Home className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="max-w-[100px] sm:max-w-none truncate">{folder.name}</span>
              </button>
              {index < folderPath.length - 1 && (
                <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error - Mobile Friendly */}
      {error && (
        <div className={`p-3 sm:p-4 mb-4 rounded-lg border transition-colors ${
          isDarkMode
            ? 'bg-red-900/30 border-red-700/50 text-red-300'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Files/Folders Grid - Mobile Responsive */}
      {loading ? (
        <div className="text-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className={`mt-4 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Folder className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No materials found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 sm:p-4 border rounded-lg transition-all hover:shadow-md ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* File/Folder Icon and Name - Mobile Optimized */}
              <div
                className="flex items-start gap-2 sm:gap-3 mb-3 cursor-pointer"
                onClick={() => navigateToFolder(item)}
              >
                {item.mimeType === 'application/vnd.google-apps.folder' ? (
                  <Folder className="w-7 h-7 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                ) : (
                  <File className={`w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 ${getFileColor(item.mimeType)}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {item.name}
                  </p>
                  {item.size && (
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {formatSize(item.size)}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions for files only - Mobile Friendly */}
              {item.mimeType !== 'application/vnd.google-apps.folder' && (
                <div className="flex gap-2">
                  {item.webViewLink && (
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm flex-1 justify-center transition-colors ${
                        isDarkMode
                          ? 'bg-blue-900/50 hover:bg-blue-900 text-blue-300'
                          : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  )}
                  {item.webContentLink && (
                    <a
                      href={item.webContentLink}
                      download
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                        isDarkMode
                          ? 'bg-green-900/50 hover:bg-green-900 text-green-300'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
