// Tipe Assignment & Submission untuk web user
export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  attachment_url?: string | null;
  created_at?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  student_nim: string;
  file_url: string;
  file_name: string;
  notes?: string | null;
  submitted_at?: string;
}

// Tipe legacy untuk kompatibilitas komponen
export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  is_completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
}

export interface TaskStatus {
  urgency: 'overdue' | 'urgent' | 'warning' | 'normal' | 'completed';
  badgeText: string;
  daysDiff: number;
  isUrgent: boolean;
}
