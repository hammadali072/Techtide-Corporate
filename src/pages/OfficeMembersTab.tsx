import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref as dbRef, push, onValue, remove, update } from "firebase/database";

interface SocialLink {
  platform: string;
  url: string;
}

interface Member {
  id: string;
  name: string;
  email?: string;
  role?: string;
  userRole?: string;
  description?: string;
  keyFocus?: string;
  photo?: string; // base64 or url
  social?: SocialLink[];
  createdAt?: string;
}

const OfficeMembersTab: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [userRole, setUserRole] = useState(""); // new field
  const [description, setDescription] = useState("");
  const [keyFocus, setKeyFocus] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialPlatformCustom, setSocialPlatformCustom] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<Member | null>(null);

  // edit state
  const [editing, setEditing] = useState<Member | null>(null);

  useEffect(() => {
    const membersRef = dbRef(db, "officeMembers");
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, m]: any) => ({ id, ...m }));
        setMembers(list.reverse());
      } else {
        setMembers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!photoFile) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(photoFile);
  }, [photoFile]);

  const handleAddSocial = () => {
    const platform =
      socialPlatform === "Other"
        ? socialPlatformCustom.trim()
        : socialPlatform.trim();
    if (!platform || !socialUrl.trim()) return;
    setSocials((prev) => [...prev, { platform, url: socialUrl.trim() }]);
    setSocialPlatform("");
    setSocialPlatformCustom("");
    setSocialUrl("");
  };

  const handleRemoveSocial = (idx: number) =>
    setSocials((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setName("");
    setRole("");
    setUserRole("");
    setDescription("");
    setKeyFocus("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setSocials([]);
    setError("");
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please provide a name.");
      return;
    }
    setSubmitting(true);
    try {
      // basic email validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please provide a valid email address.");
        setSubmitting(false);
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim(),
        role: role.trim(),
        userRole: userRole.trim(),
        description: description.trim(),
        keyFocus: keyFocus.trim(),
        photo: photoPreview || "",
        social: socials.length > 0 ? socials : [],
        createdAt: new Date().toISOString(),
      } as any;

      if (editing) {
        await update(dbRef(db, `officeMembers/${editing.id}`), payload);
      } else {
        await push(dbRef(db, "officeMembers"), payload);
      }

      resetForm();
    } catch (err: any) {
      console.error(err);
      setError("Save failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (m: Member) => {
    setEditing(m);
    setName(m.name || "");
    setEmail(m.email || "");
    setRole(m.role || "");
    setUserRole(m.userRole || "");
    setDescription(m.description || "");
    setKeyFocus(m.keyFocus || "");
    setPhotoPreview(m.photo || null);
    setSocials(m.social || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this member?")) return;
    await remove(dbRef(db, `officeMembers/${id}`));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Office Members</h2>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-6 mb-6 max-w-2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="person@example.com"
              type="email"
              required
            />
          </div>

          {/* New Dropdown Field */}
          <div>
            <label className="block font-semibold mb-1">User Role</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white"
              required
            >
              <option value="">Select Role</option>
              <option value="CEO">CEO</option>
              <option value="COO">COO</option>
              <option value="DO">Director Operation</option>
              <option value="Employee">Employee</option>
              <option value="Intern">Intern</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Team Manager">Team Manager</option>
              <option value="Partner">Partner</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Role / Title</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="CEO, COO, Designer..."
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Short Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
              placeholder="Bio or responsibilities"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Key Focus</label>
            <input
              value={keyFocus}
              onChange={(e) => setKeyFocus(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Key focus area"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPhotoFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full"

            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt={`${photoPreview}`}
                className="h-28 w-28 object-cover rounded mt-2"
              />
            )}
          </div>

          {/* Social Links */}
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Social Links</label>
            <div className="flex gap-2 items-center">
              <select
                value={socialPlatform}
                onChange={(e) => setSocialPlatform(e.target.value)}
                className="border rounded px-3 py-2 w-1/3 bg-white"
              >
                <option value="">Select platform</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="Twitter">Twitter</option>
                <option value="GitHub">GitHub</option>
                <option value="Website">Website</option>
                <option value="Other">Other</option>
              </select>
              {socialPlatform === "Other" && (
                <input
                  placeholder="Custom platform"
                  value={socialPlatformCustom}
                  onChange={(e) => setSocialPlatformCustom(e.target.value)}
                  className="border rounded px-3 py-2 w-1/4"
                />
              )}
              <input
                placeholder="URL"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
              <button
                type="button"
                onClick={handleAddSocial}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {socials.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 bg-gray-100 border rounded px-2 py-1 text-sm"
                >
                  <strong className="mr-2">{s.platform}:</strong>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline truncate max-w-xs"
                  >
                    {s.url}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocial(i)}
                    className="text-red-600 font-bold ml-2"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="text-red-600 mt-3">{error}</div>}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {editing
              ? submitting
                ? "Updating..."
                : "Update Member"
              : submitting
                ? "Adding..."
                : "Add Member"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Member List */}
      <h3 className="text-xl font-bold mb-4">All Office Members</h3>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-gray-500">No members added yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col items-start"
            >
              {m.photo && (
                <img
                  src={m.photo}
                  alt={m.name}
                  className="h-28 w-28 object-cover rounded mb-3"
                />
              )}
              <h4 className="font-bold text-lg">{m.name}</h4>
              <div className="text-sm text-gray-600 mb-1">
                {m.userRole && <span className="font-semibold">{m.userRole}</span>}
              </div>
              <div className="text-sm text-gray-600 mb-2">{m.role}</div>
              {m.keyFocus && (
                <div className="text-sm font-medium text-indigo-600 mb-2">
                  Key: {m.keyFocus}
                </div>
              )}
              {m.email && (
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Email:</strong> <a className="text-blue-600 underline" href={`mailto:${m.email}`}>{m.email}</a>
                </div>
              )}
              {m.description && (
                <p className="text-gray-700 mb-2">{m.description}</p>
              )}
              {m.social && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.social.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      {s.platform}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => setViewing(m)}
                  className="px-3 py-1 bg-blue-100 rounded"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(m)}
                  className="px-3 py-1 bg-yellow-100 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="px-3 py-1 bg-red-100 rounded"
                >
                  Delete
                </button>
              </div>
              <span className="text-xs text-gray-400 mt-3">
                {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{viewing.name}</h3>
              <button
                onClick={() => setViewing(null)}
                className="text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                {viewing.photo ? (
                  <img
                    src={viewing.photo}
                    alt={viewing.name}
                    className="w-full h-56 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-56 bg-gray-100 rounded flex items-center justify-center">
                    No photo
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-600">{viewing.role}</div>
                {viewing.userRole && (
                  <div className="text-indigo-600 font-medium mt-2">
                    Role: {viewing.userRole}
                  </div>
                )}
                {viewing.keyFocus && (
                  <div className="text-indigo-600 font-medium mt-2">
                    Key: {viewing.keyFocus}
                  </div>
                )}
                {viewing.description && (
                  <p className="mt-3 text-gray-700">{viewing.description}</p>
                )}
                {viewing.social && viewing.social.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold">Social Links</h4>
                    <ul className="mt-2 space-y-1">
                      {viewing.social.map((s, i) => (
                        <li key={i}>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {s.platform}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-4">
                  Added:{" "}
                  {viewing.createdAt
                    ? new Date(viewing.createdAt).toLocaleString()
                    : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeMembersTab;
