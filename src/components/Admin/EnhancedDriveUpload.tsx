/**
 * Enhanced Google Drive Upload Component
 * Features:
 * - Direct file upload via Google Drive API
 * - Auto-generate embed/download URLs
 * - Auto-organize files into folders
 * - Batch upload support
 * - Progress tracking
 * - Admin email verification (@cse.bubt.edu.bd)
 */

import React, { useState, useEffect } from 'react';
import { Upload, Folder, File, LogIn, LogOut, CheckCircle, AlertCircle, Loader, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Google Drive API configuration
const DRIVE_FOLDER_ID = '1HmjIBbTM8tIlHk7PUepTo7Cffjjg_4pz'; // Your main Drive folder ID
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface EnhancedDriveUploadProps {
  onFileUploaded?: () => void;
}

interface UploadedFile {
  id: string;
  name: string;
  embedUrl: string;
  downloadUrl: string;
  size: number;
  mimeType: string;
}

export const EnhancedDriveUpload: React.FC<EnhancedDriveUploadProps> = ({ onFileUploaded }) => {
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examPeriod, setExamPeriod] = useState<'midterm' | 'final'>('midterm');
  const [category, setCategory] = useState('notes');
  
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Course list
  const courses = [
    { code: 'CSE-319-20', name: 'Networking' },
    { code: 'CSE-327', name: 'Software Development' },
    { code: 'CSE-407', name: 'Project Management' },
    { code: 'CSE-417', name: 'Distributed Database' },
    { code: 'CSE-351', name: 'Artificial Intelligence' },
  ];

  // Categories
  const categories = [
    { value: 'notes', label: 'Notes', folder: 'Notes' },
    { value: 'slides', label: 'Slides', folder: 'Slides' },
    { value: 'ct-questions', label: 'CT Questions', folder: 'CT-Questions' },
    { value: 'suggestions', label: 'Suggestions', folder: 'Suggestions' },
    { value: 'super-tips', label: 'Super Tips', folder: 'Super-Tips' },
    { value: 'videos', label: 'Videos', folder: 'Videos' },
  ];

  /**
   * Initialize Google API
   */
  useEffect(() => {
    const initGapi = () => {
      if (window.gapi) {
        window.gapi.load('client:auth2', async () => {
          try {
            // Try with discovery docs
            await window.gapi.client.init({
              apiKey: API_KEY,
              clientId: CLIENT_ID,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
              scope: SCOPES,
            });
            console.log('✅ GAPI client ready with discovery docs');
            window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
            setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
            setIsGapiLoaded(true);
          } catch (error: any) {
            console.warn('⚠️ Discovery docs failed, trying manual load:', error?.message);
            try {
              // Fallback: init without discovery docs, then load Drive API
              await window.gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                scope: SCOPES,
              });
              await window.gapi.client.load('drive', 'v3');
              console.log('✅ GAPI client ready (manual load)');
              window.gapi.auth2.getAuthInstance().isSignedIn.listen(setIsSignedIn);
              setIsSignedIn(window.gapi.auth2.getAuthInstance().isSignedIn.get());
              setIsGapiLoaded(true);
            } catch (fallbackError: any) {
              console.error('❌ Drive API init failed:', fallbackError?.message);
              setMessage({ type: 'error', text: 'Failed to initialize Google Drive. Please refresh.' });
              setIsGapiLoaded(false);
            }
          }
        });
      }
    };

    // Load the Google API script
    if (!document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initGapi;
      document.body.appendChild(script);
    } else {
      initGapi();
    }
  }, []);

  /**
   * Sign in to Google
   */
  const handleSignIn = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signIn();
      const user = window.gapi.auth2.getAuthInstance().currentUser.get();
      const email = user.getBasicProfile().getEmail();
      setAdminEmail(email);
      
      // Auto-verify if email is from BUBT
      if (email.endsWith('@cse.bubt.edu.bd')) {
        setIsEmailVerified(true);
        setMessage({ type: 'success', text: `✅ Signed in as ${email}` });
      } else {
        setMessage({ type: 'error', text: '❌ Only @cse.bubt.edu.bd emails are authorized' });
        handleSignOut();
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      setMessage({ type: 'error', text: 'Failed to sign in' });
    }
  };

  /**
   * Sign out from Google
   */
  const handleSignOut = async () => {
    try {
      await window.gapi.auth2.getAuthInstance().signOut();
      setIsEmailVerified(false);
      setAdminEmail('');
      setUploadedFiles([]);
      setMessage(null);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  /**
   * Create or get folder by path
   */
  const getOrCreateFolder = async (folderPath: string[]): Promise<string> => {
    let currentFolderId = DRIVE_FOLDER_ID; // Start from main folder

    for (const folderName of folderPath) {
      // Search for existing folder
      const response = await window.gapi.client.drive.files.list({
        q: `name='${folderName}' and '${currentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (response.result.files && response.result.files.length > 0) {
        // Folder exists
        currentFolderId = response.result.files[0].id!;
      } else {
        // Create new folder
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolderId],
        };

        const folderResponse = await window.gapi.client.drive.files.create({
          resource: folderMetadata,
          fields: 'id',
        });

        currentFolderId = folderResponse.result.id!;
      }
    }

    return currentFolderId;
  };

  /**
   * Upload file to Google Drive
   */
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const categoryFolder = categories.find(c => c.value === category)?.folder || 'Notes';
    const folderPath = [selectedCourse, examPeriod === 'midterm' ? 'Midterm' : 'Final', categoryFolder];
    
    // Get or create folder structure
    const folderId = await getOrCreateFolder(folderPath);

    // Upload file
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${window.gapi.auth.getToken().access_token}`,
        },
        body: form,
      }
    );

    const result = await response.json();

    // Make file public
    await window.gapi.client.drive.permissions.create({
      fileId: result.id,
      resource: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generate URLs
    const embedUrl = `https://drive.google.com/file/d/${result.id}/preview`;
    const downloadUrl = `https://drive.google.com/file/d/${result.id}/view`;

    return {
      id: result.id,
      name: result.name,
      embedUrl,
      downloadUrl,
      size: parseInt(result.size),
      mimeType: result.mimeType,
    };
  };

  /**
   * Handle file selection and upload
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!isEmailVerified) {
      setMessage({ type: 'error', text: 'Please sign in with @cse.bubt.edu.bd email first' });
      return;
    }

    if (!selectedCourse) {
      setMessage({ type: 'error', text: 'Please select a course first' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const uploaded: UploadedFile[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setMessage({ type: 'success', text: `Uploading ${file.name}...` });
        
        // Upload to Drive
        const uploadedFile = await uploadFile(file);
        uploaded.push(uploadedFile);

        // Save to Supabase
        await saveToDatabase(uploadedFile);

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setUploadedFiles([...uploadedFiles, ...uploaded]);
      setMessage({ 
        type: 'success', 
        text: `✅ Successfully uploaded ${files.length} file(s)!` 
      });

      if (onFileUploaded) onFileUploaded();
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: `Error uploading files: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  /**
   * Save file metadata to Supabase
   */
  const saveToDatabase = async (file: UploadedFile) => {
    // Get course_id
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('code', selectedCourse)
      .single();

    if (courseError || !courseData) {
      throw new Error('Course not found in database');
    }

    // Insert material
    const { error: insertError } = await supabase
      .from('materials')
      .insert([{
        course_id: courseData.id,
        title: file.name,
        type: category,
        file_url: file.embedUrl,
        download_url: file.downloadUrl,
        exam_period: examPeriod,
        uploaded_by: adminEmail,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      }]);

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }
  };

  /**
   * Delete file from Drive and database
   */
  const handleDeleteFile = async (fileId: string) => {
    try {
      // Delete from Drive
      await window.gapi.client.drive.files.delete({ fileId });

      // Remove from uploaded list
      setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
      
      setMessage({ type: 'success', text: 'File deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Enhanced Google Drive Upload</h2>
              <p className="text-sm text-blue-100">Auto-organize files with API integration</p>
            </div>
          </div>
          
          {/* Sign In/Out Button */}
          {isGapiLoaded && (
            <div>
              {!isSignedIn ? (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In with Google
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-100">{adminEmail}</span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {/* Main Content */}
      {isEmailVerified ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Features Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">✨ Auto-Upload Features</h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
              <li>✅ Upload files directly from your computer</li>
              <li>✅ Auto-create folder structure (Course/Period/Category)</li>
              <li>✅ Auto-generate embed and download URLs</li>
              <li>✅ Auto-save to database (students see immediately)</li>
              <li>✅ Batch upload multiple files at once</li>
              <li>✅ Progress tracking for uploads</li>
            </ul>
          </div>

          {/* Folder Path Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">📁 Upload Destination:</p>
            <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-300">
              {selectedCourse || 'Select course'} &gt; {examPeriod === 'midterm' ? 'Midterm' : 'Final'} &gt; {
                categories.find(c => c.value === category)?.folder || 'Notes'
              }
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select course...</option>
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Period</label>
              <select
                value={examPeriod}
                onChange={(e) => setExamPeriod(e.target.value as 'midterm' | 'final')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files to Upload
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading || !selectedCourse}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Select one or multiple files (PDFs, videos, etc.)
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Recently Uploaded ({uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <File className="w-5 h-5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => navigator.clipboard.writeText(file.embedUrl)}
                        className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="font-semibold text-yellow-900 mb-2">Sign In Required</h3>
          <p className="text-sm text-yellow-800">
            Please sign in with your @cse.bubt.edu.bd Google account to upload files.
          </p>
        </div>
      )}
    </div>
  );
};
