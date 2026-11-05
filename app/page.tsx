'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Assignment, Submission } from '../types/task';
import BackgroundOrbs from '../components/BackgroundOrbs';
import {
  BookOpen, Upload, CheckCircle2, Clock, Calendar,
  FileText, AlertTriangle, ChevronDown, ChevronUp,
  ExternalLink, Inbox, X, Loader2
} from 'lucide-react';

export default function StudentPortal() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Expanded assignment card
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Submit form state
  const [submitId, setSubmitId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentNim, setStudentNim] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================================
  // FETCH
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: aData }, { data: sData }] = await Promise.all([
        supabase.from('assignments').select('*').order('deadline', { ascending: true }),
        supabase.from('submissions').select('*'),
      ]);
      if (aData) setAssignments(aData);
      if (sData) setSubmissions(sData);
    } catch {
      notify('Gagal memuat data. Cek koneksi.', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const getDaysLeft = (deadline: string) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const [y, m, d] = deadline.split('-').map(Number);
    return Math.ceil((new Date(y, m - 1, d).getTime() - now.getTime()) / 86400000);
  };

  const formatDate = (d: string) => {
    try {
      const [y, m, day] = d.split('-');
      return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return d; }
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
  // SUBMIT TUGAS
  // ============================================================
  const handleSubmit = async (e: React.FormEvent, assignmentId: string) => {
    e.preventDefault();
    if (!file || !studentName || !studentNim) return;

    setUploading(true);
    try {
      // 1. Upload file ke Supabase Storage
      const filePath = `${assignmentId}/${studentNim}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback: simpan tanpa file URL jika bucket belum dibuat
        console.warn('Storage upload failed, saving without file URL:', uploadError.message);
        notify('? Bucket storage belum dibuat di Supabase, hubungi admin.', false);
        setUploading(false);
        return;
      }

      // 2. Dapatkan public URL
      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(uploadData.path);

      // 3. Simpan ke tabel submissions
      const { data, error } = await supabase
        .from('submissions')
        .insert([{
          assignment_id: assignmentId,
          student_name: studentName,
          student_nim: studentNim,
          file_url: publicUrl,
          file_name: file.name,
          notes: notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setSubmissions(prev => [...prev, data]);
      notify(`Tugas berhasil dikumpulkan! ?`);
      resetForm();
    } catch (err: any) {
      notify('Gagal mengumpulkan: ' + err.message, false);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSubmitId(null);
    setStudentName('');
    setStudentNim('');
    setNotes('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="min-h-screen px-4 md:px-8 py-8 max-w-3xl mx-auto relative flex flex-col gap-6">
      <BackgroundOrbs />

      {/* Header */}
      <header className="glass px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Integrasi Sistem<span className="text-blue-600"> - Portal Siswa</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Lihat & kumpulkan tugas mata kuliah</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Tugas', value: stats.total, color: 'blue', icon: <BookOpen size={16} /> },
          { label: 'Sudah Dikumpulkan', value: stats.submitted, color: 'emerald', icon: <CheckCircle2 size={16} /> },
          { label: 'Belum Dikumpulkan', value: stats.pending, color: 'amber', icon: <Clock size={16} /> },
          { label: 'Terlambat', value: stats.overdue, color: 'rose', icon: <AlertTriangle size={16} /> },
        ].map((s, i) => (
          <div key={i} className="glass p-4 card-hover flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
              ${s.color === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-100' : ''}
              ${s.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : ''}
              ${s.color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' : ''}
              ${s.color === 'rose' ? 'bg-rose-50 text-rose-600 border border-rose-100' : ''}
            `}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Assignment List */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-slate-700 px-1">Daftar Tugas</h2>

        {loading ? (
          <div className="glass p-10 text-center flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Memuat tugas...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="glass p-10 text-center flex flex-col items-center gap-3">
            <Inbox size={36} className="text-slate-300" />
            <p className="text-slate-500 text-sm">Belum ada tugas yang diterbitkan guru.</p>
          </div>
        ) : assignments.map(a => {
          const dl = getDaysLeft(a.deadline);
          const sub = getSubmission(a.id);
          const isExpanded = expandedId === a.id;
          const isSubmitOpen = submitId === a.id;

          return (
            <div key={a.id} className="glass card-hover overflow-hidden">
              {/* Card Header */}
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                      {sub ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Sudah Dikumpulkan
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          dl < 0 ? 'bg-red-50 text-red-700 border-red-200' :
                          dl === 0 ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          dl <= 3 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {dl < 0 ? `Lewat ${Math.abs(dl)} hari` : dl === 0 ? 'Hari ini!' : `${dl} hari lagi`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar size={12} />
                      <span>Deadline: {formatDate(a.deadline)}</span>
                    </div>
                  </div>
                  <div className="text-slate-400 shrink-0 mt-0.5">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed mt-4 mb-4">{a.description}</p>

                  {a.attachment_url && (
                    <a
                      href={a.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mb-4 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-all"
                    >
                      <FileText size={13} /> Unduh File Soal <ExternalLink size={11} />
                    </a>
                  )}

                  {/* Already submitted */}
                  {sub ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Tugas Sudah Dikumpulkan
                      </p>
                      <div className="space-y-1 text-xs text-emerald-700">
                        <p>Nama: <strong>{sub.student_name}</strong></p>
                        <p>NIM: <strong>{sub.student_nim}</strong></p>
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline font-medium"
                        >
                          <FileText size={12} /> {sub.file_name} <ExternalLink size={10} />
                        </a>
                        {sub.notes && <p className="italic text-emerald-600">Catatan: {sub.notes}</p>}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Submit Button */}
                      {!isSubmitOpen ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSubmitId(a.id); }}
                          disabled={dl < 0}
                          className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            dl < 0
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'glow-btn text-white'
                          }`}
                        >
                          <Upload size={15} />
                          {dl < 0 ? 'Deadline Telah Lewat' : 'Kumpulkan Tugas'}
                        </button>
                      ) : (
                        /* Submit Form */
                        <form
                          onSubmit={(e) => handleSubmit(e, a.id)}
                          className="space-y-3 mt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-slate-700">Form Pengumpulan Tugas</p>
                            <button
                              type="button"
                              onClick={resetForm}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
                              <input
                                type="text"
                                placeholder="Nama Lengkap"
                                value={studentName}
                                onChange={e => setStudentName(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">NIM *</label>
                              <input
                                type="text"
                                placeholder="Nomor Induk"
                                value={studentNim}
                                onChange={e => setStudentNim(e.target.value)}
                                required
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">File Tugas * (PDF / DOC / DOCX)</label>
                            <div
                              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              {file ? (
                                <div className="flex items-center justify-center gap-2 text-blue-600">
                                  <FileText size={16} />
                                  <span className="text-xs font-semibold truncate max-w-[200px]">{file.name}</span>
                                  <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                  <Upload size={20} />
                                  <p className="text-xs">Klik untuk pilih file</p>
                                  <p className="text-[10px]">PDF, DOC, DOCX - maks 10 MB</p>
                                </div>
                              )}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                              className="hidden"
                              onChange={e => setFile(e.target.files?.[0] ?? null)}
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan (opsional)</label>
                            <textarea
                              rows={2}
                              placeholder="Tambahan keterangan untuk guru..."
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={resetForm}
                              className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={uploading || !file}
                              className="flex-1 py-2.5 rounded-xl glow-btn text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                            >
                              {uploading ? (
                                <><Loader2 size={14} className="animate-spin" /> Mengunggah...</>
                              ) : (
                                <><Upload size={14} /> Kumpulkan</>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-semibold shadow-xl ${toast.ok ? 'bg-slate-900' : 'bg-rose-700'}`}>
          {toast.ok ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </main>
  );
}
