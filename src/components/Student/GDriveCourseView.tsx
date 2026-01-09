/**
 * Google Drive Course View
 * Displays materials from a Google Drive folder with mid-term/final separation
 * Uses Drive API to fetch files from the course folder with subfolder support
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Play, 
  Eye, 
  Download, 
  RefreshCw, 
  AlertCircle,
  ChevronLeft,
  Folder,
  Clock,
  ChevronRight
} from 'lucide-react';
import { getCurrentSemesterStatus } from '../../config/semester';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  parentId?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
}

interface GDriveCourseViewProps {
  courseCode: string;
  courseName: string;
  folderId: string;
  folderLink: string;
  onBack: () => void;
  onFileClick?: (file: DriveFile) => void;
  isDarkMode?: boolean;
}

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const GDriveCourseView: React.FC<GDriveCourseViewProps> = ({ 
  courseCode,
  courseName,
  folderId,
  folderLink,
  onBack,
  onFileClick,
  isDarkMode = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<'midterm' | 'final' | 'regular'>('regular');
  const [activeTab, setActiveTab] = useState<'mid' | 'final'>('mid');
  
  // Store folder structures
  const [midFolderId, setMidFolderId] = useState<string>('');
  const [finalFolderId, setFinalFolderId] = useState<string>('');
  const [midContent, setMidContent] = useState<DriveFolder[]>([]);
  const [finalContent, setFinalContent] = useState<DriveFolder[]>([]);

  // Get current semester status
  useEffect(() => {
    const status = getCurrentSemesterStatus();
    if (status.currentPhase === 'Mid-term Examinations') {
      setCurrentPeriod('midterm');
      setActiveTab('mid');
    } else if (status.currentPhase === 'Final Examinations') {
      setCurrentPeriod('final');
      setActiveTab('final');
    } else {
      setCurrentPeriod('regular');
    }
  }, []);

  // Load files from Drive folder
  useEffect(() => {
    loadFilesFromDrive();
  }, [folderId]);

  const loadFilesFromDrive = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Find Mid and Final subfolders
      const folderQuery = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const folderUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        folderQuery
      )}&key=${API_KEY}&fields=files(id,name)&pageSize=100`;

      console.log('🔍 Searching for Mid/Final folders in:', courseName);

      const folderResponse = await fetch(folderUrl);
      if (!folderResponse.ok) {
        throw new Error(`Drive API error: ${folderResponse.statusText}`);
      }

      const folderData = await folderResponse.json();
      const folders = folderData.files || [];

      console.log(`📁 Found ${folders.length} folders:`, folders.map((f: any) => f.name));

      // Find Mid and Final folders (case-insensitive)
      const midFolder = folders.find((f: any) => f.name.toLowerCase().includes('mid'));
      const finalFolder = folders.find((f: any) => f.name.toLowerCase().includes('final'));

      if (midFolder) {
        setMidFolderId(midFolder.id);
        await loadFolderContent(midFolder.id, 'mid');
      }

      if (finalFolder) {
        setFinalFolderId(finalFolder.id);
        await loadFolderContent(finalFolder.id, 'final');
      }

      if (!midFolder && !finalFolder) {
        setError('No Mid or Final folders found. Please create "Mid" and "Final" folders in the course folder.');
      } else {
        // Check after a brief delay to allow state to update
        setTimeout(() => {
          const midTotal = midContent.reduce((sum, f) => sum + f.files.length, 0);
          const finalTotal = finalContent.reduce((sum, f) => sum + f.files.length, 0);
          console.log(`📊 Final count - Mid: ${midTotal} files, Final: ${finalTotal} files`);
        }, 500);
      }
    } catch (err) {
      console.error('❌ Error loading files from Drive:', err);
      setError('Failed to load course materials. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadFolderContent = async (parentFolderId: string, type: 'mid' | 'final') => {
    try {
      // Step 1: Get all subfolders
      const subfoldersQuery = `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const subfoldersUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        subfoldersQuery
      )}&key=${API_KEY}&fields=files(id,name)&pageSize=100&orderBy=name`;

      const subfoldersResponse = await fetch(subfoldersUrl);
      const subfoldersData = await subfoldersResponse.json();
      const subfolders = subfoldersData.files || [];

      // Step 2: Get files directly in the parent folder
      const filesQuery = `'${parentFolderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
      const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        filesQuery
      )}&key=${API_KEY}&fields=files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,modifiedTime)&pageSize=100&orderBy=name`;

      const filesResponse = await fetch(filesUrl);
      const filesData = await filesResponse.json();
      const rootFiles = filesData.files || [];

      console.log(`📂 ${type.toUpperCase()}: Found ${subfolders.length} subfolders and ${rootFiles.length} root files`);

      // Step 3: For each subfolder, get its files
      const folderContents: DriveFolder[] = [];

      // Add root files as "General" folder if any
      if (rootFiles.length > 0) {
        folderContents.push({
          id: parentFolderId,
          name: '📚 General Materials',
          files: rootFiles
        });
      }

      // Load files from each subfolder
      for (const subfolder of subfolders) {
        const subFilesQuery = `'${subfolder.id}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`;
        const subFilesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          subFilesQuery
        )}&key=${API_KEY}&fields=files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,modifiedTime)&pageSize=100&orderBy=name`;

        console.log(`🔍 Fetching files from: ${subfolder.name} (ID: ${subfolder.id})`);
        
        const subFilesResponse = await fetch(subFilesUrl);
        
        if (!subFilesResponse.ok) {
          console.error(`❌ Failed to fetch from ${subfolder.name}:`, subFilesResponse.statusText);
          continue;
        }
        
        const subFilesData = await subFilesResponse.json();
        const subFiles = subFilesData.files || [];

        console.log(`  ✅ ${subfolder.name}: ${subFiles.length} files found`, 
          subFiles.length > 0 ? subFiles.map((f: any) => f.name) : 'No files');

        if (subFiles.length > 0) {
          folderContents.push({
            id: subfolder.id,
            name: subfolder.name,
            files: subFiles
          });
        }
      }

      // Update state based on type
      if (type === 'mid') {
        setMidContent(folderContents);
      } else {
        setFinalContent(folderContents);
      }

    } catch (err) {
      console.error(`Error loading ${type} folder content:`, err);
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5" />;
    } else if (mimeType.includes('video')) {
      return <Play className="h-5 w-5" />;
    } else if (mimeType.includes('image')) {
      return <Eye className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Render folder section with files
  const renderFolderSection = (folder: DriveFolder) => {
    if (folder.files.length === 0) return null;

    return (
      <div key={folder.id} className="mb-6">
        <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <Folder className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <h4 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {folder.name}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
          }`}>
            {folder.files.length} files
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {folder.files.map((file) => (
            <div
              key={file.id}
              onClick={() => onFileClick?.(file)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-102 ${
                isDarkMode
                  ? 'bg-gray-800/50 border-gray-700/50 hover:border-blue-500/50 hover:shadow-lg'
                  : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-blue-600'
                }`}>
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`font-semibold text-sm mb-1 line-clamp-2 ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}>
                    {file.name}
                  </h5>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClick?.(file);
                  }}
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                    isDarkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${
            isDarkMode ? 'border-blue-400' : 'border-blue-600'
          }`}></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading course materials...
          </p>
        </div>
      </div>
    );
  }

  const currentContent = activeTab === 'mid' ? midContent : finalContent;
  const totalFiles = currentContent.reduce((sum, folder) => sum + folder.files.length, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'hover:bg-gray-800 text-gray-300 hover:text-gray-100'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Courses
          </button>

          <div className={`p-6 rounded-2xl border ${
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h1 className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {courseName}
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {courseCode}
            </p>
            
            {/* Current Period Badge */}
            {currentPeriod !== 'regular' && (
              <div className="mt-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                  {currentPeriod === 'midterm' ? 'Mid-term Period' : 'Final Exam Period'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mid/Final Toggle Buttons */}
        {!error && (midFolderId || finalFolderId) && (
          <div className="mb-6">
            <div className={`flex flex-col sm:inline-flex rounded-xl p-1 gap-2 sm:gap-0 ${
              isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100 border border-gray-200'
            }`}>
            <button
              onClick={() => setActiveTab('mid')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 w-full sm:w-auto ${
                activeTab === 'mid'
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-blue-600 shadow-lg'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-5 w-5" />
              Mid-term
              {midContent.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'mid'
                    ? 'bg-blue-500 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {midContent.reduce((sum, f) => sum + f.files.length, 0)}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('final')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 w-full sm:w-auto ${
                activeTab === 'final'
                  ? isDarkMode 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-white text-purple-600 shadow-lg'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-5 w-5" />
              Final
              {finalContent.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'final'
                    ? 'bg-purple-500 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {finalContent.reduce((sum, f) => sum + f.files.length, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`rounded-xl p-6 mb-8 ${
            isDarkMode ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-6 w-6 flex-shrink-0 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  {error}
                </h3>
                <button
                  onClick={loadFilesFromDrive}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isDarkMode
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-yellow-600 text-white hover:bg-yellow-700'
                  }`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Materials Content */}
        {!error && currentContent.length > 0 && (
          <div className={`rounded-2xl border p-6 ${
            isDarkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {currentContent.map(folder => renderFolderSection(folder))}
          </div>
        )}

        {/* Empty State */}
        {!error && totalFiles === 0 && (midFolderId || finalFolderId) && (
          <div className={`text-center py-12 rounded-2xl border ${
            isDarkMode ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-white text-gray-700'
          }`}>
            <Folder className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="font-semibold text-lg">No files in {activeTab === 'mid' ? 'Mid-term' : 'Final'} folder yet</p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentContent.length > 0 
                ? `Found ${currentContent.length} subfolder(s) but no files inside. Please add files to the folders.`
                : 'Folder exists but contains no subfolders or files. Please add study materials.'
              }
            </p>
            <button
              onClick={loadFilesFromDrive}
              className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2 ${
                isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
