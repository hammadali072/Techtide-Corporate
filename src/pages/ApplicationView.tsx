import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref as dbRef, get } from "firebase/database";

const ApplicationView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const ref = dbRef(db, `applications/${id}`);
    get(ref)
      .then((snap) => {
        if (!snap.exists()) {
          setError('Application not found');
          setApp(null);
        } else {
          setApp(snap.val());
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!app) return <div className="p-8">No application data.</div>;

  const { jobTitle, name, phone, coverLetter, cvLink, status, createdAt, applicationId } = app;

  return (
    <div className="min-h-screen p-8">
      <Link to="/careers" className="underline text-sm mb-4 inline-block">Back to Careers</Link>
      <h1 className="text-2xl font-bold mb-4">Application: {applicationId ?? id}</h1>
      <p className="mb-2"><strong>Job:</strong> {jobTitle}</p>
      <p className="mb-2"><strong>Name:</strong> {name}</p>
      <p className="mb-2"><strong>Phone:</strong> {phone ?? 'N/A'}</p>
      <p className="mb-2"><strong>Status:</strong> {status}</p>
      <p className="mb-4"><strong>Submitted:</strong> {new Date(createdAt).toLocaleString()}</p>

      <div className="mb-6">
        <h2 className="font-semibold mb-2">Cover Letter</h2>
        <div className="p-4 bg-card rounded">{coverLetter}</div>
      </div>

      {cvLink ? (
        <div>
          <h2 className="font-semibold mb-2">CV</h2>
          <div className="border rounded overflow-hidden">
            {/* If CV is a data URL or an http(s) link, show in iframe */}
            <iframe src={cvLink} title="CV" className="w-full h-[800px]" />
          </div>
        </div>
      ) : (
        <p>No CV provided.</p>
      )}
    </div>
  );
};

export default ApplicationView;
