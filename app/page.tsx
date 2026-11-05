'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Task } from '../types/task';
import BackgroundOrbs from '../components/BackgroundOrbs';
import StatsRow from '../components/StatsRow';
import TaskForm from '../components/TaskForm';
import TaskCard, { calculateStatus } from '../components/TaskCard';
import { BookOpenCheck, CalendarDays, Inbox, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('deadline', { ascending: true });

      if (error) {
        console.warn('Menggunakan data lokal cadangan:', error.message);
        loadLocalFallback();
      } else if (data && data.length > 0) {
        setTasks(data);
      } else {
        loadLocalFallback();
      }
    } catch (err) {
      console.error('Network error:', err);
      loadLocalFallback();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFallback = () => {
    const saved = localStorage.getItem('tugasku_local_tasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const threeDays = new Date(today);
      threeDays.setDate(today.getDate() + 3);

      const defaults: Task[] = [
        {
          id: 'demo-1',
          subject: 'Matematika',
          detail: 'Kerjakan soal latihan Eksponen Hal 42, No 1-10 beserta caranya.',
          deadline: tomorrow.toISOString().split('T')[0],
          is_completed: false,
          priority: 'high',
        },
        {
          id: 'demo-2',
          subject: 'Fisika',
          detail: 'Membuat ringkasan Hukum Newton I, II, III di buku catatan.',
          deadline: threeDays.toISOString().split('T')[0],
          is_completed: false,
          priority: 'medium',
        },
      ];
      setTasks(defaults);
      localStorage.setItem('tugasku_local_tasks', JSON.stringify(defaults));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTask = async (subject: string, detail: string, deadline: string) => {
    const newTask: Partial<Task> = {
      subject,
      detail,
      deadline,
      is_completed: false,
      priority: 'medium',
    };

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;
      if (data) setTasks((prev) => [data, ...prev]);
      showToast('Tugas baru berhasil disimpan!');
    } catch {
      const localTask: Task = {
        id: 'local_' + Date.now(),
        subject,
        detail,
        deadline,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      const updated = [localTask, ...tasks];
      setTasks(updated);
      localStorage.setItem('tugasku_local_tasks', JSON.stringify(updated));
      showToast('Tugas disimpan secara lokal!');
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_completed: !currentStatus } : t))
      );
      showToast('Status tugas diperbarui!');
    } catch {
      const updated = tasks.map((t) =>
        t.id === id ? { ...t, is_completed: !currentStatus } : t
      );
      setTasks(updated);
      localStorage.setItem('tugasku_local_tasks', JSON.stringify(updated));
      showToast('Status tugas diperbarui!');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('Tugas berhasil dihapus!');
    } catch {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      localStorage.setItem('tugasku_local_tasks', JSON.stringify(updated));
      showToast('Tugas berhasil dihapus!');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const status = calculateStatus(task.deadline, task.is_completed);
    if (filter === 'urgent') return status.isUrgent && !task.is_completed;
    if (filter === 'pending') return !task.is_completed;
    if (filter === 'completed') return task.is_completed;
    return true;
  });

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <main className="min-h-screen px-4 py-7 max-w-lg mx-auto flex flex-col gap-4 relative">
      <BackgroundOrbs />

      {/* Header */}
      <header className="glass-panel p-4 flex items-center justify-between float-slow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <BookOpenCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
              Tugas<span className="text-blue-600">Ku</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              PENGINGAT TUGAS HARIAN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-600 font-medium border border-slate-200">
          <CalendarDays size={13} className="text-blue-600" />
          <span>{todayStr}</span>
        </div>
      </header>

      {/* Statistik */}
      <StatsRow tasks={tasks} />

      {/* Form Input */}
      <TaskForm onAddTask={handleAddTask} />

      {/* Kontrol & Filter Tugas */}
      <div className="flex flex-col gap-2.5 mt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900">Daftar Tugas</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
            {tasks.filter((t) => !t.is_completed).length} aktif
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'urgent', label: '⚠️ Mendesak' },
              { id: 'pending', label: 'Belum Selesai' },
              { id: 'completed', label: 'Selesai' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                filter === item.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* List Kartu */}
      <div className="flex flex-col gap-3 pb-8">
        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-xs">
            Memuat tugas...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-panel p-8 text-center flex flex-col items-center gap-2.5">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Inbox size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada tugas</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Semua tugas telah diselesaikan atau belum ada tugas dalam filter ini.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-fade-in">
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </main>
  );
}
