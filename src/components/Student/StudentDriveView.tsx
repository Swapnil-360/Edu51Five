/**
 * Student Direct Drive Access Component
 * - Reads files directly from Google Drive (NO database)
 * - No authentication needed for students
 * - Uses Drive API with API key (read-only)
 * - Real-time file listing
 */

import React, { useState, useEffect } from 'react';
import { File, Eye, Download, Loader, AlertCircle } from 'lucide-react';

// Google Drive API configuration
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';

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

interface StudentDriveViewProps {
  courseCode: string;
  examPeriod?: 'midterm' | 'final';
  onFileClick?: (fileId: string, fileName: string) => void;
}

interface DriveFile {
  id: string;
  name: string;
  size?: number;
  mimeType: string;
  createdTime: string;
  webViewLink?: string;
}

export const StudentDriveView: React.FC<StudentDriveViewProps> = ({
  courseCode,
  examPeriod = 'midterm',
  onFileClick
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filesByCategory, setFilesByCategory] = useState<Record<string, DriveFile[]>>({});

  const categories = [
    { value: 'notes', label: '📝 Notes', icon: '📝' },
    { value: 'slides', label: '📊 Slides', icon: '📊' },
    { value: 'ct-questions', label: '❓ CT Questions', icon: '❓' },
    { value: 'suggestions', label: '💡 Suggestions', icon: '💡' },
    { value: 'super-tips', label: '⚡ Super Tips', icon: '⚡' },
    { value: 'videos', label: '🎥 Videos', icon: '🎥' },
  ];

  /**
   * Load files from Google Drive
   */
  useEffect(() => {
    loadAllFiles();
  }, [courseCode, examPeriod]);

  const loadAllFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize gapi client if needed
      if (!window.gapi.client) {
        await new Promise((resolve) => {
          window.gapi.load('client', resolve);
        });
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
      }

      const filesData: Record<string, DriveFile[]> = {};

      // Load files for each category
      for (const category of categories) {
        const folderId = getFolderId(courseCode, examPeriod, category.value);
        if (!folderId) continue;

        try {
          const response = await window.gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, size, mimeType, createdTime, webViewLink)',
            orderBy: 'createdTime desc',
            pageSize: 100,
          });

          filesData[category.value] = response.result.files || [];
        } catch (err) {
          console.error(`Error loading ${category.label}:`, err);
          filesData[category.value] = [];
        }
      }

      setFilesByCategory(filesData);
    } catch (err) {
      console.error('Error loading files:', err);
      setError('Failed to load files from Google Drive');
    } finally {
      setIsLoading(false);
    }
  };

  const getFolderId = (course: string, period: 'midterm' | 'final', cat: string): string | null => {
    const courseData = FOLDER_IDS[course as keyof typeof FOLDER_IDS];
    if (!courseData) return null;
    
    const periodData = courseData[period as keyof typeof courseData];
    if (!periodData) return null;
    
    return periodData[cat as keyof typeof periodData] || null;
  };

  const handleFileClick = (file: DriveFile) => {
    if (onFileClick) {
      onFileClick(file.id, file.name);
    } else {
      // Default: Open in new tab
      const embedUrl = `https://drive.google.com/file/d/${file.id}/preview`;
      window.open(embedUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading files from Google Drive...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadAllFiles}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const files = filesByCategory[category.value] || [];
        
        return (
          <div key={category.value} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">{category.icon}</span>
                {category.label}
                <span className="ml-auto text-sm text-gray-600">
                  ({files.length} file{files.length !== 1 ? 's' : ''})
                </span>
              </h3>
            </div>

            {files.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} •{' '}
                            {new Date(file.createdTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleFileClick(file)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Preview
                        </button>
                        <a
                          href={`https://drive.google.com/uc?export=download&id=${file.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                          download
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No files in this category yet</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
