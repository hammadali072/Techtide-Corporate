import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue, remove, update } from "firebase/database";
import { Dialog } from "@headlessui/react";

interface UserRecord {
  uid: string;
  name: string;
  email: string;
  photo?: string;
  role?: string;
  createdAt?: string;
}

const AllUsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [newRole, setNewRole] = useState("");

  // ✅ Fetch Users
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.entries(data).map(([uid, user]: any) => ({
          uid,
          ...user,
        }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Delete User
  const handleDelete = async (uid: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      await remove(ref(db, `users/${uid}`));
    }
  };

  // ✅ Open Edit Modal
  const handleEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setNewRole(user.role || "user");
    setIsOpen(true);
  };

  // ✅ Update Role
  const handleUpdateRole = async () => {
    if (selectedUser) {
      await update(ref(db, `users/${selectedUser.uid}`), { role: newRole });
      setIsOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">All Users</h2>
      {loading ? (
        <div className="text-gray-500">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-gray-500">No users found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border-b text-left">Photo</th>
                <th className="px-4 py-2 border-b text-left">Name</th>
                <th className="px-4 py-2 border-b text-left">Email</th>
                <th className="px-4 py-2 border-b text-left">Role</th>
                <th className="px-4 py-2 border-b text-left">Created At</th>
                <th className="px-4 py-2 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b text-center">
                      {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name ? `${user.name} profile photo` : 'User profile photo'}
                        className="h-10 w-10 rounded-full mx-auto"
                      />
                    ) : (
                      <span className="inline-block h-10 w-10 rounded-full bg-gray-200" aria-hidden="true" />
                    )}
                  </td>
                  <td className="px-4 py-2 border-b">{user.name}</td>
                  <td className="px-4 py-2 border-b">{user.email}</td>
                  <td className="px-4 py-2 border-b capitalize">
                    {user.role || "user"}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2 border-b text-center space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.uid)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ Edit Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-lg font-bold mb-4">
              Edit User Role
            </Dialog.Title>
            <p className="mb-2">
              Name: <span className="font-semibold">{selectedUser?.name}</span>
            </p>
            <p className="mb-4">
              Email: <span className="font-semibold">{selectedUser?.email}</span>
            </p>

            <label className="block mb-2 text-sm font-medium">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Update
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AllUsersTab;
