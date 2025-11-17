import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref as dbRef, onValue, off, update } from "firebase/database";
import { toast } from "sonner";

type Application = {
  applicationId?: string;
  jobTitle?: string;
  name?: string;
  phone?: string | null;
  coverLetter?: string;
  cvLink?: string | null;
  status?: string;
  createdAt?: string;
  // allow any additional fields
  [k: string]: any;
};

const STATUSES = ["contacting", "interview", "cancel", "hire"];

const JobApplyTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Array<{ key: string; data: Application }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const applicationsRef = dbRef(db, "applications");

    const listener = onValue(
      applicationsRef,
      (snap) => {
        const list: Array<{ key: string; data: Application }> = [];
        snap.forEach((child) => {
          const key = child.key ?? "";
          const data = child.val() as Application;
          list.push({ key, data });
        });
        // sort by createdAt desc
        list.sort((a, b) => {
          const ta = a.data.createdAt ?? "";
          const tb = b.data.createdAt ?? "";
          return tb.localeCompare(ta);
        });
        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to read applications", err);
        setError(String(err));
        setLoading(false);
      },
    );

    return () => {
      off(applicationsRef, "value", listener as any);
    };
  }, []);

  const handleStatusChange = async (key: string, newStatus: string) => {
    try {
      await update(dbRef(db, `applications/${key}`), { status: newStatus });
      toast.success("Status updated");
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Could not update status");
    }
  };

  if (loading) return <div className="p-4">Loading applications...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!applications.length) return <div className="p-4">No job applications found.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Job Applications</h2>
      <div className="space-y-4">
        {applications.map(({ key, data }) => (
          <div key={key} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-medium">{data.name ?? "-"}</h3>
                <p className="text-sm text-muted-foreground">{data.jobTitle ?? "-"}</p>
                <p className="text-sm mt-1"><strong>Phone:</strong> {data.phone ?? "-"}</p>
                <p className="text-sm"><strong>App ID:</strong> {data.applicationId ?? key}</p>
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

export default JobApplyTab;
