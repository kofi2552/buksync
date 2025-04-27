// routes/api.js
import express from "express";
import { Booking, BookingType, User, Availability } from "./models.js";
import { authenticator } from "./middleware/authenticator.js";
import { isSameDay } from "date-fns";

const router = express.Router();

// create user
router.post("/user/create", async (req, res) => {
  try {
    //console.log("BCK User data recieved:", req.body);

    const { email, username, role, token } = req.body;

    if (!email || !username || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Generate a secure random API key
    const apiKey = token;

    // Find and update or create the user
    const user = await User.findOneAndUpdate(
      { email },
      { email, full_name: username, role, apiKey },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    //console.log("BCK User stored:", user);

    res.status(201).json({ message: "User stored", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create booking (public route)
router.get("/bookings/all/:id", async (req, res) => {
  try {
    const { id } = req.params; // Fix here: extract id from params properly
    const myBookings = await Booking.find({ user: id }); // Fix here: use await and correct field
    res.status(200).json(myBookings); // 200 for success
  } catch (err) {
    res
      .status(400)
      .json({ message: "Booking fetch failed", error: err.message });
  }
});

// 1. Fetch Upcoming Bookings
router.get("/bookings/upcoming", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const bookings = await Booking.find({
      $or: [{ user: userId }, { bookedBy: userId }],
      booked_time: { $gte: now },
    })
      .populate("bookingType")
      .sort({ booked_time: 1 })
      .limit(5);

    res.status(200).json(bookings);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: err.message });
  }
});

// 2. Fetch Booking Types
router.get("/booking-types", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_id } = req.query;

    const types = await BookingType.find({ user: userId || user_id }).sort({
      createdAt: -1,
    });

    res.status(200).json(types);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch booking types", error: err.message });
  }
});

// 3. Fetch Booking Stats
router.get("/bookings/stats", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [total, todayCount, totalTypes] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({
        user: userId,
        booking_time: { $gte: today, $lt: tomorrow },
      }),
      BookingType.countDocuments({ user: userId }),
    ]);

    res.status(200).json({
      totalBookings: total,
      todayBookings: todayCount,
      totalBookingTypes: totalTypes,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: err.message });
  }
});

//BOOKING TYPES
// Create booking type (public route)
router.post("/booking-types", async (req, res) => {
  try {
    const { name, description, duration, color, user_id } = req.body;

    console.log("BCK Booking type data received:", req.body);

    const newBookingType = new BookingType({
      name,
      description: description || "",
      duration,
      color,
      user: user_id,
    });

    await newBookingType.save();
    res.status(201).json(newBookingType);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Booking type creation failed", error: err.message });
  }
});

// update booking type by ID (public route)
router.put("/booking-types/:id", async (req, res) => {
  try {
    const { id } = req.params; // Booking type ID
    const { name, description, duration, color } = req.body;

    const updatedBookingType = await BookingType.findByIdAndUpdate(
      id,
      { name, description, duration, color },
      { new: true } // Return the updated document
    );

    if (!updatedBookingType) {
      return res.status(404).json({ message: "Booking type not found" });
    }

    res.status(200).json(updatedBookingType);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to update booking type", error: err.message });
  }
});

// Delete booking type by ID (public route)
router.delete("/booking-types/:id", async (req, res) => {
  try {
    const { id } = req.params; // Booking type ID

    const deletedBookingType = await BookingType.findByIdAndDelete(id);

    if (!deletedBookingType) {
      return res.status(404).json({ message: "Booking type not found" });
    }

    res.status(200).json({ message: "Booking type deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Failed to delete booking type", error: err.message });
  }
});

