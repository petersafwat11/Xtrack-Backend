const db = require("../config/db"); // Knex connection

const Tracking = {
  // Main table name
  tableName: "dba.xtrack_log",
  logTracking: async (logData) => {
    const [log] = await db(Tracking.tableName)
      .insert(logData)
      .returning("log_id");
    return log;
  },

  getLogRecords: async (options = {}) => {
    const {
      page = 1,
      limit = 10,
      user_id = null,
      status = null,
      search = null,
      from = null,
      to = null,
      sortField = "api_date",
      sortOrder = "desc",
    } = options;

    const offset = (page - 1) * limit;

    // Transaction for consistency
    return await db.transaction(async (trx) => {
      // Build count query
      const countQuery = trx(Tracking.tableName)
        .count("* as count")
        .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
        .timeout(5000);

      // Apply filters to count query
      if (user_id) {
        countQuery.where("user_id", user_id);
      }
      if (status) {
        countQuery.where("api_status", status);
      }
      if (search) {
        countQuery.where(function () {
          this.whereILike("user_id", `%${search}%`)
            .orWhereILike("api_request", `%${search}%`)
            .orWhereILike("menu_id", `%${search}%`);
        });
      }
      if (from) {
        countQuery.where("api_date", ">=", new Date(from));
      }
      if (to) {
        countQuery.where("api_date", "<=", new Date(to));
      }

      // Execute count query
      const [{ count }] = await countQuery;

      // Build data query
      const dataQuery = trx(Tracking.tableName)
        .select("*")
        .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
        .orderBy(sortField, sortOrder)
        .timeout(5000);

      // Apply same filters to data query
      if (user_id) {
        dataQuery.where("user_id", user_id);
      }
      if (status) {
        dataQuery.where("api_status", status);
      }
      if (search) {
        dataQuery.where(function () {
          this.whereILike("user_id", `%${search}%`)
            .orWhereILike("api_request", `%${search}%`)
            .orWhereILike("menu_id", `%${search}%`);
        });
      }
      if (from) {
        dataQuery.where("api_date", ">=", new Date(from));
      }
      if (to) {
        dataQuery.where("api_date", "<=", new Date(to));
      }

      // Execute data query with pagination
      const logs = await dataQuery.limit(limit).offset(offset);

      return { count: parseInt(count), logs };
    });
  },

  getLogsForExport: async (options = {}) => {
    const {
      user_id = null,
      status = null,
      search = null,
      from = null,
      to = null,
      sortField = "api_date",
      sortOrder = "desc",
    } = options;

    // Build query
    const query = db(Tracking.tableName)
      .select("*")
      .whereNotIn("api_request", ["login", "logout"]) // Exclude login/logout
      .orderBy(sortField, sortOrder)
      .timeout(15000); // 15 second timeout for larger datasets

    // Apply filters
    if (user_id) {
      query.where("user_id", user_id);
    }
    if (status) {
      query.where("api_status", status);
    }
    if (search) {
      query.where(function () {
        this.whereILike("user_id", `%${search}%`)
          .orWhereILike("api_request", `%${search}%`)
          .orWhereILike("menu_id", `%${search}%`);
      });
    }
    if (from) {
      query.where("api_date", ">=", new Date(from));
    }
    if (to) {
      query.where("api_date", "<=", new Date(to));
    }

    // Execute query (no pagination)
    return await query;
  },

  getDashboardData: async (options = {}) => {
    const { user_id, year } = options;
    if (!user_id || !year) {
      throw new Error("Missing user_id or year parameter");
    }

    const targetYear = parseInt(year, 10);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    // 1. Total records for the current month
    const currentMonthTotalPromise = db(Tracking.tableName)
      .where("user_id", user_id)
      .andWhereRaw("EXTRACT(YEAR FROM api_date) = ?", [targetYear])
      .andWhereRaw("EXTRACT(MONTH FROM api_date) = ?", [currentMonth])
      .count("log_id as count")
      .first();

    // 2. Total records for the current year
    const currentYearTotalPromise = db(Tracking.tableName)
      .where("user_id", user_id)
      .andWhereRaw("EXTRACT(YEAR FROM api_date) = ?", [targetYear])
      .count("log_id as count")
      .first();

    // 3. Last 7 days data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    const last7DaysPromise = db(Tracking.tableName)
      .select(
        db.raw("TO_CHAR(api_date, 'Dy') as day"),
        db.raw("COUNT(log_id) as count")
      )
      .where("user_id", user_id)
      .whereNotIn("api_request", ["login", "logout"])
      .andWhere("api_date", ">=", sevenDaysAgo)
      .groupByRaw("TO_CHAR(api_date, 'Dy')")
      .orderByRaw("MIN(api_date)");

    // 4. Recent activity data
    const dataGridPromise = db(Tracking.tableName)
      .where("user_id", user_id)
      .orderBy("api_date", "desc")
      .whereNotIn("api_request", ["login", "logout"])
      .limit(20);

    // 5. Success/failure ratio
    const successRatioPromise = db(Tracking.tableName)
      .select("api_status")
      .count("log_id as count")
      .where("user_id", user_id)
      .whereNotIn("api_request", ["login", "logout"])
      .andWhereRaw("EXTRACT(YEAR FROM api_date) = ?", [targetYear])
      .groupBy("api_status");

    // 6. Track type ratio
    const trackRatioPromise = db(Tracking.tableName)
      .select(
        db.raw(
          `SUM(CASE WHEN menu_id IN ('Ocean', 'Ocean AF', 'Ocean FT', 'Ocean SR') THEN 1 ELSE 0 END) AS "Ocean"`
        ),
        db.raw(
          `SUM(CASE WHEN menu_id IN ('Marine Traffic', 'Vessel Tracker') THEN 1 ELSE 0 END) AS "Vessel"`
        ),
        db.raw(`SUM(CASE WHEN menu_id = 'Spot' THEN 1 ELSE 0 END) AS "Spot"`),
        db.raw(
          `SUM(CASE WHEN menu_id = 'Air Cargo' THEN 1 ELSE 0 END) AS "Air"`
        ),
        db.raw(`SUM(CASE WHEN menu_id = 'Air' THEN 1 ELSE 0 END) AS "Schedule"`)
      )
      .where("user_id", user_id)
      .andWhereRaw("EXTRACT(YEAR FROM api_date) = ?", [targetYear])
      .first();

    // Execute all queries concurrently
    const [
      currentMonthResult,
      currentYearResult,
      last7DaysResult,
      dataGrid,
      successRatioResult,
      trackRatio,
    ] = await Promise.all([
      currentMonthTotalPromise,
      currentYearTotalPromise,
      last7DaysPromise,
      dataGridPromise,
      successRatioPromise,
      trackRatioPromise,
    ]);

    // Process results
    const currentMonthTotal = parseInt(currentMonthResult.count, 10);
    const currentYearTotal = parseInt(currentYearResult.count, 10);

    // Format last 7 days data
    const last7Days = [];
    const dayCounts = {};
    last7DaysResult.forEach((row) => {
      dayCounts[row.day.trim()] = parseInt(row.count, 10);
    });
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      last7Days.push({ name: dayName, value: dayCounts[dayName] || 0 });
    }

    // Format success ratio data
    let success = 0,
      fail = 0;
    successRatioResult.forEach((row) => {
      if (row.api_status === "S") {
        success = parseInt(row.count, 10);
      } else if (row.api_status === "F") {
        fail = parseInt(row.count, 10);
      }
    });
    const successRatio = { success, fail };

    // Return the formatted dashboard data
    return {
      currentMonthTotal,
      currentYearTotal,
      last7Days,
      dataGrid,
      successRatio,
      trackRatio,
    };
  },
};

module.exports = Tracking;
