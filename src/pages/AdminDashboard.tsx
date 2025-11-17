import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, child } from "firebase/database";
import { ref as dbRef, onValue } from "firebase/database";
import { signOut } from "firebase/auth";
import { useTasks } from "@/hooks/use-tasks";
import { useNotifications } from "@/hooks/use-notifications";
import AllUsersTab from "./AllUsersTab";
import AddServiceTab from "./AddServiceTab";
import JobApplyTab from "./JobApplyTab";
import InternshipApplyTab from "./InternshipApplyTab";
import MessageUserTab from "./MessageUserTab";
import AddBlog from "./AddBlog";
import OfficeMembersTab from "./OfficeMembersTab";
// NotificationMenu removed from here — now shown in the global Navigation bar
import siteLogo from "@/assets/brand-logo-dark.svg";
import CostManager from "./CostManager";


const AdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "service"
    | "job"
    | "internship"
    | "message"
    | "blog"
    | "office"
    | "tasks"
    | "costManager"
  >("users");

  // Notifications hook
  const { createNotification } = useNotifications();

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskEndDate, setTaskEndDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState(""); // office member id
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const nextTaskId = useRef(1);
  const {
    tasks: dbTasks,
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const [officeMembers, setOfficeMembers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [siteUsers, setSiteUsers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // Task Filters (declare hooks at top level so hooks order is stable)
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("all"); // all, today, yesterday, thisWeek, lastWeek, thisMonth

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setCurrentUserName(u.displayName || u.email || "User");
      else setCurrentUserName(null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/", { replace: true });
        return;
      }
      const userSnap = await get(child(ref(db), `users/${user.uid}`));
      if (userSnap.exists() && userSnap.val().role === "admin") {
        setIsAdmin(true);
      } else {
        navigate("/", { replace: true });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  // subscribe to officeMembers for assignee dropdown
  useEffect(() => {
    const membersRef = dbRef(db, "officeMembers");
    const unsub = onValue(membersRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, m]: any) => ({
          id,
          name: m.name,
        }));
        setOfficeMembers(list.reverse());
      } else setOfficeMembers([]);
    });
    return () => unsub();
  }, []);

  // subscribe to site users so we can assign tasks to any registered user
  useEffect(() => {
    const usersRef = dbRef(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, u]: any) => ({
          id,
          name: u.name || u.displayName || u.email || id,
        }));
        setSiteUsers(list.reverse());
      } else setSiteUsers([]);
    });
    return () => unsub();
  }, []);

  // In your AdminDashboard component, add this useEffect
  useEffect(() => {
    const adminNotificationsRef = dbRef(db, 'adminNotifications');
    const unsub = onValue(adminNotificationsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const notifications = Object.entries(data).map(([id, n]: [string, any]) => ({
          id,
          ...n,
        }));
        // Handle the notifications (you can set them in state)
        console.log('Admin notifications:', notifications);
      }
    });
    return () => unsub();
  }, []);
  // no local mirror needed, we render directly from dbTasks

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg sm:text-xl text-gray-600">
          Checking admin access...
        </div>
      </div>
    );
  }
  if (!isAdmin) return null;

  // Apply filters to dbTasks
  const filteredTasks = dbTasks.filter((t: any) => {
    // Status filter
    if (filterStatus && (t.status || "") !== filterStatus) return false;

    // Assignee filter (support different possible fields)
    const assigneeId = t.officeAssigneeId || t.assigneeId || "";
    if (filterAssignee && assigneeId !== filterAssignee) return false;

    // Date range filtering with preset ranges
    if (filterDateRange !== "all") {
      const taskStart = t.startDate ? new Date(t.startDate) : null;
      const taskEnd = t.endDate ? new Date(t.endDate) : null;

      // If task has no dates, exclude when date filter is active
      if (!taskStart && !taskEnd) return false;

      // normalize task range: if only one date exists, use it for both ends
      const aStart = taskStart || taskEnd!;
      const aEnd = taskEnd || taskStart!;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday = 0
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Date range checks
      switch (filterDateRange) {
        case "today":
          if (
            aEnd < today ||
            aStart > new Date(today.getTime() + 24 * 60 * 60 * 1000)
          )
            return false;
          break;
        case "yesterday":
          if (
            aEnd < yesterday ||
            aStart > new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
          )
            return false;
          break;
        case "thisWeek":
          if (aEnd < startOfWeek || aStart > endOfWeek) return false;
          break;
        case "lastWeek":
          if (aEnd < startOfLastWeek || aStart > endOfLastWeek) return false;
          break;
        case "thisMonth":
          if (aEnd < startOfMonth || aStart > endOfMonth) return false;
          break;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg overflow-scroll no-scrollbar transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 md:sticky md:top-0 md:h-screen flex flex-col justify-between`}
      >
        <div className="flex flex-col">
          {/* Logo Section */}
          <div className="flex items-center justify-center h-20 border-b">
            <a href="/">
              <img
                src={siteLogo}
                alt="Office Logo"
                className="xl:w-48 w-40 h-auto object-contain drop-shadow-lg"
              />
            </a>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 py-6 px-4 space-y-2">
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "users"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("users")}
            >
              All Users
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "tasks"
                ? "bg-rose-100 text-rose-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("tasks")}
            >
              Task Management
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "service"
                ? "bg-green-100 text-green-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("service")}
            >
              Add Service
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "office"
                ? "bg-pink-100 text-pink-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("office")}
            >
              Office Members
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "job"
                ? "bg-indigo-100 text-indigo-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("job")}
            >
              Job Apply
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "blog"
                ? "bg-teal-100 text-teal-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("blog")}
            >
              Add Blog
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "internship"
                ? "bg-purple-100 text-purple-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("internship")}
            >
              Internship Apply
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "message"
                ? "bg-yellow-100 text-yellow-800"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("message")}
            >
              Message User
            </button>
            <button
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-base md:text-lg transition-colors ${activeTab === "costManager"
                ? "bg-orange-100 text-orange-700"
                : "hover:bg-gray-100 text-gray-700"
                }`}
              onClick={() => setActiveTab("costManager")}
            >
              Cost Manager
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
              className="hidden absolute left-0 bottom-14 w-full bg-white border rounded shadow-lg z-40"
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

      {/* Overlay (for mobile sidebar) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar intentionally left empty; notifications are shown in the global navbar */}
        {/* Active Tab Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <AllUsersTab />
            </div>
          )}
          {activeTab === "service" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <AddServiceTab />
            </div>
          )}
          {activeTab === "job" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <JobApplyTab />
            </div>
          )}
          {activeTab === "internship" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <InternshipApplyTab />
            </div>
          )}
          {activeTab === "blog" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <AddBlog />
            </div>
          )}
          {activeTab === "tasks" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Task Management</h2>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="px-3 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                >
                  Add New Task
                </button>
              </div>
              {/* ✅ Filter Bar UI */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5 p-3 rounded border bg-gray-50">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">All Status</option>
                  <option value="working">Working</option>
                  <option value="completed">Completed</option>
                  <option value="solved">Solved</option>
                  <option value="error">Error</option>
                  <option value="cancel">Cancel</option>
                </select>

                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">All Members</option>
                  {officeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="thisWeek">This Week</option>
                  <option value="lastWeek">Last Week</option>
                  <option value="thisMonth">This Month</option>
                </select>
              </div>

              {dbTasks.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No tasks yet. Click "Add New Task" to create one.
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No tasks match the selected filters.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredTasks.map((t) => {
                    // status color mapping
                    const status = t.status || "working";
                    const statusMap: Record<string, string> = {
                      working: "bg-yellow-100 text-yellow-800",
                      completed: "bg-green-100 text-green-800",
                      solved: "bg-blue-100 text-blue-800",
                      error: "bg-red-100 text-red-800",
                      cancel: "bg-gray-100 text-gray-800",
                    };
                    const badgeClass =
                      statusMap[status] || "bg-gray-100 text-gray-800";

                    return (
                      <div
                        key={t.id}
                        className="w-full bg-white rounded-lg shadow p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">
                              Assigned to:{" "}
                              <span className="font-semibold">
                                {t.assigneeName || "-"}
                              </span>
                            </div>
                            <div className="font-bold text-xl mt-1">
                              {t.title}
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {t.desc.slice(0, 100)}...
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div
                              className={`w-fit px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}
                            >
                              {status}
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                              Dates:{" "}
                              <span className="font-semibold">
                                {t.startDate || "-"}
                                {t.endDate ? ` — ${t.endDate}` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600">
                              Change status
                            </label>
                            <select
                              value={t.status || "working"}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                try {
                                  await updateTask(t.id, { status: newStatus });
                                  // Force refresh the task's status in the UI
                                  const updatedTask = {
                                    ...t,
                                    status: newStatus,
                                  };
                                  const taskIndex = dbTasks.findIndex(
                                    (task) => task.id === t.id
                                  );
                                  if (taskIndex !== -1) {
                                    dbTasks[taskIndex] = updatedTask;
                                  }
                                } catch (err) {
                                  console.error(
                                    "Failed to update task status:",
                                    err
                                  );
                                  alert(
                                    "Failed to update task status. Please try again."
                                  );
                                }
                              }}
                              className="border rounded px-3 py-1 bg-white"
                            >
                              <option value="working">Working</option>
                              <option value="completed">Completed</option>
                              <option value="solved">Solved</option>
                              <option value="error">Error</option>
                              <option value="cancel">Cancel</option>
                            </select>
                          </div>
                          <div className="flex gap-x-2">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm"
                              onClick={() => {
                                setEditTaskId(t.id);
                                setTaskTitle(t.title);
                                setTaskDesc(t.desc || "");
                                setTaskStartDate(t.startDate || "");
                                setTaskEndDate(t.endDate || "");
                                setTaskAssignee(
                                  t.officeAssigneeId || t.assigneeId || ""
                                );
                                setTaskModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm"
                              onClick={async () => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this task?"
                                  )
                                ) {
                                  try {
                                    await deleteTask(t.id);
                                  } catch (err) {
                                    alert("Failed to delete task.");
                                  }
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === "office" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <OfficeMembersTab />
            </div>
          )}
          {activeTab === "message" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <MessageUserTab />
            </div>
          )}
          {/* Add Cost Manager Tab Content */}
          {activeTab === "costManager" && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <CostManager />
            </div>
          )}
        </div>
      </div>
      {/* Task Modal (portal) */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setTaskModalOpen(false)}
          />
          <div className="bg-white rounded-lg shadow-lg z-10 w-11/12 max-w-md p-6">
            <h3 className="text-lg font-semibold mb-3">Add New Task</h3>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="mt-1 mb-3 p-1 block w-full rounded border border-gray-300 shadow-sm focus:outline-blue-500"
            />
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              className="mt-1 mb-3 p-1 block w-full rounded border border-gray-300 shadow-sm focus:outline-blue-500"
              rows={4}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(e) => setTaskStartDate(e.target.value)}
                  className="text-sm mt-1 mb-3 p-1 block w-full rounded border border-gray-300 shadow-sm focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={taskEndDate}
                  onChange={(e) => setTaskEndDate(e.target.value)}
                  className="text-sm mt-1 mb-3 p-1 block w-full rounded border border-gray-300 shadow-sm focus:outline-blue-500"
                />
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Assignee
            </label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="mt-1 mb-3 p-1 block w-full rounded border border-gray-300 shadow-sm focus:outline-blue-500"
            >
              <option value="">Unassigned</option>
              {officeMembers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setTaskModalOpen(false);
                  setEditTaskId(null);
                }}
                className="px-3 py-2 rounded-md border"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const title = taskTitle.trim();
                  if (!title) return;
                  try {
                    const assignee = officeMembers.find(
                      (x) => x.id === taskAssignee
                    );
                    let taskId;

                    if (editTaskId) {
                      await updateTask(editTaskId, {
                        title,
                        desc: taskDesc,
                        startDate: taskStartDate || undefined,
                        endDate: taskEndDate || undefined,
                        assigneeId: taskAssignee || undefined,
                        assigneeName: assignee ? assignee.name : undefined,
                      });
                      taskId = editTaskId;
                    } else {
                      taskId = await addTask({
                        title,
                        desc: taskDesc,
                        startDate: taskStartDate || undefined,
                        endDate: taskEndDate || undefined,
                        assigneeId: taskAssignee || undefined,
                        assigneeName: assignee ? assignee.name : undefined,
                      });
                    }

                    // After saving the task, read it back to find the resolved assigneeId
                    try {
                      if (taskId) {
                        const taskSnap = await get(
                          child(ref(db), `tasks/${taskId}`)
                        );
                        if (taskSnap.exists()) {
                          const taskVal: any = taskSnap.val();
                          const resolvedAssignee =
                            taskVal.assigneeId ||
                            taskVal.officeAssigneeId ||
                            "";
                          // If the task record resolved to a real user id, notify that user
                          if (resolvedAssignee) {
                            await createNotification(resolvedAssignee, {
                              title: "New Task Assigned",
                              message: `You have been assigned a new task: ${title}`,
                              type: "task",
                              taskId,
                            });
                          }
                        }
                      }
                    } catch (e) {
                      console.warn(
                        "Failed to create notification after saving task:",
                        e
                      );
                    }

                    setTaskTitle("");
                    setTaskDesc("");
                    setTaskStartDate("");
                    setTaskEndDate("");
                    setTaskAssignee("");
                    setTaskModalOpen(false);
                    setEditTaskId(null);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-3 py-2 rounded-md bg-rose-600 text-white"
              >
                {editTaskId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default AdminDashboard;
