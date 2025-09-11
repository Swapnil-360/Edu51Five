export interface Intake {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Section {
  id: string;
  intake_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Course {
  id: string;
  section_id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

export interface Material {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'doc' | 'video' | 'suggestion' | 'past_question';
  file_url?: string;
  video_url?: string;
  description?: string;
  created_at: string;
}

export interface SearchResult {
  type: 'course' | 'material';
  id: string;
  title: string;
  subtitle: string;
  path: string;
}