import React, { useState, useEffect } from "react";
import { db } from "@/firebase";
import { ref as dbRef, push, onValue, remove, update } from "firebase/database";

interface Service {
  id: string;
  name: string;
  description: string;
  images: string[];
  altTexts?: string[];
  createdAt?: string;
  blocks?: any[];
}

const AddServiceTab: React.FC = () => {
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editAltTexts, setEditAltTexts] = useState<string[]>([]);
  const [editAltInput, setEditAltInput] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  // Delete service
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      await remove(dbRef(db, `services/${id}`));
    }
  };

  // Edit service
  const handleEdit = (service: Service) => {
    // populate top form for editing (reuse Add form like AddBlog.tsx)
    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description || "");
    const imgs = Array.isArray(service.images) ? service.images : [];
    setImagePreviews(imgs);
    // populate alt texts if present
    const existingAlts: string[] = (service as any).altTexts || [];
    setImageAltTexts(imgs.map((_, i) => existingAlts[i] || ""));
    // populate blocks (map stored blocks to form blocks)
    const storedBlocks = (service as any).blocks || [];
    const mapped = storedBlocks.map((b: any) => {
      if (b.type === 'image') {
        return { id: makeId(), type: 'image', file: null, preview: b.url ?? undefined } as Block;
      }
      if (b.type === 'heading') return { id: makeId(), type: 'heading', text: b.text || '', level: b.level || 2 } as Block;
      if (b.type === 'descriptionList') return { id: makeId(), type: 'descriptionList', items: b.items || [{ term: '', description: '' }] } as Block;
      return { id: makeId(), type: 'paragraph', text: b.text || '' } as Block;
    });
    setBlocks(mapped);
    setEditModalOpen(false);
    // scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editService) {
      let updatedImages = [...editImages];
      let updatedAltTexts = [...editAltTexts];
      // If new images are uploaded, convert to base64 and add
      if (editImageFiles.length > 0) {
        const newImgs = await Promise.all(
          editImageFiles.map(
            file => new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
          )
        );
        updatedImages = [...updatedImages, ...newImgs];
        // add blank alt texts for newly added images (placeholder)
        updatedAltTexts = [...updatedAltTexts, ...newImgs.map(() => "")];
      }
      // ensure altTexts array matches images length
      const finalAltTexts = updatedImages.map((_, i) => updatedAltTexts[i] || "");
      await update(dbRef(db, `services/${editService.id}`), {
        name: editName,
        description: editDescription,
        images: updatedImages,
        altTexts: finalAltTexts,
      });
      setEditModalOpen(false);
      setEditService(null);
      setEditImages([]);
      setEditImageFiles([]);
      setEditAltTexts([]);
      setEditAltInput("");
    }
  };

  // Remove image from editImages
  function handleRemoveEditImage(idx: number) {
    setEditImages(imgs => imgs.filter((_, i) => i !== idx));
    setEditAltTexts(prev => prev.filter((_, i) => i !== idx));
  }

  // Handle new image upload in edit modal
  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setEditImageFiles(files);
  }
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageAltTexts, setImageAltTexts] = useState<string[]>([]);
  const [altInput, setAltInput] = useState("");
  // Overview content blocks (for service detail)
  type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
  type Block =
    | { id: string; type: "heading"; text: string; level: HeadingLevel }
    | { id: string; type: "paragraph"; text: string }
    | { id: string; type: "descriptionList"; items: { term: string; description: string }[]; file?: File | null; preview?: string }
    | { id: string; type: "image"; file?: File | null; preview?: string };
  const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const servicesRef = dbRef(db, "services");
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, s]: any) => ({ id, ...s }));
        setServices(list.reverse());
      } else {
        setServices([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setError("");
    if (files.length > 0) {
      Promise.all(
        files.map(
          file =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      ).then(setImagePreviews);
      // initialize alt texts for newly selected files (preserve previous if same length)
      setImageAltTexts(prev => {
        const next = files.map((_, i) => prev[i] || "");
        return next;
      });
    } else {
      setImagePreviews([]);
      setImageAltTexts([]);
    }
  };

  const addBlock = (type: Block["type"], headingLevel?: HeadingLevel) => {
    const id = makeId();
    if (type === "heading") setBlocks((s) => [...s, { id, type: "heading", text: "", level: headingLevel || 2 as HeadingLevel }]);
    if (type === "paragraph") setBlocks((s) => [...s, { id, type: "paragraph", text: "" }]);
    if (type === "descriptionList") setBlocks((s) => [...s, { id, type: "descriptionList", items: [{ term: "", description: "" }] }]);
    if (type === "image") setBlocks((s) => [...s, { id, type: "image", file: null, preview: undefined }]);
  };

  const updateBlockText = (id: string, text: string) => {
    setBlocks((s) => s.map((b) => (b.id === id && (b.type === "heading" || b.type === "paragraph") ? { ...b, text } : b)));
  };

  const updateDescriptionItem = (blockId: string, itemIndex: number, field: "term" | "description", text: string) => {
    setBlocks((s) => s.map((b) => {
      if (b.id !== blockId || b.type !== "descriptionList") return b;
      const newItems = [...(b as any).items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: text };
      return { ...b, items: newItems };
    }));
  };

  const addDescriptionItem = (blockId: string) => {
    setBlocks((s) => s.map((b) => (b.id !== blockId || b.type !== "descriptionList") ? b : { ...b, items: [...(b as any).items, { term: "", description: "" }] }));
  };

  const removeDescriptionItem = (blockId: string, itemIndex: number) => {
    setBlocks((s) => s.map((b) => {
      if (b.id !== blockId || b.type !== "descriptionList") return b;
      const newItems = (b as any).items.filter((_: any, idx: number) => idx !== itemIndex);
      return { ...b, items: newItems };
    }));
  };

  const handleBlockImageChange = (id: string, file: File | null) => {
    setBlocks((s) => s.map((b) => {
      if (b.id !== id) return b;
      if (b.type !== "image") return b;
      if (b.preview) URL.revokeObjectURL(b.preview as string);
      return { ...b, file, preview: file ? URL.createObjectURL(file) : undefined } as Block;
    }));
  };

  const removeBlock = (id: string) => setBlocks((s) => s.filter((b) => b.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !description.trim() || imagePreviews.length === 0) {
      setError("Please fill all fields and select at least one image.");
      return;
    }
    setSubmitting(true);
    try {
      // merged alt texts: prefer per-image input (imageAltTexts indexed), fall back to tag-style imageAltTexts array
      const mergedAltTexts = imagePreviews.map((_, i) => imageAltTexts[i] || imageAltTexts[i] || "");

      // process blocks: convert any block images to data URLs
      const blocksResult: any[] = [];
      let imgCounter = 0;
      for (const b of blocks) {
        if (b.type === "image") {
          if ((b as any).file) {
            // convert file to base64
            const url = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL((b as any).file as File);
            });
            imgCounter += 1;
            blocksResult.push({ type: "image", url, name: `${name}-${imgCounter}` });
          } else if ((b as any).preview) {
            blocksResult.push({ type: "image", url: (b as any).preview, name: (b as any).name ?? null });
          } else {
            blocksResult.push({ type: "image", url: null, name: null });
          }
        } else if (b.type === "heading") {
          blocksResult.push({ type: "heading", text: b.text, level: (b as any).level || 2 });
        } else if (b.type === "descriptionList") {
          // always store the description list
          blocksResult.push({ type: "descriptionList", items: (b as any).items || [{ term: "", description: "" }] });
          // if the descriptionList block has an attached image (file or preview), store it as a following image block
          if ((b as any).file) {
            // convert file to base64 and push as image block
            const url = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL((b as any).file as File);
            });
            imgCounter += 1;
            blocksResult.push({ type: "image", url, name: `${name}-dl-${imgCounter}` });
          } else if ((b as any).preview) {
            // preview may already be a stored url (when editing) or an object URL for new uploads
            blocksResult.push({ type: "image", url: (b as any).preview, name: (b as any).name ?? null });
          }
        } else if (b.type === "paragraph") {
          blocksResult.push({ type: "paragraph", text: b.text });
        }
      }

      if (editingId) {
        // update existing service
        await update(dbRef(db, `services/${editingId}`), {
          name,
          description,
          images: imagePreviews,
          altTexts: mergedAltTexts,
          blocks: blocksResult,
        });
      } else {
        await push(dbRef(db, "services"), {
          name,
          description,
          images: imagePreviews, // array of base64 strings
          altTexts: mergedAltTexts,
          blocks: blocksResult,
          createdAt: new Date().toISOString(),
        });
      }
      +      // reset form
        +      setName("");
      +      setDescription("");
      +      setImageFiles([]);
      +      setImagePreviews([]);
      +      setImageAltTexts([]);
      +      setBlocks([]);
      +      setAltInput("");
      +      setEditingId(null);
    } catch (err: any) {
      setError("Image upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Add Service</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Service Name</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter service name"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Service Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter service description"
            required
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Alt Texts</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={altInput}
              onChange={e => setAltInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const v = altInput.trim();
                  if (v) {
                    setImageAltTexts(prev => [...prev, v]);
                    setAltInput("");
                  }
                }
              }}
              placeholder="Type alt text and press Enter"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {imageAltTexts.map((alt, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 bg-gray-100 border rounded px-2 py-1 text-sm">
                <span className="max-w-[200px] truncate">{alt}</span>
                <button type="button" title="Remove" onClick={() => setImageAltTexts(prev => prev.filter((_, i) => i !== idx))} className="text-red-600 font-bold">&times;</button>
              </span>
            ))}
          </div>
          <label className="block font-semibold mb-1 mt-4">Service Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
            onChange={handleImageChange}
          />
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imagePreviews.map((img, idx) => (
                <div key={idx} className="flex flex-col items-start">
                  <img src={img} alt={imageAltTexts[idx] || `Preview ${idx + 1}`} className="h-20 w-20 object-cover rounded shadow" />
                  <input
                    type="text"
                    value={imageAltTexts[idx] || ""}
                    onChange={e => setImageAltTexts(prev => {
                      const copy = [...prev];
                      copy[idx] = e.target.value;
                      return copy;
                    })}
                    placeholder={`Alt text for image ${idx + 1}`}
                    className="mt-1 w-48 text-sm border rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overview content blocks editor */}
        <div className="border-t pt-4 mt-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-medium mr-2">Add Overview Content</span>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((level) => (
                <button type="button" key={level} onClick={() => addBlock("heading", level)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">H{level}</button>
              ))}
            </div>
            <button type="button" onClick={() => addBlock("paragraph")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Paragraph</button>
            <button type="button" onClick={() => addBlock("descriptionList")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Description List</button>
            <button type="button" onClick={() => addBlock("image")} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded">Image</button>
          </div>

          <div className="space-y-4">
            {blocks.map((b) => (
              <div key={b.id} className="p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div className="text-sm text-gray-600">{b.type === "heading" ? `H${(b as any).level || 2}` : b.type.toUpperCase()}</div>
                  <div className="flex items-center gap-2">
                    {b.type === "heading" && (
                      <select value={(b as any).level || 2} onChange={(e) => {
                        const level = parseInt(e.target.value) as HeadingLevel;
                        setBlocks((s) => s.map((bb) => bb.id === b.id && bb.type === 'heading' ? { ...bb, level } : bb));
                      }} className="text-sm border rounded px-2 py-1">
                        {([1, 2, 3, 4, 5, 6] as const).map((level) => <option key={level} value={level}>H{level}</option>)}
                      </select>
                    )}
                    <button type="button" onClick={() => removeBlock(b.id)} className="text-sm text-red-600">Remove</button>
                  </div>
                </div>

                {b.type === "heading" && (
                  <input value={b.text} onChange={(e) => updateBlockText(b.id, e.target.value)} className="w-full mt-2 border rounded px-3 py-2" placeholder="Heading text" />
                )}

                {b.type === "paragraph" && (
                  <textarea value={b.text} onChange={(e) => updateBlockText(b.id, e.target.value)} className="w-full mt-2 border rounded px-3 py-2 h-28" placeholder="Paragraph content" />
                )}

                {b.type === "descriptionList" && (
                  <div className="mt-2">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        {(b as any).items?.map((item: { term: string, description: string }, idx: number) => (
                          <div key={idx} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                value={item.term}
                                onChange={e => updateDescriptionItem(b.id, idx, "term", e.target.value)}
                                style={{ flex: 1, border: '1px solid #ccc', padding: '4px' }}
                                placeholder={`Term ${idx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeDescriptionItem(b.id, idx)}
                                style={{ color: 'red', border: 'none', background: 'none', padding: '0 8px', cursor: 'pointer' }}
                                title="Remove item"
                              >
                                ×
                              </button>
                            </div>
                            <textarea
                              value={item.description}
                              onChange={e => updateDescriptionItem(b.id, idx, "description", e.target.value)}
                              style={{ width: '100%', border: '1px solid #ccc', padding: '4px', marginTop: 4 }}
                              placeholder={`Description ${idx + 1}`}
                              rows={2}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addDescriptionItem(b.id)}
                          style={{ padding: '4px 12px', color: '#2563eb', border: '1px solid #93c5fd', borderRadius: 4, marginTop: 8, background: 'none', cursor: 'pointer' }}
                        >
                          + Add term & description
                        </button>
                      </div>
                      <div className="flex-1">
                        <label style={{ display: 'block', fontSize: 14, marginBottom: 8 }}>Upload Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0] ?? null;
                            setBlocks(blocks => blocks.map(block => {
                              if (block.id !== b.id || block.type !== "descriptionList") return block;
                              if (block.preview) URL.revokeObjectURL(block.preview as string);
                              return { ...block, file, preview: file ? URL.createObjectURL(file) : undefined };
                            }));
                          }}
                          style={{ marginBottom: 8 }}
                        />
                        {b.preview && (
                          <div style={{ marginTop: 8 }}>
                            <img
                              src={b.preview}
                              alt="Preview"
                              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 4, border: '1px solid #eee' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setBlocks(blocks => blocks.map(block => {
                                  if (block.id !== b.id || block.type !== "descriptionList") return block;
                                  if (block.preview) URL.revokeObjectURL(block.preview as string);
                                  return { ...block, file: null, preview: undefined };
                                }));
                              }}
                              style={{ color: 'white', background: 'red', border: 'none', borderRadius: '50%', width: 24, height: 24, position: 'absolute', top: 8, right: 8, cursor: 'pointer' }}
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {b.type === "image" && (
                  <div className="mt-2">
                    <input type="file" accept="image/*" onChange={(e) => handleBlockImageChange(b.id, e.target.files?.[0] ?? null)} />
                    {b.preview && <img src={b.preview} alt="block preview" className="mt-2 max-h-56 object-contain" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* No upload progress for base64 */}
        {error && <div className="mb-2 text-red-600">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Service" : "Add Service")}
        </button>
      </form>

      <h3 className="text-xl font-bold mb-4">All Services</h3>
      {loading ? (
        <div className="text-gray-500">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-gray-500">No services found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow p-4 flex flex-col items-center relative">
              {Array.isArray(service.images) && service.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 w-full justify-center">
                  {service.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Service ${service.name} ${idx + 1}`} className="h-20 w-20 object-cover rounded shadow" />
                  ))}
                </div>
              )}
              <h4 className="font-bold text-lg mb-1">{service.name}</h4>
              <p className="text-gray-600 mb-2 text-center">{service.description}</p>
              <span className="text-xs text-gray-400">{service.createdAt ? new Date(service.createdAt).toLocaleString() : ""}</span>
              <div className="flex gap-4 mt-3">
                {/* Edit Icon */}
                <button
                  title="Edit"
                  className="p-2 rounded hover:bg-blue-100"
                  onClick={() => handleEdit(service)}
                >
                  <svg width="22" height="22" fill="none" stroke="#4A00E0" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                </button>
                {/* Delete Icon */}
                <button
                  title="Delete"
                  className="p-2 rounded hover:bg-red-100"
                  onClick={() => handleDelete(service.id)}
                >
                  <svg width="22" height="22" fill="none" stroke="#E00C3B" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                </button>
              </div>
              {/* Edit Modal */}
              {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
                  <div className="bg-white rounded-lg p-8 w-full max-w-xl mx-4 shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Edit Service</h2>
                    <form onSubmit={handleUpdateService}>
                      <div className="mb-4">
                        <label className="block font-semibold mb-1">Service Name</label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block font-semibold mb-1">Service Description</label>
                        <textarea
                          className="w-full border rounded px-3 py-2"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          required
                          rows={3}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block font-semibold mb-1">Service Images</label>
                        {editImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editImages.map((img, idx) => (
                              <div key={idx} className="flex flex-col items-start relative">
                                <img src={img} alt={editAltTexts[idx] || `Edit Preview ${idx + 1}`} className="h-16 w-1/2 object-cover rounded shadow" />
                                <button type="button" className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" onClick={() => {
                                  // remove image and its alt text
                                  handleRemoveEditImage(idx);
                                  setEditAltTexts(prev => prev.filter((_, i) => i !== idx));
                                }} title="Remove image">&times;</button>
                                <input
                                  type="text"
                                  value={editAltTexts[idx] || ""}
                                  onChange={e => setEditAltTexts(prev => {
                                    const copy = [...prev];
                                    copy[idx] = e.target.value;
                                    return copy;
                                  })}
                                  placeholder={`Alt text for image ${idx + 1}`}
                                  className="mt-1 w-40 text-sm border rounded px-2 py-1"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-3">
                          <label className="block font-semibold mb-1">Alt Texts</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editAltInput}
                              onChange={e => setEditAltInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const v = editAltInput.trim();
                                  if (v) {
                                    setEditAltTexts(prev => [...prev, v]);
                                    setEditAltInput("");
                                  }
                                }
                              }}
                              placeholder="Type alt text and press Enter or click Add"
                              className="w-full border rounded px-3 py-2"
                            />
                            <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => {
                              const v = editAltInput.trim();
                              if (v) {
                                setEditAltTexts(prev => [...prev, v]);
                                setEditAltInput("");
                              }
                            }}>Add</button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editAltTexts.map((alt, i) => (
                              <span key={i} className="inline-flex items-center gap-2 bg-gray-100 border rounded px-2 py-1 text-sm">
                                <span className="max-w-[200px] truncate">{alt}</span>
                                <button type="button" onClick={() => setEditAltTexts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-600 font-bold">&times;</button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="w-full border rounded px-3 py-2 mt-2"
                          onChange={handleEditImageChange}
                        />
                        {editImageFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Array.from(editImageFiles).map((file, idx) => (
                              <div key={idx} className="flex flex-col items-start">
                                <span className="text-xs text-gray-500">{file.name}</span>
                                <input
                                  type="text"
                                  value={editAltTexts[editImages.length + idx] || ""}
                                  onChange={e => setEditAltTexts(prev => {
                                    const copy = [...prev];
                                    copy[editImages.length + idx] = e.target.value;
                                    return copy;
                                  })}
                                  placeholder={`Alt text for new image ${idx + 1}`}
                                  className="mt-1 w-40 text-sm border rounded px-2 py-1"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 justify-end">
                        <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => { setEditModalOpen(false); setEditAltInput(""); }}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold">Update</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddServiceTab;
