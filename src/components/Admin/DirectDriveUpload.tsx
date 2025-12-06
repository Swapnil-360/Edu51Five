/**
 * Direct Google Drive Upload & Access System
 * - Admin uploads to centralized Drive (22235103183@cse.bubt.edu.bd)
 * - Admin must use @cse.bubt.edu.bd email
 * - Files auto-organize by Course/Period/Category
 * - Students read directly from Drive (NO Supabase)
 * - Real-time file listing via Drive API
 * - Uses Google Identity Services (GIS) - the new OAuth method
 */

import React, { useState, useEffect } from 'react';
import { Upload, LogIn, LogOut, CheckCircle, AlertCircle, File, Trash2, FolderOpen } from 'lucide-react';

// Google Drive API configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Global variable for access token
let accessToken: string | null = null;

// Course folder IDs (from googleDrive.ts)
const FOLDER_IDS = {
  'CSE-319-20': {
    midterm: {
      'ct-questions': '19GNZOjHkeI74NeU6wQ4Ud_k6p5082muo',
      'notes': '15P_lHxnMKHeUNQlGd2s-3_U3p9a6Tptt',
      'slides': '1V-G1KJbKeMi6ipkWeRZik13ZXI6WcMuT',
      'suggestions': '1NrwJsqGJvVBxDOPJBSXse2m00ajMhbo6',
      'super-tips': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'videos': '1LaHnIMxu0X4klUqBAjYajpaWGX7vNvw8'
    }
  },
  'CSE-327': {
    midterm: {
      'ct-questions': '1TnHTiq8jVf7K0aqoOvhBQzxgW-Zt-A1b',
      'notes': '1lHY1VHo-2BpvEgRVuBt2UkR7ye05XJoU',
      'slides': '16I2ET_APiduX79Xm9Z-d_UH0PZ5LsMLv',
      'suggestions': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'super-tips': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'videos': '1lIDc5yFLV53o-yJUcxLyoT8yTr1gFoVH'
    }
  },
  'CSE-407': {
    midterm: {
      'ct-questions': '1aeiZL_IvhavB-zKVH_AYz881Kir-zxpA',
      'notes': '1vUyDqOle6a0XySBitkrFYKJIHzDC-nsS',
      'slides': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'suggestions': '1KCy4SgMBMxwVOBotwPxID7MFUpt9_Ow4',
      'super-tips': '1rEimFkWrpEGYWEbfh3JN-Nrb6eMn5km2',
      'videos': '1xTBB9NxRnllI-Fm_vzmo8peVklF-bEbp'
    }
  },
  'CSE-417': {
    midterm: {
      'ct-questions': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'notes': '1hjTWNQd2HRV692i5g4nd_W-4T3FOE_cy',
      'slides': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'suggestions': '1qoYuJ2xiuCty3LqEyTXG-7BlryXycN_t',
      'super-tips': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'videos': '1xkDwJDx1wZHW7JOsk6--89kuzGBJyWli'
    }
  },
  'CSE-351': {
    midterm: {
      'ct-questions': 'bc1q63k6h64n7n56p23cjzu5yl6yfu55yxk6swy66k',
      'notes': '1emxoxmzIkH2jJtFORhO58NE-_F78347V',
      'slides': '1Hi2fiSozLjmHqdenHEYnEqJM_ruOylRT',
      'suggestions': '1LieLecfrAYqzNB5OSQ6RrE0LC1Anbmxd',
      'super-tips': '1dAxtUgEkaTMJjEjnY9616eRN-Gp1HkFC',
      'videos': '12wWh4Hm-4hCVlRZ-8F3Ioku6ySeTkkPB'
    }
  }
};

interface DirectDriveUploadProps {
  onFileUploaded?: () => void;
}

interface DriveFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdTime: string;
  webViewLink: string;
}

