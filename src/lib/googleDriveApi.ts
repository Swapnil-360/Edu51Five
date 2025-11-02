/**
 * Google Drive API Service
 * Handles authentication and file operations with Google Drive
 */

// Google API Configuration
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// Debug logging
console.log('🔧 Google Drive API Config:', {
  hasClientId: !!CLIENT_ID,
  hasApiKey: !!API_KEY,
  clientIdPrefix: CLIENT_ID?.substring(0, 20) + '...',
});

// Global state
let gapiInited = false;
let gisInited = false;
let tokenClient: any;

/**
 * Initialize Google API Client
 */
export const initializeGapi = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gapiInited) {
      resolve();
      return;
    }

    if (!API_KEY) {
      const error = 'Google API Key is not configured. Please add VITE_GOOGLE_API_KEY to your .env file';
      console.error('❌', error);
      reject(new Error(error));
      return;
    }

    // Check if gapi is already loaded
    if (window.gapi) {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiInited = true;
          console.log('✅ Google API Client initialized');
          resolve();
        } catch (error: any) {
          console.error('❌ Error initializing GAPI client:', error);
          if (error.details) {
            console.error('Error details:', error.details);
          }
          reject(error);
        }
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
          });
          gapiInited = true;
          console.log('✅ Google API Client initialized');
          resolve();
        } catch (error: any) {
          console.error('❌ Error initializing GAPI client:', error);
          if (error.details) {
            console.error('Error details:', error.details);
          }
          reject(error);
        }
      });
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google API script:', error);
      reject(new Error('Failed to load Google API script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Initialize Google Identity Services (OAuth)
 */
export const initializeGis = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (gisInited) {
      resolve();
      return;
    }

    if (!CLIENT_ID) {
      const error = 'Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file';
      console.error('❌', error);
      reject(new Error(error));
      return;
    }

    // Check if google identity is already loaded
    if (window.google?.accounts?.oauth2) {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined at request time
        });
        gisInited = true;
        console.log('✅ Google Identity Services initialized');
        resolve();
      } catch (error) {
        console.error('❌ Error initializing GIS:', error);
        reject(error);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined at request time
        });
        gisInited = true;
        console.log('✅ Google Identity Services initialized');
        resolve();
      } catch (error) {
        console.error('❌ Error initializing GIS:', error);
        reject(error);
      }
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Identity Services script:', error);
      reject(new Error('Failed to load Google Identity Services script'));
    };
    document.body.appendChild(script);
  });
};

/**
 * Sign in to Google and request access token
 */
export const signIn = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = async (response: any) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }
        console.log('✅ Access token received');
        resolve(response.access_token);
      };

      // Check if user already has a valid token
      if (window.gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (error) {
      console.error('❌ Error signing in:', error);
      reject(error);
    }
  });
};

/**
 * Sign out from Google
 */
export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('✅ Signed out from Google');
    });
    window.gapi.client.setToken(null);
  }
};

/**
 * Check if user is signed in
 */
export const isSignedIn = (): boolean => {
  return window.gapi?.client?.getToken() !== null;
};

/**
 * Upload file to Google Drive
 */
export const uploadFile = async (
  file: File,
  folderId?: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> => {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    ...(folderId && { parents: [folderId] }),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const token = window.gapi.client.getToken();
  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + token.access_token }),
      body: form,
    }
  );

  const result = await response.json();
  console.log('✅ File uploaded:', result);
  return result;
};

/**
 * Make file publicly accessible
 */
export const makeFilePublic = async (fileId: string): Promise<void> => {
  await window.gapi.client.drive.permissions.create({
    fileId: fileId,
    resource: {
      role: 'reader',
      type: 'anyone',
    },
  });
  console.log('✅ File made public:', fileId);
};

/**
 * List files in a folder
 */
export const listFiles = async (folderId?: string): Promise<any[]> => {
  const query = folderId ? `'${folderId}' in parents` : undefined;
  
  const response = await window.gapi.client.drive.files.list({
    q: query,
    pageSize: 100,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime, modifiedTime, size)',
  });

  return response.result.files || [];
};

/**
 * Create a folder in Google Drive
 */
export const createFolder = async (
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; webViewLink: string }> => {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await window.gapi.client.drive.files.create({
    resource: metadata,
    fields: 'id,webViewLink',
  });

  console.log('✅ Folder created:', response.result);
  return response.result;
};

/**
 * Delete a file from Google Drive
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await window.gapi.client.drive.files.delete({
    fileId: fileId,
  });
  console.log('✅ File deleted:', fileId);
};

/**
 * Get file preview/embed URL
 */
export const getEmbedUrl = (fileId: string): string => {
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

/**
 * Get direct download URL
 */
export const getDownloadUrl = (fileId: string): string => {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

/**
 * Search files by name or query
 */
export const searchFiles = async (searchQuery: string): Promise<any[]> => {
  const query = `name contains '${searchQuery}' and trashed=false`;
  
  const response = await window.gapi.client.drive.files.list({
    q: query,
    pageSize: 50,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime)',
  });

  return response.result.files || [];
};

/**
 * Get file metadata
 */
export const getFileMetadata = async (fileId: string): Promise<any> => {
  const response = await window.gapi.client.drive.files.get({
    fileId: fileId,
    fields: 'id, name, mimeType, webViewLink, webContentLink, createdTime, modifiedTime, size, owners',
  });

  return response.result;
};

// Type declarations for TypeScript
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
