import { useState, useEffect } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import siteLogo from "@/assets/brand-logo-dark.svg";
import favicon from "@/assets/officelogo.jpg";
import { NotificationMenu } from "@/components/ui/notification-menu";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { auth, googleProvider, db } from "@/firebase";
import { signInWithPopup, signOut, User } from "firebase/auth";
import { ref, set, get, child } from "firebase/database"; // 👈 Realtime DB functions
import { useTasks, TaskItem } from "@/hooks/use-tasks";

const Navigation = ({ handleAnchorClick }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOfficeMember, setIsOfficeMember] = useState(false);
  const [isDropdownOpen, setIsDropDownOpen] = useState(false);
  const navLinks = [
    { href: "/", label: "Home", isRoute: true },
    { href: "/services", label: "Services", isRoute: true },
    { href: "/about", label: "About Us", isRoute: true },
    { href: "/contact", label: "Contact Us", isRoute: true },
    { href: "/blog", label: "Blog", isRoute: true },
    { href: "/ourteam", label: "Our Team", isRoute: true },
    { href: "/careers", label: "Careers", isRoute: true },
  ];

  // ✅ Auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch user role from Realtime DB
  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const snap = await get(child(ref(db), `users/${user.uid}`));
        if (snap.exists()) {
          setUserRole(snap.val().role);
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
    };
    fetchRole();
  }, [user]);

  const isAdmin = userRole === "admin";
  // tasks hook
  const { tasks: allTasks, loading: tasksLoading } = useTasks();

  // fetch officeMembers to determine whether current user is listed there
  useEffect(() => {
    const checkOffice = async () => {
      if (!user) {
        setIsOfficeMember(false);
        return;
      }
      try {
        const snap = await get(child(ref(db), `officeMembers`));
        if (!snap.exists()) {
          setIsOfficeMember(false);
          return;
        }
        const members: any = snap.val();
        const uEmail = (user.email || "").toString().trim().toLowerCase();
        const found = Object.values(members).some((m: any) => {
          const em = (m.email || "").toString().trim().toLowerCase();
          return em && em === uEmail;
        });
        setIsOfficeMember(!!found);
      } catch (err) {
        console.error(err);
        setIsOfficeMember(false);
      }
    };
    checkOffice();
  }, [user]);

  // filter tasks assigned to current user (assigneeId matches uid)
  const assignedTasks: TaskItem[] =
    user && allTasks.length > 0
      ? allTasks.filter((t) => t.assigneeId === user.uid)
      : [];

  // active route is determined by browser location (react-router)

  // ✅ Google login + Realtime DB me store
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const loggedInUser = result.user;

      const userRef = ref(db, "users/" + loggedInUser.uid);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        await set(userRef, {
          uid: loggedInUser.uid,
          name: loggedInUser.displayName,
          email: loggedInUser.email,
          photo: loggedInUser.photoURL,
          role: "user", // ✅ Default role
          createdAt: new Date().toISOString(),
        });
      }

      setShowLoginModal(false);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsDropDownOpen(false);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropDownOpen(!isDropdownOpen);
  };

  // Close dropdown when a link is clicked
  const handleDropdownLinkClick = () => {
    setIsDropDownOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo + Title (far left, less gap) */}
            <div className="flex items-center justify-start ml-0 mr-4 gap-2 min-w-0">
              <div
                className="flex items-center group overflow-hidden relative"
                aria-label="Home"
              >
                <a  href="/">
                {/* full site logo is in the flow (relative) but hidden off-screen by transform; it will slide in on hover */}
                <img
                  src={siteLogo}
                  alt="Techtide Co. full logo"
                  className="relative -translate-x-full drop-shadow-md group-hover:translate-x-0 transition-transform duration-300 pointer-events-none lg:h-12 sm:h-10 h-8"
                  style={{ maxHeight: "48px", width: "auto" }}
                />
                {/* favicon is absolutely positioned on top so it shows immediately; it will move right on hover to reveal the logo */}
                <img
                  src={favicon}
                  alt="Techtide Co. favicon"
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 lg:h-12 sm:h-10 h-8 w-auto object-contain drop-shadow-md transition-transform duration-300 group-hover:translate-x-56 group-hover:scale-0"
                  style={{ maxHeight: "48px" }}
                />
                </a>
              </div>
            </div>

            {/* Desktop Navigation (less space, smaller tabs) */}
            <div className="hidden lg:flex items-center gap-x-2.5">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`xl:text-lg text-base px-2 py-1 font-semibold tracking-wide transition-colors duration-300 ${
                      location.pathname === link.href
                        ? "border-b-2"
                        : "border-b-0"
                    }`}
                    style={
                      location.pathname === link.href
                        ? {
                            background:
                              "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            color: "transparent",
                            borderBottomColor: "#00C9FF",
                          }
                        : {}
                    }
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleAnchorClick(link.href, e)}
                    className={`xl:text-lg text-base px-2 py-1 font-semibold tracking-wide transition-colors duration-300 ${
                      location.pathname === link.href ? "border-b-2" : ""
                    }`}
                    style={
                      location.pathname === link.href
                        ? {
                            background:
                              "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            color: "transparent",
                            borderBottomColor: "#00C9FF",
                          }
                        : {}
                    }
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>

            {/* User Info / Login Button (Desktop) */}
            <div className="hidden lg:flex items-center ml-4">
              {/* Show notification bell when user is signed-in */}
              {user && (
                <div className="mr-3">
                  <NotificationMenu />
                </div>
              )}
              {user ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-2 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                    onClick={toggleDropdown}
                  >
                    {user.displayName}
                    <ChevronDown
                      size={18}
                      className={`transition - transform duration-200 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-10 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                      {isAdmin && (
                        <Link
                          to="/admin-dashboard"
                          className="block px-4 py-2 text-blue-700 hover:bg-gray-100"
                          onClick={handleDropdownLinkClick}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      {/* Your Work section: show up to 5 assigned tasks (desktop) */}
                      {isOfficeMember && (
                        <div className="border-t">
                          {/* Simple 'Your Work' link navigates to full tasks page */}
                          <Link
                            to="/my-tasks"
                            className="px-3 py-2 text-sm font-semibold text-gray-600 block hover:bg-gray-50"
                            onClick={handleDropdownLinkClick}
                          >
                            Your Work
                          </Link>
                        </div>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-md px-6 py-2 font-bold text-black border-textile-silk hover:text-blue-500 transition-colors duration-200"
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden border border-border"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="flex flex-col gap-4 mt-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`transition-colors duration-300 font-medium ${
                      location.pathname === link.href ? "border-l-4 pl-2" : ""
                    }`}
                    style={
                      location.pathname === link.href
                        ? {
                            background:
                              "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            color: "transparent",
                            borderLeftColor: "#00C9FF",
                          }
                        : {}
                    }
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      setIsOpen(false);
                      handleAnchorClick(link.href, e);
                    }}
                    className={`transition-colors duration-300 font-medium ${
                      location.pathname === link.href ? "border-l-4 pl-2" : ""
                    }`}
                    style={
                      location.pathname === link.href
                        ? {
                            background:
                              "linear-gradient(90deg, #4A00E0 10%, #00C9FF 90%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            color: "transparent",
                            borderLeftColor: "#00C9FF",
                          }
                        : {}
                    }
                  >
                    {link.label}
                  </a>
                )
              )}

              {/* Mobile Login / User Info */}
              {user ? (
                <div className="flex flex-col gap-3 mt-4">
                  {/* Mobile notification bell when signed-in */}
                  <div className="px-4">
                    <NotificationMenu />
                  </div>
                  <button className="flex items-center gap-2 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition-colors">
                    {user.displayName}
                    <ChevronDown size={18} />
                  </button>
                  <div className="w-full bg-white border rounded shadow-lg mt-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      {user.displayName}
                    </Link>
                    {isOfficeMember && (
                      <div className="border-t">
                        {/* Mobile: single link to the full tasks page */}
                        <Link
                          to="/my-tasks"
                          className="block px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                          onClick={() => setIsOpen(false)}
                        >
                          Your Work
                        </Link>
                      </div>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin-dashboard"
                        className="block px-4 py-2 text-blue-700 hover:bg-gray-100"
                        onClick={() => setIsOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="rounded-full px-6 py-2 font-bold text-black border-textile-silk hover:bg-textile-silk hover:text-white transition-colors duration-200 shadow-md mt-4"
                  onClick={() => {
                    setIsOpen(false);
                    setShowLoginModal(true);
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Login</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-600 mb-6 text-center">
              Sign in to access your account
            </p>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                  fill="#4285F4"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
