import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import buksyncapp from "../assets/buksyncapp.png";

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("profile");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);

        // Set form defaults
        reset({
          fullName: user.full_name,
          email: user.email,
          role: user.role,
        });
      } catch (error) {
        console.error("Error loading profile data:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfileData();
    }
  }, [user, reset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <svg
          className="animate-spin h-8 w-8 text-primary-500"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Settings
        </h1>
        <p className="text-neutral-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg">
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedTab("profile")}
              className={`flex items-center px-4 py-3 rounded-lg w-full text-left ${
                selectedTab === "profile"
                  ? "bg-primary-50 text-primary-600"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              Profile
            </button>

            <button
              onClick={() => setSelectedTab("notifications")}
              className={`flex items-center px-4 py-3 rounded-lg w-full text-left ${
                selectedTab === "notifications"
                  ? "bg-primary-50 text-primary-600"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Notifications
            </button>
          </nav>
          <div>
            <img
              src={buksyncapp}
              alt="buksync official logo"
              width="90%"
              className="mx-auto"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {selectedTab === "profile" && (
            <motion.section
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                Profile Settings
              </h2>
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="w-full"
                    {...register("fullName", {
                      required: "Full name is required",
                    })}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full bg-neutral-50 cursor-not-allowed"
                    {...register("email")}
                    disabled
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Email address cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Assigned Role
                  </label>
                  <input
                    id="role"
                    type="text"
                    className="w-full bg-neutral-50 cursor-not-allowed"
                    {...register("role")}
                    disabled
                  />
                </div>

                {/* <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={btn btn-primary ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div> */}
              </form>
            </motion.section>
          )}

          {selectedTab === "notifications" && (
            <motion.section
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">
                      New Booking Notifications
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Receive an email when a new booking is made
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input
                      type="checkbox"
                      id="new-booking"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer"
                      defaultChecked={true}
                    />
                    <span className="block w-full h-full rounded-full bg-neutral-300 peer-checked:bg-primary-400 transition-colors duration-300"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform peer-checked:translate-x-6"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">
                      Booking Reminders
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Receive a reminder email before your scheduled meetings
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input
                      type="checkbox"
                      id="booking-reminder"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer"
                      defaultChecked={true}
                    />
                    <span className="block w-full h-full rounded-full bg-neutral-300 peer-checked:bg-primary-400 transition-colors duration-300"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform peer-checked:translate-x-6"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">
                      Booking Cancellations
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Receive an email when a booking is cancelled
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input
                      type="checkbox"
                      id="cancellation"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer"
                      defaultChecked={true}
                    />
                    <span className="block w-full h-full rounded-full bg-neutral-300 peer-checked:bg-primary-400 transition-colors duration-300"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform peer-checked:translate-x-6"></span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-800">
                      Marketing Updates
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Receive emails about new features and updates
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                    <input
                      type="checkbox"
                      id="marketing"
                      className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer peer"
                      defaultChecked={false}
                    />
                    <span className="block w-full h-full rounded-full bg-neutral-300 peer-checked:bg-primary-400 transition-colors duration-300"></span>
                    <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform peer-checked:translate-x-6"></span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button className="btn btn-primary">
                  Save Notification Settings
                </button>
              </div>
            </motion.section>
          )}
        </div>
      </div>
    </div>
  );
}
