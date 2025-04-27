import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { color, motion } from "framer-motion";
import { useToast } from "../contexts/ToastContext";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  BellDot,
  CalendarDays,
  Clock,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import bookingApi from "../utils/bookingApi";
import { DateTime } from "luxon";
import student from "../assets/buksync-img.png";

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [bookingTypes, setBookingTypes] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalBookingTypes: 0,
  });

  //console.log("UserId in Dashbaord:", user._id);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true); // Set loading to true when fetching data

        // Fetch all data concurrently using Promise.all
        const [bookingsRes, typesRes, statsRes] = await Promise.all([
          bookingApi.get("/bookings/upcoming"),
          bookingApi.get("/booking-types"),
          bookingApi.get("/bookings/stats"),
        ]);

        // Handle the responses from each API call
        const bookings = bookingsRes.data;
        const bookingTypes = typesRes.data;
        const stats = statsRes.data;

        // console.log("Bookings data:", bookings);

        const startOfToday = DateTime.local().startOf("day").toISODate();
        const endOfToday = DateTime.local().endOf("day").toISODate();

        const todayBookings = bookings.filter((booking) => {
          const bookingDate = DateTime.fromISO(booking.booked_time)
            .toLocal()
            .toISODate();
          return bookingDate >= startOfToday && bookingDate <= endOfToday; // Filter for today's bookings only
        });

        const upcomingBookings = bookings.filter((booking) => {
          const bookingDate = DateTime.fromISO(booking.booked_time)
            .toLocal()
            .toISODate();
          return bookingDate >= startOfToday; // Include bookings from today onwards
        });

        // Set the state with the fetched data
        setUpcomingBookings(todayBookings && upcomingBookings);
        setBookingTypes(bookingTypes || []);
        setStats({
          totalBookings: stats.totalBookings || 0,
          todayBookings: todayBookings.length || 0,
          totalBookingTypes: bookingTypes?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching booking data:", error.message, error);
        console.error("Dashboard Error: ", error);
      } finally {
        setLoading(false); // Set loading to false after fetching the data
      }
    };

    // Only fetch data if user is available
    if (user) {
      fetchBookingData();
    }
  }, [user]); // Re-run the effect when user changes

  // Helper function to format date for display
  const formatBookingDate = (dateString) => {
    const date = parseISO(dateString);

    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, yyyy 'at' h:mm a");
    }
  };

  const copyBookingLink = (bookingTypeId) => {
    const link = `${window.location.origin}/book/${bookingTypeId}`;
    navigator.clipboard.writeText(link);
    addToast("Booking link copied to clipboard", "success");
  };

  const VisitMyBookings = () => {
    window.location.href = "/bookings";
  };

  // Stat cards data
  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      color: "stats-1",
      icon: <CalendarDays className="h-6 w-6 text-white" />,
      onClick: VisitMyBookings,
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      color: "stats-3",
      icon: <Clock className="h-6 w-6 text-white" />,
    },
    {
      title: "Booking Types",
      value: stats.totalBookingTypes,
      color: "stats-2",
      icon: <LayoutDashboard className="h-6 w-6 text-white" />,
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-semibold capitalize text-neutral-900">
            {user ? `Hi, ${user.full_name}` : "Dashboard"}
          </h1>
          <p className="text-neutral-600 mt-1">
            Welcome to your BukSync dashboard
          </p>
        </div>
      </div>

      <div className="block sm:hidden">
        <img
          src={student}
          alt="buksync official logo"
          width="100%"
          className="mx-auto"
        />
      </div>

      {/* Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            onClick={stat.onClick}
            className={`rounded-xl c-shdw bg-white p-6 flex items-center transition hover:shadow-lg ${
              stat.onClick ? "cursor-pointer hover:bg-gray-50" : ""
            }`}
          >
            <div className={`${stat.color} p-3 rounded-full  mr-4`}>
              {stat.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                {stat.value}
              </h2>
              <p className="text-sm text-neutral-600">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2"
        >
          <div className="rounded-xl c-shdw bg-white p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                Upcoming Bookings
              </h2>
              <Link
                to="/calendar"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
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
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex items-start sm:items-center cursor-pointer p-4 rounded-lg border hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 ease-in-out"
                    onClick={() => (window.location.href = "/calendar")}
                  >
                    {/* Colored line */}
                    <div
                      className="w-2 h-16 rounded-full mr-4 shrink-0"
                      style={{
                        backgroundColor:
                          booking.bookingType?.color || "#0071e3",
                      }}
                    ></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                      {/* Left Side */}
                      <div className="flex flex-col flex-1">
                        <h3 className="font-semibold text-neutral-900 text-lg leading-snug">
                          {booking.client_name}
                        </h3>

                        <div className="flex flex-col md:flex-row md:items-center mt-1 text-sm text-neutral-600 gap-2">
                          <p>{booking.bookingType?.name || "Booking"}</p>

                          <span
                            className={`w-fit inline-block px-3 py-1 text-xs rounded-full ${
                              booking?.status === "confirmed"
                                ? "bg-success-100 text-success-700"
                                : booking?.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {booking?.status === "confirmed"
                              ? "Confirmed"
                              : booking?.status === "pending"
                              ? "Pending"
                              : "Cancelled"}
                          </span>
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-medium text-neutral-800">
                          {formatBookingDate(booking.booked_time)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {booking.bookingType?.duration} min
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-color-light c-shdw h-64 flex flex-col items-center justify-center rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-neutral-600 font-medium">
                  No upcoming bookings
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Your scheduled bookings will appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Booking Types */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-1"
        >
          <div className="rounded-xl c-shdw bg-white p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                Booking Types
              </h2>
              <Link
                to="/booking-types"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Manage
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
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
            ) : bookingTypes.length > 0 ? (
              <div className="space-y-3">
                {bookingTypes.slice(0, 4).map((type) => (
                  <div
                    key={type.id}
                    className="flex items-start sm:items-center p-3 rounded-lg border border-neutral-200 hover:border-primary-200 hover:bg-primary-50 transition-all"
                  >
                    <div
                      className="w-2 h-12 rounded-full mr-3"
                      style={{ backgroundColor: type.color }}
                    ></div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-neutral-900 text-base">
                          {type.name}
                        </h3>
                        <p className="text-xs text-neutral-500">
                          {type.duration} minutes
                        </p>
                      </div>

                      {/* Copy link */}
                      <span
                        onClick={() => copyBookingLink(type._id)}
                        className="text-xs px-3 py-1 cursor-pointer rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors whitespace-nowrap text-center sm:text-left"
                      >
                        Copy Link
                      </span>
                    </div>
                  </div>
                ))}

                {bookingTypes.length > 4 && (
                  <div className="text-center mt-2">
                    <Link
                      to="/booking-types"
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View {bookingTypes.length - 4} more
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-color-light c-shdw rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-neutral-600 font-medium">
                  No booking types
                </h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Create booking types to start accepting appointments
                </p>
                <Link
                  to="/booking-types"
                  className="mt-3 inline-block btn btn-primary text-sm"
                >
                  Create Booking Type
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
