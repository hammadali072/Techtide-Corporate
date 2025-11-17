import { useState } from "react";
import { motion } from "framer-motion";

export default function DemoBlog() {
  const [search, setSearch] = useState("");

  const posts = [
    {
      id: 1,
      title: "The Future of AI in Web Development",
      date: "October 7, 2025",
      author: "Bilal Butt",
      excerpt:
        "Artificial intelligence is transforming the way we build and optimize websites. Here's how developers can adapt to this new wave...",
    },
    {
      id: 2,
      title: "Mastering React Hooks for Modern Apps",
      date: "September 28, 2025",
      author: "Techtide Co.",
      excerpt:
        "React Hooks simplify state management and logic reuse. Discover the best practices for using Hooks effectively...",
    },
    {
      id: 3,
      title: "How to Boost Website SEO with React",
      date: "September 15, 2025",
      author: "Tech Trends",
      excerpt:
        "SEO in React apps can be challenging, but with the right setup and practices, your site can rank high in Google search results...",
    },
  ];

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-gray-100 p-4">
      <header className="max-w-5xl mx-auto flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-gray-900">
            TB
          </div>
          <h1 className="text-xl font-semibold">Read Our Latest Article</h1>
        </div>
        <nav className="hidden md:flex gap-4 text-sm text-gray-400">
          <a href="#" className="hover:text-white">Home</a>
          <a href="#" className="hover:text-white">About</a>
          <a href="#" className="hover:text-white">Contact</a>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto mt-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-3">Welcome to the Demo Blog</h2>
          <p className="text-gray-400">Explore trending articles in tech, AI, and web development.</p>
          <div className="mt-5 flex justify-center">
            <input
              type="text"
              placeholder="Search posts..."
              className="px-4 py-2 rounded-l-lg bg-slate-800 border border-slate-700 focus:outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="px-4 py-2 rounded-r-lg bg-cyan-500 text-slate-900 font-medium">
              Search
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              whileHover={{ scale: 1.03 }}
              className="bg-slate-800/60 p-5 rounded-2xl shadow-md border border-slate-700 cursor-pointer"
            >
              <h3 className="text-lg font-semibold mb-1">{post.title}</h3>
              <p className="text-xs text-gray-400 mb-2">
                {post.date} • {post.author}
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{post.excerpt}</p>
              <div className="mt-4 text-cyan-400 text-sm font-medium hover:underline">Read more →</div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="max-w-5xl mx-auto mt-16 py-6 text-center text-gray-500 text-sm border-t border-slate-800">
        © 2025 Techtide Co. All rights reserved.
      </footer>
    </div>
  );
}