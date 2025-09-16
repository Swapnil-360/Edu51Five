// Mid-term Exam Material Management System
// Focuses on mid-term materials only - final materials will be added later

import { getCurrentSemesterStatus } from './semester';

export type ExamType = 'midterm' | 'regular' | 'all';
export type MaterialType = 'ct' | 'notes' | 'slides' | 'suggestions' | 'syllabus' | 'other';

export interface ExamMaterial {
  id: string;
  name: string;
  type: MaterialType;
  examType: ExamType;
  courseCode: string;
  driveUrl: string;
  embedUrl: string;
  uploadDate: string;
  isHighPriority?: boolean;
  relevanceScore: number; // Relevance score 0-100 for mid-term
  topics?: string[];
  description?: string;
}

// Mid-term focused course materials
export const EXAM_MATERIALS: ExamMaterial[] = [
  // CSE-319-20 Mid-term Materials
  {
    id: 'cse319_ct1_mid',
    name: 'Class Test 1 - Mid-term Focus',
    type: 'ct',
    examType: 'midterm',
    courseCode: 'CSE-319-20',
    driveUrl: 'https://drive.google.com/drive/folders/1example1',
    embedUrl: 'https://drive.google.com/embedview?id=example1',
    uploadDate: '2025-09-10',
    isHighPriority: true,
    relevanceScore: 100,
    topics: ['Chapter 1-3', 'Mid-term Syllabus'],
    description: 'Class test covering mid-term examination topics'
  },
  {
    id: 'cse319_notes_mid',
    name: 'Mid-term Notes Collection',
    type: 'notes',
    examType: 'midterm',
    courseCode: 'CSE-319-20',
    driveUrl: 'https://drive.google.com/drive/folders/1example2',
    embedUrl: 'https://drive.google.com/embedview?id=example2',
    uploadDate: '2025-09-12',
    isHighPriority: true,
    relevanceScore: 95,
    topics: ['Core Concepts', 'Mid-term Topics'],
    description: 'Comprehensive notes for mid-term examination'
  },
  {
    id: 'cse319_slides_mid',
    name: 'Mid-term Lecture Slides',
    type: 'slides',
    examType: 'midterm',
    courseCode: 'CSE-319-20',
    driveUrl: 'https://drive.google.com/drive/folders/1example3',
    embedUrl: 'https://drive.google.com/embedview?id=example3',
    uploadDate: '2025-09-08',
    relevanceScore: 90,
    topics: ['Lecture 1-8', 'Mid-term Coverage'],
    description: 'Slides covering mid-term examination scope'
  },

  // CSE-327 Mid-term Materials
  {
    id: 'cse327_ct1_mid',
    name: 'CSE-327 Class Test - Mid-term',
    type: 'ct',
    examType: 'midterm',
    courseCode: 'CSE-327',
    driveUrl: 'https://drive.google.com/drive/folders/1example4',
    embedUrl: 'https://drive.google.com/embedview?id=example4',
    uploadDate: '2025-09-11',
    isHighPriority: true,
    relevanceScore: 100,
    topics: ['Mid-term Syllabus', 'Core Topics'],
    description: 'Class test for mid-term preparation'
  },
  {
    id: 'cse327_suggestions_mid',
    name: 'Mid-term Exam Suggestions',
    type: 'suggestions',
    examType: 'midterm',
    courseCode: 'CSE-327',
    driveUrl: 'https://drive.google.com/drive/folders/1example5',
    embedUrl: 'https://drive.google.com/embedview?id=example5',
    uploadDate: '2025-09-13',
    isHighPriority: true,
    relevanceScore: 95,
    topics: ['Important Questions', 'Mid-term Tips'],
    description: 'Suggestions and tips for mid-term exam'
  },

  // CSE-351 Mid-term Materials
  {
    id: 'cse351_notes_mid',
    name: 'CSE-351 Mid-term Study Notes',
    type: 'notes',
    examType: 'midterm',
    courseCode: 'CSE-351',
    driveUrl: 'https://drive.google.com/drive/folders/1example6',
    embedUrl: 'https://drive.google.com/embedview?id=example6',
    uploadDate: '2025-09-09',
    isHighPriority: true,
    relevanceScore: 90,
    topics: ['Key Concepts', 'Mid-term Focus Areas'],
    description: 'Study notes optimized for mid-term exam'
  },
  {
    id: 'cse351_ct_mid',
    name: 'CSE-351 Class Test Questions',
    type: 'ct',
    examType: 'midterm',
    courseCode: 'CSE-351',
    driveUrl: 'https://drive.google.com/drive/folders/1example7',
    embedUrl: 'https://drive.google.com/embedview?id=example7',
    uploadDate: '2025-09-10',
    isHighPriority: true,
    relevanceScore: 100,
    topics: ['Practice Questions', 'Mid-term Format'],
    description: 'Class test questions for mid-term practice'
  },

  // CSE-407 Mid-term Materials
  {
    id: 'cse407_slides_mid',
    name: 'CSE-407 Mid-term Presentation Slides',
    type: 'slides',
    examType: 'midterm',
    courseCode: 'CSE-407',
    driveUrl: 'https://drive.google.com/drive/folders/1example8',
    embedUrl: 'https://drive.google.com/embedview?id=example8',
    uploadDate: '2025-09-07',
    relevanceScore: 85,
    topics: ['Theory Concepts', 'Mid-term Topics'],
    description: 'Presentation slides for mid-term preparation'
  },
  {
    id: 'cse407_suggestions_mid',
    name: 'CSE-407 Mid-term Guidelines',
    type: 'suggestions',
    examType: 'midterm',
    courseCode: 'CSE-407',
    driveUrl: 'https://drive.google.com/drive/folders/1example9',
    embedUrl: 'https://drive.google.com/embedview?id=example9',
    uploadDate: '2025-09-12',
    isHighPriority: true,
    relevanceScore: 90,
    topics: ['Study Guide', 'Important Points'],
    description: 'Guidelines and suggestions for mid-term exam'
  },

  // CSE-417 Mid-term Materials
  {
    id: 'cse417_notes_mid',
    name: 'CSE-417 Comprehensive Mid-term Notes',
    type: 'notes',
    examType: 'midterm',
    courseCode: 'CSE-417',
    driveUrl: 'https://drive.google.com/drive/folders/1example10',
    embedUrl: 'https://drive.google.com/embedview?id=example10',
    uploadDate: '2025-09-11',
    isHighPriority: true,
    relevanceScore: 95,
    topics: ['All Mid-term Chapters', 'Summary Notes'],
    description: 'Comprehensive notes covering all mid-term topics'
  },
  {
    id: 'cse417_ct_practice',
    name: 'CSE-417 Practice Questions',
    type: 'ct',
    examType: 'midterm',
    courseCode: 'CSE-417',
    driveUrl: 'https://drive.google.com/drive/folders/1example11',
    embedUrl: 'https://drive.google.com/embedview?id=example11',
    uploadDate: '2025-09-13',
    isHighPriority: true,
    relevanceScore: 100,
    topics: ['Practice Problems', 'Mid-term Style Questions'],
    description: 'Practice questions in mid-term exam format'
  }
];