// GET booking-type by id (public route)
router.get("/booking-type/:id", async (req, res) => {
  try {
    const bookingType = await BookingType.findById(req.params.id).populate(
      "user",
      "email full_name"
    );

    if (!bookingType) return res.status(404).json({ message: "Not found" });

    // Fetch availability by the user (host) ID
    const availability = await Availability.find({
      userId: bookingType.user._id,
    });

    res.json({
      ...bookingType.toObject(),
      user: {
        _id: bookingType.user._id,
        email: bookingType.user.email,
        full_name: bookingType.user.full_name,
      },
      availability,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET availability for calendar
router.get("/bookings/check-availability", async (req, res) => {
  const { bookingTypeId, date } = req.query;

  //console.log("BCK Booking data received:", req.query);

  if (!bookingTypeId || !date)
    return res.status(400).json({ message: "Missing parameters" });

  try {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);

    const end = new Date(date);
    end.setHours(17, 0, 0, 0);

    const bookings = await Booking.find({
      booking_type_id: bookingTypeId,
      booking_time: {
        $gte: start,
        $lte: end,
      },
    }).select("booking_time");

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// DELETE /booking/:id
router.delete("/delete-booking/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "cancelled") {
      return res
        .status(400)
        .json({ message: "Only cancelled bookings can be deleted" });
    }

    await Booking.findByIdAndDelete(id);

    res.status(200).json({ message: "Cancelled booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

router.post("/add/booking", async (req, res) => {
  const {
    booking_type_id,
    user_id,
    bookedBy,
    anonymousId,
    client_name,
    client_email,
    notes,
    booked_time,
    duration,
    meet_link,
  } = req.body;

  if (
    !booking_type_id ||
    !user_id ||
    !client_name ||
    !client_email ||
    !booked_time
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Check 1: If a booking with the same booking_type_id and booked_time already exists
    const existingBooking = await Booking.findOne({
      bookingType: booking_type_id,
      booked_time: booked_time,
    });

    if (existingBooking) {
      return res.status(409).json({
        message:
          "This slot has already been booked. Please choose another time.",
      });
    }

    // Check 2: Prevent self-booking (only if bookedBy is present)
    const bookingType = await BookingType.findById(booking_type_id);
    if (!bookingType) {
      return res.status(404).json({ message: "Booking type not found." });
    }

    if (bookedBy && bookingType.user.toString() === bookedBy) {
      return res.status(400).json({
        message: "You cannot book yourself. Please select a different host.",
      });
    }

    // All checks passed — create booking
    const booking = new Booking({
      bookingType: booking_type_id,
      status: "pending",
      user: user_id, // Host (always provided)
      bookedBy: bookedBy || undefined, // If bookedBy exists
      anonymousId: anonymousId || undefined, // If anonymousId exists
      duration,
      client_name,
      client_email,
      notes,
      booked_time,
      meet_link: meet_link || "to be determined by host",
    });

    console.log("BCK saved Booking data: ", booking);

    await booking.save();

    res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch bookings for the calendar view
router.get("/bookings/calendar", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const { start, end } = req.query;

    //console.log("BCK Calendar data received:", req.query);

    const bookings = await Booking.find({
      $or: [{ user: userId }, { bookedBy: userId }],
      booked_time: { $gte: new Date(start), $lte: new Date(end) },
    })
      .populate("bookingType") // Assuming bookingType is a ref
      .sort({ booked_time: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch calendar bookings",
      error: err.message,
    });
  }
});

//cancel booking
router.patch("/booking/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Restrict updates on the day of the booking
    const today = new Date();
    const bookingDate = new Date(booking.booked_time);
    const isSameDay =
      bookingDate.getDate() === today.getDate() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getFullYear() === today.getFullYear();

    if (isSameDay) {
      return res
        .status(403)
        .json({ message: "Cannot cancel booking on the day of the booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// edit booking
router.patch("/booking/:id/edit", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isSameDayBooking = isSameDay(
      new Date(booking.booked_time),
      new Date()
    );
    if (isSameDayBooking) {
      return res
        .status(403)
        .json({ message: "Cannot edit booking on the day of the booking" });
    }

    Object.assign(booking, updates);
    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

//update booking status
router.patch("/booking/:id/status", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;

    //console.log("BCK Booking status data received:", req.body);

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const today = new Date();
    const bookingDate = new Date(booking.booked_time);

    if (isSameDay(today, bookingDate)) {
      return res.status(403).json({
        message: "Cannot update booking status on the day of the booking",
      });
    }

    booking.status = status;
    await booking.save();

    return res.json({ message: "Status updated successfully", booking });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check Time Overlap
function isTimeOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

// CREATE AVAILABILITY
router.post("/availability/create", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const { day, startTime, endTime } = req.body;

    //console.log("BCK Availability data received:", req.body);

    const existing = await Availability.find({ userId, day });

    const hasOverlap = existing.some((a) =>
      isTimeOverlap(startTime, endTime, a.startTime, a.endTime)
    );

    if (hasOverlap) {
      return res
        .status(400)
        .json({ message: "Time overlaps with existing availability." });
    }

    const newAvailability = await Availability.create({
      userId,
      day,
      startTime,
      endTime,
    });

    res.status(201).json(newAvailability);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// READ all availabilities for a user
router.get("/availability/all", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    //console.log("BCK Availability data received:", userId);
    const availabilities = await Availability.find({
      userId: userId,
    });

    //console.log("BCK Availability data fetched:", availabilities);
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE availability
router.post("/set/availability", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;

    if (
      !Array.isArray(schedule) ||
      schedule.some(
        (entry) =>
          typeof entry.day !== "number" || !entry.startTime || !entry.endTime
      )
    ) {
      return res.status(400).json({ message: "Invalid schedule format." });
    }

    const updatedEntries = [];

    for (const entry of schedule) {
      const { day, startTime, endTime } = entry;

      if (startTime >= endTime) {
        continue; // Invalid time range
      }

      // Check for overlapping existing availability (excluding identical time slot)
      const overlapping = await Availability.findOne({
        userId,
        day,
        $or: [
          {
            startTime: { $lt: endTime, $gte: startTime },
          },
          {
            endTime: { $gt: startTime, $lte: endTime },
          },
          {
            startTime: { $lte: startTime },
            endTime: { $gte: endTime },
          },
        ],
      });

      if (
        overlapping &&
        (overlapping.startTime !== startTime || overlapping.endTime !== endTime)
      ) {
        continue; // Conflict found, skip
      }

      // Upsert logic
      const updated = await Availability.findOneAndUpdate(
        { userId, day },
        {
          userId,
          day,
          startTime,
          endTime,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      updatedEntries.push(updated);
    }

    //console.log("BCK Availability data updated:", updatedEntries);

    res.json({
      message: "Availability updated successfully.",
      updated: updatedEntries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

// ✅ DELETE availability
router.delete("/del/availability", authenticator, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await Availability.deleteMany({ userId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No availability found to delete" });
    }

    console.log("BCK Availability data deleted:", result);
    res.json({ message: "All availability deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
