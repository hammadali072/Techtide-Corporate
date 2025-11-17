import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

interface Blog {
    id: string;
    title: string;
    description: string;
    mainImageUrl: string;
}

const BlogSec: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);

    useEffect(() => {
        const blogRef = ref(db, "blogs");
        const unsubscribe = onValue(blogRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const blogList = Object.entries(data).map(([id, value]: any) => ({
                    id,
                    ...value,
                }));
                setBlogs(blogList);
            } else {
                setBlogs([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Take only the first 7 blogs and arrange into three columns [2, 3, 2]
    const displayBlogs = blogs.slice(0, 7); // Only show first 7 blogs
    const columnSizes = [2, 3, 2]; // Left: 2, Center: 3, Right: 2
    const columns: Blog[][] = [[], [], []];
    
    if (displayBlogs.length > 0) {
        let blogIndex = 0;
        
        // Distribute exactly 7 blogs to columns according to the specified sizes
        for (let colIndex = 0; colIndex < 3; colIndex++) {
            const targetSize = columnSizes[colIndex];
            for (let i = 0; i < targetSize && blogIndex < displayBlogs.length; i++) {
                columns[colIndex].push(displayBlogs[blogIndex]);
                blogIndex++;
            }
        }
    }

    // set up scroll-linked motion values for column parallax
    const rightRef = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({ target: rightRef, offset: ["start end", "end start"] });

    // map scroll progress to y offsets for each column. Values in px.
    const yCol0 = useSpring(useTransform(scrollYProgress, [0, 1], [30, -150]), { stiffness: 50, damping: 20 });
    const yCol1 = useSpring(useTransform(scrollYProgress, [0, 1], [-100, 100]), { stiffness: 60, damping: 20 });
    const yCol2 = useSpring(useTransform(scrollYProgress, [0, 1], [30, -150]), { stiffness: 50, damping: 20 });

    return (
        <section className="relative py-16 bg-white before:content-[''] before:absolute before:bottom-[-150px] before:right-[-150px] before:size-[700px] before:rounded-full before:bg-blue-500/50 before:blur-3xl overflow-hidden">
            <div className="container">
                <div className="flex lg:flex-row flex-col lg:gap-12 gap-6 items-start">
                    {/* Left: Heading & CTA */}
                    <div className="lg:w-5/12">
                        <h5 className="text-blue-500 font-semibold mb-2 tracking-wide uppercase text-sm">Featured Insights</h5>
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4"
                            style={{
                                background: "linear-gradient(120deg, #4A00E0 10%, #00C9FF 90%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            Stories of our transformations across Services and Industries
                        </h2>
                        <p className="text-black text-xl mb-8">From Concept to Completion</p>
                        <a
                            href="/blog"
                            className="inline-block bg-blue-500 text-white font-semibold px-6 py-3 rounded-full shadow hover:bg-blue-600 transition-colors"
                        >
                            Explore More 
                        </a>
                    </div>

                    {/* Right: Blog Cards arranged into 3 columns (2,3,2) - Only 7 blogs total */}
                    <div ref={rightRef} className="lg:w-7/12 grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-8 lg:py-12">
                        {displayBlogs.length === 0 ? (
                            <p className="text-gray-400 col-span-3 text-center">No blogs available yet.</p>
                        ) : (
                            columns.map((col, colIdx) => {
                                const yStyle = colIdx === 0 ? yCol0 : colIdx === 1 ? yCol1 : yCol2;
                                return (
                                    <motion.div key={colIdx} style={{ y: yStyle }} className="flex flex-col gap-6 will-change-transform disable-motion-lg">
                                        {col.map((blog) => (
                                            <div
                                                key={blog.id}
                                                className="rounded-xl min-h-60 shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative group"
                                            >
                                                {blog.mainImageUrl ? (
                                                    <>
                                                        {/* Use an <img> for reliable rendering and lazy loading */}
                                                        <img
                                                            src={blog.mainImageUrl}
                                                            alt={blog.title}
                                                            className="absolute inset-0 w-full h-full object-cover duration-300 group-hover:scale-110 group-hover:blur-sm"
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                // hide broken image so fallback content shows
                                                                (e.currentTarget as HTMLImageElement).style.display = "none";
                                                                console.warn("Failed to load blog image:", blog.mainImageUrl);
                                                            }}
                                                            style={{ zIndex: 1 }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/40" style={{ zIndex: 5 }} />
                                                        <div className="p-5 relative h-40 sm:h-40 flex flex-col" style={{ zIndex: 10 }}>
                                                            <h3 className="text-sm font-bold text-white/90 mb-1">Blogs</h3>
                                                            <Link to={`/blog/${blog.id}`} className="text-white">
                                                                <h4 className="text-lg leading-tight font-semibold mb-1 text-white duration-300 ">{blog.title}</h4>
                                                            </Link>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="p-5">
                                                        <h3 className="text-md font-bold text-blue-500 mb-2">Blogs</h3>
                                                        <a href={`/blog/${blog.id}`} className="text-black no-underline group">
                                                            <h4 className="text-lg leading-tight font-semibold mb-2 text-black duration-300 group-hover:text-blue-500">{blog.title}</h4>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BlogSec;