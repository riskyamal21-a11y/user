'use client';

import { ListCheck, Flame, CheckCircle2 } from 'lucide-react';
import { Task } from '../types/task';

interface StatsRowProps {
  tasks: Task[];
}

export default function StatsRow({ tasks }: StatsRowProps) {
  const total = tasks.length;
  const done = tasks.filter(t => t.is_completed).length;

  const urgentCount = tasks.filter(t => {
    if (t.is_completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [y, m, d] = t.deadline.split('-').map(Number);
    const deadline = new Date(y, m - 1, d);
    deadline.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  }).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="glass-panel p-3.5 flex items-center gap-3 float-motion">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
          <ListCheck size={19} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Total Tugas</p>
          <p className="text-base font-bold text-slate-900 leading-tight">{total}</p>
        </div>
      </div>

      <div className="glass-panel p-3.5 flex items-center gap-3 float-motion [animation-delay:1.2s]">
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
          <Flame size={19} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Mendesak</p>
          <p className="text-base font-bold text-rose-600 leading-tight">{urgentCount}</p>
        </div>
      </div>

      <div className="glass-panel p-3.5 flex items-center gap-3 float-motion [animation-delay:2.4s]">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={19} />
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium">Selesai</p>
          <p className="text-base font-bold text-emerald-600 leading-tight">{done}</p>
        </div>
      </div>
    </div>
  );
}
