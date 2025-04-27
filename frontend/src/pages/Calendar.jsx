import React from "react";
import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import bookingApi from "../utils/bookingApi";
import Modal from "../components/Modal";
import EditBookingModal from "./EditBookingModal";

export default function Calendar() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("pending");

  // Fetch bookings and booking types
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);

        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        const response = await bookingApi.get("/bookings/calendar", {
          params: {
            start: calendarStart.toISOString(),
            end: calendarEnd.toISOString(),
          },
        });

        const bookingsData = response.data;

        // Optional: if your app expects booking_type instead of bookingType
        const normalizedBookings = bookingsData.map((booking) => ({
          ...booking,
          booking_type: booking.bookingType, // normalize field name
        }));

        setBookings(normalizedBookings);
      } catch (error) {
        console.error("Error fetching calendar data:", error.message);
        addToast("Failed to load calendar data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCalendarData();
    }
  }, [user, currentDate, addToast]);

  // console.log("Bookings:", bookings);
  // console.log("Booking Types:", bookingTypes);

  // Calendar navigation
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // View booking details
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  // Open cancel booking modal
  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    try {
      setIsSubmitting(true);

      const res = await bookingApi.patch(
        `/booking/${selectedBooking._id}/cancel`
      );

      if (res.status !== 200) throw new Error("Failed to cancel booking");

      // Gracefully handle specific backend errors
      if (res.status === 403) {
        addToast(response.data.message, "error");
        return;
      }

      // Update local state
      setBookings(
        bookings.map((booking) =>
          booking._id === selectedBooking._id
            ? { ...booking, status: "cancelled" }
            : booking
        )
      );

      setIsCancelModalOpen(false);
      addToast("Booking cancelled successfully", "success");
    } catch (error) {
      console.error("Error cancelling booking:", error.message);
      addToast("Failed to cancel booking", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build calendar rows for the current month view
  const buildCalendarRows = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayBookings = bookings.filter((booking) => {
          try {
            const bookingDate = new Date(booking.booked_time);
            return isSameDay(bookingDate, day);
          } catch (error) {
            console.error("Invalid booking date:", booking.booked_time, error);
            return false;
          }
        });

        days.push({
          date: day,
          bookings: dayBookings,
          isCurrentMonth: isSameMonth(day, monthStart),
        });

        day = addDays(day, 1);
      }

      rows.push(days);
      days = [];
    }

    return rows;
  };

  // Format the booking time
  const formatBookingTime = (dateString) => {
    const date = parseISO(dateString);
    return format(date, "h:mm a");
  };

  const canEdit = (bookingDate) => {
    const today = new Date();
    return !isSameDay(parseISO(bookingDate), today);
  };

  const openEditModal = (booking) => {
    setIsViewModalOpen(false);
    setTimeout(() => {
      setSelectedBooking(booking);
      setIsEditBookingModalOpen(true);
    }, 200);
  };

  const openStatusUpdateModal = (booking) => {
    setIsViewModalOpen(false);
    setTimeout(() => {
      setSelectedBooking(booking);
      setIsStatusUpdateModalOpen(true);
    }, 200);
  };

  const calendar = buildCalendarRows();

  const handleBookingUpdated = (updatedBooking) => {
    setIsEditBookingModalOpen(false);
    addToast("Booking updated successfully", "success");
  };

  const handleUpdateBookingStatus = async (booking) => {
    setIsSubmitting(true);
    try {
      const res = await bookingApi.patch(`/booking/${booking._id}/status`, {
        status,
      });

      if (res.status !== 200) {
        throw new Error("Failed to update booking status");
      }

      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? res.data.booking : b))
      );

      addToast("Booking status updated", "success");
      setIsStatusUpdateModalOpen(false);
    } catch (error) {
      setIsStatusUpdateModalOpen(false);
      console.error("Error updating booking status:", error.message);
      addToast("Failed to update booking status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedBooking) {
      setStatus(selectedBooking.status); // Initialize status if selectedBooking is available
    }
  }, [selectedBooking]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            Calendar
          </h1>
          <p className="text-neutral-600 mt-1">
            View and manage your scheduled bookings
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <span className="text-lg font-medium text-neutral-800 min-w-[150px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <button
            onClick={goToToday}
            className="ml-2 px-3 py-1 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="rounded-xl c-shdw bg-white p-6 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-neutral-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div
              key={i}
              className="py-3 font-medium text-neutral-600 text-center text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <svg
              className="animate-spin h-10 w-10 text-primary-500"
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
        ) : (
          // Calendar grid
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 auto-rows-fr">
            {calendar.map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`border-b border-r border-neutral-200 min-h-[87px] p-2 ${
                    day.isCurrentMonth ? "bg-white" : "bg-neutral-50"
                  } ${isSameDay(day.date, new Date()) ? "bg-primary-50" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`text-sm font-medium ${
                        day.isCurrentMonth
                          ? "text-neutral-800"
                          : "text-neutral-400"
                      } ${
                        isSameDay(day.date, new Date())
                          ? "bg-primary-500 text-white w-6 h-6 flex items-center justify-center rounded-full"
                          : ""
                      }`}
                    >
                      {format(day.date, "d")}
                    </span>

                    {day.date < new Date() &&
                      !isSameDay(day.date, new Date()) && (
                        <span className="text-[10px] text-neutral-400">
                          PAST
                        </span>
                      )}
                  </div>

                  <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
                    {day.bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => viewBookingDetails(booking)}
                        className={`px-2 py-2 text-xs rounded-md cursor-pointer truncate ${
                          booking.status === "cancelled"
                            ? "bg-neutral-100 text-neutral-500 line-through"
                            : "text-white"
                        }`}
                        style={{
                          backgroundColor:
                            booking.status === "cancelled"
                              ? "transparent"
                              : booking.booking_type?.color || "#0071e3",
                        }}
                      >
                        <div className="font-medium truncate">
                          {formatBookingTime(booking.booked_time)} -{" "}
                          {booking.client_name}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Booking Details"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex items-start">
              <div
                className="w-3 h-12 rounded-full mr-4 flex-shrink-0"
                style={{
                  backgroundColor:
                    selectedBooking.booking_type?.color || "#0071e3",
                }}
              ></div>
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {selectedBooking.booking_type?.name || "Booking"}
                </h2>
                <p className="text-neutral-600">
                  {format(
                    parseISO(selectedBooking.booked_time),
                    "EEEE, MMMM d, yyyy"
                  )}{" "}
                  at {formatBookingTime(selectedBooking.booked_time)}
                </p>
                <p className="text-sm text-neutral-500">
                  {selectedBooking.booking_type?.duration || 30} minutes
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-neutral-700">Client</h3>
                <p className="text-neutral-900">
                  {selectedBooking.client_name}
                </p>
                <p className="text-sm text-neutral-600">
                  {selectedBooking.client_email}
                </p>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">
                    Notes
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {selectedBooking.notes
                      ? selectedBooking.notes
                          .split(/(https?:\/\/[^\s]+)/g)
                          .map((part, index) =>
                            part.match(/https?:\/\/[^\s]+/) ? (
                              <a
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                {part}
                              </a>
                            ) : (
                              <React.Fragment key={index}>
                                {part}
                              </React.Fragment>
                            )
                          )
                      : "No notes provided."}
                  </p>
                </div>
              )}

              {selectedBooking.meet_link && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700">
                    Meeting Link
                  </h3>
                  <a
                    href={selectedBooking.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {selectedBooking.meet_link}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-neutral-700">Status</h3>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    selectedBooking.status === "confirmed"
                      ? "bg-success-100 text-success-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {selectedBooking.status === "confirmed"
                    ? "Confirmed"
                    : selectedBooking.status === "pending"
                    ? "Pending"
                    : "Cancelled"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:justify-between sm:flex-row pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              <div className="flex items-center space-x-2">
                {canEdit(selectedBooking.booked_time) &&
                  (selectedBooking?.user === user?._id ? (
                    <button
                      onClick={() => openStatusUpdateModal(selectedBooking)}
                      className="btn btn-primary"
                    >
                      Update Status
                    </button>
                  ) : (
                    <button
                      onClick={() => openEditModal(selectedBooking)}
                      className="btn btn-primary"
                    >
                      Edit Booking
                    </button>
                  ))}

                {/* Ensure correct status checking */}
                {(selectedBooking.status === "confirmed" ||
                  (selectedBooking.status === "pending" &&
                    parseISO(selectedBooking.booked_time) > new Date())) && (
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openCancelModal(selectedBooking);
                    }}
                    className="btn bg-error-500 hover:bg-error-600 text-white focus:ring-error-500"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Booking"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-error-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>

            <h3 className="mt-4 text-lg font-semibold text-neutral-900">
              Are you sure?
            </h3>
            <p className="mt-2 text-neutral-600">
              This will cancel the booking with {selectedBooking.client_name} on{" "}
              {format(parseISO(selectedBooking.booked_time), "MMMM d, yyyy")} at{" "}
              {formatBookingTime(selectedBooking.booked_time)}.
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="btn btn-outline"
              >
                Keep Booking
              </button>

              <button
                onClick={handleCancelBooking}
                disabled={isSubmitting}
                className={`btn bg-error-500 hover:bg-error-600 text-white focus:ring-error-500 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    Cancelling...
                  </span>
                ) : (
                  "Cancel Booking"
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEditBookingModalOpen}
        onClose={() => setIsEditBookingModalOpen(false)}
        title="Edit Booking"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <EditBookingModal
            booking={selectedBooking}
            onClose={() => setIsEditBookingModalOpen(false)}
            onBookingUpdated={handleBookingUpdated}
          />
        )}
      </Modal>

      <Modal
        isOpen={isStatusUpdateModalOpen}
        onClose={() => setIsStatusUpdateModalOpen(false)}
        title="Update Booking Status"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <>
            <div className="text-center">
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Update Status for Booking with {selectedBooking.client_name} on{" "}
                {format(parseISO(selectedBooking.booked_time), "MMMM d, yyyy")}{" "}
                at {formatBookingTime(selectedBooking.booked_time)}.
              </h3>

              <div className="mt-6 flex justify-center space-x-3">
                {isSubmitting ? (
                  <div className="flex items-center justify-center py-12">
                    <svg
                      className="animate-spin h-10 w-10 text-primary-500"
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
                ) : (
                  <>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border rounded px-3 py-2 mb-4"
                    >
                      {selectedBooking.status === "pending" && (
                        <option value="pending">Pending</option>
                      )}
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setIsStatusUpdateModalOpen(false)}
                className="btn btn-outline"
              >
                Close
              </button>

              <button
                onClick={() => handleUpdateBookingStatus(selectedBooking)}
                disabled={isSubmitting}
                className={`btn bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
                    Updating...
                  </span>
                ) : (
                  "Update Status"
                )}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
