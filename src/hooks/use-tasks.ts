import { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  ref as dbRef,
  onValue,
  push,
  update,
  child,
  get,
} from "firebase/database";

export interface TaskItem {
  id: string;
  title: string;
  desc?: string;
  startDate?: string;
  endDate?: string;
  officeAssigneeId?: string; // original officeMembers id if assigned from office list
  assigneeId?: string; // office member id
  assigneeName?: string;
  status?: string;
  createdAt?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tasksRef = dbRef(db, "tasks");
    const unsub = onValue(tasksRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, t]: any) => ({ id, ...t }));
        setTasks(list.reverse());
      } else {
        setTasks([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function addTask(payload: Omit<TaskItem, "id" | "createdAt" | "status"> & { status?: string }) {
    const tasksRef = dbRef(db, "tasks");
    // Resolve assignee: if payload.assigneeId refers to an office member and
    // that office member has an email which maps to a registered user in
    // `users`, prefer assigning the task to the user (so it appears in
    // the user's "Your Work" page). Still store the original
    // officeAssigneeId for reference.
    let resolvedAssigneeId = payload.assigneeId || "";
    let resolvedAssigneeName = payload.assigneeName || "";
    let officeAssigneeId: string | undefined = undefined;

    if (payload.assigneeId) {
      // Try to lookup office member and its email
      const officeSnap = await get(dbRef(db, `officeMembers/${payload.assigneeId}`));
      if (officeSnap.exists()) {
        const officeVal: any = officeSnap.val();
        officeAssigneeId = payload.assigneeId; // store original office id
        const officeEmail = officeVal.email;
        if (officeEmail) {
          const normalizedOfficeEmail = String(officeEmail).trim().toLowerCase();
          // search users for matching email (case-insensitive) and check common email fields
          const usersSnap = await get(dbRef(db, `users`));
          if (usersSnap.exists()) {
            const usersVal: any = usersSnap.val();
            const match = Object.entries(usersVal).find(([, u]: any) => {
              const user = u as any;
              const emailsToCheck = [user.email, user.emailAddress, user.emailLower];
              for (const e of emailsToCheck) {
                if (!e) continue;
                if (String(e).trim().toLowerCase() === normalizedOfficeEmail) return true;
              }
              return false;
            });
            if (match) {
              const [userId, userObj]: any = match as any;
              resolvedAssigneeId = userId;
              resolvedAssigneeName = userObj.name || userObj.displayName || resolvedAssigneeName;
            }
          }
        }
        // if no email or no match, leave resolvedAssigneeId as the office id
      }
    }

    const item = {
      title: payload.title,
      desc: payload.desc || "",
      startDate: payload.startDate || "",
      endDate: payload.endDate || "",
      officeAssigneeId: officeAssigneeId || "",
      assigneeId: resolvedAssigneeId || "",
      assigneeName: resolvedAssigneeName || "",
      status: payload.status || "under working",
      createdAt: new Date().toISOString(),
    } as any;

    // push task and get key
    const newRef = await push(tasksRef, item);
    const taskId = newRef.key as string;

    return taskId;
  }

  async function updateTask(taskId: string, updates: Partial<TaskItem>) {
    if (!taskId) throw new Error("taskId required");
    const taskRef = dbRef(db, `tasks/${taskId}`);
    // Only update allowed fields
    const allowed: any = {};
    if (updates.title !== undefined) allowed.title = updates.title;
    if (updates.desc !== undefined) allowed.desc = updates.desc;
    if (updates.startDate !== undefined) allowed.startDate = updates.startDate;
    if (updates.endDate !== undefined) allowed.endDate = updates.endDate;
    if (updates.assigneeId !== undefined) {
      // Resolve assignee: if updates.assigneeId refers to an office member and
      // that office member has an email which maps to a registered user in
      // `users`, prefer assigning the task to the user
      let resolvedAssigneeId = updates.assigneeId || "";
      let resolvedAssigneeName = updates.assigneeName || "";
      let officeAssigneeId: string | undefined = undefined;

      if (updates.assigneeId) {
        // Try to lookup office member and its email
        const officeSnap = await get(dbRef(db, `officeMembers/${updates.assigneeId}`));
        if (officeSnap.exists()) {
          const officeVal: any = officeSnap.val();
          officeAssigneeId = updates.assigneeId; // store original office id
          const officeEmail = officeVal.email;
          if (officeEmail) {
            const normalizedOfficeEmail = String(officeEmail).trim().toLowerCase();
            // search users for matching email (case-insensitive) and check common email fields
            const usersSnap = await get(dbRef(db, `users`));
            if (usersSnap.exists()) {
              const usersVal: any = usersSnap.val();
              const match = Object.entries(usersVal).find(([, u]: any) => {
                const user = u as any;
                const emailsToCheck = [user.email, user.emailAddress, user.emailLower];
                for (const e of emailsToCheck) {
                  if (!e) continue;
                  if (String(e).trim().toLowerCase() === normalizedOfficeEmail) return true;
                }
                return false;
              });
              if (match) {
                const [userId, userObj]: any = match as any;
                resolvedAssigneeId = userId;
                resolvedAssigneeName = userObj.name || userObj.displayName || resolvedAssigneeName;
              }
            }
          }
          // if no email or no match, leave resolvedAssigneeId as the office id
        }
      }

      allowed.assigneeId = resolvedAssigneeId || "";
      allowed.officeAssigneeId = officeAssigneeId || "";
    }
    if (updates.assigneeName !== undefined) allowed.assigneeName = updates.assigneeName;
    if (updates.status !== undefined) allowed.status = updates.status;
    if (Object.keys(allowed).length === 0) return;
    await update(taskRef, allowed as any);
  }

  async function deleteTask(taskId: string) {
    if (!taskId) throw new Error("taskId required");
    const taskRef = dbRef(db, `tasks/${taskId}`);
    // Use remove to actually delete the node
    await import('firebase/database').then(({ remove }) => remove(taskRef));
  }

  return { tasks, loading, addTask, updateTask, deleteTask };
}
