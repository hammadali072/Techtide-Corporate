import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/firebase";
import { ref, get, child, push, set } from "firebase/database";
import { ref as dbRef, onValue } from "firebase/database";
import { useTasks } from "@/hooks/use-tasks";
import { useNotifications } from "@/hooks/use-notifications";
import siteLogo from "@/assets/brand-logo-dark.svg";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import TaskDetail from "./TaskDetail";
import { X, Plus } from "lucide-react";
import { signOut } from "firebase/auth";
import { NotificationMenu } from "@/components/ui/notification-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const MyTasks: React.FC = () => {
  const { tasks, loading, updateTask } = useTasks();
  const { notifyAdminsAboutUserTask } = useNotifications(); // Updated import
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Function to check if a date falls within the selected range
  const isDateInRange = (dateStr: string) => {
    if (!dateStr || filterDateRange === "all") return true;

    const taskDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filterDateRange) {
      case "today":
        return taskDate.toDateString() === today.toDateString();
      case "tomorrow":
        return taskDate.toDateString() === tomorrow.toDateString();
      case "yesterday":
        return taskDate.toDateString() === yesterday.toDateString();
      case "thisWeek": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      }
      case "lastWeek": {
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return taskDate >= startOfLastWeek && taskDate <= endOfLastWeek;
      }
      default:
        return true;
    }
  };

  // Subscribe to auth state once and mark when auth has been checked so we
  // don't redirect while Firebase is still initializing (which would send
  // users back to "/" on page refresh even if they're signed-in).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCurrentUserName(u ? u.displayName || u.email || "User" : null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Only redirect to / when we've confirmed auth and there is no user.
  useEffect(() => {
    if (authChecked && user === null) navigate("/", { replace: true });
  }, [authChecked, user, navigate]);

  const assignedTasks = user
    ? tasks.filter((t) => {
        // First filter by assignee
        const isAssigned = t.assigneeId === user.uid;
        if (!isAssigned) return false;

        // Then filter by status
        const statusMatch = filterStatus === "all" || t.status === filterStatus;
        if (!statusMatch) return false; // Finally filter by date range
        return isDateInRange(t.endDate);
      })
    : [];
  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  const total = assignedTasks.length;
  const completed = assignedTasks.filter(
    (t) => t.status === "completed"
  ).length;

  const openTaskModal = (taskId: string) => setSelectedTaskId(taskId);
  const closeTaskModal = () => setSelectedTaskId(null);

  const handleAddTask = async () => {
    if (!user || !newTask.title.trim()) return;

    try {
      const taskId = push(ref(db, 'tasks')).key;
      const taskData = {
        id: taskId,
        title: newTask.title,
        desc: newTask.description,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        assigneeId: user.uid,
        assigneeName: user.displayName || user.email || "User",
        status: "completed",
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        createdByUser: true,
      };

      await set(ref(db, `tasks/${taskId}`), taskData);
      
      // 🔔 UPDATED: Use the specialized function to notify admins
      try {
        // Get all users to find admins
        const usersRef = dbRef(db, 'users');
        const usersSnapshot = await get(usersRef);
        if (usersSnapshot.exists()) {
          const users = usersSnapshot.val();
          
          // Find all admin users
          const adminUsers = Object.entries(users)
            .filter(([userId, userData]: [string, any]) => userData.role === 'admin')
            .map(([userId]) => userId);
          
          // Use the new specialized function
          if (adminUsers.length > 0 && taskId) {
            await notifyAdminsAboutUserTask(adminUsers, {
              taskId: taskId,
              taskTitle: newTask.title,
              userId: user.uid,
              userName: user.displayName || user.email || "User",
            });
            
            console.log(`Notified ${adminUsers.length} admin(s) about the new user-created task`);
          }
        }
      } catch (notificationError) {
        console.error("Failed to send notification to admin:", notificationError);
        // Don't block the task creation if notification fails
      }

      // Reset form and close modal
      setNewTask({ title: "", description: "", startDate: "", endDate: "" });
      setShowAddTaskModal(false);
      
      alert("Task added successfully!");
      
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Error adding task. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between`}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-center h-20 border-b">
            <a href="/">
              <img
                src={siteLogo}
                alt="Office Logo"
                className="xl:w-48 w-40 h-auto object-contain drop-shadow-lg"
              />
            </a>
          </div>

          <nav className="flex-1 py-6 px-4 space-y-2">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${
                activeTab === "tasks"
                  ? "bg-rose-100 text-rose-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
              onClick={() => setActiveTab("tasks")}
            >
              Tasks
            </button>
          </nav>
        </div>

        <div className="px-6 py-3 bg-white border-t">
          <div className="relative">
            <button
              className="w-full flex justify-between items-center gap-3 px-3 py-2 bg-white rounded hover:bg-gray-50"
              onClick={() => {
                const el = document.getElementById("user-dropdown");
                if (el) el.classList.toggle("hidden");
              }}
            >
              <span className="text-sm font-medium text-gray-700">
                {currentUserName || "User"}
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              id="user-dropdown"
              className="hidden absolute left-0 bottom-14 w-full bg-white border rounded overflow-hidden shadow-lg z-40"
            >
              <Link
                to="/admin-dashboard"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Admin Dashboard
              </Link>
              <Link
                to="/my-tasks"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                My Tasks
              </Link>
              <button
                onClick={async () => {
                  await signOut(auth);
                  window.location.href = "/";
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {activeTab === "overview" && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Overview
                </h1>
                <p className="text-gray-600 mt-1">
                  Your task summary and progress
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Last updated: Just now</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="p-6 bg-white shadow-sm rounded-2xl border-b-4 border-b-blue-500 hover:shadow-lg duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Total Tasks
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? "..." : total}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  All assigned tasks
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-sm rounded-2xl border-b-4 border-b-green-500 hover:shadow-lg duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? "..." : completed}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-sm rounded-2xl border-b-4 border-b-orange-500 hover:shadow-lg duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      Pending
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {loading ? "..." : total - completed}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-full">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Your Tasks</h1>
              <div className="flex gap-4 items-center">
                {/* Add Task Button */}
                <Button 
                  onClick={() => setShowAddTaskModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Task
                </Button>

                {/* Notification: show bell aligned with status filter */}
                {user && (
                  <div className="hidden sm:block">
                    <NotificationMenu />
                  </div>
                )}
                <select
                  className="px-3 py-2 border rounded-lg text-sm"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  value={filterStatus}
                >
                  <option value="all">All Status</option>
                  <option value="working">Working</option>
                  <option value="completed">Completed</option>
                  <option value="solved">Solved</option>
                  <option value="error">Error</option>
                  <option value="cancel">Cancel</option>
                </select>
                <select
                  className="px-3 py-2 border rounded-lg text-sm"
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  value={filterDateRange}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                </select>
              </div>
            </div>
            <Card className="overflow-hidden rounded-2xl shadow-sm border bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="px-4 py-2 font-semibold">Title</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold">Status</th>
                      <th className="px-4 py-2 font-semibold">Start Date</th>
                      <th className="px-4 py-2 font-semibold">Deadline</th>
                      <th className="px-4 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-gray-500 py-6 italic"
                        >
                          Loading tasks...
                        </td>
                      </tr>
                    ) : assignedTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center text-gray-500 py-6 italic"
                        >
                          No tasks assigned to you.
                        </td>
                      </tr>
                    ) : (
                      assignedTasks.map((task) => {
                        const statusMap: Record<string, string> = {
                          working: "bg-yellow-100 text-yellow-800",
                          completed: "bg-green-100 text-green-800",
                          solved: "bg-blue-100 text-blue-800",
                          error: "bg-red-100 text-red-800",
                          cancel: "bg-gray-100 text-gray-800",
                        };
                        return (
                          <tr
                            key={task.id}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => openTaskModal(task.id)}
                          >
                            <td className="px-4 py-2">{task.title}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {(task.desc || "")
                                .split(" ")
                                .slice(0, 8)
                                .join(" ") +
                                ((task.desc || "").split(" ").length > 8
                                  ? "..."
                                  : "")}
                            </td>
                            <td className={"px-4 py-2 capitalize"}>
                              <p
                                className={`text-sm inline rounded-full px-2 py-1 ${
                                  statusMap[task.status]
                                }`}
                              >
                                {task.status}
                              </p>
                            </td>
                            <td className="px-4 py-2 capitalize">
                              {task.startDate || "-"}
                            </td>
                            <td className="px-4 py-2 capitalize">
                              {task.endDate}
                            </td>
                            <td className="px-4 py-2">
                              {task.status === "completed" ? (
                                <span className="text-green-600 font-medium text-sm">
                                  ✅ Done
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTask(task.id, {
                                      status: "completed",
                                    });
                                  }}
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold">Add New Task</h2>
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddTask}
                  disabled={!newTask.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add Task
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold">Task Details</h2>
              <button
                onClick={closeTaskModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {selectedTask ? (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                      {selectedTask.title}
                    </h1>
                    <div className="inline-block">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedTask.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : selectedTask.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedTask.status.charAt(0).toUpperCase() +
                          selectedTask.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedTask.desc || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border">
                      <div className="text-gray-500 text-sm font-medium">
                        Assigned To
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {selectedTask.assigneeName || "—"}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border">
                      <div className="text-gray-500 text-sm font-medium">
                        Start Date
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {selectedTask.startDate || "—"}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border">
                      <div className="text-gray-500 text-sm font-medium">
                        Deadline
                      </div>
                      <div className="text-lg font-semibold mt-1">
                        {selectedTask.endDate || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {selectedTask.status !== "completed" ? (
                      <Button
                        onClick={() => {
                          updateTask(selectedTask.id, { status: "completed" });
                          closeTaskModal();
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark Complete
                      </Button>
                    ) : (
                      <div className="text-green-600 font-medium flex items-center">
                        ✅ Task Completed
                      </div>
                    )}
                    <Button variant="outline" onClick={closeTaskModal}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Task not found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;