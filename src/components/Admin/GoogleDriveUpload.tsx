/**
 * Google Drive Upload Component
 * Admin interface for uploading files to Google Drive
 */

import React, { useState } from 'react';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { Upload, Folder, File, LogIn, LogOut, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface GoogleDriveUploadProps {
  onFileUploaded?: (fileId: string, embedUrl: string, downloadUrl: string) => void;
  courseCode?: string;
  category?: string;
}

export const GoogleDriveUpload: React.FC<GoogleDriveUploadProps> = ({
  onFileUploaded,
  courseCode: initialCourseCode,
  category: initialCategory,
}) => {
  const {
    isInitialized,
    isSignedIn,
    isLoading,
    error,
    signIn,
    signOut,
    uploadFile,
    createFolder,
    getEmbedUrl,
    getDownloadUrl,
  } = useGoogleDrive();

  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    embedUrl: string;
    downloadUrl: string;
  }>>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseCode || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'notes');

  /**
   * Handle file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadProgress('Preparing upload...');

      // Create folder structure if courseCode and category provided
      let folderId: string | undefined;
      if (selectedCourse && selectedCategory) {
        setUploadProgress(`Creating folder structure for ${selectedCourse}/${selectedCategory}...`);
        
        // Create course folder
        const courseFolder = await createFolder(selectedCourse);
        
        // Create category folder inside course folder
        const categoryFolder = await createFolder(selectedCategory, courseFolder.id);
        folderId = categoryFolder.id;
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);

        const result = await uploadFile(file, folderId);
        const embedUrl = getEmbedUrl(result.id);
        const downloadUrl = getDownloadUrl(result.id);

        setUploadedFiles(prev => [...prev, {
          name: file.name,
          embedUrl,
          downloadUrl,
        }]);

        // Callback with file info
        if (onFileUploaded) {
          onFileUploaded(result.id, embedUrl, downloadUrl);
        }
      }

      setUploadProgress(`✅ Successfully uploaded ${files.length} file(s)!`);
      
      // Clear progress after 3 seconds
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadProgress('❌ Upload failed');
    }
  };

  if (!isInitialized) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
          <Loader className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Initializing Google Drive...</span>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Initialization Error</h4>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Make sure Google Drive API is enabled in your Google Cloud Console
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sign In/Out Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isSignedIn ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Connected to Google Drive</h3>
                  <p className="text-sm text-gray-600">Ready to upload files</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Sign in to Google Drive</h3>
                  <p className="text-sm text-gray-600">Required to upload files</p>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={isSignedIn ? signOut : signIn}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isSignedIn
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSignedIn ? (
              <>
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In with Google</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {isSignedIn && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Upload Files to Google Drive</span>
          </h3>

          {/* Course and Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code
              </label>
              <input
                type="text"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                placeholder="e.g., CSE-319"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="notes">Notes</option>
                <option value="slides">Slides</option>
                <option value="ct-questions">CT Questions</option>
                <option value="suggestions">Suggestions</option>
                <option value="super-tips">Super Tips</option>
                <option value="videos">Videos</option>
              </select>
            </div>
          </div>

          {selectedCourse && selectedCategory && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-sm">
                <Folder className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">
                  Files will be organized in: <strong>{selectedCourse}/{selectedCategory}</strong>
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>

            {uploadProgress && (
              <div className="flex items-center space-x-2 text-sm">
                {isLoading && <Loader className="h-4 w-4 animate-spin text-blue-600" />}
                <span className={uploadProgress.includes('✅') ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  {uploadProgress}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Recently Uploaded ({uploadedFiles.length})</span>
          </h3>
          
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">{file.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={file.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(file.embedUrl);
                      alert('Embed URL copied to clipboard!');
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
