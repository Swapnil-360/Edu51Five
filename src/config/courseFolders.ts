/**
 * Course Storage Configuration - Google Drive Folders
 * Each major has its own folder + all majors share the Common folder
 */

export const COURSE_FOLDER_LINKS = {
  // Common courses - visible to ALL majors (AI, Software Engineering, Networking)
  'Common': {
    name: 'Common Courses',
    folderId: '1ZlnWXpA2pH8l5X1jfwWjHmnacIj2jxgp',
    shareLink: 'https://drive.google.com/drive/folders/1ZlnWXpA2pH8l5X1jfwWjHmnacIj2jxgp?usp=drive_link'
  },
  
  // AI-specific courses - only visible to AI major students
  'AI': {
    name: 'AI Major Courses',
    folderId: '1UvxprKhePf6gUWxtSExfg9ik6ncSp54y',
    shareLink: 'https://drive.google.com/drive/folders/1UvxprKhePf6gUWxtSExfg9ik6ncSp54y?usp=drive_link'
  },
  
  // Software Engineering-specific courses - only visible to Software major students
  'Software Engineering': {
    name: 'Software Engineering Courses',
    folderId: '1oYAa0bSu8SbOtfkWl8uiH4rcRqyVqxV6',
    shareLink: 'https://drive.google.com/drive/folders/1oYAa0bSu8SbOtfkWl8uiH4rcRqyVqxV6?usp=drive_link'
  },
  
  // Networking-specific courses - only visible to Networking major students
  'Networking': {
    name: 'Networking Major Courses',
    folderId: '1O67pRRZhqGq2YZ6lgYl245QUG5NQeJne',
    shareLink: 'https://drive.google.com/drive/folders/1O67pRRZhqGq2YZ6lgYl245QUG5NQeJne?usp=drive_link'
  }
};

/**
 * Admin Panel Upload Folder
 * Admins use this folder to upload course materials
 */
export const ADMIN_UPLOAD_FOLDER = {
  name: 'Admin Panel Uploads',
  folderId: '1lFktSbOz-voVmiSnYJzuHbtSfpeqsuAx',
  shareLink: 'https://drive.google.com/drive/folders/1lFktSbOz-voVmiSnYJzuHbtSfpeqsuAx?usp=drive_link'
};

/**
 * Get folder link for a major
 * @param major - The student's major (AI, Software Engineering, Networking)
 * @returns Array of folder links: [CommonFolder, MajorSpecificFolder]
 */
export const getCourseFolder = (major: string) => {
  const commonFolder = COURSE_FOLDER_LINKS['Common'];
  const majorFolder = COURSE_FOLDER_LINKS[major as keyof typeof COURSE_FOLDER_LINKS];
  
  return {
    common: commonFolder,
    major: majorFolder
  };
};

/**
 * Get all accessible folder IDs for a major
 * Common folder is always included + major-specific folder
 */
export const getAccessibleFolderIds = (major: string): string[] => {
  const common = COURSE_FOLDER_LINKS['Common'].folderId;
  const majorFolder = COURSE_FOLDER_LINKS[major as keyof typeof COURSE_FOLDER_LINKS];
  
  const folderIds = [common];
  if (majorFolder && majorFolder.folderId !== common) {
    folderIds.push(majorFolder.folderId);
  }
  
  return folderIds;
};
