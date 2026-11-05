'use client';

import { Task, TaskStatus } from '../types/task';
import { Calendar, Check, RotateCcw, Trash2, Flame, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, currentStatus: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function calculateStatus(deadlineStr: string, isCompleted: boolean): TaskStatus {
  if (isCompleted) {
    return {
      urgency: 'completed',
      badgeText: 'Selesai',
      daysDiff: 0,
      isUrgent: false,
    };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [y, m, d] = deadlineStr.split('-').map(Number);
  const deadline = new Date(y, m - 1, d);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      urgency: 'overdue',
      badgeText: `Lewat ${Math.abs(diffDays)} Hari`,
      daysDiff: diffDays,
      isUrgent: true,
    };
  } else if (diffDays === 0) {
    return {
      urgency: 'urgent',
      badgeText: 'Hari ini!',
      daysDiff: 0,
      isUrgent: true,
    };
  } else if (diffDays === 1) {
    return {
      urgency: 'urgent',
      badgeText: 'Besok!',
      daysDiff: 1,
      isUrgent: true,
    };
  } else if (diffDays <= 3) {
    return {
      urgency: 'warning',
      badgeText: `${diffDays} hari lagi`,
      daysDiff: diffDays,
      isUrgent: false,
    };
  } else {
    return {
      urgency: 'safe',
      badgeText: `${diffDays} hari lagi`,
      daysDiff: diffDays,
      isUrgent: false,
    };
  }
}

export default function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const status = calculateStatus(task.deadline, task.is_completed);

  const formatFriendlyDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getUrgencyClass = () => {
    switch (status.urgency) {
      case 'urgent':
        return 'card-urgent';
      case 'warning':
        return 'card-warning';
      case 'overdue':
        return 'card-overdue';
      case 'completed':
        return 'card-completed';
      default:
        return 'card-safe';
    }
  };

  const getBadgeStyle = () => {
    switch (status.urgency) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const renderBadgeIcon = () => {
    switch (status.urgency) {
      case 'urgent':
        return <Flame size={12} className="text-rose-600" />;
      case 'overdue':
        return <AlertTriangle size={12} className="text-red-600" />;
      case 'completed':
        return <CheckCircle2 size={12} className="text-emerald-600" />;
      default:
        return <Clock size={12} className="text-blue-600" />;
    }
  };

  return (
    <div className={`glass-panel p-4 task-card-hover ${getUrgencyClass()}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            status.urgency === 'urgent' 
              ? 'bg-rose-500 ring-4 ring-rose-100' 
              : 'bg-blue-600 ring-4 ring-blue-100'
          }`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {task.subject}
          </h3>
        </div>

        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${getBadgeStyle()}`}>
          {renderBadgeIcon()}
          <span>{status.badgeText}</span>
        </span>
      </div>

      {/* Detail Text */}
      <p className={`text-sm leading-relaxed mb-3 text-slate-700 ${task.is_completed ? 'line-through text-slate-400' : ''}`}>
        {task.detail}
      </p>

      {/* Footer Row */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Calendar size={13} className="text-slate-400" />
          <span>Deadline: {formatFriendlyDate(task.deadline)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Centang Selesai */}
          <button
            onClick={() => onToggle(task.id, task.is_completed)}
            title={task.is_completed ? 'Batalkan Selesai' : 'Tandai Selesai'}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 flex items-center justify-center transition-all cursor-pointer"
          >
            {task.is_completed ? <RotateCcw size={14} /> : <Check size={14} />}
          </button>

          {/* Hapus */}
          <button
            onClick={() => onDelete(task.id)}
            title="Hapus Tugas"
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
