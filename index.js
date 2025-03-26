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
// restore the state of the backend 
// making update to github to update reailway
const app = express();

// Trust proxy - Add this before other middleware
app.set("trust proxy", 1);

// Enable pre-flight requests for all routes
app.options("*", cors());

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://trackww.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Security middleware with adjusted settings
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
});

app.use(limiter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Xtrack API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/endpoints", endpointRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong!";

  res.status(statusCode).json({
    status: err?.status || "error",
    code: err?.statusCode || 500,
    message,
  });
});

// Error handling middleware
app.use(errorController);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
