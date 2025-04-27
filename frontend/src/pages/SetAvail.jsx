import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import bookApi from "../utils/bookingApi"; // Your custom axios instance

const dayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function SetAvail() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useSameHours, setUseSameHours] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [availabilityData, setAvailabilityData] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  console.log("user in avail: ", user);

  // Fetch initial availability data when component mounts
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        const res = await bookApi.get("/availability/all");
        const data = res.data;
        // console.log("Fetched availability data:", data);
        setAvailabilityData(data);

        // Transform for form default values
        const transformed = {
          days: {},
        };

        data.forEach((entry) => {
          transformed.days[entry.day] = {
            enabled: true,
            startTime: entry.startTime,
            endTime: entry.endTime,
          };
        });

        // If all days have same start/end, consider enabling `useSameHours`
        const allSameHours = data.every(
          (d) =>
            d.startTime === data[0].startTime && d.endTime === data[0].endTime
        );

        if (allSameHours) {
          setUseSameHours(true);
          reset({
            globalStartTime: data[0]?.startTime,
            globalEndTime: data[0]?.endTime,
            ...transformed,
          });
        } else {
          setUseSameHours(false);
          reset(transformed);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching availability:", error.message, error);
        addToast("Failed to fetch availability", "error");
      }
    };

    if (user) {
      fetchAvailability();
    }
  }, [user, reset]);

  const handleClearSchedule = async (data) => {
    try {
      const userId = user._id;
      await bookApi.delete("/del/availability", userId);
      setAvailabilityData({ workingDays: [], workingHours: {} });
      addToast("All schedules cleared successfully", "success");
    } catch (error) {
      console.error("Error clearing schedule:", error);
      addToast("Failed to clear schedule", "error");
    }
  };

  const handleAvailabilityUpdate = async (data) => {
    try {
      setIsSubmitting(true);

      let schedule = [];

      if (useSameHours) {
        schedule = Object.entries(data.days || {})
          .filter(([_, val]) => val?.enabled)
          .map(([day]) => ({
            day: parseInt(day),
            startTime: data.globalStartTime,
            endTime: data.globalEndTime,
          }));
      } else {
        schedule = Object.entries(data.days || {})
          .filter(([_, val]) => val?.enabled)
          .map(([day, val]) => ({
            day: parseInt(day),
            startTime: val.startTime,
            endTime: val.endTime,
          }));
      }

      const payload = {
        userId: user._id,
        schedule,
      };

      console.log("Sending availability data:", payload);

      await bookApi.post("/set/availability", payload);

      setAvailabilityData(schedule);
      addToast("Availability settings updated", "success");
    } catch (error) {
      console.error("Error updating availability:", error.message);
      addToast("Failed to update availability", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
          Set Availability
        </h1>
        <p className="text-neutral-600 mt-1">
          Keep your users informed about your schedule
        </p>
      </div>

      <div className="w-full space-y-8">
        <motion.section
          id="availability"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-2 sm:p-6 space-y-6"
        >
          <div className="flex items-center justify-between border-b pt-2 pb-6">
            <h2 className="text-md sm:text-xl font-semibold text-neutral-900">
              Set Your Schedule
            </h2>
            <button
              onClick={handleClearSchedule}
              className="ml-4 px-4 py-2 border border-red-600 text-xs text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2"
            >
              {/* Trash Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22"
                />
              </svg>
              {/* Button Text - hidden on mobile */}
              <span className="hidden sm:inline">Clear My Schedule</span>
            </button>
          </div>

          {isLoading ? (
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
          ) : availabilityData && Object.keys(availabilityData).length > 0 ? (
            <form
              onSubmit={handleSubmit(handleAvailabilityUpdate)}
              className="max-w-2xl mx-auto bg-white rounded-2xl p-2 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Set Your Weekly Availability
              </h2>

              {/* Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-2 sm:gap-0">
                <span className="text-sm text-gray-700">
                  Use same hours for all selected days
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSameHours}
                    onChange={() => setUseSameHours(!useSameHours)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative transition-all">
                    <div className="dot absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              {/* Global Time */}
              {useSameHours && (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
                  <div>
                    <label className="text-sm text-gray-600">Start Time</label>
                    <input
                      type="time"
                      required
                      className="block w-full sm:w-32 mt-1 border border-gray-300 rounded-md p-2"
                      defaultValue={
                        availabilityData.workingHours?.start || "09:00"
                      }
                      {...register("globalStartTime")}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">End Time</label>
                    <input
                      type="time"
                      required
                      className="block w-full sm:w-32 mt-1 border border-gray-300 rounded-md p-2"
                      defaultValue={
                        availabilityData.workingHours?.end || "17:00"
                      }
                      {...register("globalEndTime")}
                    />
                  </div>
                </div>
              )}

              {/* Daily Time Settings */}
              <div className="space-y-4">
                {dayLabels.map((label, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register(`days.${i}.enabled`)}
                        defaultChecked={availabilityData.workingDays?.includes(
                          i
                        )}
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>

                    {!useSameHours && (
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none">
                          <label className="text-sm text-gray-600">Start</label>
                          <input
                            type="time"
                            required
                            className="block w-full sm:w-36 mt-1 border border-gray-300 rounded-md p-2"
                            {...register(`days.${i}.startTime`)}
                            defaultValue="09:00"
                          />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <label className="text-sm text-gray-600">End</label>
                          <input
                            type="time"
                            required
                            className="block w-full sm:w-36 mt-1 border border-gray-300 rounded-md p-2"
                            {...register(`days.${i}.endTime`)}
                            defaultValue="17:00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Saving..." : "Save / Update"}
                </button>
              </div>
            </form>
          ) : showForm ? (
            <form
              onSubmit={handleSubmit(handleAvailabilityUpdate)}
              className="max-w-2xl mx-auto bg-white rounded-2xl p-2 sm:p-6 space-y-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                Set Your Weekly Availability
              </h2>

              {/* Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-2 sm:gap-0">
                <span className="text-sm text-gray-700">
                  Use same hours for all selected days
                </span>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSameHours}
                    onChange={() => setUseSameHours(!useSameHours)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 relative transition-all">
                    <div className="dot absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              {/* Global Time */}
              {useSameHours && (
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-end">
                  <div>
                    <label className="text-sm text-gray-600">Start Time</label>
                    <input
                      type="time"
                      required
                      className="block w-full sm:w-32 mt-1 border border-gray-300 rounded-md p-2"
                      defaultValue={
                        availabilityData.workingHours?.start || "09:00"
                      }
                      {...register("globalStartTime")}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">End Time</label>
                    <input
                      type="time"
                      required
                      className="block w-full sm:w-32 mt-1 border border-gray-300 rounded-md p-2"
                      defaultValue={
                        availabilityData.workingHours?.end || "17:00"
                      }
                      {...register("globalEndTime")}
                    />
                  </div>
                </div>
              )}

              {/* Daily Time Settings */}
              <div className="space-y-4">
                {dayLabels.map((label, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register(`days.${i}.enabled`)}
                        defaultChecked={availabilityData.workingDays?.includes(
                          i
                        )}
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>

                    {!useSameHours && (
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none">
                          <label className="text-sm text-gray-600">Start</label>
                          <input
                            type="time"
                            required
                            className="block w-full sm:w-36 mt-1 border border-gray-300 rounded-md p-2"
                            {...register(`days.${i}.startTime`)}
                            defaultValue="09:00"
                          />
                        </div>
                        <div className="flex-1 sm:flex-none">
                          <label className="text-sm text-gray-600">End</label>
                          <input
                            type="time"
                            required
                            className="block w-full sm:w-36 mt-1 border border-gray-300 rounded-md p-2"
                            {...register(`days.${i}.endTime`)}
                            defaultValue="17:00"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Saving..." : "Save / Update"}
                </button>
              </div>
            </form>
          ) : (
            <div className="max-w-xl mx-auto text-center mt-20 p-4 sm:p-6 bg-white shadow rounded-xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No Availability Set
              </h2>
              <p className="text-gray-600 mb-6">
                You haven’t set your availability schedule yet. Click the button
                below to get started.
              </p>
              <button
                onClick={() => {
                  setAvailabilityData({
                    workingDays: [1, 2, 3, 4, 5],
                    workingHours: {
                      start: "09:00",
                      end: "17:00",
                    },
                  });
                  setShowForm(true);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Set Availability
              </button>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
