'use client';

import { useState } from 'react';
import { Sparkles, BookOpen, PenTool, Calendar, Plus, Loader2 } from 'lucide-react';

interface TaskFormProps {
  onAddTask: (subject: string, detail: string, deadline: string) => Promise<void>;
}

export default function TaskForm({ onAddTask }: TaskFormProps) {
  const [subject, setSubject] = useState('');
  const [detail, setDetail] = useState('');
  const [deadline, setDeadline] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !detail.trim() || !deadline) return;

    setLoading(true);
    try {
      await onAddTask(subject.trim(), detail.trim(), deadline);
      setSubject('');
      setDetail('');
      setDeadline(new Date().toISOString().split('T')[0]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5 relative overflow-hidden float-slow">
      {/* Top subtle highlight border */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />

      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-600" size={17} />
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">Tambah Tugas Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Mata Pelajaran */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
            <BookOpen size={14} className="text-blue-600" />
            <span>Mata Pelajaran</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Matematika, Fisika, B. Inggris"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
          />
        </div>

        {/* Detail Tugas */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
            <PenTool size={14} className="text-blue-600" />
            <span>Detail Tugas</span>
          </label>
          <textarea
            rows={2}
            placeholder="Contoh: Kerjakan latihan soal Bab 4 No. 1-10"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm resize-none"
          />
        </div>

        {/* Tanggal Deadline */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
            <Calendar size={14} className="text-blue-600" />
            <span>Tanggal Deadline</span>
          </label>
          <input
            type="date"
            value={deadline}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer"
          />
        </div>

        {/* Tombol Simpan */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-xl btn-primary font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          <span>{loading ? 'Menyimpan...' : 'Simpan Tugas'}</span>
        </button>
      </form>
    </div>
  );
}
