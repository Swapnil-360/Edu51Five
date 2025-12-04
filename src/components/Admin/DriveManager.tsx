/**
 * Google Drive Manager - Full folder management for centralized storage
 * Root folder: 1pwtRJ3AcPVztKq2nBebj0oP5b2G-iugq
 * Admin can: browse, create folders, upload, delete, organize
 */

import React, { useState, useEffect, useRef } from 'react';
import { Upload, LogIn, LogOut, FolderPlus, Trash2, Eye, RefreshCw, Folder, File } from 'lucide-react';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive';
const ROOT_FOLDER_ID = '1pwtRJ3AcPVztKq2nBebj0oP5b2G-iugq';

let accessToken: string | null = null;
// Global flag to prevent duplicate initialization (survives React StrictMode)
let isGloballyInitializing = false;
let isGloballyInitialized = false;

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  webViewLink?: string;
  iconLink?: string;
}

interface DriveManagerProps {
  isDarkMode?: boolean;
}

export const DriveManager: React.FC<DriveManagerProps> = ({ isDarkMode = false }) => {
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const hasInitialized = useRef(false);
  
  const [currentFolderId, setCurrentFolderId] = useState(ROOT_FOLDER_ID);
  const [folderPath, setFolderPath] = useState<Array<{id: string, name: string}>>([
    { id: ROOT_FOLDER_ID, name: 'Storage Root' }
  ]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  /**
   * Initialize Google Identity Services
   */
  useEffect(() => {
    // Prevent duplicate initialization using ref (survives StrictMode)
    if (hasInitialized.current || isGloballyInitializing || isGloballyInitialized) {
      return;
    }
    
    hasInitialized.current = true;
    isGloballyInitializing = true;
    console.log('🚀 DriveManager: Initializing...');
    
    // Load GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          console.log('✅ GAPI client ready');
          setIsGapiLoaded(true);
        } catch (error: any) {
          // Google API discovery might be temporarily unavailable (502)
          // This is not critical - user can still authenticate and try again
          console.warn('⚠️ GAPI init warning (non-critical):', error?.message || 'Unknown error');
          setIsGapiLoaded(true); // Allow UI to proceed
        } finally {
          isGloballyInitializing = false;
          isGloballyInitialized = true;
        }
      });
    };
    gapiScript.onerror = () => {
      console.error('❌ Failed to load Google API script');
      isGloballyInitializing = false;
      isGloballyInitialized = true; // Mark as done even on error to prevent retries
    };
    document.body.appendChild(gapiScript);

    // Load GIS
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            setMessage({ type: 'error', text: `OAuth Error: ${response.error}` });
            return;
          }
          accessToken = response.access_token;
          setIsSignedIn(true);
          setMessage({ type: 'success', text: '✅ Signed in successfully!' });
          loadFolder(ROOT_FOLDER_ID);
        },
      });
      setTokenClient(client);
      console.log('✅ GIS ready');
    };
    document.body.appendChild(gisScript);
  }, []);

  /**
   * Sign in
   */
  const handleSignIn = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  /**
   * Sign out
   */
  const handleSignOut = () => {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    }
    accessToken = null;
    setIsSignedIn(false);
    setItems([]);
    setFolderPath([{ id: ROOT_FOLDER_ID, name: 'Storage Root' }]);
    setCurrentFolderId(ROOT_FOLDER_ID);
  };

  /**
   * Load folder contents
   */
  const loadFolder = async (folderId: string) => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime,webViewLink,iconLink)&orderBy=folder,name`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      const data = await response.json();
      setItems(data.files || []);
      setCurrentFolderId(folderId);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to load folder: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to folder
   */
  const navigateToFolder = (item: DriveItem) => {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
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
    loadFolder(newPath[newPath.length - 1].id);
  };

  /**
   * Create new folder
   */
  const createFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !accessToken) return;

    try {
      const response = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentFolderId],
          }),
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: `✅ Created folder "${folderName}"` });
        loadFolder(currentFolderId);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to create folder: ${error.message}` });
    }
  };

  /**
   * Upload file
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !accessToken) return;

    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const metadata = {
          name: file.name,
          parents: [currentFolderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: form,
          }
        );
      }
      
      setMessage({ type: 'success', text: `✅ Uploaded ${files.length} file(s)` });
      loadFolder(currentFolderId);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  /**
   * Delete item
   */
  const deleteItem = async (item: DriveItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;

    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${item.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      setMessage({ type: 'success', text: `✅ Deleted "${item.name}"` });
      loadFolder(currentFolderId);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Delete failed: ${error.message}` });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-blue-500 to-purple-600'} text-white p-4 sm:p-6 rounded-lg shadow-lg`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Upload className="w-7 h-7 sm:w-8 sm:h-8" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Google Drive Manager</h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-100'}`}>Full control over centralized storage</p>
            </div>
          </div>
          
          {!isGapiLoaded ? (
            <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-blue-100'}`}>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Loading...</span>
            </div>
          ) : !isSignedIn ? (
            <button
              onClick={handleSignIn}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white text-blue-600 hover:bg-blue-50'} rounded-lg transition-colors font-medium w-full sm:w-auto`}
            >
              <LogIn className="w-5 h-5" />
              <span>Sign In with Google</span>
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-white/20 hover:bg-white/30'} rounded-lg transition-colors w-full sm:w-auto`}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
          message.type === 'success' 
            ? isDarkMode ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-50 text-green-800' 
            : isDarkMode ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {isSignedIn && (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 sm:p-6 space-y-4`}>
          {/* Breadcrumb - Mobile Scrollable */}
          <div className="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto pb-2 scrollbar-hide">
            {folderPath.map((folder, index) => (
              <React.Fragment key={folder.id}>
                <button
                  onClick={() => navigateToPath(index)}
                  className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:underline'} whitespace-nowrap`}
                >
                  {folder.name}
                </button>
                {index < folderPath.length - 1 && <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>/</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Actions - Mobile Stacked */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={createFolder}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg text-sm sm:text-base`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
            
            <label className={`flex items-center justify-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg cursor-pointer text-sm sm:text-base`}>
              <Upload className="w-4 h-4" />
              <span>Upload Files</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => loadFolder(currentFolderId)}
              className={`flex items-center justify-center gap-2 px-4 py-2 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-lg text-sm sm:text-base`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Files list - Mobile Optimized */}
          {loading ? (
            <div className="text-center py-8">
              <div className={`animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 ${isDarkMode ? 'border-blue-400 border-t-transparent' : 'border-blue-500 border-t-transparent'} mx-auto`}></div>
              <p className={`mt-4 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <Folder className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className="text-sm sm:text-base">Empty folder</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-lg gap-3 ${
                    isDarkMode 
                      ? 'border-gray-700 hover:bg-gray-700/50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => navigateToFolder(item)}
                  >
                    {item.mimeType === 'application/vnd.google-apps.folder' ? (
                      <Folder className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    ) : (
                      <File className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`font-medium text-sm sm:text-base truncate block ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item.name}</span>
                      {item.size && (
                        <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({(item.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end sm:justify-start">
                    {item.webViewLink && (
                      <a
                        href={item.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded flex items-center gap-1 text-sm ${
                          isDarkMode 
                            ? 'text-blue-300 hover:bg-blue-900/30' 
                            : 'text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </a>
                    )}
                    <button
                      onClick={() => deleteItem(item)}
                      className={`p-2 rounded flex items-center gap-1 text-sm ${
                        isDarkMode 
                          ? 'text-red-300 hover:bg-red-900/30' 
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
