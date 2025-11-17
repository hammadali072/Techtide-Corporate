import React, { useEffect, useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

export default function YourWork() {
  // Get authenticated user (adjust to your auth method)
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const { tasks, loading, updateTask } = useTasks();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (user) {
      // Only show tasks assigned to this user
      const userTasks = tasks.filter((t) => t.assigneeId === user.uid);
      setFilteredTasks(userTasks);
    } else {
      setFilteredTasks([]);
    }
  }, [user, tasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === "completed").length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 hidden md:block">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <nav className="space-y-2">
          <button
            className={`block w-full text-left px-3 py-2 rounded font-medium ${activeTab === "overview"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
              }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded font-medium ${activeTab === "tasks"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
              }`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
          <button
            className={`block w-full text-left px-3 py-2 rounded font-medium ${activeTab === "settings"
              ? "bg-blue-50 text-blue-600"
              : "hover:bg-gray-100"
              }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === "overview" && (
          <div>
            <h1 className="text-2xl font-semibold mb-4">Overview</h1>
            <Card className="p-6 bg-white shadow-sm rounded-2xl">
              {loading ? (
                <p className="text-gray-500 italic">Loading summary...</p>
              ) : total === 0 ? (
                <p className="text-gray-500 italic">No tasks assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Total Tasks:</span> {total}
                  </p>
                  <p>
                    <span className="font-semibold">Completed:</span> {completed}
                  </p>
                  <p>
                    <span className="font-semibold">Pending:</span> {total - completed}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "tasks" && (
          <div>
            <h1 className="text-2xl font-semibold mb-6">Your Tasks</h1>
            <Card className="p-4 rounded-2xl shadow-sm border bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="px-4 py-2 font-semibold">Title</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-6 italic"
                        >
                          Loading tasks...
                        </td>
                      </tr>
                    ) : filteredTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center text-gray-500 py-6 italic"
                        >
                          No tasks assigned to you.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => (
                        <tr key={task.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{task.title}</td>
                          <td className="px-4 py-2 text-gray-600">
                            {task.desc || "—"}
                          </td>
                          <td className="px-4 py-2 capitalize">{task.status}</td>
                          <td className="px-4 py-2">
                            {task.status !== "completed" ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateTask(task.id, { status: "completed" })
                                }
                              >
                                Mark Complete
                              </Button>
                            ) : (
                              <span className="text-green-600 font-medium text-sm">
                                ✅ Done
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="p-8">
            <h1 className="text-3xl font-semibold text-gray-800 mb-6">Settings</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600">Settings page content goes here...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
