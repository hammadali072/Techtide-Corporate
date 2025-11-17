import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTasks } from "@/hooks/use-tasks";
import TaskStatus from "@/components/ui/task-status";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks: dbTasks, loading } = useTasks();

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="text-lg animate-pulse">Loading task details...</div>
      </div>
    );

  const task = dbTasks.find((t) => t.id === id);

  if (!task) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <h2 className="text-3xl font-semibold mb-3">Task Not Found</h2>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          The requested task doesn’t exist or may have been removed.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition-all duration-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full  p-6 pt-24 text-gray-700">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">

          <TaskStatus status={task.status} />
        </div>

        {/* Title & Description */}

        {/* Details Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <div className="p-4 rounded-xl bg-gray-200 border border-white/10 hover:bg-white/10 transition">
            <div className="text-gray-400 text-sm">Budget</div>

          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
            <div className="text-gray-400 text-sm">Assigned To</div>
            <div className="text-lg font-semibold mt-1">
              {task.assigneeName || "—"}
            </div>
          </div>
        </div>
        <p className="mt-3 text-black text-lg leading-relaxed">{task.desc}</p>
      </motion.div>
    </div>
  );
};

export default TaskDetail;
