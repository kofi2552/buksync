import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Link } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Modal from "../components/Modal";
import BookingTypeForm from "../components/BookingTypeForm";
import bookingApi from "../utils/bookingApi";

export default function BookingTypes() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookingTypes, setBookingTypes] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBookingType, setCurrentBookingType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //console.log("UserId in BookingTypes:", user._id);

  // Fetch booking types
  useEffect(() => {
    const fetchBookingTypes = async () => {
      try {
        setLoading(true);

        // Fetch booking types from MongoDB
        const response = await bookingApi.get(
          `/booking-types?user_id=${user.id}`
        );

        if (response.error) throw response.error;

        setBookingTypes(response.data || []);
      } catch (error) {
        console.error("Error fetching booking types:", error.message);
        addToast("Failed to load booking types", "error");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookingTypes();
    }
  }, [user, addToast]);

  // Create booking type
  const handleCreateBookingType = async (data) => {
    try {
      setIsSubmitting(true);

      // Insert a new booking type into MongoDB
      const response = await bookingApi.post("/booking-types", {
        user_id: user._id,
        name: data.name,
        description: data.description || "",
        duration: data.duration,
        color: data.color,
      });

      if (response.error) throw response.error;

      setBookingTypes([response.data, ...bookingTypes]); // Prepend new booking type
      setIsCreateModalOpen(false);
      addToast("Booking type created successfully", "success");
    } catch (error) {
      console.error("Error creating booking type:", error.message, error);
      addToast("Failed to create booking type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update booking type
  const handleUpdateBookingType = async (data) => {
    try {
      setIsSubmitting(true);

      // Update booking type in MongoDB
      const response = await bookingApi.put(
        `/booking-types/${currentBookingType._id}`,
        {
          name: data.name,
          description: data.description || "",
          duration: data.duration,
          color: data.color,
        }
      );

      if (response.error) throw response.error;

      setBookingTypes(
        bookingTypes.map((bt) =>
          bt.id === currentBookingType._id ? response.data : bt
        )
      );
      setIsEditModalOpen(false);
      setCurrentBookingType(null);
      addToast("Booking type updated successfully", "success");
    } catch (error) {
      console.error("Error updating booking type:", error.message, error);
      addToast("Failed to update booking type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete booking type
  const handleDeleteBookingType = async () => {
    try {
      setIsSubmitting(true);

      // Delete booking type from MongoDB
      const response = await bookingApi.delete(
        `/booking-types/${currentBookingType._id}`
      );

      if (response.error) throw response.error;

      setBookingTypes(
        bookingTypes.filter((bt) => bt.id !== currentBookingType._id)
      );
      setIsDeleteModalOpen(false);
      setCurrentBookingType(null);
      addToast("Booking type deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting booking type:", error.message);
      addToast("Failed to delete booking type", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (bookingType) => {
    setCurrentBookingType(bookingType);
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (bookingType) => {
    setCurrentBookingType(bookingType);
    setIsDeleteModalOpen(true);
  };

  // Copy booking link to clipboard
  const copyBookingLink = (bookingTypeId) => {
    const link = `${window.location.origin}/book/${bookingTypeId}`;
    navigator.clipboard.writeText(link);
    addToast("Booking link copied to clipboard", "success");
  };

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            Booking Types
          </h1>
          <p className="text-neutral-600 mt-1">
            Manage your meeting types for clients to book
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create Type
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
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
      ) : bookingTypes.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {bookingTypes.map((bookingType) => (
            <motion.div
              key={bookingType._id}
              variants={itemVariants}
              className="rounded-xl c-shdw bg-white p-6 hover:shadow-apple-md transition-all"
            >
              <div className="flex items-center mb-4">
                <div
                  className="w-12 h-12 rounded-full mr-4 flex items-center justify-center"
                  style={{ backgroundColor: bookingType.color }}
                >
                  <CalendarClock color="#fff" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {bookingType.name}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {bookingType.duration} minutes
                  </p>
                </div>
              </div>

              {bookingType.description && (
                <p className="text-neutral-700 mb-6 text-sm">
                  {bookingType.description}
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between">
                <div className="space-x-2">
                  <button
                    onClick={() => openEditModal(bookingType)}
                    className="p-2 rounded text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                    title="Edit"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => openDeleteModal(bookingType)}
                    className="p-2 rounded text-neutral-600 hover:text-error-600 hover:bg-neutral-100 transition-colors"
                    title="Delete"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => copyBookingLink(bookingType._id)}
                  className="btn btn-outline text-sm flex items-center"
                >
                  <Link />
                  Copy Link
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-white c-shdw rounded-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-neutral-400"
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
          <h2 className="mt-4 text-xl font-semibold text-neutral-700">
            No Booking Types Yet
          </h2>
          <p className="mt-2 text-neutral-600 max-w-md mx-auto">
            Create your first booking type to start accepting appointments from
            clients.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-6 btn btn-primary"
          >
            Create Your First Booking Type
          </button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Booking Type"
      >
        <BookingTypeForm
          onSubmit={handleCreateBookingType}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Booking Type"
      >
        <BookingTypeForm
          initialData={currentBookingType}
          onSubmit={handleUpdateBookingType}
          onCancel={() => setIsEditModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Booking Type"
        maxWidth="max-w-md"
      >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>

          <h3 className="mt-4 text-lg font-semibold text-neutral-900">
            Are you sure?
          </h3>
          <p className="mt-2 text-neutral-600">
            This will permanently delete the "{currentBookingType?.name}"
            booking type. This action cannot be undone.
          </p>

          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>

            <button
              onClick={handleDeleteBookingType}
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
                  Deleting...
                </span>
              ) : (
                "Delete Booking Type"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
