import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref as dbRef, onValue, off, update } from "firebase/database";
import { toast } from "sonner";

type Intern = {
  internshipId?: string;
  jobTitle?: string;
  name?: string;
  phone?: string | null;
  coverLetter?: string;
  cvLink?: string | null;
  status?: string;
  createdAt?: string;
  [k: string]: any;
};

const STATUSES = ["contacting", "interview", "cancel", "hire"];

const InternshipApplyTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{ key: string; data: Intern }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const internshipsRef = dbRef(db, "internships");
    const listener = onValue(
      internshipsRef,
      (snap) => {
        const list: Array<{ key: string; data: Intern }> = [];
        snap.forEach((child) => {
          list.push({ key: child.key ?? "", data: child.val() as Intern });
        });
        list.sort((a, b) => (b.data.createdAt ?? "").localeCompare(a.data.createdAt ?? ""));
        setItems(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(String(err));
        setLoading(false);
      },
    );

    return () => off(internshipsRef, "value", listener as any);
  }, []);

  const handleStatusChange = async (key: string, newStatus: string) => {
    try {
      await update(dbRef(db, `internships/${key}`), { status: newStatus });
      toast.success("Status updated");
    } catch (err) {
      console.error(err);
      toast.error("Could not update status");
    }
  };

  if (loading) return <div className="p-4">Loading internships...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!items.length) return <div className="p-4">No internship applications found.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Internship Applications</h2>
      <div className="space-y-4">
        {items.map(({ key, data }) => (
          <div key={key} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium">{data.name ?? "-"}</h3>
                <p className="text-sm text-muted-foreground"><strong>Category:</strong> {data.category ?? data.jobTitle ?? "-"}</p>
                {data.phone ? (
                  <p className="text-sm mt-1"><strong>Phone:</strong> {data.phone}</p>
                ) : null}
                <p className="text-sm"><strong>ID:</strong> {data.internshipId ?? key}</p>
                <p className="text-sm"><strong>Submitted:</strong> {data.createdAt ? new Date(data.createdAt).toLocaleString() : "-"}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={data.status ?? "contacting"}
                  onChange={(e) => handleStatusChange(key, e.target.value)}
                  className="px-3 py-1 border rounded"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold mb-2">Cover Letter</h4>
              <div className="p-3 bg-card rounded whitespace-pre-wrap">{data.coverLetter ?? "-"}</div>
            </div>

            {data.cvLink ? (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">CV</h4>
                <div className="border rounded overflow-hidden">
                  <iframe src={data.cvLink} title={`cv-${key}`} className="w-full h-[600px]" />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InternshipApplyTab;
