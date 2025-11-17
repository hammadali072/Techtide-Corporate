import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Award, Users, Target, BarChart3, Heart, Globe, Shield, Zap, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import foundationVideo from '../assets/Techtide foundation.mp4';
import Achievements from '../assets/leadership.json';
import Lottie from 'lottie-react';
import Leadership from "@/assets/Team.json";
import { motion, useInView } from 'framer-motion';
import PSEBLOGO from '../assets/Pakistan-Software-Export-Board-PSEB-Logo.jpg'
import SECPLOGO from '../assets/Securities-and-Exchange-Commission-of-Pakistan-Logo-Vector.svg-.png'

const About = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRefs = useRef([]);

  // Ref for values section
  const valuesRef = useRef(null);
  const isValuesInView = useInView(valuesRef, { once: true, threshold: 0.1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      clearTimeout(timer);
      sectionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  // Add ref to each section for scroll animations
  const addToRefs = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  // Animation variants for values cards
  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
       
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      x: 100,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      }
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      }
    }
  };

  const values = [
    { icon: Shield, title: "Integrity", desc: "Transparency, honesty, and ethics in every action.", color: "from-purple-500 to-purple-600" },
    { icon: Zap, title: "Innovation", desc: "Creativity at the heart of every product and service.", color: "from-blue-500 to-blue-600" },
    { icon: BarChart3, title: "Excellence", desc: "Commitment to delivering the highest quality in all endeavors.", color: "from-cyan-500 to-cyan-600" },
    { icon: Users, title: "Collaboration", desc: "Working together to achieve extraordinary results.", color: "from-indigo-500 to-indigo-600" },
  ];

  return (
    <section
      id="about"
      className="min-h-screen py-16 md:py-24 px-4 md:px-8 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-r from-purple-400/10 to-blue-400/10 transform -skew-y-6 -translate-y-32" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-full transform translate-x-64 translate-y-64" />

      {/* Animated floating elements */}
      <div className="absolute top-20 left-10 w-10 h-10 bg-purple-400/20 rounded-full animate-float" />
      <div className="absolute top-1/3 right-20 w-16 h-16 bg-blue-400/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-indigo-400/20 rounded-full animate-float" style={{ animationDelay: '4s' }} />

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
            style={{
              background: "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            About Techtide Co.
          </h2>
          <div className={`w-32 h-1 bg-gradient-to-r from-purple-600 to-blue-400 mx-auto transition-all duration-1000 delay-300 ease-out ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
        </div>

        {/* Foundation Section */}
        <div ref={addToRefs} className="fade-in-up mb-20">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12">
                <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Our Foundation</h3>
                <p className="xl:text-lg lg:text-xl text-base leading-relaxed text-gray-700 mb-6">Founded in <span className="text-purple-600 font-semibold">2025</span>, Techtide Co. emerged with a vision to revolutionize the digital landscape. Our journey began with a simple belief: technology should empower businesses, not complicate them.</p>
                <p className="xl:text-lg lg:text-xl text-base leading-relaxed text-gray-700">From our humble beginnings, we've grown into a comprehensive technology partner for businesses seeking digital transformation, innovation, and sustainable growth in an ever-evolving digital world.</p>
              </div>
              <div className="relative min-h-80 lg:min-h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10"></div>
                 <video
              className="w-full h-full object-cover"
              src={foundationVideo}
              autoPlay
              muted
              loop
              playsInline
              aria-label="Techtide Team video"
            />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div ref={addToRefs} className="fade-in-up mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Mission */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-3xl p-8 md:p-12 shadow-xl transform transition-all duration-500 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <Target className="w-10 h-10 mr-4" />
                <h3 className="text-2xl md:text-3xl font-bold">Our Mission</h3>
              </div>
              <p className="xl:text-lg lg:text-xl text-base leading-relaxed">To develop cutting-edge technology that enables businesses to transform digitally, increase operational efficiency, and achieve significant business outcomes through innovative solutions tailored to their unique needs.</p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white rounded-3xl p-8 md:p-12 shadow-xl transform transition-all duration-500 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <Globe className="w-10 h-10 mr-4" />
                <h3 className="text-2xl md:text-3xl font-bold">Our Vision</h3>
              </div>
              <p className="xl:text-lg lg:text-xl text-base leading-relaxed">To become the leading technology company by providing innovative solutions that drive global business advancement and create a more connected, efficient digital ecosystem for organizations worldwide.</p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div ref={valuesRef} className="mb-20">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Core Values</h3>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isValuesInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={cardVariants}
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl cursor-pointer"
              >
                <motion.div 
                  className={`w-14 h-14 rounded-xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-4`}
                  variants={iconVariants}
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                >
                  <value.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h4 className="text-xl font-semibold mb-2 text-gray-800">{value.title}</h4>
                <p className="text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Achievements & Recognition Section */}
        <div ref={addToRefs} className="fade-in-up mb-20">
          <div className="bg-gradient-to-br from-indigo-200 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-100">
            <h3 className="text-3xl font-bold text-center mb-12 text-indigo-800">Achievements & Certifications</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="space-y-6">
                  {[
                    // { icon: Award, title: "Best Innovative Tech Company 2025", desc: "Recognized for our groundbreaking solutions in the tech industry." },
                    { icon: SECPLOGO, title: "SECP Certification", desc: "Awarded for our commitment to corporate compliance and regulatory standards." },
                    { icon: PSEBLOGO, title: "PSEB Certification", desc: "Certified by Pakistan Software Export Board for quality software development and export services." },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      
                        <img src={item.icon} className="w-12 mr-4 mt-2 text-purple-600" />
                      

                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">{item.title}</h4>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-96">
                <div className=" bg-white rounded-2xl">
                  <Lottie
                    animationData={Achievements}
                    loop={true}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-500/20 rounded-full -z-10" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-500/20 rounded-full -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div ref={addToRefs} className="fade-in-up">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">Leadership & Team</h3>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative min-h-96">
                <div className="w-full h-full">
                  <Lottie
                    animationData={Leadership}
                    loop={true}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
               
              </div>

              <div className="p-8 md:p-12">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-purple-600">Muhammad Nadir</h4>
                    <p className="text-gray-600">CEO & Founder</p>
                    <p className="text-gray-700 mt-2">With 3+ years of experience in web design, social media, and business development, Muhammad leads our vision and strategic direction.</p>
                  </div>

                  <div>
                    <h4 className="text-xl font-semibold text-blue-600">Muhammad Moazzam</h4>
                    <p className="text-gray-600">CFO</p>
                    <p className="text-gray-700 mt-2">Oversees daily operations and ensures our projects meet the highest standards of quality and client satisfaction.</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-blue-600">Sajideen Hassan</h4>
                    <p className="text-gray-600">CTO</p>
                    <p className="text-gray-700 mt-2">Oversees daily operations and ensures our projects meet the highest standards of quality and client satisfaction.</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-blue-600">Shamin Gull</h4>
                    <p className="text-gray-600">COO</p>
                    <p className="text-gray-700 mt-2">Oversees daily operations and ensures our projects meet the highest standards of quality and client satisfaction.</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div
          ref={addToRefs}
          className={`fade-in-up mt-20 text-center transition-all duration-1000 delay-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <Link to="/ourteam">
            <Button size="lg" variant="default">Connect With Our Team</Button>
          </Link>
        </div>
      </div>

      <style >{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        
        .fade-in-up {
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
      `}</style>

    </section>
  );
};

export default About;