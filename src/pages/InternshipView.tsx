import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref as dbRef, get } from "firebase/database";

const InternshipView = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intern, setIntern] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const ref = dbRef(db, `internships/${id}`);
    get(ref)
      .then((snap) => {
        if (!snap.exists()) {
          setError('Internship record not found');
          setIntern(null);
        } else {
          setIntern(snap.val());
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!intern) return <div className="p-8">No internship data.</div>;

  const { internshipId, jobTitle, name, coverLetter, cvLink, status, createdAt } = intern;

  return (
    <div className="min-h-screen p-8">
      <Link to="/careers" className="underline text-sm mb-4 inline-block">Back to Careers</Link>
      <h1 className="text-2xl font-bold mb-4">Internship Application: {internshipId ?? id}</h1>
      <p className="mb-2"><strong>Position:</strong> {jobTitle}</p>
      <p className="mb-2"><strong>Name:</strong> {name}</p>
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
            <iframe src={cvLink} title="CV" className="w-full h-[800px]" />
          </div>
        </div>
      ) : (
        <p>No CV provided.</p>
      )}
    </div>
  );
};

export default InternshipView;
