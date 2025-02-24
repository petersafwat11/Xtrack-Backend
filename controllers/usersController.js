const User = require("../models/userModel");
const handlers = require("./handelerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const knex = require("../config/db"); // Your db connection via Knex
const bcrypt = require("bcryptjs");

exports.getAllUsers = catchAsync(async (req, res, next) => {
  try {
    console.log('Query params:', req.query);

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Transaction for consistency
    const result = await knex.transaction(async (trx) => {
      // Get total count for pagination
      const countQuery = trx("dba.XTRACK_users")
        .count('* as count')
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        countQuery.where(function () {
          this.whereILike("user_id", `%${req.query.search}%`)
            .orWhereILike("user_name", `%${req.query.search}%`)
            .orWhereILike("user_email", `%${req.query.search}%`)
            .orWhereILike("user_company", `%${req.query.search}%`);
        });
      }

      // Execute count query
      const [{ count }] = await countQuery;

      // Fetch users with pagination
      const usersQuery = trx("dba.XTRACK_users")
        .select("*")
        .orderBy("create_date", "desc") // Order by latest created users
        .limit(limit)
        .offset(offset)
        .timeout(5000);

      // Apply search filter if provided
      if (req.query.search) {
        usersQuery.where(function () {
          this.whereILike("user_id", `%${req.query.search}%`)
            .orWhereILike("user_name", `%${req.query.search}%`)
            .orWhereILike("user_email", `%${req.query.search}%`)
            .orWhereILike("user_company", `%${req.query.search}%`);
        });
      }

      const users = await usersQuery;

      return { count, users };
    });

    // Send response
    res.status(200).json({
      status: "success",
      results: parseInt(result.count),
      page,
      limit,
      data: result.users
    });

  } catch (error) {
    console.error('Error in getAllUsers:', error);
    next(new AppError(error.message || 'Failed to fetch users', 500));
  }
});

exports.createUser = handlers.createOne("dba.XTRACK_users");

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const user = await knex("dba.XTRACK_users").where({ user_id: id }).first();

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: user,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updateData = { ...req.body };
  
  // Don't update user_id
  delete updateData.user_id;
  
  // If password is empty, don't update it
  if (!updateData.user_pwd) {
    delete updateData.user_pwd;
  }

  const updated = await knex("dba.XTRACK_users")
    .where({ user_id: id })
    .update(updateData)
    .returning("*");

  if (!updated.length) {
    return next(new AppError("No user found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: updated[0],
    },
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { user_email, user_pwd } = req.body;

  // Validate input
  if (!user_email || !user_pwd) {
    return next(new AppError('Email and password are required.', 400));
  }

  try {
    // Check if user exists
    const user = await knex('dba.qru_access').where({ user_email }).first();

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(user_pwd, 12);

    // Update the password
    await knex('dba.qru_access')
      .where({ user_email })
      .update({ 
        user_pwd: hashedPassword,
        update_date: new Date().toISOString()
      });

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.'
    });
  } catch (error) {
    return next(new AppError('Error updating password', 500));
  }
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
console.log('id')
console.log(id)
  // Check if the user exists
  const user = await knex("dba.XTRACK_users").where({ user_id: id }).first();
  if (!user) {
      return next(new AppError("User not found", 404));
  }

  // Delete the user
  await knex("dba.XTRACK_users").where({ user_id: id }).del();

  res.status(204).json({
      status: "success",
      data: null, // No content on successful deletion
  });
});
