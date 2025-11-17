import React from 'react';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';

type Status = 'done' | 'in-progress' | 'blocked' | string;

const statusMap: Record<Status, { color: string; label: string; Icon: any }> = {
  done: { color: 'bg-emerald-100 text-emerald-800', label: 'Done', Icon: CheckCircleIcon },
  'in-progress': { color: 'bg-amber-100 text-amber-800', label: 'In Progress', Icon: ClockIcon },
  blocked: { color: 'bg-rose-100 text-rose-800', label: 'Blocked', Icon: XCircleIcon },
};

interface Props {
  status?: string;
}

const TaskStatus: React.FC<Props> = ({ status = 'in-progress' }) => {
  const key = (status || '').toLowerCase();
  const s = statusMap[key] || { color: 'bg-slate-100 text-slate-800', label: status, Icon: ClockIcon };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${s.color} font-medium text-sm`}>
      <s.Icon className="w-4 h-4" />
      <span>{s.label}</span>
    </div>
  );
};

export default TaskStatus;
