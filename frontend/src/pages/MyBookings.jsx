import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bookingApi from "../utils/bookingApi";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import { useToast } from "../contexts/ToastContext";
import { format, parseISO } from "date-fns";

const MyBookings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const userId = user._id;
        const res = await bookingApi.get(`/bookings/all/${userId}`);
        console.log("my bookings: ", res);
        setBookings(Array.isArray(res.data) ? res.data : [res.data]);
      } catch (err) {
        console.log("error fetching my bookings: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  useEffect(() => {
    if (error) {
      addToast("Oops! An error occurred", "error");
    }
  }, [error]);

  const openDeleteModal = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleDeleteBooking = async () => {
    try {
      setIsSubmitting(true);
      await bookingApi.delete(`/delete-booking/${selectedBooking._id}`);
      setBookings((prev) => prev.filter((b) => b._id !== selectedBooking._id));
      setIsDeleteModalOpen(false);
      addToast("Booking deleted", "success");
    } catch (err) {
      setIsDeleteModalOpen(false);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to delete booking. Please try again.";
      addToast(errorMessage || "Failed to delete booking", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBooking = () => {
    navigate("/calendar");
  };

  if (loading)
    return (
      <div>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <h1 className="text-xl font-medium py-3">my booking...</h1>
        </div>
      </div>
    );

  if (error) {
    return <p>Error occurred. Please try again.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-center">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Client Name
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Booked Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t">
                  <td className="py-4 px-4 text-sm font-semibold">
                    {booking.client_name} Meeting
                  </td>
                  <td className="w-[250px] py-4 px-4 text-sm">
                    {format(
                      parseISO(booking.booked_time),
                      "MMMM d, yyyy, h:mm a"
                    )}
                  </td>
                  <td className="w-[180px] py-4 px-4 text-sm capitalize">
                    {booking.status}
                  </td>
                  <td className="w-[200px] py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(booking)}
                        className="px-4 py-2 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(booking)}
                        className="px-4 py-2 text-xs bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
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
              {format(parseISO(selectedBooking.booked_time), "h:mm a")}.
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-outline"
              >
                Keep Booking
              </button>

              <button
                onClick={handleDeleteBooking}
                disabled={isSubmitting}
                className={`btn bg-error-500 hover:bg-error-600 text-white focus:ring-error-500 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Deleting..." : "Delete Booking"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Booking"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">
              Edit booking with {selectedBooking.client_name}?
            </h3>
            <p className="text-sm text-gray-600">
              You can edit details like the date, time, or notes.
            </p>

            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>

              <button
                onClick={handleEditBooking}
                className="btn bg-blue-500 hover:bg-blue-600 text-white"
              >
                Proceed to Edit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookings;
