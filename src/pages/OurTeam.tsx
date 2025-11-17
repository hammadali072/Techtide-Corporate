import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Linkedin, Instagram, Facebook, Mail, Github, Twitter } from "lucide-react";
import { db } from "@/firebase";
import { ref as dbRef, onValue } from "firebase/database";
import Lottie from "lottie-react";
import LoadAnimation from "../../src/assets/Loading Animation.json";

const RolePill = ({ role }: { role?: string }) => (
  <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white sm:text-sm text-xs font-medium px-3 py-1 rounded-full">
    {role}
  </span>
);

const SocialIcon = ({ platform, link }: { platform?: string; link?: string }) => {
  const icons: Record<string, JSX.Element> = {
    linkedin: <Linkedin className="w-5 h-5" />,
    twitter: <Twitter className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    github: <Github className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
    portfolio: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-8h16v8H4z" />
      </svg>
    ),
  };

  const key = (platform || "").toLowerCase();
  const icon = icons[key] || icons["portfolio"];

  return (
    <motion.a
      href={link}
      whileHover={{ translateY: -3 }}
      whileTap={{ scale: 0.9 }}
      className="flex justify-center items-center md:size-12 size-11 bg-gray-50 rounded-full text-blue-600 transition-colors hover:text-gray-50 hover:bg-blue-600"
    >
      {icon}
    </motion.a>
  );
};

