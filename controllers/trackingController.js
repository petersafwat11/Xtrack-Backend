const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const knex = require("../config/db");
const factory = require("./handelerFactory");
const axios = require("axios");
const e = require("express");
const geoip = require("geoip-lite");
const excel = require('exceljs');

// exports.logTracking = catchAsync(async (req, res, next) => {
//     const { user_id, menu_id, api_request } = req.body;
    
//     try {
//         // Get client IP and attempt to get location from headers
//         const ip_config = req.ip || req.connection.remoteAddress;
//         const ip_location = req.headers["x-forwarded-for"] || ip_config;

//         // Insert tracking log
//         const [log] = await knex("dba.xtrack_log")
//             .insert({
//                 user_id,
//                 api_date: new Date(),
//                 api_request,
//                 menu_id,
//                 api_status: req.body.api_status || 'S',
//                 api_error: req.body.api_error || null,
//                 ip_config,
//                 ip_location
//             })
//             .returning("log_id");

//         res.status(200).json({
//             status: "success",
//             data: {
//                 log_id: log.log_id
//             }
//         });

//     } catch (error) {
//         console.error('Tracking Log Error:', error);
//         next(new AppError(error.message || 'Failed to log tracking', 500));
//     }
// });

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
                ip_location: country // Store country instead of raw IP
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
// Controller to fetch AQZA tracking data
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
        // console.error('Error fetching tracking data:', error.response?.data);
        if(error.response?.data?.response_status === 'success'){
            console.log('error.response?.data?.response_status', error.response?.data?.response_status)

            return res.status(error.response?.status || 200).json({
                data: error.response?.data,
            });
        }
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

// Get chart data for dashboard
exports.getChartData = catchAsync(async (req, res, next) => {
    try {
        const user_id = req.query.user_id;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        
        if (!user_id) {
            return next(new AppError('User ID is required', 400));
        }

        // Get weekly usage data (last 7 days)
        const weeklyUsageData = await knex.raw(`
            WITH DateSeries AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                )::date as date
            )
            SELECT 
                TO_CHAR(d.date, 'MM-DD') as day,
                COUNT(l.log_id) as count
            FROM 
                DateSeries d
            LEFT JOIN 
                dba.xtrack_log l ON DATE(l.api_date) = d.date AND l.user_id = ?
            GROUP BY 
                d.date
            ORDER BY 
                d.date
        `, [user_id]);

        // Format weekly usage data
        const weeklyUsage = weeklyUsageData.rows.map(row => ({
            day: row.day,
            count: parseInt(row.count)
        }));

        // Get track ratio data (Ocean, Air, Schedule, Vessel)
        const trackRatioQuery = await knex.raw(`
            WITH CategoryCounts AS (
                SELECT 
                    CASE 
                        WHEN api_request LIKE '%Ocean%' THEN 'Ocean'
                        WHEN api_request LIKE '%Air%' THEN 'Air'
                        WHEN api_request LIKE '%Schedule%' THEN 'Schedule'
                        WHEN api_request IN ('Marine Traffic', 'Vessel Tracker') THEN 'Vessel'
                        ELSE 'Other'
                    END as category,
                    COUNT(*) as count
                FROM 
                    dba.xtrack_log
                WHERE 
                    user_id = ?
                    AND EXTRACT(YEAR FROM api_date) = ?
                GROUP BY 
                    CASE 
                        WHEN api_request LIKE '%Ocean%' THEN 'Ocean'
                        WHEN api_request LIKE '%Air%' THEN 'Air'
                        WHEN api_request LIKE '%Schedule%' THEN 'Schedule'
                        WHEN api_request IN ('Marine Traffic', 'Vessel Tracker') THEN 'Vessel'
                        ELSE 'Other'
                    END
            )
            SELECT category, count 
            FROM CategoryCounts 
            WHERE count > 0
            ORDER BY count DESC
        `, [user_id, year]);

        // Format track ratio data
        const trackRatio = trackRatioQuery.rows.map(row => ({
            name: row.category,
            value: parseInt(row.count)
        }));

        // Get success ratio data
        const successRatioQuery = await knex.raw(`
            WITH StatusCounts AS (
                SELECT 
                    CASE 
                        WHEN api_status = 'S' THEN 'Success'
                        ELSE 'Failure'
                    END as status,
                    COUNT(*) as count
                FROM 
                    dba.xtrack_log
                WHERE 
                    user_id = ?
                    AND EXTRACT(YEAR FROM api_date) = ?
                GROUP BY 
                    CASE 
                        WHEN api_status = 'S' THEN 'Success'
                        ELSE 'Failure'
                    END
            )
            SELECT status, count 
            FROM StatusCounts 
            WHERE count > 0
            ORDER BY status
        `, [user_id, year]);

        // Format success ratio data
        const successRatio = successRatioQuery.rows.map(row => ({
            name: row.status,
            value: parseInt(row.count)
        }));

        res.status(200).json({
            status: "success",
            weeklyUsage,
            trackRatio,
            successRatio
        });
    } catch (error) {
        console.error('Error in getChartData:', error);
        next(new AppError(error.message || 'Failed to fetch chart data', 500));
    }
});

// Get recent tracks for dashboard
exports.getRecentTracks = catchAsync(async (req, res, next) => {
    try {
        const user_id = req.query.user_id;
        const limit = parseInt(req.query.limit) || 20;
        
        if (!user_id) {
            return next(new AppError('User ID is required', 400));
        }

        // Get recent tracks
        const recentTracksQuery = await knex("dba.xtrack_log")
            .select(
                "log_id",
                "user_id",
                "api_date",
                "api_request",
                "api_status",
                "api_error",
                "ip_config",
                "ip_location",
                "menu_id"
            )
            .where('user_id', user_id)
            .orderBy('api_date', 'desc')
            .limit(limit);
            
        // Format data for frontend
        const data = recentTracksQuery.map(track => ({
            id: track.log_id,
            userId: track.user_id,
            date: track.api_date,
            request: track.api_request,
            status: track.api_status,
            error: track.api_error,
            ipConfig: track.ip_config,
            ipLocation: track.ip_location,
            menuId: track.menu_id
        }));
        
        res.status(200).json({
            status: "success",
            data
        });
    } catch (error) {
        console.error('Error in getRecentTracks:', error);
        next(new AppError(error.message || 'Failed to fetch recent tracks', 500));
    }
});