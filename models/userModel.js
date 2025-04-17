const db = require("../config/db"); // Your db connection via Knex
// ss
const User = {
  // Main table name for users
  tableName: "dba.XTRACK_users",

  // Relationship tables
  logsTable: "dba.xtrack_log",
  signupTable: "dba.xtrack_signup",

  findAll: async (options = {}) => {
    const { page = 1, limit = 10, search = null } = options;
    const offset = (page - 1) * limit;

    // Transaction for consistency
    return await db.transaction(async (trx) => {
      // Build count query
      const countQuery = trx(User.tableName).count("* as count").timeout(5000);

      // Apply search filter if provided
      if (search) {
        countQuery.where(function () {
          this.whereILike("user_id", `%${search}%`)
            .orWhereILike("user_name", `%${search}%`)
            .orWhereILike("user_email", `%${search}%`)
            .orWhereILike("user_company", `%${search}%`);
        });
      }

      // Execute count query
      const [{ count }] = await countQuery;

      // Build users query
      const usersQuery = trx(User.tableName)
        .select("*")
        .orderBy("create_date", "desc")
        .limit(limit)
        .offset(offset)
        .timeout(5000);

      // Apply search filter if provided
      if (search) {
        usersQuery.where(function () {
          this.whereILike("user_id", `%${search}%`)
            .orWhereILike("user_name", `%${search}%`)
            .orWhereILike("user_email", `%${search}%`)
            .orWhereILike("user_company", `%${search}%`);
        });
      }

      // Execute users query
      const users = await usersQuery;

      return { count: parseInt(count), users };
    });
  },
  findById: async (id) => {
    return await db(User.tableName).where({ user_id: id }).first();
  },
  findByEmail: async (email) => {
    return await db(User.tableName).where({ user_email: email }).first();
  },
  create: async (userData) => {
    const [newUser] = await db(User.tableName).insert(userData).returning("*");
    return newUser;
  },

  update: async (id, updatedData) => {
    const [updated] = await db(User.tableName)
      .where({ user_id: id })
      .update(updatedData)
      .returning("*");
    return updated;
  },

  delete: async (id) => {
    await db(User.tableName).where({ user_id: id }).del();
    return true;
  },
  getUserLogs: async (userId, options = {}) => {
    const { page = 1, limit = 10, from = null, to = null } = options;
    const offset = (page - 1) * limit;

    const query = db(User.logsTable)
      .where("user_id", userId)
      .orderBy("api_date", "desc")
      .limit(limit)
      .offset(offset);

    // Apply date filters if provided
    if (from) {
      query.where("api_date", ">=", new Date(from));
    }
    if (to) {
      query.where("api_date", "<=", new Date(to));
    }

    return await query;
  },
  getLogsCount: async (userId, options = {}) => {
    const { from = null, to = null } = options;

    const query = db(User.logsTable)
      .where("user_id", userId)
      .count("* as count");

    // Apply date filters if provided
    if (from) {
      query.where("api_date", ">=", new Date(from));
    }
    if (to) {
      query.where("api_date", "<=", new Date(to));
    }

    const [result] = await query;
    return parseInt(result.count);
  },
  getUserStats: async () => {
    // Get active vs inactive users
    const activeStats = await db(User.tableName)
      .select("user_active")
      .count("* as count")
      .groupBy("user_active");

    // Get users by expiration status
    const currentDate = new Date();
    const expirationStats = await db(User.tableName)
      .select(
        db.raw(
          `
          CASE 
            WHEN valid_till < ? THEN 'expired'
            WHEN valid_till <= DATE(NOW() + INTERVAL '30 day') THEN 'expiring_soon'
            ELSE 'valid'
          END as status`,
          [currentDate]
        )
      )
      .count("* as count")
      .groupBy("status");

    return {
      activeStats: activeStats.reduce(
        (acc, item) => {
          acc[item.user_active === "Y" ? "active" : "inactive"] = parseInt(
            item.count
          );
          return acc;
        },
        { active: 0, inactive: 0 }
      ),
      expirationStats: expirationStats.reduce(
        (acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        },
        { valid: 0, expiring_soon: 0, expired: 0 }
      ),
    };
  },
  verifyCredentials: async (userId, password) => {
    const user = await db(User.tableName)
      .where({
        user_id: userId,
        user_pwd: password, // Note: Better to use bcrypt comparison in controller
      })
      .first();

    return user || null;
  },
  logUserActivity: async (logData) => {
    const [log] = await db(User.logsTable).insert(logData).returning("log_id");
    return log;
  },
  validateUserStatus: (user) => {
    if (!user) {
      return { valid: false, message: "User not found" };
    }

    if (user.user_active !== "Y") {
      return { valid: false, message: "User account is inactive" };
    }

    const currentDate = new Date();
    if (user.valid_till && new Date(user.valid_till) < currentDate) {
      return { valid: false, message: "User account has expired" };
    }

    return { valid: true };
  },
  createSignupRequest: async (signupData) => {
    const [signup] = await db(User.signupTable)
      .insert(signupData)
      .returning("*");
    return signup;
  },
};

module.exports = User;
