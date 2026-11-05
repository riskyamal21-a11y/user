'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Assignment, Submission } from '../types/task';
import BackgroundOrbs from '../components/BackgroundOrbs';
import {
  BookOpen, Upload, CheckCircle2, Clock, Calendar,
  FileText, AlertTriangle, ChevronRight,
  ExternalLink, Inbox, X, Loader2, ArrowUpRight, Check
} from 'lucide-react';

export default function StudentPortal() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Modal pengumpulan tugas
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentNim, setStudentNim] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4500);
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: aData, error: aErr }, { data: sData, error: sErr }] = await Promise.all([
        supabase.from('assignments').select('*').order('deadline', { ascending: true }),
        supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
      ]);
      if (aErr) throw aErr;
      if (sErr) throw sErr;
      if (aData) setAssignments(aData);
      if (sData) setSubmissions(sData);
    } catch (err: any) {
      console.error(err);
      notify('Gagal memuat data dari database: ' + (err.message || 'Cek koneksi'), false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const getDaysLeft = (deadline: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [y, m, d] = deadline.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getSubmission = (assignmentId: string) =>
    submissions.find(s => s.assignment_id === assignmentId);

  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => getSubmission(a.id)).length,
    pending: assignments.filter(a => !getSubmission(a.id) && getDaysLeft(a.deadline) >= 0).length,
    overdue: assignments.filter(a => !getSubmission(a.id) && getDaysLeft(a.deadline) < 0).length,
  };

  // ============================================================
  // SUBMIT TUGAS (UPLOAD FILE KE STORAGE + INSERT SUBMISSION)
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    if (!studentName.trim() || !studentNim.trim()) {
      notify('Harap isi Nama Lengkap dan NIM!', false);
      return;
    }
    if (!file) {
      notify('Harap pilih file tugas untuk diunggah!', false);
      return;
    }

    setUploading(true);

    try {
      // 1. Sanitasi nama file dan buat path unik
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${activeAssignment.id}/${studentNim.trim()}_${Date.now()}_${cleanFileName}`;

      // 2. Upload ke Supabase Storage (bucket: 'submissions')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(
          uploadError.message.includes('row-level security')
            ? 'Storage Policy Supabase belum diaktifkan (RLS). Jalankan query policy di Supabase SQL Editor.'
            : uploadError.message
        );
      }

      // 3. Dapatkan URL publik dari file yang diupload
      const { data: urlData } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;

      // 4. Simpan metadata ke tabel submissions di DB User
      const { data: subData, error: subError } = await supabase
        .from('submissions')
        .insert([
          {
            assignment_id: activeAssignment.id,
            student_name: studentName.trim(),
            student_nim: studentNim.trim(),
            file_url: publicUrl,
            file_name: file.name,
            notes: notes.trim() || null,
          },
        ])
        .select()
        .single();

      if (subError) throw subError;

      // 5. Update state
      setSubmissions(prev => [subData, ...prev.filter(s => s.assignment_id !== activeAssignment.id)]);
      notify(`Tugas "${activeAssignment.title}" berhasil dikumpulkan! ?`, true);
      closeModal();
    } catch (err: any) {
      console.error('Submit error:', err);
      notify(err.message || 'Gagal mengumpulkan tugas', false);
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setActiveAssignment(null);
    setStudentName('');
    setStudentNim('');
    setNotes('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openSubmitModal = (assignment: Assignment) => {
    setActiveAssignment(assignment);
    const existing = getSubmission(assignment.id);
    if (existing) {
      setStudentName(existing.student_name);
      setStudentNim(existing.student_nim);
      setNotes(existing.notes || '');
    }
  };

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto flex flex-col gap-6">
      <BackgroundOrbs />

      {/* Header Bar */}
      <header className="card-clean p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Integrasi Sistem
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Portal Mahasiswa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar pemberian tugas dan pengumpulan berkas perkuliahan
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all self-end sm:self-auto cursor-pointer"
        >
          {loading ? 'Memuat...' : 'Refresh Data'}
        </button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {[
          { label: 'Total Tugas', value: stats.total, color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <BookOpen size={18} /> },
          { label: 'Sudah Dikumpulkan', value: stats.submitted, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={18} /> },
          { label: 'Belum Selesai', value: stats.pending, color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={18} /> },
          { label: 'Terlambat', value: stats.overdue, color: 'text-rose-600 bg-rose-50 border-rose-100', icon: <AlertTriangle size={18} /> },
        ].map((s, i) => (
          <div key={i} className="card-clean p-4.5 flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment List Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Daftar Tugas Perkuliahan</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {assignments.length}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="card-clean p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Memuat data tugas dari database...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="card-clean p-12 text-center flex flex-col items-center justify-center gap-3">
            <Inbox size={42} className="text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Tugas Aktif</p>
            <p className="text-xs text-slate-400 max-w-sm">
              Dosen belum menerbitkan tugas untuk mata kuliah ini. Silakan periksa kembali nanti.
            </p>
          </div>
        ) : (
          assignments.map(item => {
            const daysLeft = getDaysLeft(item.deadline);
            const sub = getSubmission(item.id);
            const isOverdue = daysLeft < 0;

            return (
              <div key={item.id} className="card-clean p-6 flex flex-col gap-4">
                {/* Header item */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {item.title}
                      </h3>

                      {sub ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Check size={12} className="stroke-[3]" /> Sudah Dikumpulkan
                        </span>
                      ) : isOverdue ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle size={12} /> Lewat {Math.abs(daysLeft)} Hari
                        </span>
                      ) : daysLeft === 0 ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock size={12} /> Deadline Hari Ini!
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Clock size={12} /> {daysLeft} Hari Lagi
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Batas Pengumpulan: <strong>{formatDate(item.deadline)}</strong></span>
                    </div>
                  </div>

                  {/* Tombol aksi */}
                  <div className="shrink-0 pt-1 sm:pt-0">
                    <button
                      onClick={() => openSubmitModal(item)}
                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        sub
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'btn-primary'
                      }`}
                    >
                      {sub ? (
                        <>
                          <CheckCircle2 size={14} /> Lihat / Update Pengumpulan
                        </>
                      ) : (
                        <>
                          <Upload size={14} /> Kumpulkan Tugas
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Deskripsi tugas */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {item.description}
                </div>

                {/* File materi/soal lampiran dari dosen jika ada */}
                {item.attachment_url && (
                  <div className="flex items-center gap-2">
                    <a
                      href={item.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      <FileText size={13} />
                      <span>Unduh File Materi / Soal</span>
                      <ArrowUpRight size={13} />
                    </a>
                  </div>
                )}

                {/* Status Pengumpulan jika sudah submit */}
                {sub && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-950">
                          {sub.student_name} <span className="font-normal text-emerald-700">({sub.student_nim})</span>
                        </p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          File: <span className="font-medium underline">{sub.file_name}</span>
                          {sub.notes && ` - "${sub.notes}"`}
                        </p>
                      </div>
                    </div>

                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-[11px] hover:bg-emerald-50 transition-colors self-start sm:self-auto"
                    >
                      <span>Buka Berkas</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* ============================================================ */}
      {/* MODAL FORM PENGUMPULAN TUGAS                                */}
      {/* ============================================================ */}
      {activeAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Form Pengumpulan Tugas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {activeAssignment.title}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Mahasiswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Muhammad Rizky"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIM / NPM <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 21102030"
                    value={studentNim}
                    onChange={e => setStudentNim(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                  />
                </div>
              </div>

              {/* Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Berkas Tugas <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-slate-50/50"
                >
                  {file ? (
                    <div className="flex items-center gap-2.5 text-blue-700 bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-200">
                      <FileText size={18} className="shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold truncate max-w-[240px]">{file.name}</p>
                        <p className="text-[10px] text-blue-500 font-medium">
                          {(file.size / 1024).toFixed(1)} KB - Klik untuk ganti
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          Klik untuk memilih berkas tugas
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Format: PDF, DOC, DOCX, ZIP (Maksimal 25MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.zip,.rar"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan untuk Dosen <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tambahkan catatan atau link demo jika diperlukan..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={uploading}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="flex-1 py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Mengunggah Berkas...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Kirim Tugas Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-xl text-white text-xs font-semibold shadow-2xl transition-all ${
            toast.ok ? 'bg-slate-900' : 'bg-rose-600'
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-white shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}
    </main>
  );
}
