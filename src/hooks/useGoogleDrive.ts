/**
 * React Hook for Google Drive API
 * Provides easy access to Drive operations in React components
 */

import { useState, useEffect } from 'react';
import * as driveApi from '../lib/googleDriveApi';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
  modifiedTime?: string;
  size?: string;
}

export const useGoogleDrive = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google APIs on mount
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          driveApi.initializeGapi(),
          driveApi.initializeGis(),
        ]);
        setIsInitialized(true);
        setIsSignedIn(driveApi.isSignedIn());
      } catch (err) {
        console.error('Failed to initialize Google Drive API:', err);
        setError('Failed to initialize Google Drive API');
      }
    };

    init();
  }, []);

  /**
   * Sign in to Google Drive
   */
  const signIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await driveApi.signIn();
      setIsSignedIn(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out from Google Drive
   */
  const signOut = () => {
    driveApi.signOut();
    setIsSignedIn(false);
  };

  /**
   * Upload a file to Google Drive
   */
  const uploadFile = async (file: File, folderId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await driveApi.uploadFile(file, folderId);
      // Make file public for sharing
      await driveApi.makeFilePublic(result.id);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * List files in a folder
   */
  const listFiles = async (folderId?: string): Promise<DriveFile[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await driveApi.listFiles(folderId);
      return files as DriveFile[];
    } catch (err: any) {
      setError(err.message || 'Failed to list files');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a folder
   */
  const createFolder = async (folderName: string, parentFolderId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await driveApi.createFolder(folderName, parentFolderId);
      // Make folder public
      await driveApi.makeFilePublic(result.id);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create folder');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a file
   */
  const deleteFile = async (fileId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await driveApi.deleteFile(fileId);
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search files
   */
  const searchFiles = async (query: string): Promise<DriveFile[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await driveApi.searchFiles(query);
      return files as DriveFile[];
    } catch (err: any) {
      setError(err.message || 'Failed to search files');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get file metadata
   */
  const getFileMetadata = async (fileId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await driveApi.getFileMetadata(fileId);
    } catch (err: any) {
      setError(err.message || 'Failed to get file metadata');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isInitialized,
    isSignedIn,
    isLoading,
    error,
    
    // Methods
    signIn,
    signOut,
    uploadFile,
    listFiles,
    createFolder,
    deleteFile,
    searchFiles,
    getFileMetadata,
    
    // Utilities
    getEmbedUrl: driveApi.getEmbedUrl,
    getDownloadUrl: driveApi.getDownloadUrl,
  };
};
