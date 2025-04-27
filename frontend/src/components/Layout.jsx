import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/useAuthStore";
import {
  Home,
  Calendar,
  Users,
  Clock,
  Settings,
  LogOut,
  BellDot,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  UserCircle,
} from "lucide-react";

import logo from "../assets/buksync-logo-mark.png";
import student from "../assets/buksync-img.png";

export default function Layout() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef(null);
  const toggleProfile = () => setShowProfile((prev) => !prev);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfile]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getPageName = (pathname) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    return segments[segments.length - 1]
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const currentPage = getPageName(location.pathname);

  // Navigation items
  const navItems = [
    {
      to: "/overview",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      to: "/calendar",
      label: "Calendar",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      to: "/booking-types",
      label: "Booking Types",
      icon: <Users className="h-5 w-5" />,
    },
    {
      to: "/availability",
      label: "Availability",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      to: "/settings",
      label: "Personalize",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Handle logout
  const handleLogout = async () => {
    await signOut();
  };

  const handleGetHelp = () => {
    window.open("https://t.me/get_free_apps", "_blank");
  };

  return (
    <div className="layout flex flex-col md:flex-row md:h-screen">
      {/* Desktop sidebar */}
      <div className="flex justify-between z-50">
        <div className="hidden md:flex flex-col w-64 bg-white border-r bord">
          <div className="flex items-center pl-6 h-16 border-b bord">
            <h1 className="text-xl font-bold logo flex items-center">
              <img
                src={logo}
                alt="buksync official logo"
                width={32}
                className="mr-2"
              />{" "}
              BukSync
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-2 text-sm font-regular">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg
                ${
                  isActive
                    ? "bg-light text-primary-600"
                    : "text-neutral-600 btn-highlight"
                }
              `}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div>
            <img
              src={student}
              alt="buksync official logo"
              width="85%"
              className="mx-auto"
            />
          </div>
          <div className="p-4 border-t bord">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 capitalize rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-neutral-800 truncate">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header & Menu */}
      <div className="flex flex-col flex-1 mt-16 md:hidden">
        <header className="bg-white border-b bord p-4 flex items-center justify-between">
          <div className="flex items-center h-16 ">
            <h1 className="text-xl font-bold logo flex items-center">
              <img
                src={logo}
                alt="buksync official logo"
                width={32}
                className="mr-2"
              />{" "}
              BukSync
            </h1>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
          >
            {isMobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border-b bord overflow-hidden"
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-lg transition-all
                      ${
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }
                    `}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <div className="pt-2 mt-2 border-t bord">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100"
                  >
                    <LogOut size={18} className="mr-1" />
                    Sign Out
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto flex-col h-screen">
        {/* Fixed Topbar */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 md:px-10">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 ml-0 md:ml-64  pl-0 md:pl-5">
            <span
              onClick={() => (window.location.href = "/overview")}
              className="cursor-pointer font-medium"
            >
              Dashboard
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-800 font-regular">{currentPage}</span>
          </div>

          {/* Right: Notifications + Profile Toggle */}
          <div className="relative flex items-center space-x-2">
            <div className="w-[35px] border bordr rounded-full p-2 text-right cursor-pointer ">
              <BellDot
                color="#454545"
                size={18}
                strokeWidth={1.75}
                onClick={() => (window.location.href = "/settings")}
              />
            </div>
            <span onClick={toggleProfile} className="cursor-pointer">
              {showProfile ? (
                <ChevronUp
                  color="#454545"
                  className="ml-2"
                  size={20}
                  strokeWidth={1.75}
                />
              ) : (
                <ChevronDown
                  color="#454545"
                  className="ml-2"
                  size={20}
                  strokeWidth={1.75}
                />
              )}
            </span>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-[22rem] w-[200px]  sm:w-[200px] bg-white border rounded-xl shadow-lg p-3 z-50"
                >
                  <div className="flex flex-col items-center text-center px-4 sm:px-6 py-4">
                    <UserCircle
                      size={80}
                      strokeWidth={1}
                      className="text-gray-500 mb-2"
                    />
                    <p className="font-semibold text-lg text-gray-800">
                      {user ? user.full_name : "John Doe"}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      {user ? user.email : "john@example.com"}
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      <button
                        onClick={handleGetHelp} // <- you'll need to create this handler
                        className="px-6 py-2 cursor-pointer text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-full transition"
                      >
                        Get Help
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-6 py-2 cursor-pointer text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 w-full mt-[10px] md:mt-[70px] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 md:p-8 h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
