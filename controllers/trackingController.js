const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const knex = require("../config/db");
const axios = require("axios");
const geoip = require("geoip-lite");
const excel = require("exceljs");
const Tracking = require("../models/trackingModel");

exports.logTracking = catchAsync(async (req, res, next) => {
  const { user_id, menu_id, api_request } = req.body;

  // Validate required fields
  if (!user_id) {
    return next(new AppError("User ID is required", 400));
  }

  if (!menu_id) {
    return next(new AppError("Menu ID is required", 400));
  }

  if (!api_request) {
    return next(new AppError("API request information is required", 400));
  }

  try {
    // Get real client IP (ignoring proxies)
    const ip_config =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.ip ||
      req.connection.remoteAddress;

    // Get country from GeoLite2 database
    let country = "Unknown";
    if (ip_config && ip_config !== "127.0.0.1") {
      // Skip local IPs
      try {
      const geo = geoip.lookup(ip_config);
      if (geo && geo.country) {
        country = geo.country; // ISO country code (e.g., "US", "MY", "EG")
        }
      } catch (geoError) {
        console.error("IP geolocation failed:", geoError);
        // Continue with "Unknown" country
      }
    }

    // Create log data object
    const logData = {
        user_id,
        api_date: new Date(),
        api_request,
        menu_id,
        api_status: req.body.api_status || "S",
        api_error: req.body.api_error || null,
        ip_config,
        ip_location: country,
    };

    // Use Tracking model to log the event
    const log = await Tracking.logTracking(logData);

    if (!log) {
      return next(new AppError("Failed to create tracking log entry", 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        log_id: log.log_id,
      },
    });
  } catch (error) {
    console.error("Tracking Log Error:", error);

    if (error.code === "23503") {
      return next(
        new AppError("The provided user_id does not exist in the database", 400)
      );
    }

    next(
      new AppError(
        "Failed to log tracking activity. Please try again later",
        500
      )
    );
  }
});

exports.getLogRecords = catchAsync(async (req, res, next) => {
  try {
    // Validate pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return next(new AppError("Page number must be at least 1", 400));
    }

    if (limit < 1 || limit > 100) {
      return next(new AppError("Limit must be between 1 and 100", 400));
    }

    const user_id = req.query.user_id;
    const status = req.query.status; // 'S' for success, 'F' for failure
    const search = req.query.search;
    const from = req.query.from;
    const to = req.query.to;

    // Validate date range if provided
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime())) {
        return next(new AppError("Invalid 'from' date format", 400));
      }

      if (isNaN(toDate.getTime())) {
        return next(new AppError("Invalid 'to' date format", 400));
      }

      if (fromDate > toDate) {
        return next(
          new AppError("'From' date cannot be later than 'to' date", 400)
        );
      }
    }

    // Get sorting parameters
    const sortField = req.query.sortField || "api_date";
    const sortOrder = req.query.sortOrder || "desc";

    // Validate sort order
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return next(
        new AppError("Sort order must be either 'asc' or 'desc'", 400)
      );
    }

    // Use Tracking model to get log records
    const result = await Tracking.getLogRecords({
      page,
      limit,
      user_id,
      status,
      search,
      from,
      to,
      sortField,
      sortOrder,
    });

    if (!result) {
      return next(new AppError("Failed to retrieve log records", 500));
    }

    res.status(200).json({
      status: "success",
      results: result.count,
      page,
      limit,
      data: result.logs,
    });
  } catch (error) {
    console.error("Error in getLogRecords:", error);
    if (error.code === "42703") {
      return next(new AppError("Invalid sort field specified", 400));
    }

    next(new AppError("Failed to retrieve logs. Please try again later", 500));
  }
});

