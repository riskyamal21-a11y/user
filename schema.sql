-- ============================================================
-- Schema Database Supabase: USER APPLICATION (TugasKu)
-- Project: https://rktwutibfgaytygtavfy.supabase.co
-- ============================================================

-- 1. Buat Tabel Tasks Siswa
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    deadline DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Buat Index untuk pencarian cepat berdasarkan deadline & status
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON public.tasks(is_completed);

-- 3. Trigger otomatis update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan Akses (RLS Policies)
-- Mengizinkan pembacaan, penambahan, pengubahan, dan penghapusan data
DROP POLICY IF EXISTS "Allow public read access" ON public.tasks;
CREATE POLICY "Allow public read access" ON public.tasks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.tasks;
CREATE POLICY "Allow public insert access" ON public.tasks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.tasks;
CREATE POLICY "Allow public update access" ON public.tasks
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.tasks;
CREATE POLICY "Allow public delete access" ON public.tasks
    FOR DELETE USING (true);

-- 6. Seed Data Contoh (Mendesak, Menengah, dan Santai)
INSERT INTO public.tasks (subject, detail, deadline, is_completed, priority)
VALUES 
    ('Matematika', 'Kerjakan latihan soal Eksponen hal. 45 no. 1-10 beserta jalannya.', (CURRENT_DATE + INTERVAL '1 day')::DATE, false, 'high'),
    ('Fisika', 'Buat resume rangkuman Hukum Gravitasi Newton di buku catatan.', (CURRENT_DATE + INTERVAL '3 days')::DATE, false, 'medium'),
    ('Bahasa Inggris', 'Dialog presentasi kelompok pemesanan hotel (2 orang).', (CURRENT_DATE + INTERVAL '6 days')::DATE, true, 'low')
ON CONFLICT DO NOTHING;
