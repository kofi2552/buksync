import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useToast } from "../contexts/ToastContext";
import {
  format,
  subMonths,
  getDay,
  addDays,
  addMonths,
  isAfter,
  isBefore,
  addMinutes,
  set,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
} from "date-fns";
import bookingApi from "../utils/bookingApi";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { generateMeetLink } from "../services/googleMeet";
import { sendBookingConfirmation } from "../services/emailService";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/buksync-logo-mark.png";

export default function ClientBooking() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingTypeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [formStep, setFormStep] = useState(1);
  const [bookingType, setBookingType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [availabilityData, setAvailabilityData] = useState("");
  const [clientInfo, setClientInfo] = useState({
    name: "",
    email: "",
    notes: "",
  });

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(selectedDate || today);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (location.state?.bookingData) {
      const { selectedDate, selectedTime, clientInfo } =
        location.state.bookingData;

      setSelectedDate(selectedDate);
      setSelectedTime(selectedTime);
      setBookingDetails({
        name: clientInfo.name,
        email: clientInfo.email,
        date: selectedDate,
        time: selectedTime,
      });

      reset({
        name: clientInfo.name,
        email: clientInfo.email,
        notes: clientInfo.notes || "",
      });

      setFormStep(3);
    } else {
      // Start from step 1 if not coming from login
      navigate(location.pathname, { replace: true });
      setFormStep(1);
    }
  }, []);

  // Fetch booking type details
  useEffect(() => {
    const fetchBookingTypeDetails = async () => {
      try {
        const res = await bookingApi.get(`/booking-type/${bookingTypeId}`);
        const bookingTypeData = res.data;

        if (res.status === 200) {
          setBookingType({
            ...bookingTypeData,
            host: user,
          });
          setAvailabilityData(bookingTypeData.availability);
        } else {
          addToast(
            "OOpps! Something happend. Failed to load Booking info",
            "warning"
          );
          navigate("/not-found");
          return;
        }
      } catch (error) {
        console.error("Error fetching booking type:", error);
        addToast(
          "Could be your network or there is no booking available",
          "error"
        );
        navigate("/overview");
      } finally {
        setLoading(false);
      }
    };

    if (bookingTypeId) fetchBookingTypeDetails();
  }, [bookingTypeId, navigate]);

  const availability = Array.isArray(availabilityData) ? availabilityData : [];
  const availableDays = availability?.map((entry) => Number(entry.day));

  //console.log("availability: ", availability);

  const getBusinessHoursForDay = (date) => {
    const dayNumber = getDay(new Date(date)); // Sunday=0, Monday=1, etc.

    // console.log("selected date's number: ", dayNumber);
    // Find matching availability object
    const dayAvailability = availability?.find(
      (entry) => Number(entry.day) === dayNumber
    );

    //console.log("selected date's entry: ", dayAvailability);

    if (!dayAvailability) return null;

    const [startHour] = dayAvailability.startTime.split(":").map(Number);
    const [endHour] = dayAvailability.endTime.split(":").map(Number);

    return {
      start: startHour,
      end: endHour,
    };
  };

  // Generate available time slots for the selected date
  useEffect(() => {
    const generateTimeSlots = async () => {
      if (!selectedDate || !bookingType) return;

      try {
        // Get the bookings for the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch existing bookings for the host on the selected date
        const res = await bookingApi.get(
          `/bookings/check-availability?bookingTypeId=${bookingTypeId}&date=${selectedDate}`
        );

        const existingBookings = res.data;

        // console.log("existing booking: ", existingBookings);

        // Define business hours (eg 9 AM to 5 PM)
        const businessHours = getBusinessHoursForDay(selectedDate);

        if (!businessHours) {
          setAvailableTimes([]);
          return;
        }

        const duration = bookingType.duration || 30; // <-- use duration from bookingType

        const slots = [];

        let currentSlot = set(new Date(selectedDate), {
          hours: businessHours.start,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });

        while (
          isBefore(
            currentSlot,
            set(new Date(selectedDate), {
              hours: businessHours.end,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            })
          )
        ) {
          const slotEnd = addMinutes(currentSlot, duration);

          // Break if slotEnd exceeds end of business hours
          if (
            isAfter(
              slotEnd,
              set(new Date(selectedDate), {
                hours: businessHours.end,
                minutes: 0,
                seconds: 0,
                milliseconds: 0,
              })
            )
          ) {
            break;
          }

          const hasConflict = existingBookings?.some((booking) => {
            const bookingStart = new Date(booking.booking_time);
            const bookingEnd = addMinutes(
              bookingStart,
              booking.booking_types.duration
            );

            return (
              (isAfter(currentSlot, bookingStart) &&
                isBefore(currentSlot, bookingEnd)) ||
              (isAfter(slotEnd, bookingStart) &&
                isBefore(slotEnd, bookingEnd)) ||
              (isBefore(currentSlot, bookingStart) &&
                isAfter(slotEnd, bookingEnd)) ||
              currentSlot.getTime() === bookingStart.getTime()
            );
          });

          if (!hasConflict) {
            slots.push({
              time: currentSlot,
              formattedTime: `${format(currentSlot, "h:mm a")} - ${format(
                slotEnd,
                "h:mm a"
              )}`,
            });
          }

          currentSlot = addMinutes(currentSlot, duration);
        }

        setAvailableTimes(slots);
      } catch (error) {
        console.error("Error generating time slots:", error.message, error);
        setAvailableTimes([]);
      }
    };

    generateTimeSlots();
  }, [selectedDate, bookingType]);

  const handleDateSelect = (date) => {
    // console.log("selected date: ", date);
    setSelectedDate(date);
    setSelectedTime(null);
    setFormStep(2);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setFormStep(3);
  };

  const handlePrevStep = () => {
    setFormStep(formStep - 1);
  };

  const onSubmit = async (data) => {
    if (!selectedDate || !selectedTime || !bookingType) return;

    if (!user) {
      // Save current location + form data in redirect state
      navigate("/auth/", {
        state: {
          from: location.pathname + location.search,
          bookingData: {
            selectedDate,
            selectedTime,
            clientInfo: {
              name: data.name,
              email: data.email,
              notes: data.notes,
            },
            bookingTypeId,
          },
        },
      });
      return;
    }

    try {
      setSubmitting(true);

      const bookingTime = selectedTime.time;

      // Generate a Google Meet link
      const meetResult = await generateMeetLink({
        title: `${bookingType.name} with ${data.name}`,
        startTime: bookingTime,
        endTime: addMinutes(bookingTime, bookingType.duration),
        attendees: [
          { email: bookingType.host.email }, // Host's email
          { email: data.email }, // Client's email
        ],
      });

      if (!meetResult.success) {
        throw new Error("Failed to generate meeting link");
      }

      // console.log("bookingtype: ", bookingType);

      // Create the booking
      const res = await bookingApi.post("/add/booking", {
        user_id: bookingType.user._id,
        bookedBy: user._id,
        booking_type_id: bookingTypeId,
        booked_time: bookingTime.toISOString(),
        client_name: data.name,
        client_email: data.email,
        notes: data.notes,
        duration: bookingType.duration,
        meet_link: meetResult.meetLink || null,
        status: "pending",
      });

      console.log("booking success: ", res);

      // Send confirmation emails
      await sendBookingConfirmation({
        hostName: bookingType.host.full_name,
        hostEmail: bookingType.host.email,
        clientName: data.name,
        clientEmail: data.email,
        bookingType: bookingType.name,
        bookingTime: bookingTime,
        duration: bookingType.duration,
        meetLink: meetResult.meetLink,
      });

      // setSuccess(true);
      setBookingDetails({
        name: data.name,
        email: data.email,
        date: format(bookingTime, "MMMM d, yyyy"),
        time: format(bookingTime, "h:mm a"),
        duration: bookingType.duration,
        meetLink: meetResult.meetLink,
      });
      if (res) {
        setFormStep(4);
        addToast("Booking has been made successfully", "success");
      }
    } catch (error) {
      console.error("Error creating booking:", error.message);
      const message =
        error.response?.data?.message ||
        "Failed to create booking. Please try again.";

      addToast(message, "error");
      navigate(location.pathname, { replace: true });
      setFormStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
    } finally {
      setSubmitting(false);
    }
  };

  const generateCalendar = (date) => {
    const startMonth = startOfMonth(date);
    const endMonth = endOfMonth(date);
    const startDate = startOfWeek(startMonth, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });

    const calendar = [];
    let current = startDate;

    while (current <= endDate) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(current);
        current = addDays(current, 1);
      }
      calendar.push(week);
    }
    return calendar;
  };

  const calendar = generateCalendar(currentMonth);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <h1 className="text-xl font-medium py-3">Please wait</h1>
          <h3 className="mt-4 text-neutral-600 font-medium">
            Loading booking information...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-light py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          className="flex items-center btn btn-outline text-sm text-gray-400"
          onClick={() => (window.location.href = "/overview")}
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" /> Dashboard
        </button>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center flex-col mb-4">
            <h1 className="text-xl font-bold logo flex items-center">
              <img
                src={logo}
                alt="buksync official logo"
                width={52}
                className="mr-2"
              />{" "}
              BukSync
            </h1>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">
            {bookingType?.name || "Book a Meeting"}
          </h1>
          <p className="text-neutral-600 mt-2">
            {bookingType?.description ||
              `Schedule a ${bookingType?.duration}-minutes meeting`}
          </p>
          <div className="flex items-center justify-center mt-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-full capitalize bg-primary-100 flex items-center justify-center text-primary-600 font-semibold mr-2">
              {bookingType?.host?.full_name?.charAt(0) || "H"}
            </div>
            <span className="text-sm font-medium">
              {bookingType?.host?.full_name || "Host"}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-10 relative w-full">
          <div className="flex items-center w-full max-w-md gap-0 relative z-10">
            {[1, 2, 3, 4].map((step, index) => {
              const isActive = formStep >= step;
              const isCompleted = formStep > step;

              return (
                <div
                  key={step}
                  className="flex-1 flex flex-col items-center relative"
                >
                  {/* Circle */}
                  <motion.div
                    initial={false}
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 20,
                    }}
                    className={`w-8 h-8 rounded-full text-md font-medium flex items-center justify-center transition-all duration-300
          ${
            isActive
              ? "bg-primary-400 text-white shadow-md"
              : "bg-gray-200 text-gray-500"
          }
        `}
                  >
                    {isCompleted ? "✓" : step}
                  </motion.div>

                  {/* Title */}
                  <span className="mt-2 text-xs text-center text-gray-500">
                    {step === 1 && "Select Date"}
                    {step === 2 && "Choose Time"}
                    {step === 3 && "Confirm Details"}
                    {step === 4 && "Done"}
                  </span>

                  {/* Line to next step */}
                  {step !== 4 && (
                    <div className="absolute top-4 left-1/2 w-full overflow-hidden">
                      <div className="h-0.5  w-full ml-4 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: formStep > step ? "100%" : "0%" }}
                          transition={{
                            duration: 1.2, // slow animation (you can make it even slower like 1.5s if you want)
                            ease: "easeInOut",
                          }}
                          className="h-0.5 bg-primary-600 absolute top-0 left-0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-xl bord-color p-6 md:p-8">
          {/* Step 1: Select Date */}
          {formStep === 1 && (
            <motion.div
              key="step1"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex flex-col items-center"
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                Select a Highlighted Day
              </h2>
              <div className="w-full max-w-7xl mx-auto p-4 rounded-2xl shadow-sm bg-white mb-6">
                <div className="w-full max-w-4xl mx-auto p-4 rounded-2xl border border-gray-200 mb-2 bg-white">
                  {/* Month and Year */}
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={goToPrevMonth}
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>

                    <h2 className="text-xl font-bold">
                      {format(currentMonth, "MMMM yyyy")}
                    </h2>

                    <button
                      onClick={goToNextMonth}
                      className="p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 text-center mb-2 text-gray-500 uppercase text-sm font-semibold">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div key={day}>{day}</div>
                      )
                    )}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 auto-rows-fr bg-white gap-[1px] border border-gray-100 p-2  rounded-lg overflow-hidden">
                    {calendar.map((week, weekIndex) =>
                      week.map((date, dateIndex) => {
                        const isAvailable = availableDays.includes(
                          date.getDay()
                        );
                        const isPast =
                          isBefore(date, today) && !isSameDay(date, today);

                        const nextMonth = addMonths(selectedDate || today, 1);
                        const isFuture = isSameMonth(date, nextMonth);

                        const isDisabled = !isAvailable;

                        const isSelected =
                          selectedDate && isSameDay(date, selectedDate);

                        return (
                          <div
                            key={`${weekIndex}-${dateIndex}`}
                            onClick={() =>
                              !isDisabled &&
                              !isPast &&
                              isSameMonth(date, selectedDate || today) &&
                              handleDateSelect(date)
                            }
                            className={`min-h-[60px] flex flex-col items-center justify-start p-2 m-[2px] border border-gray-200 rounded-md bg-white
                              ${
                                isPast
                                  ? "bg-gray-300 text-gray-300 opacity-40"
                                  : ""
                              }
                              ${
                                isDisabled
                                  ? "bg-gray-300 text-gray-600 opacity-50"
                                  : "bg-blue-50"
                              }
                              ${
                                !isSameMonth(date, selectedDate || today)
                                  ? " text-gray-600 opacity-40 c-x"
                                  : ""
                              }
                              ${isFuture ? " text-gray-600 opacity-40 c-x" : ""}
                              ${
                                isAvailable && !isPast
                                  ? "bg-blue-200 hover:bg-blue-300 hover:text-white transition cursor-pointer"
                                  : "cursor-not-allowed"
                              }
                                ${isSelected ? "bg-blue-200 text-gray" : ""}
                            `}
                          >
                            <span className="font-medium text-sm pt-2">
                              {format(date, "d")}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-600 mt-4">
                Select a date to see available time slots.
              </p>
            </motion.div>
          )}

          {/* Step 2: Select Time */}
          {formStep === 2 && (
            <motion.div
              key="step2"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Select a Time
              </h2>
              <p className="text-neutral-600 mb-6">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>

              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {availableTimes.map((slot, index) => (
                    <button
                      key={index}
                      className={`p-3 rounded-lg border text-center transition-all
                        ${
                          selectedTime === slot
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-neutral-200 hover:border-primary-200 hover:bg-primary-50"
                        }`}
                      onClick={() => handleTimeSelect(slot)}
                    >
                      {slot.formattedTime}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-light rounded-lg mb-6">
                  <div className="h-12 w-12 mx-auto text-neutral-400 border-2 border-current rounded-full flex items-center justify-center">
                    <span className="text-lg">!</span>
                  </div>
                  <h3 className="mt-2 text-neutral-600 font-medium">
                    No available times
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Please select another date
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={handlePrevStep} className="btn btn-outline">
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Enter Details */}
          {formStep === 3 && (
            <motion.div
              key="step3"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Enter Your Details
              </h2>
              <p className="text-neutral-600 mb-6">
                {format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
                {selectedTime.formattedTime}
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`w-full ${
                      errors.name ? "border-error-500 focus:ring-error-500" : ""
                    }`}
                    {...register("name", { required: "Name is required" })}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`w-full ${
                      errors.email
                        ? "border-error-500 focus:ring-error-500"
                        : ""
                    }`}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full"
                    {...register("notes")}
                    placeholder="Let me know if you have any specific questions or topics you'd like to discuss."
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="btn btn-outline"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn btn-primary ${
                      submitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                        Confirming...
                      </span>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {formStep === 4 && (
            <motion.div
              key="step4"
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-success-100 flex items-center justify-center">
                  <span className="text-2xl text-success-600">✓</span>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Booking Successful!
              </h2>

              <p className="text-neutral-600 mb-6">
                Your {bookingType.duration}-minute meeting has been scheduled.
              </p>

              <div className="bg-neutral-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-medium text-neutral-800 mb-4">
                  Booking Details
                </h3>

                <div className="space-y-3">
                  <div className="flex">
                    <span className="w-5 text-neutral-500 mr-3">👤</span>
                    <div>
                      <p className="text-sm text-neutral-800">
                        {bookingDetails?.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {bookingDetails?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="w-5 text-neutral-500 mr-3">📅</span>
                    <div>
                      <p className="text-sm text-neutral-800">
                        {bookingDetails?.date}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {bookingDetails?.time} ({bookingDetails?.duration} min)
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <span className="w-5 text-neutral-500 mr-3">🎥</span>
                    <div>
                      <p className="text-sm text-neutral-800">Google Meet</p>
                      <a
                        href={bookingDetails?.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >
                        {bookingDetails?.meetLink}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-neutral-600 mb-6">
                A confirmation email will be sent to your email address. You can
                add this meeting to your calendar using the link in the email.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Schedule Another Meeting
              </button>
            </motion.div>
          )}
        </div>
        <p className="text-center font-small py-8">
          Simple Booking Automation 👌
          <a href="http://www.tudlin.com/welcome" className="text-primary-600">
            Try for yourself
          </a>
        </p>
      </div>
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
