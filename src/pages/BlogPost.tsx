import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref as dbRef, get as dbGet } from "firebase/database";
import Seo from "@/components/Seo";
import { format } from "date-fns";

// Redesigned BlogPost component using Tailwind for a modern, clean layout.
// - Top page title (only one large colored title) shown in accent color.
// - Article area: first shows post title then blocks arranged so that
//   when a text block is adjacent to an image block they appear side-by-side
//   with content and image on opposite sides (alternating direction).
// - Sidebar condensed into an info card.
// - Related posts kept as compact cards.

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  // track which text blocks are expanded (by block index)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({});

  const toggleBlock = (idx: number) => {
    setExpandedBlocks((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const snap = await dbGet(dbRef(db, `blogs/${slug}`));
        if (snap.exists()) {
          const data = snap.val();
          if (data.createdBy && data.createdBy.length > 8) {
            try {
              const userSnap = await dbGet(dbRef(db, `users/${data.createdBy}`));
              if (userSnap.exists()) {
                const u = userSnap.val();
                data._authorName = u.displayName || u.name || data.createdBy;
              } else {
                data._authorName = data.createdBy;
              }
            } catch (e) {
              console.warn("Failed to load author name", e);
              data._authorName = data.createdBy;
            }
          } else {
            data._authorName = data.createdBy || "Unknown";
          }
          setPost(data);
        }
      } catch (e) {
        console.error("Failed to load post", e);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const snap = await dbGet(dbRef(db, `blogs`));
        if (!snap.exists()) return setRelated([]);
        const all = snap.val() || {};
        const arr = Object.keys(all).map((k) => ({ id: k, ...all[k] }));
        const others = arr.filter((a) => a.id !== slug);
        others.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        setRelated(others.slice(0, 4));
      } catch (e) {
        console.error("Failed to load related posts", e);
      }
    })();
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-gray-500">Loading post…</div>
      </div>
    );
  }

  // Helper to render content blocks with alternating image/text layout
  const renderBlocks = () => {
    const blocks = post.blocks || [];
    return (
      <div className="space-y-4">
        {blocks.map((b, idx) => {
          if (b.type === "heading") {
            const headingLevel = b.level || 2; // Default to h2 if level not specified
            const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
            const fontSize = {
              1: "text-3xl",
              2: "text-2xl",
              3: "text-xl",
              4: "text-lg",
              5: "text-base",
              6: "text-sm"
            }[headingLevel] || "text-2xl";

            return (
              <HeadingTag key={idx} className={`${fontSize} font-bold text-slate-800 mb-1.5`}>
                {b.text}
              </HeadingTag>
            );
          }
          if (b.type === "bulletList") {
            return (
              <ul key={idx} className="pl-0 space-y-3 text-slate-700">
                {b.items?.map((item: string, itemIdx: number) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-base leading-relaxed">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          }
          if (b.type === "paragraph") {
            const text = (b.text || "").toString();
            const words = text.split(/\s+/).filter(Boolean);
            const isExpanded = !!expandedBlocks[idx];
            const showToggle = words.length > 100;
            const displayed = isExpanded ? text : words.slice(0, 100).join(" ") + (words.length > 100 ? "…" : "");
            return (
              <div key={idx} className="w-full">
                <p className="text-lg leading-relaxed text-slate-700">{displayed}</p>
                {showToggle && (
                  <button
                    aria-expanded={isExpanded}
                    onClick={() => toggleBlock(idx)}
                    className="mt-2 text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            );
          }
          if (b.type === "image" && b.url) {
            return (
              <figure key={idx} className="w-full flex flex-col items-center">
                <img
                  src={b.url}
                  alt={post.description || `Image ${idx + 1}`}
                  className="rounded-lg shadow-md w-full max-h-[400px] object-cover mb-2"
                />
                {b.name && (
                  <figcaption className="capitalize text-sm text-gray-500 italic text-center">
                    {b.name.split("-").join(" ").split(".jpeg")}
                  </figcaption>
                )}
              </figure>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Seo title={post.title} description={post.description} />

      {/* Enhanced header with blog image and themed gradient */}
      <header className="relative min-h-[320px] sm:min-h-[450px] md:min-h-[520px] mt-10 overflow-hidden">
        {/* Background image with a lighter gradient overlay so image shows through */}
        <div className="absolute inset-0">
          {post.mainImageUrl ? (
            <img
              src={post.mainImageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
          )}
          {/* lighter overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </div>

        {/* Content container: add top padding on small screens and center on larger screens */}
        <div className="relative h-full px-4 sm:px-6 flex items-start sm:items-center pt-24 sm:pt-28 md:pt-36">
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-4xl">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 drop-shadow-sm">
                {post.title}
              </h1>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm sm:text-base text-white/90">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span className="truncate">By {post._authorName || post.createdBy || "Unknown"}</span>
                </div>
                <span className="hidden sm:inline text-white/60">•</span>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <span className="whitespace-nowrap">{post.createdAt ? format(new Date(post.createdAt), "PPP") : ""}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10">
        {/* Main article full-width */}
        <article className="w-full bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
          <div className="mb-6 sm:mb-8">
            {post.description && (
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                {post.description}
              </p>
            )}
          </div>

          <div className="space-y-6 sm:space-y-8">{renderBlocks()}</div>
        </article>

        <div className="flex justify-center mt-8 sm:mt-12 mb-6 sm:mb-8 px-4">
          <Link
            to="/blog"
            className="group flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-slate-700 hover:text-blue-600 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 sm:h-5 sm:w-5 transform group-hover:-translate-x-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            <span className="font-medium text-sm sm:text-base">Back to all posts</span>
          </Link>
        </div>

        {/* Related posts section with enhanced design */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
          <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">You might also like</h3>
            {related.length === 0 ? (
              <div className="text-slate-500">No suggestions available</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {related.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                    <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                      {r.mainImageUrl ? (
                        <img src={r.mainImageUrl} alt={r.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-12 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      <Link
                        to={`/blog/${r.id}`}
                        className="block text-base sm:text-lg font-semibold text-slate-800 hover:text-blue-500 duration-300 mb-2 line-clamp-2"
                      >
                        {r.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                        <span>{r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BlogPost;