// Get all materials sorted by relevance for current mid-term period
export const getCurrentExamMaterials = (): ExamMaterial[] => {
  const currentPhase = getCurrentSemesterStatus().currentPhase;
  
  // During mid-terms, show all mid-term materials first
  if (currentPhase === 'Mid-term Examinations') {
    return EXAM_MATERIALS
      .filter(material => material.examType === 'midterm' || material.examType === 'all')
      .sort((a, b) => {
        // High priority items first
        if (a.isHighPriority && !b.isHighPriority) return -1;
        if (!a.isHighPriority && b.isHighPriority) return 1;
        
        // Then by relevance score
        return b.relevanceScore - a.relevanceScore;
      });
  }
  
  // During other periods, show all materials
  return EXAM_MATERIALS.sort((a, b) => {
    if (a.isHighPriority && !b.isHighPriority) return -1;
    if (!a.isHighPriority && b.isHighPriority) return 1;
    return b.relevanceScore - a.relevanceScore;
  });
};

// Get materials by specific course
export const getExamMaterialsByCourse = (courseCode: string): ExamMaterial[] => {
  return EXAM_MATERIALS
    .filter(material => material.courseCode === courseCode)
    .sort((a, b) => {
      // High priority items first
      if (a.isHighPriority && !b.isHighPriority) return -1;
      if (!a.isHighPriority && b.isHighPriority) return 1;
      
      // Then by relevance score
      return b.relevanceScore - a.relevanceScore;
    });
};

// Check if material is relevant for current mid-term period
export const isMaterialRelevantNow = (material: ExamMaterial): boolean => {
  const semesterStatus = getCurrentSemesterStatus();
  
  // During mid-terms, show mid-term materials with high relevance
  if (semesterStatus.currentPhase === 'Mid-term Examinations') {
    return (material.examType === 'midterm' || material.examType === 'all') && 
           material.relevanceScore >= 70;
  }
  
  // During regular periods, show all materials
  return true;
};

// Get material statistics for current period
export const getMaterialStats = () => {
  const allMaterials = getCurrentExamMaterials();
  
  return {
    total: allMaterials.length,
    midterm: allMaterials.filter(m => m.examType === 'midterm').length,
    highPriority: allMaterials.filter(m => m.isHighPriority).length,
    currentlyRelevant: allMaterials.filter(m => isMaterialRelevantNow(m)).length
  };
};