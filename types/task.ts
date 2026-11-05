// Tipe yang sama dengan admin/types/admin.ts (salinan untuk web user)
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
