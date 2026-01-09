/**
 * Google Drive Folders Browser
 * Displays folders from Google Drive as courses
 * Each folder in Common + Major folders = 1 Course
 */

import React, { useState, useEffect } from 'react';
import { Folder, RefreshCw, AlertCircle } from 'lucide-react';
import { COURSE_FOLDER_LINKS } from '../../config/courseFolders';

interface GDriveCourse {
  id: string;
  name: string;
  code: string;
  description: string;
  folderId: string;
  folderLink: string;
  major: string;
}

interface GDriveFolderBrowserProps {
  userMajor: string;
  isDarkMode?: boolean;
  onCourseSelect?: (course: GDriveCourse) => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

export const GDriveFolderBrowser: React.FC<GDriveFolderBrowserProps> = ({ 
  userMajor, 
  isDarkMode = false,
  onCourseSelect 
}) => {
  const [courses, setCourses] = useState<GDriveCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoursesFromDrive();
  }, [userMajor]);

  const loadCoursesFromDrive = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesFound: GDriveCourse[] = [];

      // Get Common folder
      const commonFolder = COURSE_FOLDER_LINKS['Common'];
      if (commonFolder && commonFolder.folderId) {
        const commonCourses = await listFoldersInFolder(
          commonFolder.folderId,
          'Common'
        );
        coursesFound.push(...commonCourses);
      }

      // Get Major-specific folder
      const majorFolder = COURSE_FOLDER_LINKS[userMajor as keyof typeof COURSE_FOLDER_LINKS];
      if (majorFolder && majorFolder.folderId) {
        const majorCourses = await listFoldersInFolder(
          majorFolder.folderId,
          userMajor
        );
        coursesFound.push(...majorCourses);
      }

      console.log('Courses found from Google Drive:', coursesFound);
      setCourses(coursesFound);

      if (coursesFound.length === 0) {
        setError(`No courses found in your folders. Please create course folders in Google Drive.`);
      }
    } catch (err) {
      console.error('Error loading courses from Drive:', err);
      setError('Failed to load courses from Google Drive. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const listFoldersInFolder = async (
    parentFolderId: string,
    sourceFolder: string
  ): Promise<GDriveCourse[]> => {
    try {
      // Query: find all folders in the parent folder
      const query = `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&key=${API_KEY}&fields=files(id,name,webViewLink)&pageSize=50`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Drive API error: ${response.statusText}`);
      }

      const data = await response.json();
      const folderItems = data.files || [];

      console.log(`Found ${folderItems.length} courses in ${sourceFolder} folder`);

      return folderItems.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        code: folder.name.split(' ')[0] || folder.name, // Extract course code from name
        description: `${sourceFolder} Course`,
        folderId: folder.id,
        folderLink: folder.webViewLink,
        major: sourceFolder
      }));
    } catch (error) {
      console.error(`Error listing folders in ${sourceFolder}:`, error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto ${
          isDarkMode ? 'border-blue-400' : 'border-blue-600'
        }`}></div>
        <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading courses from Google Drive...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-6 w-6 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          <div>
            <h3 className={`font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
              Unable to Load Courses
            </h3>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
              {error}
            </p>
            <button
              onClick={loadCoursesFromDrive}
              className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={`text-center py-12 rounded-2xl border ${
        isDarkMode ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-white text-gray-700'
      }`}>
        <p className="text-2xl mb-2">📂</p>
        <p className="font-semibold text-lg">No courses available in your folders.</p>
        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Create course folders in your Google Drive folders to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
              : 'bg-gradient-to-br from-white to-gray-50 border-gray-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10'
          }`}
          onClick={() => onCourseSelect?.(course)}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' 
                  : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
              }`}>
                <Folder className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-xl mb-2 group-hover:text-blue-500 transition-colors ${
                  isDarkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>
                  {course.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDarkMode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {course.code}
                  </span>
                  {course.major !== 'Common' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {course.major}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className={`text-sm mb-4 leading-relaxed ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {course.description}
            </p>

            {/* Access indicator */}
            <div className={`flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              <span>View Materials</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
