const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const knex = require("../config/db");
const factory = require("./handelerFactory");

exports.logTracking = catchAsync(async (req, res, next) => {
    const { user_id, menu_id, api_request } = req.body;
    
    try {
        // Get client IP and attempt to get location from headers
        const ip_config = req.ip || req.connection.remoteAddress;
        const ip_location = req.headers["x-forwarded-for"] || ip_config;

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
                ip_location
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

        // Wrap both queries in a transaction to ensure consistency
        const result = await knex.transaction(async (trx) => {
            // Get total count for pagination
            const countQuery = trx("dba.xtrack_log")
                .count('* as count')
                .timeout(5000); // 5 second timeout
            
            // Apply filters to count query
            if (user_id) {
                countQuery.where('user_id', user_id);
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
                .orderBy("api_date", "desc")
                .timeout(5000); // 5 second timeout

            // Apply same filters to data query
            if (user_id) {
                dataQuery.where('user_id', user_id);
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