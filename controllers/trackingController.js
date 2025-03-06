const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const knex = require("../config/db");
const factory = require("./handelerFactory");
const axios = require("axios");
const e = require("express");
const geoip = require("geoip-lite");
const excel = require('exceljs');
exports.logTracking = catchAsync(async (req, res, next) => {
    const { user_id, menu_id, api_request } = req.body;
    
    try {
        // Get real client IP (ignoring proxies)
        const ip_config = req.headers["x-forwarded-for"]?.split(',')[0] || req.ip || req.connection.remoteAddress;

        // Get country from GeoLite2 database
        let country = "Unknown";
        if (ip_config && ip_config !== "127.0.0.1") { // Skip local IPs
            const geo = geoip.lookup(ip_config);
            if (geo && geo.country) {
                country = geo.country; // ISO country code (e.g., "US", "MY", "EG")
            }
        }

        // Insert tracking log
        const [log] = await knex("dba.xtrack_log")
            .insert({
                user_id,
                api_date: new Date(),
                api_request,
                menu_id,
                api_status: req.body.api_status || 'S',
                api_error: req.body.api_error || null,
                ip_config,
                ip_location: country 
            })
            .returning("log_id");

        res.status(200).json({
            status: "success",
            data: {
                log_id: log.log_id
            }
        });

    } catch (error) {
        console.error('Tracking Log Error:', error);
        next(new AppError(error.message || 'Failed to log tracking', 500));
    }
});

exports.getLogRecords = catchAsync(async (req, res, next) => {
    try {
        console.log('Query params:', req.query);
        
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const user_id = req.query.user_id;
        const status = req.query.status; // 'S' for success, 'F' for failure
        
        // Get sorting parameters
        const sortField = req.query.sortField || 'api_date';
        const sortOrder = req.query.sortOrder || 'desc';

        // Wrap both queries in a transaction to ensure consistency
        const result = await knex.transaction(async (trx) => {
            // Get total count for pagination
            const countQuery = trx("dba.xtrack_log")
                .count('* as count')
                .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
                .timeout(5000); // 5 second timeout
            
            // Apply filters to count query
            if (user_id) {
                countQuery.where('user_id', user_id);
            }
            if (status) {
                countQuery.where('api_status', status);
            }
            if (req.query.search) {
                countQuery.where(function() {
                    this.whereILike("user_id", `%${req.query.search}%`)
                        .orWhereILike("api_request", `%${req.query.search}%`)
                        .orWhereILike("menu_id", `%${req.query.search}%`);
                });
            }
            if (req.query.from) {
                countQuery.where("api_date", ">=", new Date(req.query.from));
            }
            if (req.query.to) {
                countQuery.where("api_date", "<=", new Date(req.query.to));
            }

            // Execute count query
            const [{ count }] = await countQuery;

            // Build data query
            const dataQuery = trx("dba.xtrack_log")
                .select("*")
                .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
                .orderBy(sortField, sortOrder)
                .timeout(5000); // 5 second timeout

            // Apply same filters to data query
            if (user_id) {
                dataQuery.where('user_id', user_id);
            }
            if (status) {
                dataQuery.where('api_status', status);
            }
            if (req.query.search) {
                dataQuery.where(function() {
                    this.whereILike("user_id", `%${req.query.search}%`)
                        .orWhereILike("api_request", `%${req.query.search}%`)
                        .orWhereILike("menu_id", `%${req.query.search}%`);
                });
            }
            if (req.query.from) {
                dataQuery.where("api_date", ">=", new Date(req.query.from));
            }
            if (req.query.to) {
                dataQuery.where("api_date", "<=", new Date(req.query.to));
            }

            // Execute data query with pagination
            const logs = await dataQuery
                .limit(limit)
                .offset(offset);

            return { count, logs };
        });

        res.status(200).json({
            status: "success",
            results: parseInt(result.count),
            page,
            limit,
            data: result.logs
        });

    } catch (error) {
        console.error('Error in getLogRecords:', error);
        next(new AppError(error.message || 'Failed to fetch logs', 500));
    }
});