// Export logs to Excel
exports.exportLogsToExcel = catchAsync(async (req, res, next) => {
  try {
    // Get filter parameters
    const user_id = req.query.user_id;
    // const status = req.query.status;
    // const search = req.query.search;
    // const from = req.query.from;
    // const to = req.query.to;

    // // Validate date range if provided
    // if (from && to) {
    //   const fromDate = new Date(from);
    //   const toDate = new Date(to);

    //   if (isNaN(fromDate.getTime())) {
    //     return next(new AppError("Invalid 'from' date format", 400));
    //   }

    //   if (isNaN(toDate.getTime())) {
    //     return next(new AppError("Invalid 'to' date format", 400));
    //   }

    //   if (fromDate > toDate) {
    //     return next(
    //       new AppError("'From' date cannot be later than 'to' date", 400)
    //     );
    //   }
    // }

    // const sortField = req.query.sortField || "api_date";
    // const sortOrder = req.query.sortOrder || "desc";

    // Use Tracking model to get logs for export
    const logs = await Tracking.getLogsForExport({
      user_id,
      // status,
      // search,
      // from,
      // to,
      // sortField,
      // sortOrder,
    });

    if (!logs) {
      return next(new AppError("Failed to retrieve logs for export", 500));
    }

    if (logs.length === 0) {
      return next(new AppError("No logs found matching your criteria", 404));
    }

    // Create Excel workbook and worksheet
    try {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Logs");

    // Define columns
    worksheet.columns = [
      { header: "Log ID", key: "log_id", width: 10 },
      { header: "User ID", key: "user_id", width: 15 },
      { header: "Date", key: "api_date", width: 20 },
      { header: "Menu", key: "menu_id", width: 15 },
      { header: "Request", key: "api_request", width: 20 },
      { header: "Status", key: "api_status", width: 10 },
      { header: "Error Description", key: "api_error", width: 30 },
      { header: "IP Config", key: "ip_config", width: 15 },
      { header: "Location", key: "ip_location", width: 15 },
    ];

    // Format header row
    worksheet.getRow(1).font = { bold: true };

    // Add data rows
    logs.forEach((log) => {
      // Format status for readability
      const formattedLog = {
        ...log,
        api_status: log.api_status === "S" ? "Success" : "Failed",
        api_date: new Date(log.api_date).toLocaleString(),
      };
      worksheet.addRow(formattedLog);
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=logs_export.xlsx"
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    } catch (excelError) {
      console.error("Excel generation error:", excelError);
      return next(new AppError("Failed to generate Excel file", 500));
    }
  } catch (error) {
    console.error("Error in exportLogsToExcel:", error);

    if (error.code === "42703") {
      return next(new AppError("Invalid sort field specified", 400));
    }

    next(new AppError("Failed to export logs. Please try again later", 500));
  }
});

// External API URL
exports.getTrackingData = catchAsync(async (req, res, next) => {
  const { externalApiUrl } = req.query;

  // Validate externalApiUrl
  if (!externalApiUrl) {
    return next(new AppError("External API URL is required", 400));
  }

  if (typeof externalApiUrl !== "string") {
    return next(new AppError("External API URL must be a string", 400));
  }

  // Basic URL validation
  if (
    !externalApiUrl.startsWith("http://") &&
    !externalApiUrl.startsWith("https://")
  ) {
    return next(
      new AppError("External API URL must start with http:// or https://", 400)
    );
  }

  try {
    // Make an API request to the external service
    const externalApiResponse = await axios.get(externalApiUrl, {
      timeout: 10000,
    });

    // Check if the response status is not 200
    if (externalApiResponse.status !== 200) {
      return next(
        new AppError(
          "External tracking API returned an error response",
          externalApiResponse.status
        )
      );
    }

    if (!externalApiResponse.data) {
      return next(
        new AppError("External tracking API returned empty data", 404)
      );
    }

    return res.status(200).json({
      status: "success",
      data: externalApiResponse.data,
    });
  } catch (error) {
    // console.error("External API Error:", error);

    // Handle specific error scenarios with more detailed messages
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        return next(new AppError("External API request timed out", 504));
      }

      if (error.code === "ENOTFOUND") {
        return next(new AppError("External API host not found", 404));
      }
      if (
        error.response?.data?.response_data &&
        error.response?.data?.response_data?.length > 0
      ) {
        console.log("data sent", error.response?.data?.response_data);

        return res.status(200).json({
          status: "success",
          data: error.response?.data,
        });

      }
      if (error.response) {
        // The request was made and the server responded with a non-2xx status
        return next(
          new AppError(
            `External API error: ${error.response.data?.message || error.message}`,
            error.response.status || 500
          )
        );
      } else if (error.request) {
        // The request was made but no response was received
        return next(
          new AppError("No response received from external tracking API", 503)
        );
      }
    }

    // Default error response for unexpected issues
    next(
      new AppError("Failed to fetch tracking data. Please try again later", 500)
    );
  }
});

// Get dashboard data
exports.getDashboardData = catchAsync(async (req, res, next) => {
  try {
    const { user_id, year } = req.query;

    // Validate required parameters
    if (!user_id) {
      return next(new AppError("User ID is required", 400));
    }

    if (!year) {
      return next(new AppError("Year parameter is required", 400));
    }

    // Validate year format
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return next(
        new AppError(
          "Invalid year format. Must be a valid year between 2000-2100",
          400
        )
      );
    }

    // Use Tracking model to get dashboard data
    const dashboardData = await Tracking.getDashboardData({ user_id, year });

    if (!dashboardData) {
      return next(new AppError("Failed to retrieve dashboard data", 500));
    }

    return res.status(200).json({
      status: "success",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error in getDashboardData:", error);

    if (error.message === "Missing user_id or year parameter") {
      return next(new AppError(error.message, 400));
    }

    if (error.code === "42P01") {
      return next(
        new AppError(
          "Dashboard data table not found. Contact administrator",
          500
        )
      );
    }

    next(
      new AppError(
        "Failed to fetch dashboard data. Please try again later",
        500
      )
    );
  }
});
