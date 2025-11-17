import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase";
import { ref as dbRef, push, set } from "firebase/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

const Careers = () => {
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    message: "",
  });

  const [internCv, setInternCv] = useState<File | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const applied = localStorage.getItem('hasApplied');
    setHasApplied(applied === 'true');
  }, []);

  const jobs = [
    {
      title: "Senior Full Stack Developer",
      location: "On-site",
      type: "Full-time",
      description: "Join our team to build cutting-edge web applications using React, Node.js, and cloud technologies.",
    },
    {
      title: "UI/UX Designer",
      location: "On-site",
      type: "Full-time",
      description: "Create beautiful and intuitive user experiences for our clients' digital products.",
    },
    {
      title: "DevOps Engineer",
      location: "On-site",
      type: "Full-time",
      description: "Manage and optimize our cloud infrastructure and deployment pipelines.",
    },
    {
      title: "AI/ML Engineer",
      location: "On-site",
      type: "Full-time",
      description: "Develop and deploy machine learning models to solve real-world business problems.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasApplied) {
      toast({ title: "Already submitted", description: "You have already submitted an application. Each user can only apply once.", variant: "destructive" });
      handleNavigate();
      return;
    }

    // Save internship application to Realtime Database (no WhatsApp forwarding)
    (async () => {
      try {
        const internshipsRef = dbRef(db, 'internships');
        const newInternRef = push(internshipsRef);
        const internshipId = newInternRef.key;

        // If intern uploaded a CV, convert to data URL and include it in DB
        let cvDataUrl: string | null = null;
        if (internCv) {
          cvDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string | ArrayBuffer | null;
              resolve(typeof result === 'string' ? result : String(result));
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(internCv as Blob);
          });
        }

        const payload = {
          internshipId,
          jobTitle: formData.position,
          name: formData.name,
          phone: null,
          coverLetter: formData.message,
          cvLink: cvDataUrl,
          status: 'contacting',
          createdAt: new Date().toISOString(),
        };

        await set(newInternRef, payload);

        // We only save the application. Do not open WhatsApp from the client.
        localStorage.setItem('hasApplied', 'true');
        toast({ title: "Submitted", description: `Your application is being submitted successfully.`, variant: "success" });
        setHasApplied(true);
        setFormData({ name: "", position: "", message: "" });
        setInternCv(null);
        // navigate to home after successful submission
        handleNavigate();
      } catch (err) {
        console.error('Failed to submit internship application', err);
        toast({ title: "Error", description: 'Could not submit application. Please try again.', variant: "destructive" });
        handleNavigate();
      }
    })();
  };

  // Modal state for job application
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [appForm, setAppForm] = useState({ name: "", email: "", phone: "", cover: "", cv: null as File | null });

  const openApplyModal = (jobTitle: string) => {
    setSelectedJob(jobTitle);
    setIsApplyOpen(true);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasApplied) {
      toast({ title: "Already submitted", description: "You have already submitted an application. Each user can only apply once.", variant: "destructive" });
      handleNavigate()
      return;
    }

    // Save application record to Realtime Database, storing CV as a data URL (no Storage)
    (async () => {
      try {
        const applicationsRef = dbRef(db, 'applications');
        const newAppRef = push(applicationsRef);
        const applicationId = newAppRef.key;

        // convert CV file to data URL if provided
        let cvDataUrl: string | null = null;
        if (appForm.cv) {
          cvDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string | ArrayBuffer | null;
              resolve(typeof result === 'string' ? result : String(result));
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(appForm.cv as Blob);
          });
        }

        const payload = {
          applicationId,
          jobTitle: selectedJob,
          name: appForm.name,
          phone: appForm.phone,
          coverLetter: appForm.cover,
          cvLink: cvDataUrl, // store CV as data URL in the database
          status: 'contacting', // default status: contacting | interview | cancel | hire
          createdAt: new Date().toISOString(),
        };

        await set(newAppRef, payload);

        // Do not open WhatsApp. Keep submission server-only from here.
        localStorage.setItem('hasApplied', 'true');
        toast({ title: "Submitted", description: "Your application is being submitted successfully.", variant: "success" });
        setHasApplied(true);
        setIsApplyOpen(false);
        handleNavigate();
        setAppForm({ name: "", email: "", phone: "", cover: "", cv: null });
      } catch (err) {
        console.error('Failed to submit application', err);
        toast({ title: "Error", description: 'Could not submit application. Please try again.', variant: "destructive" });
      }
    })();
  };

  const navigate = useNavigate();
  const handleNavigate = () => {
    navigate("/");
    console.log("Navigated to home page");
  }

  return (
    <>
      <div className="min-h-screen pt-20">
        {/* Hero Section */}
        <section
          className="py-20"
          style={{
            background: "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)"
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl sm:text-6xl font-heading font-bold mb-6 text-white">Join Our Team</h1>
            <p className="text-xl text-white max-w-3xl mx-auto">Be part of an innovative team shaping the future of technology</p>
          </div>
        </section>

        {/* Current Openings */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-heading font-bold mb-12 text-center gradient-text">Current Openings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {jobs.map((job, index) => (
                <Card
                  key={index}
                  className="hover-lift border-2 hover:border-primary/50 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                      <span className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {job.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <Button
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      onClick={() => openApplyModal(job.title)}
                    >
                      Apply Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Internship Section */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-heading font-bold mb-8 text-center gradient-text">Internship Opportunities</h2>
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-blue-400 flex items-center justify-center">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-heading font-bold">Student Internship Program</h3>
                      <p className="text-muted-foreground">3 months · On-site · Multiple positions</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">Gain hands-on experience working on real projects with experienced mentors. Perfect for students looking to jumpstart their tech careers.</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          className="hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                        />
                      </div>
                      {/* Email removed - submissions open WhatsApp directly */}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Position of Interest *</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) =>
                          setFormData({ ...formData, position: e.target.value })
                        }
                        placeholder="e.g., Frontend Developer Intern"
                        required
                        className="hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Cover Letter *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        placeholder="Tell us why you'd be a great fit..."
                        rows={5}
                        required
                        className="hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="intern-cv">Upload CV (PDF)</Label>
                      <input
                        id="intern-cv"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setInternCv(e.target.files ? e.target.files[0] : null)}
                        className="p-10 w-full border-2 border-dashed rounded-md hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gradient-bg font-semibold"
                    >
                      Submit Application
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        {/* Application Modal */}
        <Dialog open={isApplyOpen} onOpenChange={(open) => setIsApplyOpen(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for {selectedJob}</DialogTitle>
              <DialogDescription>
                Please fill out the form below to apply for the position.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAppSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">Full Name *</Label>
                  <Input
                    id="app-name"
                    value={appForm.name}
                    onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                    required
                    className="w-full hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                  />
                </div>
                {/* Email removed from modal - applicants will be prompted to provide contact through WhatsApp */}
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-phone">Phone *</Label>
                <Input
                  id="app-phone"
                  value={appForm.phone}
                  onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                  required
                  className="hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-cover">Cover Letter *</Label>
                <Textarea
                  id="app-cover"
                  value={appForm.cover}
                  onChange={(e) => setAppForm({ ...appForm, cover: e.target.value })}
                  rows={5}
                  required
                  className="hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="app-cv">Upload CV (PDF)</Label>
                <input
                  id="app-cv"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setAppForm({ ...appForm, cv: e.target.files ? e.target.files[0] : null })}
                  className="mt-1"
                />
              </div>

              <DialogFooter>
                <DialogClose>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Submit Application</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <section className="py-20 bg-secondary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-heading font-bold mb-12 text-center gradient-text">Why Work With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="text-center p-6 rounded-2xl bg-card">
                <h3 className="text-xl font-heading font-semibold mb-2">Growth Opportunities</h3>
                <p className="text-muted-foreground">Continuous learning and career development programs</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-card">
                <h3 className="text-xl font-heading font-semibold mb-2">Flexible Work</h3>
                <p className="text-muted-foreground">Remote and hybrid options to suit your lifestyle</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-card">
                <h3 className="text-xl font-heading font-semibold mb-2">Great Culture</h3>
                <p className="text-muted-foreground">Collaborative environment with talented professionals</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Careers;
