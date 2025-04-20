const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/usersRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const endpointRoutes = require("./routes/endpointRoutes");
const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");

dotenv.config();
const app = express();

// Trust proxy for platforms like Vercel/Render
app.set("trust proxy", 1);

// CORS configuration (place early)
const allowedOrigins = ["http://localhost:3000", "https://trackww.vercel.app"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Handle all preflight OPTIONS requests
app.options("*", cors());

// Fallback for OPTIONS method to avoid CORS errors
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON requests
app.use(express.json());

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});
app.use(limiter);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Xtrack API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/endpoints", endpointRoutes);

// Catch unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";
  res.status(statusCode).json({
    status: err?.status || "error",
    code: statusCode,
    message,
  });
});

// Custom error controller
app.use(errorController);

// Server startup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully");
  server.close(() => process.exit(0));
});
process.once("SIGUSR2", () => {
  server.close(() => process.kill(process.pid, "SIGUSR2"));
});