const TeamCard = ({ member, index, isExpanded, onExpand }) => {
  const socialList = Array.isArray(member.social)
    ? member.social
    : member.social
    ? Object.entries(member.social).map(([platform, url]) => ({ platform, url }))
    : [];

  if (member.email) {
    const hasEmail = socialList.some(
      (s: any) =>
        (s.platform || "").toLowerCase() === "email" ||
        (s.platform || "").toLowerCase() === "mail"
    );
    if (!hasEmail) socialList.unshift({ platform: "email", url: `mailto:${member.email}` });
  }

  const strengths: string[] = Array.isArray(member.highlights) && member.highlights.length
    ? member.highlights
    : member.keyFocus
    ? member.keyFocus.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const previewStrengths = strengths.slice(0, 2);
  const descriptionText: string = member.description || "";
  const needsTruncate = descriptionText.length > 240;

  const clamp4: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-2xl h-fit overflow-hidden shadow-lg"
    >
      <div className="flex sm:flex-row flex-col">
        <div className="relative sm:w-2/5 sm:h-auto w-full h-full overflow-hidden">
          <motion.img
            src={member.photo || member.image}
            alt={member.description}
            className="aspect-square w-full h-full object-cover object-top duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <div className="absolute top-4 left-4">
            <RolePill role={member.role} />
          </div>
        </div>

        <div className="sm:w-3/5 p-6">
          <motion.h3
            className="text-2xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {member.name}
          </motion.h3>

          <p className="text-base text-gray-600 mb-4" style={!isExpanded ? clamp4 : undefined}>
            {member.description}
          </p>

          {!isExpanded && previewStrengths.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Key Strengths:</h4>
              <ul className="space-y-1">
                {previewStrengths.map((point, i) => (
                  <li key={i} className="flex items-center gap-x-3 text-gray-600">
                    <div className="size-1.5 bg-blue-500 rounded-full" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isExpanded && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Key Strengths:</h4>
              <ul className="space-y-1">
                {strengths.map((point, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <div className="size-1.5 bg-blue-500 rounded-full" />
                    <span className="text-gray-600">{point}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center flex-wrap gap-2 mt-6">
            <div className="flex gap-x-3">
              {socialList.map((s, i) => (
                <SocialIcon key={s.platform + i} platform={s.platform} link={s.url} />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onExpand}
              className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md font-medium text-sm shadow-md"
            >
              {isExpanded ? "Show Less" : needsTruncate ? "Show More" : "View Profile"}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const OurTeam = () => {
  const [expandedCard, setExpandedCard] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [ceo, setCeo] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    const membersRef = dbRef(db, "officeMembers");
    const unsubscribe = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, m]: any) => ({ id, ...m }));
        const ceoItem =
          list.find((x: any) => (x.role || "").toLowerCase().includes("ceo")) || null;
        const others = list.filter((x: any) => x !== ceoItem);
        setCeo(ceoItem);
        setMembers(others);
      } else {
        setCeo(null);
        setMembers([]);
      }
      setLoadingMembers(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNavigate = () => {
    navigate("/careers");
  };

  // ✅ Full Screen Loader
  if (loadingMembers) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-indigo-300 z-50">
        <Lottie animationData={LoadAnimation} loop className="w-72 h-72 mb-6" />
        <p className="text-gray-700 text-lg font-semibold">Loading TechTide Co. Team...</p>
      </div>
    );
  }

  // ✅ Main Page Content
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-32 pb-16 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="lg:text-5xl text-4xl font-bold text-gray-800 mb-4">
            Our <span className="text-blue-600">Leadership</span> Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the talented professionals driving innovation and excellence at TechTide Co.
          </p>
        </motion.div>

        {/* CEO Spotlight */}
        {ceo && (
          <motion.div
            className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 p-0 flex flex-row items-stretch justify-stretch">
                <motion.img
                  src={ceo.photo}
                  alt={ceo.description}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                />
                <div className="absolute top-4 left-4">
                  <RolePill role={ceo.role || "CEO"} />
                </div>
              </div>
              <div className="lg:w-3/5 lg:p-12 sm:p-8 p-5 flex flex-col justify-center">
                <h2 className="sm:text-3xl text-2xl font-bold mb-2 text-gray-800">{ceo.name}</h2>
                <div className="sm:text-xl text-lg font-semibold mb-4 text-blue-600">
                  {ceo.role}
                </div>
                <div className="flex space-x-4 mb-6">
                  {(ceo.social || []).map((s: any, i: number) => (
                    <SocialIcon key={i} platform={s.platform} link={s.url} />
                  ))}
                  {ceo.email && (
                    <SocialIcon key="ceo-email" platform="email" link={`mailto:${ceo.email}`} />
                  )}
                </div>
                <h3 className="md:text-2xl text-xl font-bold text-gray-800 mb-4">
                  Message from our CEO
                </h3>
                <p className="text-gray-600 mb-6 md:text-lg text-base">{ceo.description}</p>
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Key Focus Areas:</h4>
                  {ceo.keyFocus ? (
                    ceo.keyFocus.includes(",") ? (
                      <ul className="space-y-2">
                        {ceo.keyFocus.split(",").map((k: string, i: number) => (
                          <motion.li
                            key={i}
                            className="flex items-center gap-x-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                          >
                            <div className="size-1.5 bg-blue-500 rounded-full" />
                            <span className="text-gray-600">{k.trim()}</span>
                          </motion.li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">{ceo.keyFocus}</p>
                    )
                  ) : null}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-fit px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium"
                >
                  Contact CEO
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Team Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {members.map((member, index) => (
            <TeamCard
              key={member.id || index}
              member={member}
              index={index}
              isExpanded={expandedCard === index + 1}
              onExpand={() => setExpandedCard(expandedCard === index + 1 ? -1 : index + 1)}
            />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl lg:p-12 md:p-8 p-5 text-center text-white mt-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2 className="sm:text-3xl text-2xl font-bold mb-4">Join Our Growing Team</h2>
          <p className="lg:text-xl md:text-lg text-base mb-8 max-w-3xl mx-auto">
            We're always looking for talented individuals to help us shape the future of
            technology and textiles.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:px-8 px-5 py-3 bg-white text-blue-600 rounded-lg font-bold md:text-lg text-base"
            onClick={handleNavigate}
          >
            View Open Positions
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default OurTeam;
