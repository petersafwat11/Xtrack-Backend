const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/usersRoutes");
const chargesRoutes = require("./routes/chargesRoutes");
const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");
dotenv.config();

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://quotiss.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: "Too many requests from this IP, please try again in an hour",
});
app.use("/api", limiter);

app.use("/api/users", userRoutes);
app.use("/api/charges", chargesRoutes);

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
