import React, { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import bookingApi from "../utils/bookingApi";

const EditBookingModal = ({ booking, onClose, onBookingUpdated }) => {
  console.log("EditBookingModal booking:", booking);

  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    notes: "",
    booked_time: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (booking) {
      setFormData({
        client_name: booking.client_name || "",
        client_email: booking.client_email || "",
        notes: booking.notes || "",
        booked_time: booking.booked_time || "",
      });
    }
  }, [booking]);

  if (!booking) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const isBookingToday = isSameDay(
      new Date(),
      new Date(formData.booked_time)
    );
    if (isBookingToday) {
      setErrorMsg("Cannot edit a booking on the day of the booking.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await bookingApi.patch(
        `/booking/${booking._id}/edit`,
        formData
      );
      console.log("EditBookingModal response:", response.data);
      const updatedBooking = response.data.booking;
      onBookingUpdated(updatedBooking);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Booking</h2>

        <div className="space-y-3">
          <input
            type="text"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            placeholder="Client Name"
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="email"
            name="client_email"
            value={formData.client_email}
            onChange={handleChange}
            placeholder="Client Email"
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Notes"
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="datetime-local"
            name="booked_time"
            value={
              formData.booked_time
                ? format(new Date(formData.booked_time), "yyyy-MM-dd'T'HH:mm")
                : ""
            }
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}

        <div className="mt-5 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
