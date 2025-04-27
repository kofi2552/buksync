import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import apiRoutes from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:8000",
      "http://localhost:5173",
      "https://tudlin-api.onrender.com",
      "https://tudlin-client.onrender.com",
      "https://www.tudlin.com",
    ],
    credentials: true,
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api", apiRoutes);

app.use(express.static(path.join(__dirname, "frontend", "dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