// Export logs to Excel
exports.exportLogsToExcel = catchAsync(async (req, res, next) => {
    try {
        // Get filter parameters
        const user_id = req.query.user_id;
        const status = req.query.status;
        const sortField = req.query.sortField || 'api_date';
        const sortOrder = req.query.sortOrder || 'desc';

        // Build query
        const query = knex("dba.xtrack_log")
            .select("*")
            .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
            .orderBy(sortField, sortOrder)
            .timeout(15000); // 15 second timeout for larger datasets

        // Apply filters
        if (user_id) {
            query.where('user_id', user_id);
        }
        if (status) {
            query.where('api_status', status);
        }
        if (req.query.search) {
            query.where(function() {
                this.whereILike("user_id", `%${req.query.search}%`)
                    .orWhereILike("api_request", `%${req.query.search}%`)
                    .orWhereILike("menu_id", `%${req.query.search}%`);
            });
        }
        if (req.query.from) {
            query.where("api_date", ">=", new Date(req.query.from));
        }
        if (req.query.to) {
            query.where("api_date", "<=", new Date(req.query.to));
        }

        // Execute query (no pagination)
        const logs = await query;

        // Create Excel workbook and worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Logs');

        // Define columns
        worksheet.columns = [
            { header: 'Log ID', key: 'log_id', width: 10 },
            { header: 'User ID', key: 'user_id', width: 15 },
            { header: 'Date', key: 'api_date', width: 20 },
            { header: 'Menu', key: 'menu_id', width: 15 },
            { header: 'Request', key: 'api_request', width: 20 },
            { header: 'Status', key: 'api_status', width: 10 },
            { header: 'Error Description', key: 'api_error', width: 30 },
            { header: 'IP Config', key: 'ip_config', width: 15 },
            { header: 'Location', key: 'ip_location', width: 15 }
        ];

        // Format header row
        worksheet.getRow(1).font = { bold: true };
        
        // Add data rows
        logs.forEach(log => {
            // Format status for readability
            const formattedLog = {
                ...log,
                api_status: log.api_status === 'S' ? 'Success' : 'Failed',
                api_date: new Date(log.api_date).toLocaleString()
            };
            worksheet.addRow(formattedLog);
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=logs_export.xlsx');

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error in exportLogsToExcel:', error);
        next(new AppError(error.message || 'Failed to export logs', 500));
    }
});

// External API URL
exports.getTrackingData = async (req, res) => {

    const { externalApiUrl } = req.query;
    // Validate externalApiUrl
    if (!externalApiUrl || typeof externalApiUrl !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing external API URL' });
    }

    try {
        // Make an API request to the external service
        const externalApiResponse = await axios.get(externalApiUrl);

        // Check if the response status is not 200
        if (externalApiResponse.status !== 200) {
            return res.status(externalApiResponse.status).json({
                error: 'Failed to fetch tracking data, Please re-try later',
                details: externalApiResponse.data,
            });
        }
        return res.status(200).json({ data: externalApiResponse?.data });
    } catch (error) {
        // Handle specific error scenarios (e.g., network issues, bad requests)
        if (axios.isAxiosError(error)) {
            return res.status(error.response?.status || 500).json({
                error: 'No Tracking Data Found, Please re-try later',
                details: error.response?.data || error.message,
            });
        }
        // Default error response for unexpected issues
        return res.status(500).json({ error: 'Internal Server Error' });
    }    
};

// Get totals for dashboard (monthly and yearly)
exports.getTotals = catchAsync(async (req, res, next) => {
    try {
        const user_id = req.query.user_id;
        
        if (!user_id) {
            return next(new AppError('User ID is required', 400));
        }

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        const currentYear = now.getFullYear();
        
        // Get monthly total
        const monthlyQuery = await knex("dba.xtrack_log")
            .count('* as count')
            .where('user_id', user_id)
            .whereRaw('EXTRACT(MONTH FROM api_date) = ?', [currentMonth])
            .whereRaw('EXTRACT(YEAR FROM api_date) = ?', [currentYear])
            .first();
            
        // Get yearly total
        const yearlyQuery = await knex("dba.xtrack_log")
            .count('* as count')
            .where('user_id', user_id)
            .whereRaw('EXTRACT(YEAR FROM api_date) = ?', [currentYear])
            .first();
            
        res.status(200).json({
            status: "success",
            monthlyTotal: parseInt(monthlyQuery.count) || 0,
            yearlyTotal: parseInt(yearlyQuery.count) || 0
        });
    } catch (error) {
        console.error('Error in getTotals:', error);
        next(new AppError(error.message || 'Failed to fetch totals', 500));
    }
});

// controllers/dashboardController
exports.getDashboardData = async (req, res) => {
  try {
    const { user_id, year } = req.query;
    if (!user_id || !year) {
      return res.status(400).json({ error: 'Missing user_id or year parameter' });
    }

    const targetYear = parseInt(year, 10);
    const now = new Date();
    // For current month total, we use the month number from server date
    const currentMonth = now.getMonth() + 1;

    // 1. Total records for the current month (filter by provided year & current month)
    const currentMonthTotalPromise = knex('dba.xtrack_log')
      .where('user_id', user_id)
      .andWhereRaw('EXTRACT(YEAR FROM api_date) = ?', [targetYear])
      .andWhereRaw('EXTRACT(MONTH FROM api_date) = ?', [currentMonth])
      .count('log_id as count')
      .first();

    // 2. Total records for the current year (filter by provided year)
    const currentYearTotalPromise = knex('dba.xtrack_log')
      .where('user_id', user_id)
      .andWhereRaw('EXTRACT(YEAR FROM api_date) = ?', [targetYear])
      .count('log_id as count')
      .first();

    // 3. Total records for the last 7 days grouped by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    // We group by the day (date only) and count the records.
    const last7DaysQuery = knex('dba.xtrack_log')
      .select(knex.raw("TO_CHAR(api_date, 'Dy') as day"), knex.raw('COUNT(log_id) as count'))
      .where('user_id', user_id)
      .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
      .andWhere('api_date', '>=', sevenDaysAgo)
      .groupByRaw("TO_CHAR(api_date, 'Dy')")
      .orderByRaw("MIN(api_date)");
    
    // 4. DataGrid: fetch the last 20 records for the user (ordered descending by date)
    const dataGridPromise = knex('dba.xtrack_log')
      .where('user_id', user_id)
      .orderBy('api_date', 'desc')
      .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
      .limit(20);

    // 5. Success Ratio: count successes and failures (filter by provided year)
    const successRatioPromise = knex('dba.xtrack_log')
      .select('api_status')
      .count('log_id as count')
      .where('user_id', user_id)
      .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
      .andWhereRaw('EXTRACT(YEAR FROM api_date) = ?', [targetYear])
      .groupBy('api_status');

    // 6. Track Ratio: count records for each category based on menu_id mapping (filter by provided year)
    const trackRatioPromise = knex('dba.xtrack_log')
      .select(
        knex.raw(`SUM(CASE WHEN menu_id IN ('Ocean', 'Ocean AF', 'Ocean FT', 'Ocean SR') THEN 1 ELSE 0 END) AS "Ocean"`),
        knex.raw(`SUM(CASE WHEN menu_id IN ('Marine Traffic', 'Vessel Tracker') THEN 1 ELSE 0 END) AS "Vessel"`),
        knex.raw(`SUM(CASE WHEN menu_id = 'Spot' THEN 1 ELSE 0 END) AS "Spot"`),
        knex.raw(`SUM(CASE WHEN menu_id = 'Air Cargo' THEN 1 ELSE 0 END) AS "Air"`),
        knex.raw(`SUM(CASE WHEN menu_id = 'Air' THEN 1 ELSE 0 END) AS "Schedule"`)
      )
      .where('user_id', user_id)
      .andWhereRaw('EXTRACT(YEAR FROM api_date) = ?', [targetYear])
      .first();

    // Execute queries concurrently
    const [
      currentMonthResult,
      currentYearResult,
      last7DaysResult,
      dataGrid,
      successRatioResult,
      trackRatio
    ] = await Promise.all([
      currentMonthTotalPromise,
      currentYearTotalPromise,
      last7DaysQuery,
      dataGridPromise,
      successRatioPromise,
      trackRatioPromise,
    ]);

    const currentMonthTotal = parseInt(currentMonthResult.count, 10);
    const currentYearTotal = parseInt(currentYearResult.count, 10);

    // For the last 7 days, build an array of day objects (using the day abbreviation as name)
    const last7Days = [];
    // Create a map from the query results
    const dayCounts = {};
    last7DaysResult.forEach(row => {
      dayCounts[row.day.trim()] = parseInt(row.count, 10);
    });
    // For each of the past 7 days, get the abbreviated weekday and the count (default to 0)
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({ name: dayName, value: dayCounts[dayName] || 0 });
    }

    // Process success ratio: build an object with keys 'success' and 'fail'
    let success = 0, fail = 0;
    successRatioResult.forEach(row => {
      if (row.api_status === 'S') {
        success = parseInt(row.count, 10);
      } else if (row.api_status === 'F') {
        fail = parseInt(row.count, 10);
      }
    });
    const successRatio = { success, fail };

    // Build the final dashboard object
    const dashboardData = {
      currentMonthTotal,
      currentYearTotal,
      last7Days,
      dataGrid, 
      successRatio,
      trackRatio, 
    };

    return res.json(dashboardData);
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
