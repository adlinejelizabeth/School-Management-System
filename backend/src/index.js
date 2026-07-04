import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import teacherRoutes from "./routes/teachers.js";
import studentRoutes from "./routes/students.js";
import timetableRoutes from "./routes/timetables.js";
import feeRoutes from "./routes/fees.js";

// Load configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/fees", feeRoutes);

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected server error occurred."
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` School Management System API Server Running       `);
  console.log(` Port: ${PORT}                                    `);
  console.log(` Mode: ES Modules                                 `);
  console.log(`==================================================`);
});
