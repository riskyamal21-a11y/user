-- ============================================================
-- DB USER (rktwutibfgaytygtavfy.supabase.co)
-- Diakses: Web User (baca & tulis) + Web Admin (baca & tulis)
-- ============================================================

-- ??  BUAT STORAGE BUCKET MANUAL DI SUPABASE DASHBOARD:
-- Storage ? New Bucket ? Nama: "submissions" ? Public: ON

-- 1. Tabel Tugas (dibuat guru, dibaca siswa)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    deadline DATE NOT NULL,
    attachment_url TEXT DEFAULT NULL,     -- file lampiran dari guru (opsional)
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabel Pengumpulan Tugas Siswa
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    student_nim VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,               -- URL file dari Supabase Storage
    file_name TEXT NOT NULL,              -- Nama file asli
    notes TEXT DEFAULT NULL,              -- Catatan dari siswa
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.assignments(deadline);

-- 4. RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Assignments: siapa pun bisa baca, siapa pun bisa tulis (guru via admin)
DROP POLICY IF EXISTS "Allow all assignments" ON public.assignments;
CREATE POLICY "Allow all assignments" ON public.assignments USING (true) WITH CHECK (true);

-- Submissions: siapa pun bisa baca, siapa pun bisa tulis (siswa via user)
DROP POLICY IF EXISTS "Allow all submissions" ON public.submissions;
CREATE POLICY "Allow all submissions" ON public.submissions USING (true) WITH CHECK (true);

-- 5. Seed contoh tugas
INSERT INTO public.assignments (title, description, deadline) VALUES
    (
        'Laporan Praktikum Integrasi Sistem #1',
        'Buatlah laporan praktikum mengenai konsep integrasi sistem berbasis REST API. Format PDF, minimal 5 halaman, include diagram arsitektur sistem.',
        (CURRENT_DATE + INTERVAL '7 days')::DATE
    ),
    (
        'Resume Materi Middleware',
        'Buat resume singkat (1-2 halaman) tentang pengertian, fungsi, dan contoh middleware dalam sistem terintegrasi. Format bebas (PDF/Word).',
        (CURRENT_DATE + INTERVAL '3 days')::DATE
    )
ON CONFLICT DO NOTHING;
