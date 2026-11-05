export interface Task {
  id: string;
  subject: string;
  detail: string;
  deadline: string; // YYYY-MM-DD
  is_completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  created_at?: string;
  updated_at?: string;
}

export type UrgencyType = 'urgent' | 'warning' | 'safe' | 'overdue' | 'completed';

export interface TaskStatus {
  urgency: UrgencyType;
  badgeText: string;
  daysDiff: number;
  isUrgent: boolean;
}
