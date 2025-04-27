// models.js
import mongoose from "mongoose";

// User (host or admin)
export const UserSchema = new mongoose.Schema({
  full_name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ["admin", "host"], default: "host" },
  apiKey: { type: String, unique: true },
});

export const User = mongoose.model("User", UserSchema);

export const AvailabilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  startTime: { type: String, required: true }, // e.g. "09:00"
  endTime: { type: String, required: true }, // e.g. "17:00"
  createdAt: { type: Date, default: Date.now },
});

export const Availability = mongoose.model("Availability", AvailabilitySchema);

// Booking Type (event template)
export const BookingTypeSchema = new mongoose.Schema({
  name: String,
  description: String,
  duration: Number,
  color: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export const BookingType = mongoose.model("BookingType", BookingTypeSchema);

// Booking (actual appointment)
export const BookingSchema = new mongoose.Schema(
  {
    bookingType: { type: mongoose.Schema.Types.ObjectId, ref: "BookingType" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    anonymousId: {
      type: String,
    },
    client_name: String,
    client_email: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    duration: Number,
    booked_time: Date,
    notes: String,
    meet_link: String,
  },
  { timestamps: true }
);
export const Booking = mongoose.model("Booking", BookingSchema);
