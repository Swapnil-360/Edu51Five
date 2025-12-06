/**
 * Simplified Google Drive Upload Component
 * - Uses centralized Drive account: 22235103183@cse.bubt.edu.bd
 * - Admin must have @cse.bubt.edu.bd email to upload
 * - Manual process: Admin uploads to Drive folders, then adds embed links here
 */

import React, { useState } from 'react';
import { Upload, FolderTree, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SimpleDriveUploadProps {
  onFileAdded?: () => void;
}

export const SimpleDriveUpload: React.FC<SimpleDriveUploadProps> = ({ onFileAdded }) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examPeriod, setExamPeriod] = useState<'midterm' | 'final'>('midterm');
  const [category, setCategory] = useState('notes');
  const [fileName, setFileName] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Course list
  const courses = [
    { code: 'CSE-319-20', name: 'Networking' },
    { code: 'CSE-327', name: 'Software Engineering' },
    { code: 'CSE-407', name: 'Project Management' },
    { code: 'CSE-417', name: 'Distributed Database' },
    { code: 'CSE-351', name: 'Artificial Intelligence' },
  ];

  // Categories
  const categories = [
    { value: 'notes', label: 'Notes' },
    { value: 'slides', label: 'Slides' },
    { value: 'ct-questions', label: 'CT Questions' },
    { value: 'suggestions', label: 'Suggestions' },
    { value: 'super-tips', label: 'Super Tips' },
    { value: 'videos', label: 'Videos' },
  ];

  /**
   * Verify admin email (must be @cse.bubt.edu.bd)
   */
  const handleEmailVerification = () => {
    if (adminEmail.endsWith('@cse.bubt.edu.bd')) {
      setIsEmailVerified(true);
      setMessage({ type: 'success', text: `✅ Email verified: ${adminEmail}` });
    } else {
      setMessage({ type: 'error', text: '❌ Only @cse.bubt.edu.bd emails can upload files' });
    }
  };

  /**
   * Get Drive folder path for display
   */
  const getFolderPath = () => {
    if (!selectedCourse || !examPeriod || !category) return 'Select course, period, and category';
    return `Drive Storage > ${selectedCourse} > ${examPeriod.toUpperCase()} > ${category}`;
  };

  /**
   * Save file metadata to Supabase
   */
  const handleSaveFile = async () => {
    if (!isEmailVerified) {
      setMessage({ type: 'error', text: 'Please verify your @cse.bubt.edu.bd email first' });
      return;
    }

    if (!selectedCourse || !fileName || !embedUrl) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      // Get course_id from Supabase
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .eq('code', selectedCourse)
        .single();

      if (courseError || !courseData) {
        setMessage({ type: 'error', text: 'Course not found in database' });
        return;
      }

      // Insert material
      const { error: insertError } = await supabase
        .from('materials')
        .insert([
          {
            course_id: courseData.id,
            title: fileName,
            type: category,
            file_url: embedUrl,
            download_url: downloadUrl || embedUrl,
            exam_period: examPeriod,
            uploaded_by: adminEmail,
          },
        ]);

      if (insertError) {
        setMessage({ type: 'error', text: `Error saving file: ${insertError.message}` });
        return;
      }

      // Success
      setMessage({ type: 'success', text: `✅ File "${fileName}" added successfully!` });
      
      // Reset form
      setFileName('');
      setEmbedUrl('');
      setDownloadUrl('');
      
      // Notify parent
      if (onFileAdded) onFileAdded();
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-3">
          <Upload className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Google Drive File Manager</h2>
            <p className="text-sm text-blue-100">Centralized storage: 22235103183@cse.bubt.edu.bd</p>
          </div>
        </div>
      </div>

      {/* Email Verification Section */}
      {!isEmailVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-3">Admin Email Verification Required</h3>
              <p className="text-sm text-yellow-800 mb-4">
                Only authorized BUBT CSE admins can upload files. Please verify your @cse.bubt.edu.bd email.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="yourname@cse.bubt.edu.bd"
                  className="flex-1 px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <button
                  onClick={handleEmailVerification}
                  className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                >
                  Verify Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Upload Form (Only if email verified) */}
      {isEmailVerified && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FolderTree className="w-5 h-5" />
              How to Upload Files
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 ml-5 list-decimal">
              <li>Upload your file to the centralized Drive account (22235103183@cse.bubt.edu.bd)</li>
              <li>Organize in folder structure: <code className="bg-blue-100 px-1 rounded">Course &gt; Midterm/Final &gt; Category</code></li>
              <li>Right-click file → Get link → Copy link (set to "Anyone with the link")</li>
              <li>Convert to embed URL: <code className="bg-blue-100 px-1 rounded">https://drive.google.com/file/d/FILE_ID/preview</code></li>
              <li>Paste the embed URL below to make it visible to students</li>
            </ol>
          </div>

          {/* Folder Path Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">📁 Target Folder Path:</p>
            <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border border-gray-300">
              {getFolderPath()}
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* File Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g., Chapter 1 Notes.pdf"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Embed URL (Full Width) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Embed URL (Required)
            </label>
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/FILE_ID/preview"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use format: <code>https://drive.google.com/file/d/FILE_ID/preview</code>
            </p>
          </div>

          {/* Download URL (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Download URL (Optional)
            </label>
            <input
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/FILE_ID/view"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              If empty, embed URL will be used for downloads
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveFile}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Add File to Student Portal
          </button>
        </div>
      )}

      {/* Footer Note */}
      {isEmailVerified && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">📌 Important Notes:</p>
          <ul className="space-y-1 ml-5 list-disc">
            <li>All files must be uploaded to the centralized Drive account first</li>
            <li>Ensure files are set to "Anyone with the link can view" for public access</li>
            <li>Use the embed URL format for proper preview in student panel</li>
            <li>Files will appear immediately in student view after saving</li>
          </ul>
        </div>
      )}
    </div>
  );
};