export const DirectDriveUpload: React.FC<DirectDriveUploadProps> = ({ onFileUploaded }) => {
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  const [selectedCourse, setSelectedCourse] = useState('CSE-319-20');
  const [examPeriod, setExamPeriod] = useState<'midterm' | 'final'>('midterm');
  const [category, setCategory] = useState('notes');
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filesInFolder, setFilesInFolder] = useState<DriveFile[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const courses = [
    { code: 'CSE-319-20', name: 'Networking' },
    { code: 'CSE-327', name: 'Software Engineering' },
    { code: 'CSE-407', name: 'Project Management' },
    { code: 'CSE-417', name: 'Distributed Database' },
    { code: 'CSE-351', name: 'Artificial Intelligence' },
  ];

  const categories = [
    { value: 'notes', label: '📝 Notes' },
    { value: 'slides', label: '📊 Slides' },
    { value: 'ct-questions', label: '❓ CT Questions' },
    { value: 'suggestions', label: '💡 Suggestions' },
    { value: 'super-tips', label: '⚡ Super Tips' },
    { value: 'videos', label: '🎥 Videos' },
  ];

  /**
   * Initialize Google Identity Services (GIS) - New OAuth method
   */
  useEffect(() => {
    console.log('🚀 DirectDriveUpload: Initializing Google Identity Services...');
    console.log('📌 API_KEY:', API_KEY ? `Present (${API_KEY.substring(0, 10)}...)` : 'MISSING');
    console.log('📌 CLIENT_ID:', CLIENT_ID ? `Present (${CLIENT_ID.substring(0, 20)}...)` : 'MISSING');
    
    if (!API_KEY || !CLIENT_ID) {
      console.error('❌ Missing API_KEY or CLIENT_ID in environment variables');
      setMessage({ 
        type: 'error', 
        text: 'Missing Google API credentials. Check .env file' 
      });
      return;
    }
    
    // Load Google API client library
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      console.log('✅ GAPI script loaded');
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          console.log('✅ GAPI client initialized');
          setIsGapiLoaded(true);
        } catch (error: any) {
          console.error('❌ GAPI init error:', error);
          setMessage({ type: 'error', text: `GAPI Error: ${error.message}` });
        }
      });
    };
    document.body.appendChild(gapiScript);

    // Load Google Identity Services (GIS) library
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      console.log('✅ GIS script loaded');
      // Initialize the token client
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            console.error('❌ OAuth error:', response);
            setMessage({ type: 'error', text: `OAuth Error: ${response.error}` });
            return;
          }
          console.log('✅ Got access token');
          accessToken = response.access_token;
          setIsSignedIn(true);
          setMessage({ type: 'success', text: '✅ Signed in successfully!' });
        },
      });
      setTokenClient(client);
      console.log('✅ Token client ready');
    };
    gisScript.onerror = () => {
      console.error('❌ Failed to load GIS script');
      setMessage({ type: 'error', text: 'Failed to load Google Sign-In' });
    };
    document.body.appendChild(gisScript);
  }, []);

  /**
   * Load files when folder changes
   */
  useEffect(() => {
    if (isSignedIn) {
      loadFilesFromFolder();
    }
  }, [selectedCourse, category, isSignedIn]);

  /**
   * Sign in with Google (GIS method)
   */
  const handleSignIn = () => {
    if (tokenClient) {
      console.log('🔐 Requesting OAuth token...');
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      console.error('❌ Token client not initialized');
      setMessage({ type: 'error', text: 'Sign-in not ready. Please refresh the page.' });
    }
  };

  /**
   * Sign out
   */
  const handleSignOut = () => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('✅ Access token revoked');
      });
    }
    accessToken = null;
    setIsSignedIn(false);
    setAdminEmail('');
    setFilesInFolder([]);
    setMessage(null);
    console.log('✅ Signed out');
  };

  /**
   * Get folder ID for current selection
   */
  const getCurrentFolderId = (): string | null => {
    const course = FOLDER_IDS[selectedCourse as keyof typeof FOLDER_IDS];
    if (!course) return null;
    
    const period = course[examPeriod as keyof typeof course];
    if (!period) return null;
    
    return period[category as keyof typeof period] || null;
  };

  /**
   * Load files from current folder
   */
  const loadFilesFromFolder = async () => {
    const folderId = getCurrentFolderId();
    if (!folderId || !isSignedIn) return;

    try {
      const response = await window.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, mimeType, createdTime, webViewLink)',
        orderBy: 'createdTime desc',
      });

      setFilesInFolder(response.result.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setMessage({ type: 'error', text: 'Failed to load files from folder' });
    }
  };

  /**
   * Upload file to Drive
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const folderId = getCurrentFolderId();
    if (!folderId) {
      setMessage({ type: 'error', text: 'Invalid folder selection' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload file
        const metadata = {
          name: file.name,
          parents: [folderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
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

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setMessage({ type: 'success', text: `✅ Uploaded ${files.length} file(s) successfully!` });
      
      // Refresh file list
      await loadFilesFromFolder();
      
      if (onFileUploaded) onFileUploaded();
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  };

  /**
   * Delete file
   */
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      await window.gapi.client.drive.files.delete({ fileId });
      setMessage({ type: 'success', text: `✅ Deleted "${fileName}"` });
      await loadFilesFromFolder();
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
              <h2 className="text-2xl font-bold">Direct Google Drive Upload</h2>
              <p className="text-sm text-blue-100">Upload to 22235103183@cse.bubt.edu.bd storage</p>
            </div>
          </div>
          
          {!isGapiLoaded ? (
            <div className="flex items-center gap-2 text-blue-100">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Loading Google API...</span>
            </div>
          ) : (
            <div>
              {!isSignedIn ? (
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In (@cse.bubt.edu.bd)
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

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      {isSignedIn ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">✨ How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
              <li>Select course, period, and category</li>
              <li>Choose files to upload</li>
              <li>Files automatically go to correct Drive folder</li>
              <li>Students see files immediately (no database needed)</li>
              <li>All files stored in 22235103183@cse.bubt.edu.bd account</li>
            </ul>
          </div>

          {/* Folder Path */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">📁 Upload Destination:</p>
            <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-300">
              {selectedCourse} → {examPeriod === 'midterm' ? 'Midterm' : 'Final'} → {
                categories.find(c => c.value === category)?.label || 'Notes'
              }
            </p>
          </div>

          {/* Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Exam Period</label>
              <select
                value={examPeriod}
                onChange={(e) => setExamPeriod(e.target.value as 'midterm' | 'final')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={isUploading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Files in Folder */}
          {filesInFolder.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                Files in This Folder ({filesInFolder.length})
              </h3>
              <div className="space-y-2">
                {filesInFolder.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <File className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name)}
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="font-semibold text-yellow-900 mb-2">Authentication Required</h3>
          <p className="text-sm text-yellow-800">
            Sign in with your @cse.bubt.edu.bd Google account to upload files.
          </p>
        </div>
      )}
    </div>
  );
};
