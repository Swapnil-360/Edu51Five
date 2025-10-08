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
  course_code: string;
  course_name?: string;
  title: string;
  type: 'pdf' | 'doc' | 'video' | 'suggestion' | 'past_question';
  category: 'notes' | 'suggestions' | 'super-tips' | 'slides' | 'ct-questions' | 'videos' | 'other';
  file_url: string | null;
  video_url?: string;
  description?: string;
  exam_period?: 'midterm' | 'final'; // Added for exam period separation
  created_at: string;
  size?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'random' | 'exam' | 'event' | 'information' | 'academic' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  exam_type?: 'midterm' | 'final' | null;
  event_date?: string;
  is_active: boolean;
  created_at: string;
}

export interface SearchResult {
  type: 'course' | 'material';
  id: string;
  title: string;
  subtitle: string;
  path: string;
}