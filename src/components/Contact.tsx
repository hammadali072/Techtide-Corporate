import { useState, useRef, useEffect } from "react";
import Lottie from "lottie-react";
// emailjs removed — we now store messages in Firebase Realtime Database and open WhatsApp
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import WHATSAPP from "@/lib/contactConfig";
import ContactImg from "@/assets/contacts.png";
import Welcome from "../assets/Welcome.json";

type ContactProps = {
  productName?: string;
  productUrl?: string;
};

const Contact = ({ productName, productUrl }: ContactProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const imageRef = useRef(null);
  const formRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    // Add scroll animations
    const handleScroll = () => {
      const elements = document.querySelectorAll(".fade-in-up");
      elements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementTop < windowHeight - 100) {
          el.classList.add("animate-fade-in-up");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Firebase Realtime Database write
  // we'll import write functions lazily to avoid adding them at top if not needed
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // We only save messages to the database now. No external navigation.

    // Basic validation
    if (!formData.name || !formData.subject || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    try {
      const { getDatabase, ref, push, set } = await import("firebase/database");
      const { db } = await import("@/firebase");

      const messagesRef = ref(db, "messages");
      const newMessageRef = push(messagesRef);
      const payload = {
        name: formData.name,
        phone: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
        // optional product info
        productName: productName || null,
        productUrl: productUrl || null,
        // store the company phone to indicate where it should be sent
        toPhone: WHATSAPP.numberE164,
        createdAt: new Date().toISOString(),
      };

      await set(newMessageRef, payload);

      // Notify the user that the message was saved. We no longer open WhatsApp.
      toast({
        title: "Saved",
        description:
          "Your message was saved. We'll handle it from the dashboard.",
        variant: "success",
      });

      // Reset form
      setFormData({ name: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save your message. Please try again.",
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  return (
    <section id="contact" className="overflow-hidden">
      <div className="bg-gradient-to-br from-[#0d1b2a] to-[#1b263b] text-white py-8  relative">
        <div className="absolute top-0 left-0  overflow-hidden">
          <div className="absolute top-0 right-0 size-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse-slow"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container px-4 md:px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 relative z-10">
          <div className="fade-in-up ">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold animate-fade-in-up">
              Get in touch
            </h2>
            <p
              className="text-base sm:text-base text-gray-300 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Let's talk! Whether it's a project idea or a quick question, we’re
              just a message away.
            </p>
          </div>
          <div className="hidden relative lg:w-full lg:flex justify-center lg:justify-end">
            <div
              ref={imageRef}
              className="w-56 h-56 md:w-42 md:h-72 lg:w-44 lg:h-44 rounded-2xl border-4 border-indigo-400 shadow-2xl object-cover overflow-hidden transform rotate-3 transition-all duration-700 hover:rotate-0 hover:scale-105 relative z-10"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)",
                boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.4)",
              }}
            >
              <img
                className="w-44 object-cover"
                src={ContactImg}
                alt="Contact card illustration showing people connecting"
              /> 
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 to-transparent" />
            </div>
            <div className="hidden lg:block absolute -right-6 w-44 h-44 bg-indigo-500/20 rounded-2xl transform rotate-12 z-0" />
          </div> 
        </div>
      </div>

      <div className="relative py-12 md:py-16 lg:py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
            <div className="" ref={infoRef}>
              <Lottie
                animationData={Welcome}
                loop={true}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="fade-in-up" ref={formRef}>
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                <CardHeader className="lg:pl-10 p-5">
                  <CardTitle className="text-2xl font-semibold text-gray-800">
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 lg:pl-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className="animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 duration-300"
                        />
                      </div>
                      <div
                        className="animate-fade-in-up"
                        style={{ animationDelay: "0.3s" }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 duration-300"
                        />
                      </div>
                    </div>

                    <div
                      className="animate-fade-in-up"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                      />
                    </div>

                    <div
                      className="animate-fade-in-up"
                      style={{ animationDelay: "0.5s" }}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <Textarea
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="resize-none rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                      />
                    </div>

                    <div
                      className="animate-fade-in-up"
                      style={{ animationDelay: "0.6s" }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin h-5 w-5 mr-2 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8z"
                              />
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          <>
                            <Send className="size-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="hidden md:block absolute -top-20 -left-20 w-40 h-40 bg-indigo-100 rounded-full opacity-10 animate-float" />
        <div
          className="hidden md:block absolute -bottom-20 -right-20 w-60 h-60 bg-purple-100 rounded-full opacity-10 animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <style>{`
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
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
        
        @keyframes pulseSlow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .fade-in-up {
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </section>
  );
};

export default Contact;
