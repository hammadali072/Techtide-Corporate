import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref as dbRef, onValue, off } from "firebase/database";

type Message = {
  id?: string;
  name?: string;
  from?: string;
  phone?: string;
  subject?: string;
  message?: string;
  body?: string;
  createdAt?: string;
  [k: string]: any;
};

const MessageUserTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{ key: string; data: Message }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const messagesRef = dbRef(db, "messages");

    const listener = onValue(
      messagesRef,
      (snap) => {
        const list: Array<{ key: string; data: Message }> = [];
        snap.forEach((child) => {
          list.push({ key: child.key ?? "", data: child.val() as Message });
          return false; 
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

    return () => off(messagesRef, "value", listener as any);
  }, []);

  if (loading) return <div className="p-4">Loading messages...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!items.length) return <div className="p-4">No messages found.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Messages</h2>
      <p className="text-sm text-muted-foreground mb-4">Incoming messages from the contact form. Click an entry to view more details or reply.</p>
      <div className="space-y-4">
        {items.map(({ key, data }) => (
          <div key={key} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium">{data.subject ?? "No subject"}</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div><strong>Name:</strong> {data.name ?? data.from ?? "-"}</div>
                  <div><strong>Phone:</strong> {data.phone ?? "-"}</div>
                  <div className="text-right">{data.createdAt ? new Date(data.createdAt).toLocaleString() : "-"}</div>
                </div>
                <div className="mt-3 text-sm text-foreground"><strong>Message:</strong>
                  <div className="mt-1 p-3 bg-card rounded whitespace-pre-wrap">{data.message ?? data.body ?? data.coverLetter ?? "-"}</div>
                </div>
              </div>

              <div className="ml-4 flex flex-col items-end gap-2">
                <button onClick={() => console.log('Reply to', key)} className="px-3 py-1 bg-primary text-primary-foreground rounded">Reply</button>
                <button onClick={() => console.log('Mark read', key)} className="px-3 py-1 border rounded">Mark read</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageUserTab;
