const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRoutes = require("./routes/usersRoutes");
const commodityRoutes = require("./routes/commodityRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const customerRoutes = require("./routes/customerRoutes");
const stockTakeRoutes = require("./routes/stockTakeRoutes");
const transferRoutes = require("./routes/transferRoutes");
const sortingRoutes = require("./routes/sortingRoutes");
const receivingRoutes = require("./routes/receivingRoutes");
const pickRoutes = require("./routes/pickRoutes");
const packRoutes = require("./routes/packRoutes");
const putAwayRoutes = require("./routes/putawayRoutes");
const inventoryHeaderRoutes = require("./routes/InventoryHeaderRoutes");
const inventoryDetailRoutes = require("./routes/InventoryDetailRoutes");

const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");
dotenv.config();

const app = express();

// Trust proxy - Add this before other middleware
app.set("trust proxy", 1);
process.on("SIGTERM", () => {
  console.log("Closing server...");
  process.exit(0);
});


// Enable pre-flight requests for all routes
app.options("*", cors());

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "https://xtrack-frontend.vercel.app"],
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
app.use("/api/commodity", commodityRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/stock-take", stockTakeRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/sorting", sortingRoutes);
app.use("/api/receiving", receivingRoutes);
app.use("/api/pick", pickRoutes);
app.use("/api/pack", packRoutes);
app.use("/api/putaway", putAwayRoutes);
app.use("/api/inventory-header", inventoryHeaderRoutes);
app.use("/api/inventory-detail", inventoryDetailRoutes);

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
