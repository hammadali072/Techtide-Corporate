import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref as dbRef, onValue } from "firebase/database";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

import Seo from "@/components/Seo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Arrow } from "@radix-ui/react-tooltip";


const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const r = dbRef(db, "blogs");
    const cleanup = onValue(r, (snap) => {
      const v = snap.val() || {};
      const arr = Object.keys(v).map((k) => ({ id: k, ...v[k] }));
      arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setPosts(arr);
    });
    return () => { /* onValue returns unsubscribe via off: use ref().off if needed */ };
  }, []);

  return (
    <>
      <div className="min-h-screen py-28 container mx-auto px-4">
        <Seo title="Blog | Textile Tales" description="Latest articles and news" />
        <div className="mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Read Our Latest <span className="text-blue-600">Blogs</span></h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover our newest blogs on technology, business, and marketing that drive digital transformation.</p>
            <div className="mt-3 text-sm text-slate-600">{posts.length} articles</div>
          </div>
        </div>

        {/* Featured / Latest section */}
        {posts.length > 0 && (
          <section className="grid gap-6 lg:grid-cols-4 mb-8">
            {/* Large featured post */}
            <div className="lg:col-span-2 bg-white rounded-lg overflow-hidden shadow-md relative duration-300 group hover:shadow-lg">
              <Link to={`/blog/${posts[0].id}`} className="relative h-80 w-full overflow-hidden group">
                {posts[0].mainImageUrl ? (
                  <img src={posts[0].mainImageUrl} alt={`${posts[0].title}, ${posts[0].description}`} className="w-full h-full object-cover duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30" />

                {/* Latest badge */}
                <div className="absolute right-6 top-6 flex gap-2">
                  {posts[0].category && (
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg transition-all duration-300 hover:bg-white hover:scale-105">
                      {posts[0].category}
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-6">
                <div className="text-xs text-gray-500">{posts[0].createdAt ? format(new Date(posts[0].createdAt), 'MMM d, yyyy') : '-'}</div>
                <Link to={`/blog/${posts[0].id}`} className="text-2xl font-bold my-2 line-clamp-2 hover:text-blue-500">{posts[0].title}</Link>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{posts[0].description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">By {posts[0].createdBy || 'Unknown'}</div>
                </div>
              </div>
            </div>

            {/* Smaller latest posts (up to 3) */}
            <div className="lg:col-span-2 grid gap-6 sm:grid-cols-2">
              {posts.slice(1, 5).map((p) => (
                <article key={p.id} className="bg-white rounded-lg overflow-hidden shadow-md transition-shadow group hover:shadow-lg">
                  <Link to={`/blog/${p.id}`} className="relative h-40 w-full overflow-hidden">
                    {p.mainImageUrl ? (
                      <img src={p.mainImageUrl} alt={p.description} className="w-full h-full object-cover duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20" />
                    {p.category && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg transition-all duration-300 hover:bg-white hover:scale-105">
                          {p.category}
                        </span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="text-xs text-gray-500">{p.createdAt ? format(new Date(p.createdAt), 'MMM d, yyyy') : '-'}</div>
                    <Link to={`/blog/${p.id}`} className="text-lg font-semibold line-clamp-2 duration-300 hover:text-blue-500 mt-1">{p.title}</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Remaining posts grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(4).map((p) => (
            <article key={p.id} className="bg-white shadow-md rounded-lg overflow-hidden duration-300 group hover:shadow-lg transition-shadow">
              <Link to={`/blog/${p.id}`} className="relative h-44 w-full overflow-hidden">
                {p.mainImageUrl ? (
                  <img src={p.mainImageUrl} alt={p.description} className="w-full h-full object-cover duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-30" />
                {p.category && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg transition-all duration-300 hover:bg-white hover:scale-105">
                      {p.category}
                    </span>
                  </div>
                )}
              </Link>

              <div className="p-4">
                <div className="flex flex-col mb-2">
                  <div className="text-xs text-gray-500">{p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : "-"}</div>
                  <Link to={`/blog/${p.id}`} className="text-lg font-semibold line-clamp-2 duration-300 hover:text-blue-500 mt-2">{p.title}</Link>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.description}</p>
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-gray-400">By {p.createdBy || "Unknown"}</div>
                  <Link to={`/blog/${p.id}`} className="relative w-fit inline-flex gap-2 text-base font-semibold text-blue-600 before:content-[''] before:absolute before:w-0 before:h-0.5 before:bg-blue-600 before:bottom-0 before:left-0 before:duration-300 hover:before:w-full">
                    <span>Read More</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default BlogList;
