import { User } from "../models.js";

export const authenticator = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const userEmail = req.headers["x-user-email"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No API key provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Missing API key" });
  }

  if (!userEmail) {
    return res.status(400).json({ message: "Missing user ID in header" });
  }

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
