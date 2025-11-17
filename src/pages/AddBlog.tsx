import React, { useEffect, useState } from "react";
import Seo from "@/components/Seo";
import { db } from "@/firebase";
import { ref as dbRef, get as dbGet, set as dbSet, onValue, remove as dbRemove } from "firebase/database";
import { auth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6; 

type Block =
  | { id: string; type: "heading"; text: string; level: HeadingLevel }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "bulletList"; items: string[] }
  | { id: string; type: "image"; file?: File | null; preview?: string };

const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const AddBlog: React.FC = () => {
  // helper: convert File -> data URL (base64) so we can store it directly in Realtime DB
  const fileToDataUrl = (file: File) =>
    new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        if (typeof fr.result === "string") res(fr.result);
        else rej(new Error("Failed to read file as data URL"));
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  const [blogName, setBlogName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [mainImageFile, setMainImageFile]
    = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [savedPost, setSavedPost] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // cleanup previews on unmount
    return () => {
      if (mainImagePreview) URL.revokeObjectURL(mainImagePreview);
      blocks.forEach((b) => {
        if (b.type === "image" && b.preview) URL.revokeObjectURL(b.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // subscribe to all blogs so admin can see saved posts in realtime
  useEffect(() => {
    const r = dbRef(db, "blogs");
    const unsub = onValue(r, (snap) => {
      const v = snap.val() || {};
      const arr = Object.keys(v).map((k) => ({ id: k, ...v[k] }));
      arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setAllPosts(arr);
    });
    return () => { /* firebase onValue doesn't return unsubscribe; use off if needed */ };
  }, []);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setMainImageFile(f);
    if (mainImagePreview) {
      URL.revokeObjectURL(mainImagePreview);
      setMainImagePreview(null);
    }
    if (f) setMainImagePreview(URL.createObjectURL(f));
  };

  const addBlock = (type: Block["type"], headingLevel?: HeadingLevel) => {
    const id = makeId();
    if (type === "heading") setBlocks((s) => [...s, { id, type: "heading", text: "", level: headingLevel || 2 as HeadingLevel }]);
    if (type === "paragraph") setBlocks((s) => [...s, { id, type: "paragraph", text: "" }]);
    if (type === "bulletList") setBlocks((s) => [...s, { id, type: "bulletList", items: [""] }]);
    if (type === "image") setBlocks((s) => [...s, { id, type: "image", file: null, preview: undefined }]);
  };

  const updateHeadingLevel = (id: string, level: HeadingLevel) => {
    setBlocks((s) =>
      s.map((b) => {
        if (b.id !== id || b.type !== "heading") return b;
        return { ...b, level };
      })
    );
  };

  const updateBulletPoint = (blockId: string, itemIndex: number, text: string) => {
    setBlocks((s) =>
      s.map((b) => {
        if (b.id !== blockId || b.type !== "bulletList") return b;
        const newItems = [...(b as any).items];
        newItems[itemIndex] = text;
        return { ...b, items: newItems };
      })
    );
  };

  const addBulletPoint = (blockId: string) => {
    setBlocks((s) =>
      s.map((b) => {
        if (b.id !== blockId || b.type !== "bulletList") return b;
        return { ...b, items: [...(b as any).items, ""] };
      })
    );
  };

  const removeBulletPoint = (blockId: string, itemIndex: number) => {
    setBlocks((s) =>
      s.map((b) => {
        if (b.id !== blockId || b.type !== "bulletList") return b;
        const newItems = (b as any).items.filter((_: any, idx: number) => idx !== itemIndex);
        return { ...b, items: newItems };
      })
    );
  };

  const updateBlockText = (id: string, text: string) => {
    setBlocks((s) => s.map((b) => (b.id === id && (b.type === "heading" || b.type === "paragraph") ? { ...b, text } : b)));
  };

  const handleBlockImageChange = (id: string, file: File | null) => {
    setBlocks((s) =>
      s.map((b) => {
        if (b.id !== id) return b;
        if (b.type !== "image") return b;
        if (b.preview) URL.revokeObjectURL(b.preview);
        return { ...b, file, preview: file ? URL.createObjectURL(file) : undefined } as Block;
      })
    );
  };

  const removeBlock = (id: string) => setBlocks((s) => s.filter((b) => b.id !== id));

  // Helper function to reset form
  const resetForm = () => {
    setBlogName("");
    setTitle("");
    setDescription("");
    setCategory("");
    setMainImageFile(null);
    setMainImagePreview(null);
    setBlocks([]);
    setSavedPost(null);
    setEditingSlug(null);
    setErrorMessage(null);
    setUploadProgress({});
  };

  const handleSave = () => {
    (async () => {
      try {
        setSaving(true);

        // Use existing slug when editing, otherwise generate new one
        let slug = editingSlug;
        // Always define slugBase for image naming
        let slugBase = "";
        if (!editingSlug) {
          // determine slug (prefer blogName, fallback to title)
          slugBase = (blogName || title || makeId()).toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
          slug = slugBase || makeId();

          // ensure uniqueness: if slug exists, append counter
          let counter = 0;
          while (true) {
            const snap = await dbGet(dbRef(db, `blogs/${slug}`));
            if (!snap.exists()) break;
            counter += 1;
            slug = `${slugBase}-${counter}`;
          }
        } else {
          // If editing, try to get a base from blogName or title
          slugBase = (blogName || title || slug || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
        }

        // convert main image to data URL and images in blocks to data URLs
        let mainImageUrl: string | null = null;
        let mainImageName: string | null = null;
        if (mainImageFile) {
          try {
            mainImageUrl = await fileToDataUrl(mainImageFile);
            // mark progress as complete for UI
            setUploadProgress((p) => ({ ...p, main: 100 }));
            // derive a filename from the title/slug preserving extension
            try {
              const ext = (mainImageFile.name || "").split('.').pop();
              const base = slugBase;
              mainImageName = ext ? `${base}.${ext.toLowerCase()}` : base;
            } catch (e) {
              mainImageName = null;
            }
          } catch (err: any) {
            console.error("Main image read failed:", err);
            setErrorMessage(`Main image read failed: ${err?.message || err}`);
          }
        } else if (mainImagePreview) {
          // preserve existing preview (data URL) when editing
          mainImageUrl = mainImagePreview;
        }

        const blocksResult = [] as any[];
        let imgCounter = 0;
        for (const b of blocks) {
          if (b.type === "image") {
            if (b.file) {
              try {
                const url = await fileToDataUrl(b.file);
                // generate a name for the image based on title and counter
                imgCounter += 1;
                const ext = (b.file.name || "").split('.').pop();
                const base = slugBase;
                const imgName = ext ? `${base}-${imgCounter}.${ext.toLowerCase()}` : `${base}-${imgCounter}`;
                blocksResult.push({ type: "image", url, name: imgName });
              } catch (err: any) {
                console.error("Block image read failed:", err);
                setErrorMessage((m) => (m ? m + "; " : "") + `Block image read failed: ${err?.message || err}`);
                blocksResult.push({ type: "image", url: null, name: null });
              }
            } else if ((b as any).preview) {
              // preserve existing image data URL when editing
              blocksResult.push({ type: "image", url: (b as any).preview, name: (b as any).name ?? null });
            } else {
              blocksResult.push({ type: "image", url: null, name: null });
            }
          } else if (b.type === "heading") {
            blocksResult.push({ type: "heading", text: b.text, level: (b as any).level || 2 });
          } else if (b.type === "bulletList") {
            blocksResult.push({ type: "bulletList", items: (b as any).items || [] });
          } else if (b.type === "paragraph") {
            blocksResult.push({ type: "paragraph", text: b.text });
          }
        }

        // when editing, preserve createdAt/createdBy if the post existed
        const existing = editingSlug ? allPosts.find((p) => p.id === editingSlug) : null;

        const post = {
          blogName,
          title,
          description,
          category,
          mainImageUrl,
          mainImageName,
          blocks: blocksResult,
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          // store a readable name (displayName or email) when available instead of raw UID
          createdBy: existing?.createdBy ?? (auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || auth.currentUser.uid) : null),
        };

        // write to Realtime Database under 'blogs/{slug}'
        await dbSet(dbRef(db, `blogs/${slug}`), post);

        setSavedPost({ id: slug, ...post });
        setSaving(false);
        setErrorMessage(null);
        // Reset the form after successful save
        resetForm();
        toast({ title: "Saved", description: editingSlug ? "Post updated" : "Post saved to Firebase Realtime Database", variant: "success" });
      } catch (err: any) {
        console.error(err);
        setSaving(false);
        setErrorMessage(err?.message || String(err));
        alert("Error saving post. Check console.");
      }
    })();
  };

  // Helper to save post without performing any uploads (useful to test DB rules)
  const handleSaveNoUpload = async () => {
    try {
      setSaving(true);
      const slugBase = (blogName || title || makeId()).toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
      let slug = slugBase || makeId();
      let counter = 0;
      while (true) {
        const snap = await dbGet(dbRef(db, `blogs/${slug}`));
        if (!snap.exists()) break;
        counter += 1;
        slug = `${slugBase}-${counter}`;
      }

      const post = {
        blogName,
        title,
        description,
        mainImageUrl: null,
        mainImageName: null,
        blocks: blocks.map((b) => {
          if (b.type === "heading") {
            return { type: "heading", text: b.text, level: (b as any).level || 2 };
          }
          if (b.type === "bulletList") {
            return { type: "bulletList", items: (b as any).items || [] };
          }
          if (b.type === "paragraph") {
            return { type: "paragraph", text: b.text };
          }
          return { type: "image", url: null, name: null };
        }),
        createdAt: new Date().toISOString(),
        // save human-friendly creator name when available
        createdBy: auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || auth.currentUser.uid) : null,
      };

      await dbSet(dbRef(db, `blogs/${slug}`), post);
      setSavedPost({ id: slug, ...post });
      setSaving(false);
      setErrorMessage(null);
      resetForm();
      toast({ title: "Saved", description: "Post saved to Realtime DB (no images)", variant: "success" });
    } catch (err: any) {
      console.error("Save(no upload) failed:", err);
      setSaving(false);
      setErrorMessage(JSON.stringify(err));
      alert("Error saving post without uploads. Check console and error message shown below.");
    }
  };

  const startEdit = (p: any) => {
    setEditingSlug(p.id);
    setBlogName(p.blogName || "");
    setTitle(p.title || "");
    setDescription(p.description || "");
    setMainImageFile(null);
    setMainImagePreview(p.mainImageUrl || null);

    const mapped = (p.blocks || []).map((b: any) => {
      if (b.type === "image") {
        return {
          id: makeId(),
          type: "image",
          file: null,
          preview: b.url ?? undefined,
          name: b.name ?? null
        } as Block;
      }
      if (b.type === "heading") {
        return {
          id: makeId(),
          type: "heading",
          text: b.text || "",
          level: b.level || 2 as HeadingLevel
        } as Block;
      }
      if (b.type === "bulletList") {
        return {
          id: makeId(),
          type: "bulletList",
          items: b.items || [""]
        } as Block;
      }
      return {
        id: makeId(),
        type: "paragraph",
        text: b.text || ""
      } as Block;
    });
    setBlocks(mapped);
    // scroll to top where the form is
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this post? This action cannot be undone.")) return;
    try {
      await dbRemove(dbRef(db, `blogs/${id}`));
      toast({ title: "Deleted", description: "Post removed", variant: "success" });
      // onValue subscription will refresh allPosts; clear editing if it was this
      if (editingSlug === id) {
        resetForm();
      }
    } catch (err: any) {
      console.error("Delete failed", err);
      toast({ title: "Error", description: "Failed to delete post. Check console.", variant: "destructive" });
    }
  };

  return (
    <>
      <Seo title={editingSlug ? "Edit Blog | Admin" : "Add Blog | Admin"} description={editingSlug ? "Edit existing blog post" : "Create a new blog post"} />
      <h2 className="text-2xl font-bold mb-4">{editingSlug ? "Edit Blog Post" : "Add New Blog Post"}</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Blog Name (internal)</label>
          <input value={blogName} onChange={(e) => setBlogName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. textile-tales" />
        </div>

        <div>
          <label className="block mb-2 font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Post title" />
        </div>

        <div>
          <label className="block mb-2 font-medium">Short Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 h-24" placeholder="Short summary for lists and SEO"></textarea>
        </div>

        <div>
          <label className="block mb-2 font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select a category</option>
            <option value="Technology">Technology</option>
            <option value="Business">Business</option>
            <option value="Design">Design</option>
            <option value="Development">Development</option>
            <option value="Tutorial">Tutorial</option>
            <option value="News">News</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">Main Image</label>
          <input type="file" accept="image/*" onChange={handleMainImageChange} />
          {mainImagePreview && (
            <img src={mainImagePreview} alt="main preview" className="mt-3 max-h-48 object-contain" />
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-medium mr-2">Add Content</span>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => addBlock("heading", level)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  H{level}
                </button>
              ))}
            </div>
            <button onClick={() => addBlock("paragraph")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">
              Paragraph
            </button>
            <button onClick={() => addBlock("bulletList")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">
              Bullet List
            </button>
            <button onClick={() => addBlock("image")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">
              Image
            </button>
          </div>

          <div className="space-y-4">
            {blocks.map((b) => (
              <div key={b.id} className="p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div className="text-sm text-gray-600">
                    {b.type === "heading" ? `H${(b as any).level || 2}` : b.type.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    {b.type === "heading" && (
                      <select
                        value={(b as any).level || 2}
                        onChange={(e) => updateHeadingLevel(b.id, parseInt(e.target.value) as HeadingLevel)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                          <option key={level} value={level}>
                            H{level}
                          </option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => removeBlock(b.id)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>

                {b.type === "heading" && (
                  <input
                    value={b.text}
                    onChange={(e) => updateBlockText(b.id, e.target.value)}
                    className="w-full mt-2 border rounded px-3 py-2"
                    placeholder="Heading text"
                  />
                )}

                {b.type === "paragraph" && (
                  <textarea
                    value={b.text}
                    onChange={(e) => updateBlockText(b.id, e.target.value)}
                    className="w-full mt-2 border rounded px-3 py-2 h-28"
                    placeholder="Paragraph content"
                  />
                )}

                {b.type === "bulletList" && (
                  <div className="mt-2 space-y-2">
                    {(b as any).items?.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-gray-400">•</span>
                        <input
                          value={item}
                          onChange={(e) => updateBulletPoint(b.id, idx, e.target.value)}
                          className="flex-1 border rounded px-3 py-1"
                          placeholder={`List item ${idx + 1}`}
                        />
                        <button
                          onClick={() => removeBulletPoint(b.id, idx)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addBulletPoint(b.id)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add item
                    </button>
                  </div>
                )}

                {b.type === "image" && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBlockImageChange(b.id, e.target.files?.[0] ?? null)}
                    />
                    {b.preview && <img src={b.preview} alt="block preview" className="mt-2 max-h-56 object-contain" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">
              {saving ? "Saving..." : "Save Post"}
            </button>
            <button onClick={handleSaveNoUpload} disabled={saving} className="px-4 py-2 bg-gray-200 text-gray-800 rounded disabled:opacity-60">
              Save (no images)
            </button>
          </div>
        </div>
      </div>

      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Upload Progress</h3>
          <div className="space-y-1">
            {Object.entries(uploadProgress).map(([k, v]) => (
              <div key={k} className="text-sm text-gray-700">{k}: {v}%</div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 text-sm text-red-600">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      {savedPost && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-bold mb-2">Saved Post</h3>
          <div className="text-sm text-gray-700 mb-2">ID: {savedPost.id}</div>
          <div className="mb-2"><strong>Title:</strong> {savedPost.title}</div>
          <div className="mb-2"><strong>Description:</strong> {savedPost.description}</div>
          {savedPost.mainImageUrl && <img src={savedPost.mainImageUrl} className="max-h-48 object-contain mb-2" />}
          <div className="space-y-2">
            {savedPost.blocks?.map((b: any, idx: number) => (
              <div key={idx} className="p-2 border rounded">
                <div className="text-xs text-gray-500">{b.type}</div>
                {b.type === 'heading' && <div className="font-semibold">{b.text}</div>}
                {b.type === 'paragraph' && <div>{b.text}</div>}
                {b.type === 'image' && b.url && <img src={b.url} className="max-h-44 object-contain mt-2" />}
                {b.type === 'image' && !b.url && <div className="text-xs text-gray-500">No image uploaded</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All saved posts for admin */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Saved posts</h3>
        {allPosts.length === 0 ? (
          <div className="text-sm text-gray-500">No posts yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPosts.map((p) => (
              <div key={p.id} className="p-3 border rounded shadow-sm bg-white">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</div>
                </div>
                {/* show main image thumbnail if available */}
                {p.mainImageUrl ? (
                  <img src={p.mainImageUrl} alt={`${p.title} thumbnail`} className="mt-3 h-24 w-full object-cover rounded" />
                ) : (
                  <div className="mt-3 h-24 w-full bg-gray-50 border rounded flex items-center justify-center text-xs text-gray-400">No image</div>
                )}

                <div className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <a href={`/blog/${p.id}`} className="text-blue-600 text-sm hover:underline">View</a>
                    <button onClick={() => startEdit(p)} className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
                  </div>
                  <div className="text-xs text-gray-400">By {p.createdBy || "Unknown"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AddBlog;
